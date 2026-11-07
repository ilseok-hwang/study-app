// 마을 지도 탐험 (Three.js 3D + 화면 하단 왼쪽 방향 버튼)
// 지도는 마을 번호로 만든 절차적 타일맵입니다. 외부 지도 어셋을 쓰지 않습니다.
// app.js와의 연결: PokeMap.show / hide / setHandler / available
const PokeMap = (() => {
  const W = 24, H = 16;
  const START = { x: 12, y: 8 };
  const WALK = new Set(["G", "T", "P", "S", "D"]); // 걸을 수 있는 타일
  const DIRS8 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const SPOT_COUNT = 5;        // 마을마다 미리 배치하는 야생 포켓몬 조우 지점 수
  const GRASS_ENCOUNTER = 0.15; // 풀숲(T)을 밟을 때 랜덤 조우 확률
  const SPOT_MIN_GAP = 3;      // 조우 지점끼리의 최소 간격(칸)
  const MOVE_MS = 160;
  const CAM_OFFSET = { x: 0, y: 7.5, z: 7 };
  const CAM_FOLLOW = 6;        // 카메라가 플레이어를 따라가는 속도 (클수록 빠름, 프레임 속도와 무관)

  let handler = () => {};
  let active = false;
  let currentVillage = -1;
  let view = null, box = null;
  let renderer = null, sceneT = null, camT = null, groupT = null, playerT = null, shadowT = null;
  let raf = null, initialized = false;
  let camFocus = null;         // 카메라가 바라보는 중심 (부드럽게 따라감)
  let mapData = null;          // { grid, stops, gym }
  let stopMeshes = [];
  let spotMeshes = [];         // 야생 조우 지점의 볼 (위아래로 떠 있는 효과)
  let px = START.x, py = START.y;
  let moveState = null;        // 이동 중이면 { from, to, t0, nx, ny, k }
  let holdFn = null;           // 누르고 있는 동안 다음 한 칸의 방향 [dx,dy]을 돌려주는 함수 (없으면 null)
  const lastPos = {};
  const shared = {};          // 공용 지오메트리·재질 (메모리 절약)

  // ---------- 지도 생성 (2D 격자) ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 시작점에서 걸어서 닿을 수 있는 칸을 표시합니다.
  function reachableFrom(g, sx, sy) {
    const seen = Array.from({ length: H }, () => Array(W).fill(false));
    const queue = [[sx, sy]];
    seen[sy][sx] = true;
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny][nx] || !WALK.has(g[ny][nx])) continue;
        seen[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
    return seen;
  }

  function generate(village) {
    const rnd = mulberry32(village * 7919 + 17);
    const ri = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
    const g = Array.from({ length: H }, () => Array(W).fill("G"));
    const set = (x, y, k) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = k; };
    const isG = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (g[y][x] === "G" || g[y][x] === "T");
    const nearPath = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && (g[ny][nx] === "P" || g[ny][nx] === "S")) return true;
      }
      return false;
    };

    // 1) 길: 가로 한 줄, 세로 한 줄
    for (let x = 0; x < W; x++) g[8][x] = "P";
    for (let y = 0; y < H; y++) g[y][12] = "P";

    // 2) 관장 건물 (북동쪽) + 문 + 연결 길
    for (let y = 2; y <= 4; y++) for (let x = 16; x <= 18; x++) g[y][x] = "B";
    g[5][17] = "D"; g[6][17] = "P"; g[7][17] = "P";

    // 3) 포켓스톱 3개 (길 위)
    const stops = [{ x: 4, y: 8 }, { x: 20, y: 8 }, { x: 12, y: 13 }];
    stops.forEach((s) => set(s.x, s.y, "S"));

    // 4) 풀숲 (조우 구역) 4~6군데
    const patches = ri(4, 6);
    for (let i = 0; i < patches; i++) {
      const px0 = ri(1, W - 4), py0 = ri(1, H - 4);
      for (let y = py0; y < py0 + 3; y++) for (let x = px0; x < px0 + 3; x++) {
        if (g[y][x] === "G" && !nearPath(x, y)) g[y][x] = "T";
      }
    }

    // 5) 나무, 연못, 집 (길과 관장 건물은 피함)
    for (let i = 0; i < 40; i++) {
      const x = ri(0, W - 1), y = ri(0, H - 1);
      if (g[y][x] === "G" && !nearPath(x, y)) g[y][x] = "X";
    }
    for (let i = 0; i < 2; i++) {
      const px0 = ri(0, W - 3), py0 = ri(0, H - 2);
      let ok = true;
      for (let y = py0; y < py0 + 2; y++) for (let x = px0; x < px0 + 3; x++) if (!isG(x, y) || nearPath(x, y)) ok = false;
      if (ok) for (let y = py0; y < py0 + 2; y++) for (let x = px0; x < px0 + 3; x++) g[y][x] = "W";
    }
    for (let i = 0; i < 3; i++) {
      const px0 = ri(0, W - 2), py0 = ri(0, H - 2);
      let ok = true;
      for (let y = py0; y < py0 + 2; y++) for (let x = px0; x < px0 + 2; x++) if (!isG(x, y) || nearPath(x, y)) ok = false;
      if (ok) for (let y = py0; y < py0 + 2; y++) for (let x = px0; x < px0 + 2; x++) g[y][x] = "H";
    }

    // 시작 지점은 항상 길 위
    g[START.y][START.x] = "P";

    // 6) 야생 포켓몬 조우 지점 5곳: 길에서 걸어서 갈 수 있는 풀밭(G/T) 중, 서로 떨어진 곳
    //    (길·건물을 먼저 만든 뒤 고르므로 위의 지도 배치는 바뀌지 않습니다)
    const reach = reachableFrom(g, START.x, START.y);
    const cand = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if ((g[y][x] === "G" || g[y][x] === "T") && reach[y][x]) cand.push({ x, y });
    }
    const spots = [];
    for (let tries = 0; cand.length && spots.length < SPOT_COUNT && tries < 500; tries++) {
      const c = cand[ri(0, cand.length - 1)];
      if (spots.every((s) => Math.max(Math.abs(s.x - c.x), Math.abs(s.y - c.y)) >= SPOT_MIN_GAP)) spots.push(c);
    }
    return { grid: g, stops, gym: { x: 17, y: 3, door: { x: 17, y: 5 } }, spots, cand };
  }

  // ---------- 3D 재료 ----------
  function geo(key, make) {
    if (!shared[key]) shared[key] = make();
    return shared[key];
  }
  function mat(color, opts = {}) {
    const key = "m" + color + JSON.stringify(opts);
    if (!shared[key]) shared[key] = new THREE.MeshLambertMaterial({ color, ...opts });
    return shared[key];
  }
  function label(text, bg) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(4, 8, 248, 48, 14) : ctx.rect(4, 8, 248, 48);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Malgun Gothic', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 34);
    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
  }
  function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function addTile(x, y, color) {
    const m = new THREE.Mesh(geo("box", () => new THREE.BoxGeometry(1, 0.2, 1)), mat(color));
    m.position.set(x, -0.1, y);
    groupT.add(m);
    return m;
  }

  // ---------- 3D 지도 만들기 ----------
  function buildMap(village) {
    while (groupT.children.length) groupT.remove(groupT.children[0]);
    stopMeshes = [];
    spotMeshes = [];
    mapData = generate(village);
    const g = mapData.grid;

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = g[y][x];
      if (k === "P" || k === "S" || k === "D") addTile(x, y, 0xe8d3a0);
      else if (k === "W") addTile(x, y, 0x4aa3df);
      else addTile(x, y, 0x9bd97f);

      if (k === "T") {
        for (let i = 0; i < 4; i++) {
          const tuft = new THREE.Mesh(geo("tuft", () => new THREE.ConeGeometry(0.1, 0.4, 4)), mat(0x2f7d46));
          tuft.position.set(x - 0.35 + hash(x, y + i) * 0.7, 0.2, y - 0.35 + hash(y, x + i) * 0.7);
          groupT.add(tuft);
        }
      }
      if (k === "X") {
        const trunk = new THREE.Mesh(geo("trunk", () => new THREE.CylinderGeometry(0.08, 0.1, 0.5, 6)), mat(0x7a5230));
        trunk.position.set(x, 0.25, y);
        const crown = new THREE.Mesh(geo("crown", () => new THREE.SphereGeometry(0.42, 8, 6)), mat(0x2f8f4e));
        crown.position.set(x, 0.8, y);
        groupT.add(trunk, crown);
      }
      if (k === "W") {
        // 물 위에 살짝 반짝이는 면
        const shine = new THREE.Mesh(geo("shine", () => new THREE.CircleGeometry(0.35, 12)), mat(0x9fd8ff, { transparent: true, opacity: 0.6 }));
        shine.rotation.x = -Math.PI / 2;
        shine.position.set(x, 0.02, y);
        groupT.add(shine);
      }
      if (k === "H") {
        const body = new THREE.Mesh(geo("house", () => new THREE.BoxGeometry(0.8, 0.7, 0.8)), mat(0xf5e6c8));
        body.position.set(x, 0.35, y);
        const roof = new THREE.Mesh(geo("roof", () => new THREE.ConeGeometry(0.62, 0.5, 4)), mat(0x8e3b2e));
        roof.rotation.y = Math.PI / 4;
        roof.position.set(x, 0.95, y);
        groupT.add(body, roof);
      }
      if (k === "B") {
        const body = new THREE.Mesh(geo("gymBody", () => new THREE.BoxGeometry(1, 1.6, 1)), mat(0xb86b4b));
        body.position.set(x, 0.8, y);
        const roof = new THREE.Mesh(geo("gymRoof", () => new THREE.BoxGeometry(1.06, 0.2, 1.06)), mat(0xc0392b));
        roof.position.set(x, 1.7, y);
        groupT.add(body, roof);
      }
      if (k === "D") {
        const door = new THREE.Mesh(geo("door", () => new THREE.BoxGeometry(0.5, 0.6, 0.08)), mat(0x3b2a1a));
        door.position.set(x, 0.3, y + 0.46);
        groupT.add(door);
      }
    }

    // 포켓스톱 (빙글빙글 도는 볼 모양)
    mapData.stops.forEach((s, i) => {
      const ready = (view && view.stopReady) ? view.stopReady[i] !== false : true;
      const col = ready ? 0x3b82f6 : 0x9aa5b1;
      const ball = new THREE.Mesh(geo("stopBall", () => new THREE.SphereGeometry(0.22, 14, 10)), mat(col));
      ball.position.set(s.x, 0.4, s.y);
      const ring = new THREE.Mesh(geo("stopRing", () => new THREE.TorusGeometry(0.3, 0.05, 6, 20)), mat(0xffffff));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(s.x, 0.4, s.y);
      const tag = label("스톱", "rgba(29,43,58,0.85)");
      tag.position.set(s.x, 1.1, s.y);
      groupT.add(ball, ring, tag);
      stopMeshes.push({ ball, ring });
    });

    // 야생 포켓몬 조우 지점: 빨간 볼 + 포켓몬 이름표. 이미 만난 곳은 보이지 않습니다.
    ((view && view.spots) || []).forEach((info) => {
      if (!info || info.done) return;
      const s = info; // { x, y, name, done }
      const ball = new THREE.Mesh(geo("spotBall", () => new THREE.SphereGeometry(0.24, 14, 10)), mat(0xe74c3c));
      ball.position.set(s.x, 0.4, s.y);
      const tag = label(info.name, "rgba(46,125,70,0.9)");
      tag.position.set(s.x, 1.1, s.y);
      groupT.add(ball, tag);
      spotMeshes.push(ball);
    });

    // 관장 건물 이름표
    const gymTag = label(view && view.gymLabel ? view.gymLabel : "관장", "rgba(192,57,43,0.95)");
    gymTag.position.set(17, 2.3, 3);
    groupT.add(gymTag);
  }

  // ---------- 플레이어 (뼈대 + 스킨 메쉬) ----------
  // playerT: 논리상의 위치와 방향 (화면에는 안 보임). rigRoot: 실제 아바타 (playerT를 따라감).
  const AVATAR_HEIGHT = 1.5;
  const tmpM = new THREE.Matrix4();
  let rigRoot = null, rigParts = [], rigGender = null;
  let walkPhase = 0, walkAmp = 0, lastNow = 0;

  function makeShadow() {
    const s = new THREE.Mesh(geo("pShadow", () => new THREE.CircleGeometry(0.4, 16)), mat(0x000000, { transparent: true, opacity: 0.25 }));
    s.rotation.x = -Math.PI / 2;
    s.position.y = 0.02;
    sceneT.add(s);
    return s;
  }

  function clearRig() {
    if (rigRoot) sceneT.remove(rigRoot);
    rigParts.forEach((p) => sceneT.remove(p.skinned));
    rigRoot = null;
    rigParts = [];
  }

  // 남/여 아바타를 만듭니다. 어셋이 없으면 공 모양으로 대신합니다.
  function buildRig(gender) {
    clearRig();
    rigGender = gender;
    rigRoot = new THREE.Object3D();
    sceneT.add(rigRoot);
    const parts = (window.AVATAR_RIGS && window.AVATAR_RIGS[gender]) || [];
    if (!parts.length) {
      const body = new THREE.Mesh(geo("pBody", () => new THREE.SphereGeometry(0.3, 16, 12)), mat(0x3b82f6));
      body.position.y = 0.4;
      rigRoot.add(body);
      return;
    }

    // Unity 단위 → 타일 단위 (키가 AVATAR_HEIGHT가 되도록)
    let minY = Infinity, maxY = -Infinity;
    parts.forEach((pt) => { minY = Math.min(minY, pt.bbox[1]); maxY = Math.max(maxY, pt.bbox[4]); });
    rigRoot.scale.setScalar(AVATAR_HEIGHT / (maxY - minY));

    const loader = new THREE.TextureLoader();
    parts.forEach((pt) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pt.pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(pt.nrm, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(pt.uv, 2));
      g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(pt.skinIdx, 4));
      g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(pt.skinW, 4));
      g.setIndex(pt.idx);
      const material = new THREE.MeshLambertMaterial({
        map: pt.texture ? loader.load(pt.texture) : null,
        color: pt.texture ? 0xffffff : 0xcccccc,
        side: THREE.DoubleSide,
        skinning: true,
      });

      // Unity 바인드 행렬(뼈 역행렬)에서 뼈의 월드 행렬을 구하고, 부모 기준 로컬 행렬로 바꿉니다.
      const inverses = pt.bones.map((b) => new THREE.Matrix4().fromArray(b.bind));
      const worlds = inverses.map((m) => new THREE.Matrix4().copy(m).invert());
      // 주의: 일부 뼈는 좌우 반전(행렬식 < 0)이라 분해하지 않고 행렬을 그대로 씁니다.
      const objs = pt.bones.map((b) => { const bone = new THREE.Bone(); bone.name = b.name; bone.matrixAutoUpdate = false; return bone; });
      // 자세: 바인드 포즈는 팔이 T자(수평)입니다. 팔이 붙어 있는 어깨 뼈를 어깨 관절 중심으로 돌리면
      // 팔 전체(위팔·팔꿈치·손)가 함께 내려옵니다. 위팔 뼈만 돌리면 팔 메쉬가 어깨 뼈에도 묶여 있어서
      // 각도가 제대로 나오지 않았습니다.
      // ARM_OPEN_DEG: 몸(수직선)에서 팔이 벌어진 각도. 0 = 차렷, 90 = T자. 15이면 몸에서 15도 벌어진 상태.
      const ARM_OPEN_DEG = 1;
      const ARM_DOWN_RAD = (1.5 - ARM_OPEN_DEG) * Math.PI / 360;
      const ARM_ROT = { LeftShoulder: ARM_DOWN_RAD, RightShoulder: -ARM_DOWN_RAD };
      const poseWorlds = worlds.map((w, i) => {
        const angle = ARM_ROT[pt.bones[i].name];
        if (angle === undefined) return w;
        const p = new THREE.Vector3().setFromMatrixPosition(w);
        const toOrigin = new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z);
        const back = new THREE.Matrix4().makeTranslation(p.x, p.y, p.z);
        const rot = new THREE.Matrix4().makeRotationZ(angle);
        return new THREE.Matrix4().multiplyMatrices(back, rot).multiply(toOrigin).multiply(w);
      });
      // 부모 기준 로컬 행렬. 어깨 뼈만 자세 행렬을 쓰고, 나머지 자식 뼈는 원래 상대 위치를 유지합니다.
      const locals = pt.bones.map((b, i) => {
        const parentWorld = b.parent >= 0 ? worlds[b.parent] : null;
        const own = ARM_ROT[b.name] !== undefined ? poseWorlds[i] : worlds[i];
        return parentWorld
          ? new THREE.Matrix4().copy(parentWorld).invert().multiply(own)
          : own.clone();
      });
      // 자세가 적용된 최종 월드 행렬 (축 계산에 사용)
      const finalWorld = [];
      const solveWorld = (i) => {
        if (finalWorld[i]) return finalWorld[i];
        const p = pt.bones[i].parent;
        finalWorld[i] = p >= 0
          ? new THREE.Matrix4().multiplyMatrices(solveWorld(p), locals[i])
          : locals[i].clone();
        return finalWorld[i];
      };
      const bonesByName = {};
      pt.bones.forEach((b, i) => {
        objs[i].matrix.copy(locals[i]);
        if (b.parent >= 0) objs[b.parent].add(objs[i]);
        else rigRoot.add(objs[i]);
        // 뼈마다 "걷기/대기 때 돌릴 축": 뼈 기준 좌표에서 월드 X축 방향
        const axis = new THREE.Vector3(1, 0, 0)
          .transformDirection(new THREE.Matrix4().copy(solveWorld(i)).invert()).normalize();
        bonesByName[b.name] = { bone: objs[i], restM: locals[i], axis };
      });

      const skinned = new THREE.SkinnedMesh(g, material);
      skinned.frustumCulled = false; // 경계 구가 메쉬 좌표 기준이라 잘못 가려지는 것을 막습니다
      sceneT.add(skinned);
      // bindMatrix를 명시해야 Three.js가 Unity의 바인드 행렬을 덮어쓰지 않습니다.
      skinned.bind(new THREE.Skeleton(objs, inverses), new THREE.Matrix4());
      rigParts.push({ skinned, bones: bonesByName });
    });
    rigRoot.updateMatrixWorld(true);
  }

  // 걷기(다리·팔 교차 흔들림)와 대기(숨쉬기, 팔 살짝 흔들림) 동작
  function updateRig(now, dt, t) {
    if (!rigRoot) return;
    rigRoot.position.copy(playerT.position);
    rigRoot.rotation.y = playerT.rotation.y; // 이동 방향을 바라봄 (모델 앞면은 +Z)
    if (shadowT) shadowT.position.set(playerT.position.x, 0.02, playerT.position.z);

    const moving = !!moveState;
    walkAmp += ((moving ? 1 : 0) - walkAmp) * Math.min(1, dt * 8);
    if (moving) walkPhase += dt * 9;
    const a = walkAmp, idle = 1 - walkAmp, ph = walkPhase;
    const sn = Math.sin(ph);
    const poses = {
      LeftUpLeg: sn * 0.55 * a,
      RightUpLeg: -sn * 0.55 * a,
      LeftLeg: Math.max(0, -sn) * 0.6 * a,
      RightLeg: Math.max(0, sn) * 0.6 * a,
      LeftArm: -sn * 0.45 * a + Math.sin(t * 1.5) * 0.04 * idle,
      RightArm: sn * 0.45 * a - Math.sin(t * 1.5) * 0.04 * idle,
      Spine1: Math.sin(t * 2) * 0.03 * idle,
      Spine2: Math.sin(t * 2) * 0.03 * idle,
    };
    rigParts.forEach((part) => {
      for (const name in poses) {
        const e = part.bones[name];
        if (!e) continue;
        tmpM.makeRotationAxis(e.axis, poses[name]);
        e.bone.matrix.multiplyMatrices(e.restM, tmpM);   // 뼈 기준 좌표에서 회전
      }
      const hips = part.bones.Hips;
      if (hips) {
        const dy = Math.abs(sn) * 3 * a + Math.sin(t * 2) * 0.6 * idle;
        tmpM.makeTranslation(0, dy, 0);
        hips.bone.matrix.multiplyMatrices(tmpM, hips.restM);
      }
    });
    // 뼈의 월드 행렬을 강제로 다시 계산 (matrixAutoUpdate를 끈 뼈는 자동 갱신되지 않음)
    rigRoot.updateMatrixWorld(true);
  }

  // ---------- 렌더러 ----------
  function initThree() {
    if (initialized) return true;
    if (typeof THREE === "undefined") return false;
    box = document.getElementById("map-canvas");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    box.appendChild(renderer.domElement);

    sceneT = new THREE.Scene();
    sceneT.background = new THREE.Color(0xbfe6ff);
    sceneT.fog = new THREE.Fog(0xbfe6ff, 16, 34);
    camT = new THREE.PerspectiveCamera(50, 1, 0.1, 200);

    sceneT.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(-4, 10, 6);
    sceneT.add(sun);

    const base = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat(0x7fc46a));
    base.rotation.x = -Math.PI / 2;
    base.position.set(W / 2, -0.25, H / 2);
    sceneT.add(base);

    groupT = new THREE.Group();
    sceneT.add(groupT);
    playerT = new THREE.Object3D();
    shadowT = makeShadow();

    window.addEventListener("resize", resizeRenderer);
    bindControls();
    bindKeys();
    initialized = true;
    return true;
  }

  function resizeRenderer() {
    if (!renderer || !box) return;
    const w = box.clientWidth || window.innerWidth;
    const h = box.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camT.aspect = w / h;
    camT.updateProjectionMatrix();
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0;
    lastNow = now;

    // 이동 애니메이션
    if (moveState) {
      const p = Math.min(1, (now - moveState.t0) / MOVE_MS);
      playerT.position.lerpVectors(moveState.from, moveState.to, p);
      if (p >= 1) {
        const s = moveState;
        moveState = null;
        px = s.nx; py = s.ny;
        lastPos[currentVillage] = { x: px, y: py };
        onTile(s.k, px, py);
      }
    }
    // 누르고 있으면, 한 칸이 끝나자마자 다음 칸으로 이어 걸어요 (칸 사이에 멈춤이 생기지 않음)
    if (!moveState && holdFn) {
      const d = holdFn();
      if (d) move(d[0], d[1]);
    }
    // 포켓스톱 볼 회전
    stopMeshes.forEach((m, i) => {
      m.ring.rotation.z = now * 0.002 + i;
      m.ball.position.y = 0.4 + Math.sin(now * 0.003 + i) * 0.05;
    });
    spotMeshes.forEach((ball, i) => {
      ball.position.y = 0.4 + Math.sin(now * 0.004 + i) * 0.06;
    });
    // 아바타 뼈 움직임 (걷기/대기)
    updateRig(now, dt, now / 1000);
    // 카메라는 플레이어를 따라감. 매 프레임 고정 비율로 끌어당기면 프레임 속도에 따라 흔들리므로,
    // 경과 시간(dt)에 맞춰 부드럽게 따라가고, 카메라 위치는 그 중심에서 항상 같은 간격을 둡니다.
    const follow = 1 - Math.exp(-dt * CAM_FOLLOW);
    camFocus.lerp(playerT.position, follow);
    camT.position.set(camFocus.x + CAM_OFFSET.x, CAM_OFFSET.y, camFocus.z + CAM_OFFSET.z);
    camT.lookAt(camFocus.x, 0.8, camFocus.z);
    renderer.render(sceneT, camT);
  }

  // ---------- 이동 ----------
  // 8방향 이동. 대각선은 양옆 두 칸이 모두 걸을 수 있을 때만 (나무 모서리를 뚫고 지나가지 않게).
  function canStep(x, y, dx, dy) {
    const inside = (a, b) => a >= 0 && b >= 0 && a < W && b < H;
    const nx = x + dx, ny = y + dy;
    if (!inside(nx, ny) || !WALK.has(mapData.grid[ny][nx])) return false;
    if (dx !== 0 && dy !== 0) {
      if (!inside(x + dx, y) || !WALK.has(mapData.grid[y][x + dx])) return false;
      if (!inside(x, y + dy) || !WALK.has(mapData.grid[y + dy][x])) return false;
    }
    return true;
  }

  // 이동을 시작하면 true. 이동 중이거나 막혀 있으면 false.
  function move(dx, dy) {
    if (!active || moveState || !mapData) return false;
    if (!canStep(px, py, dx, dy)) return false;
    const nx = px + dx, ny = py + dy;
    const k = mapData.grid[ny][nx];
    playerT.rotation.y = Math.atan2(dx, dy);
    moveState = {
      from: playerT.position.clone(),
      to: new THREE.Vector3(nx, 0, ny),
      t0: performance.now(),
      nx, ny, k,
    };
    return true;
  }

  // 화면상의 점 (월드 x,z 위치의 캐릭터 가슴 높이)을 화면 좌표로 바꿉니다.
  function screenOf(wx, wz) {
    const v = new THREE.Vector3(wx, 0.8, wz).project(camT);
    const r = box.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
  }

  // 캐릭터 기준으로 누른 화면 위치가 어느 방향인지 가까운 순서대로 돌려줍니다.
  function rankDirs(cx, cy) {
    const me = screenOf(playerT.position.x, playerT.position.z);
    const vx = cx - me.x, vy = cy - me.y, vl = Math.hypot(vx, vy);
    if (vl < 24) return null; // 캐릭터 바로 위를 누르면 무시
    return DIRS8.map((d) => {
      const p = screenOf(playerT.position.x + d[0], playerT.position.z + d[1]);
      const ux = p.x - me.x, uy = p.y - me.y, ul = Math.hypot(ux, uy) || 1;
      return { d, dot: (ux * vx + uy * vy) / (ul * vl) };
    }).sort((a, b) => b.dot - a.dot).map((r) => r.d);
  }

  // 1순위가 막혀 있으면 가까운 2순위까지만 봅니다 (엉뚱한 방향으로 가지 않도록)
  function pickStep(ranked) {
    if (!ranked) return null;
    for (const d of ranked.slice(0, 2)) if (canStep(px, py, d[0], d[1])) return d;
    return null;
  }

  function onTile(k, x, y) {
    const spots = (view && view.spots) || [];
    const si = spots.findIndex((s) => s && !s.done && s.x === x && s.y === y);
    if (si >= 0) return handler({ type: "spot", index: si });
    if (k === "T" && Math.random() < GRASS_ENCOUNTER) return handler({ type: "grass" });
    if (k === "S") {
      const index = mapData.stops.findIndex((s) => s.x === x && s.y === y);
      return handler({ type: "stop", index });
    }
    if (k === "D") return handler({ type: "gym" });
  }

  // ---------- 입력: 화면 방향 버튼 + 키보드 ----------
  function bindControls() {
    document.querySelectorAll("#dpad [data-dir]").forEach((btn) => {
      const [dx, dy] = btn.dataset.dir.split(",").map(Number);
      const start = (e) => {
        e.preventDefault();
        holdFn = () => [dx, dy];
        move(dx, dy);
      };
      const stop = () => { holdFn = null; };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", stop);
      btn.addEventListener("pointerleave", stop);
      btn.addEventListener("pointercancel", stop);
    });
    // 화면을 누르면 캐릭터 기준으로 누른 쪽으로 걸어갑니다. 누르고 있으면 계속 걸어갑니다.
    let holdPos = null;
    const endHold = () => { holdPos = null; holdFn = null; };
    box.addEventListener("pointerdown", (e) => {
      if (!active) return;
      e.preventDefault();
      holdPos = { x: e.clientX, y: e.clientY };
      holdFn = () => pickStep(rankDirs(holdPos.x, holdPos.y));
      const d = holdFn();
      if (d) move(d[0], d[1]);
    });
    box.addEventListener("pointermove", (e) => { if (holdPos) holdPos = { x: e.clientX, y: e.clientY }; });
    box.addEventListener("pointerup", endHold);
    box.addEventListener("pointercancel", endHold);
    box.addEventListener("pointerleave", endHold);

    const menu = document.getElementById("map-menu");
    if (menu) menu.onclick = () => handler({ type: "menu" });
  }

  function bindKeys() {
    // 방향키 두 개를 함께 누르면 대각선입니다.
    const keyDir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const held = new Set();
    const keyStep = () => {
      let dx = 0, dy = 0;
      held.forEach((k) => { dx += keyDir[k][0]; dy += keyDir[k][1]; });
      dx = Math.sign(dx); dy = Math.sign(dy);
      return (dx || dy) ? [dx, dy] : null;
    };
    window.addEventListener("keydown", (e) => {
      if (!active || !keyDir[e.key]) return;
      e.preventDefault();
      if (held.has(e.key)) return; // 키 자동 반복은 무시하고, 이동은 holdFn이 이어 갑니다
      held.add(e.key);
      holdFn = keyStep;
      const d = keyStep();
      if (d) move(d[0], d[1]);
    });
    window.addEventListener("keyup", (e) => { held.delete(e.key); if (!held.size) holdFn = null; });
    window.addEventListener("blur", () => { held.clear(); holdFn = null; });
  }

  const api = {
    available: typeof THREE !== "undefined",
    setHandler(fn) { handler = fn; },
    // 마을의 기본 조우 지점 위치와, 조우 지점을 둘 수 있는 풀밭 칸 목록 (걸어서 닿는 칸만)
    layout(village) {
      const m = generate(village);
      return { spots: m.spots, cand: m.cand };
    },
    show(village, opts = {}) {
      view = null;
      view = { ...opts };
      view.stopReady = opts.stopReady;
      view.gymLabel = opts.gymLabel;
      if (!initThree()) return false;
      const el = document.getElementById("map-view");
      if (!el) return false;
      el.hidden = false;
      document.getElementById("map-title").textContent = opts.title || "";
      currentVillage = village;
      active = true;
      moveState = null;

      const gender = opts.gender === "female" ? "female" : "male";
      if (gender !== rigGender) buildRig(gender);

      buildMap(village);
      const saved = lastPos[village];
      px = saved ? saved.x : START.x;
      py = saved ? saved.y : START.y;
      playerT.position.set(px, 0, py);
      resizeRenderer();
      // 카메라는 바로 플레이어 뒤쪽에 맞춥니다
      camFocus = new THREE.Vector3(px, 0, py);
      camT.position.set(px + CAM_OFFSET.x, CAM_OFFSET.y, py + CAM_OFFSET.z);
      camT.lookAt(px, 0.8, py);
      if (raf) cancelAnimationFrame(raf);
      frame();
      return true;
    },
    hide() {
      active = false;
      moveState = null;
      holdFn = null;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      const el = document.getElementById("map-view");
      if (el) el.hidden = true;
    },
    isVisible() {
      const el = document.getElementById("map-view");
      return !!el && !el.hidden;
    },
  };
  api.debug = () => ({ rigRoot, rigParts, playerT });
  return api;
})();
