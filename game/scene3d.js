// 3D 조우 연출 (임시). 포켓몬은 공식 아트워크를 3D 공간의 평면(빌보드)에 붙여 표시합니다.
// 볼은 기본 도형으로 만든 임시 3D 모델입니다. THREE(Three.js)가 없으면 2D 이미지로 대체합니다.
const Scene3D = (() => {
  let renderer = null, scene = null, camera = null, container = null, clock = null;
  let pokeMesh = null, pokeMat = null, shadow = null, ball = null;
  let fallbackImg = null, raf = null, currentId = null, mood = "idle";
  let tweens = [];
  const textures = {};
  const BASE_Y = 1.0;

  // ---------- 공용 트윈 (시간 기반 보간) ----------
  function tween(dur, fn) {
    return new Promise((resolve) => {
      tweens.push({ t: 0, dur, fn, resolve });
    });
  }
  function tickTweens(dt) {
    tweens = tweens.filter((tw) => {
      tw.t += dt;
      const p = Math.min(1, tw.t / tw.dur);
      tw.fn(p);
      if (p >= 1) { tw.resolve(); return false; }
      return true;
    });
  }
  const wait = (sec) => tween(sec, () => {});
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

  // ---------- 초기화 ----------
  function dispose() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    tweens = [];
    if (renderer) {
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) { /* 무시 */ }
      renderer.domElement.remove();
    }
    if (fallbackImg) fallbackImg.remove();
    renderer = scene = camera = pokeMesh = pokeMat = shadow = ball = null;
    fallbackImg = null;
  }

  function init(el) {
    dispose();
    container = el;
    clock = null;
    if (!window.THREE) return useFallback(null);
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return useFallback(null);
    }
    const w = el.clientWidth || 320, h = el.clientHeight || 260;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    el.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 6.2);
    camera.lookAt(0, 0.7, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(2, 5, 4);
    scene.add(sun);

    // 땅
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 48),
      new THREE.MeshLambertMaterial({ color: 0x6fc46a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    scene.add(ground);

    // 그림자
    shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1.2, 0.5, 1);
    shadow.position.set(0, -0.18, 0);
    scene.add(shadow);

    // 임시 3D 볼 (위 절반 = 색, 아래 절반 = 흰색, 가운데 띠)
    ball = makeBall("monster");
    ball.visible = false;
    scene.add(ball);

    clock = new THREE.Clock();
    loop();
  }

  function makeBall(key) {
    const top = { monster: 0xe5484d, great: 0x3b82f6, ultra: 0xfacc15 }[key] || 0xe5484d;
    const group = new THREE.Group();
    const topHalf = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: top })
    );
    const bottomHalf = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.355, 0.355, 0.06, 32),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    const button = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    button.position.z = 0.33;
    group.add(topHalf, bottomHalf, band, button);
    return group;
  }

  // ---------- 포켓몬 표시 ----------
  // 포켓몬 이미지 주소: 번들된 data URI 우선 (file:// 에서도 WebGL 사용 가능)
  function imageSrc(id) {
    const data = window.POKE_DATA && window.POKE_DATA[id];
    return data || `assets/pokemon/${id}.png`;
  }

  function loadTexture(id, onError) {
    if (!textures[id]) {
      textures[id] = new THREE.TextureLoader().load(
        imageSrc(id),
        undefined,
        undefined,
        () => { delete textures[id]; onError && onError(); }
      );
    }
    return textures[id];
  }

  function showPokemon(id) {
    currentId = id;
    mood = "idle";
    if (!scene) return useFallback(id);
    if (pokeMesh) scene.remove(pokeMesh);
    const failedId = id;
    pokeMat = new THREE.MeshBasicMaterial({
      map: loadTexture(id, () => {
        // 텍스처를 못 읽으면 3D 평면을 숨기고 2D 이미지로 보여줍니다.
        if (currentId !== failedId) return;
        if (pokeMesh) pokeMesh.visible = false;
        useFallback(failedId);
      }),
      transparent: true, alphaTest: 0.05, depthWrite: false,
    });
    pokeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), pokeMat);
    pokeMesh.position.set(0, BASE_Y, 0);
    scene.add(pokeMesh);
    ball.visible = false;
    shadow.visible = true;
  }

  function useFallback(id) {
    // WebGL 또는 THREE를 쓸 수 없을 때 2D 이미지로 대신 보여줍니다.
    if (!container) return;
    if (!fallbackImg) {
      fallbackImg = document.createElement("img");
      fallbackImg.className = "poke";
      fallbackImg.style.cssText = "width:180px;height:180px;object-fit:contain;position:relative;z-index:1;margin-top:20px;";
      container.appendChild(fallbackImg);
    }
    if (id) fallbackImg.src = imageSrc(id);
  }

  // ---------- 상태 연출 ----------
  // mood: "idle" | "shake" | "run" | "caught"
  function setMood(m) {
    mood = m;
    if (m === "run" && pokeMesh) {
      tween(0.7, (p) => {
        pokeMesh.position.x = ease(p) * 5;
        pokeMat.opacity = 1 - p;
      });
    }
  }

  function shakePokemon() {
    if (!pokeMesh) return wait(0);
    return tween(0.45, (p) => {
      pokeMesh.position.x = Math.sin(p * Math.PI * 6) * 0.15 * (1 - p);
    });
  }

  // ---------- 볼 던지기 ----------
  // key: "monster" | "great" | "ultra", success: 잡힐지 여부 (app.js에서 결정)
  async function throwBall(key, success) {
    if (!scene || !pokeMesh) return;
    scene.remove(ball);
    ball = makeBall(key);
    scene.add(ball);
    ball.visible = true;
    const start = new THREE.Vector3(0, -0.2, 4.6);
    const target = new THREE.Vector3(0, BASE_Y, 0);

    // 1) 포물선으로 던지기
    await tween(0.7, (p) => {
      const e = ease(p);
      ball.position.lerpVectors(start, target, e);
      ball.position.y += Math.sin(p * Math.PI) * 1.8;
      ball.rotation.y = p * Math.PI * 6;
      ball.scale.setScalar(0.6 + 0.4 * e);
    });

    if (success) {
      // 2) 흔들림 3번 (잡힐 때)
      for (let i = 0; i < 3; i++) {
        await tween(0.5, (p) => {
          ball.rotation.z = Math.sin(p * Math.PI * 2) * 0.35;
        });
      }
      ball.rotation.z = 0;
      // 3) 포켓몬이 볼 속으로 사라짐
      await tween(0.4, (p) => {
        pokeMesh.scale.setScalar(1 - p);
        pokeMat.opacity = 1 - p;
        ball.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.2);
      });
      currentId = null;
      await wait(0.3);
      ball.visible = false;
    } else {
      // 2) 볼이 튕기고 포켓몬이 튀어나옴
      await tween(0.25, (p) => {
        ball.scale.setScalar(1 - p);
        pokeMesh.scale.setScalar(0.2 + 0.8 * p);
        pokeMat.opacity = p;
      });
      ball.visible = false;
      pokeMesh.scale.setScalar(1);
      pokeMat.opacity = 1;
      await shakePokemon();
    }
  }

  // ---------- 스킬 임팩트 ----------
  // fx: 스킬 종류 (색을 정합니다). 포켓몬 주변으로 색 조각이 터졌다가 사라집니다.
  const FX_COLORS = {
    grass: 0x5fbf5f, fire: 0xff7a2e, water: 0x3ea0ff, electric: 0xffd23f, ghost: 0x7a5cc7,
    dark: 0x4a3b5c, fairy: 0xff8fd0, dragon: 0x6a5cff, rock: 0xb59b5a, fighting: 0xd64545, normal: 0xe6e9ee,
    psychic: 0xff5fa2, ice: 0x9fe6ff, poison: 0xa95cc7, bug: 0x9ccc44, ground: 0xc9a25a, flying: 0x9fd3ff, steel: 0xb8c4d0,
  };
  function impact(fx) {
    if (!scene || !pokeMesh) return wait(0);
    const color = FX_COLORS[fx] || FX_COLORS.normal;
    const group = new THREE.Group();
    group.position.set(0, BASE_Y, 0.2);
    scene.add(group);
    const geo = new THREE.SphereGeometry(0.09, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, depthWrite: false });
    const parts = [];
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(geo, mat);
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const r = 0.9 + Math.random() * 0.5;
      parts.push({ m, dx: Math.cos(a) * r, dy: Math.sin(a) * r * 0.7 + 0.4, dz: (Math.random() - 0.5) * 0.6 });
      group.add(m);
    }
    // 포켓몬도 살짝 커졌다가 돌아옵니다
    tween(0.4, (p) => { if (pokeMesh) pokeMesh.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.15); });
    return tween(0.8, (p) => {
      if (!scene) return;
      const e = 1 - Math.pow(1 - p, 3);
      parts.forEach(({ m, dx, dy, dz }) => {
        m.position.set(dx * e, dy * e, dz * e);
        m.scale.setScalar(1 - p * 0.8);
      });
      mat.opacity = 1 - p;
      if (p >= 1) {
        group.parent && group.parent.remove(group);
        geo.dispose();
        mat.dispose();
      }
    });
  }

  // ---------- 렌더 루프 ----------
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!renderer) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    tickTweens(dt);
    if (pokeMesh && mood === "idle" && tweens.length === 0) {
      const t = clock.elapsedTime;
      pokeMesh.position.y = BASE_Y + Math.sin(t * 2.2) * 0.08;
      pokeMesh.position.x = 0;
      pokeMesh.scale.setScalar(1 + Math.sin(t * 2.2) * 0.02);
    }
    renderer.render(scene, camera);
  }

  return { init, dispose, showPokemon, setMood, shakePokemon, throwBall, impact };
})();
