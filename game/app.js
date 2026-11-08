// 포켓 수학 모험 — 로컬 웹 프로토타입 (5~8살용)
// 어셋: assets/ 폴더 (개인 학습용. 외부에 배포하지 말 것)

const STORE_KEY = "poke-math-v1";
const MAX_LV = 50;      // 파트너 최대 레벨
const WILD_MAX_LV = 60; // 야생/관장 포켓몬 최대 레벨
const VILLAGE_COUNT = 50;

// 난이도 구간: 마을 10개씩 5구간으로 나눕니다.
// weights: 야생 포켓몬 등급 비율 [1등급, 2등급, 3등급] / cap: 관장 포켓몬의 최대 등급
// time: 관장전 제한 시간(초). 낮은 구간은 최대 5분, 최상급은 최소 30초입니다.
// sum: 6살 문제에서 문제에 나오는 두 수의 합(a + b)의 상한. 초급 30, 중급 60 (그 밖의 구간은 제한 없음)
const DIFFICULTY_BANDS = [
  { name: "초급",   weights: [0.85, 0.15, 0.0], cap: 1, time: 300, sum: 30 },
  { name: "입문",   weights: [0.6, 0.3, 0.1],   cap: 2, time: 240, sum: 40 },
  { name: "중급",   weights: [0.4, 0.4, 0.2],   cap: 2, time: 180, sum: 70 },
  { name: "상급",   weights: [0.2, 0.4, 0.4],   cap: 3, time: 90, sum: 110 },
  { name: "최상급", weights: [0.1, 0.3, 0.6],   cap: 3, time: 30, sum: Infinity },
];
function bandOf(village) {
  return DIFFICULTY_BANDS[Math.min(DIFFICULTY_BANDS.length - 1, Math.floor(village / 10))];
}

// tier: 1~3 (야생 출현 확률과 난이도). evo: 레벨이 lv가 되면 to로 진화 (파트너만 성장)
const POKEMON = [
  { id: 1,   name: "이상해씨", tier: 1, evo: { to: 2, lv: 10 } },
  { id: 2,   name: "이상해풀", tier: 2, evo: { to: 3, lv: 20 } },
  { id: 3,   name: "이상해꽃", tier: 3 },
  { id: 4,   name: "파이리",   tier: 1, evo: { to: 5, lv: 10 } },
  { id: 5,   name: "리자드",   tier: 2, evo: { to: 6, lv: 20 } },
  { id: 6,   name: "리자몽",   tier: 3 },
  { id: 7,   name: "꼬부기",   tier: 1, evo: { to: 8, lv: 10 } },
  { id: 8,   name: "어니부기", tier: 2, evo: { to: 9, lv: 20 } },
  { id: 9,   name: "거북왕",   tier: 3 },
  { id: 25,  name: "피카츄",   tier: 2, evo: { to: 26, lv: 20 } },
  { id: 26,  name: "라이츄",   tier: 3 },
  { id: 35,  name: "삐삐",     tier: 2, evo: { to: 36, lv: 10 } },
  { id: 36,  name: "픽시",     tier: 3 },
  { id: 39,  name: "푸린",     tier: 2, evo: { to: 40, lv: 10 } },
  { id: 40,  name: "푸크린",   tier: 3 },
  { id: 52,  name: "나옹",     tier: 1, evo: { to: 53, lv: 10 } },
  { id: 53,  name: "페르시온", tier: 3 },
  { id: 54,  name: "고라파덕", tier: 1, evo: { to: 55, lv: 10 } },
  { id: 55,  name: "골덕",     tier: 3 },
  { id: 58,  name: "가디",     tier: 1, evo: { to: 59, lv: 10 } },
  { id: 59,  name: "윈디",     tier: 3 },
  { id: 74,  name: "꼬마돌",   tier: 1, evo: { to: 75, lv: 10 } },
  { id: 75,  name: "데구리",   tier: 2, evo: { to: 76, lv: 20 } },
  { id: 76,  name: "딱구리",   tier: 3 },
  { id: 92,  name: "고오스",   tier: 1, evo: { to: 93, lv: 10 } },
  { id: 93,  name: "우츠동",   tier: 2, evo: { to: 94, lv: 20 } },
  { id: 94,  name: "팬텀",     tier: 3 },
  { id: 113, name: "럭키",     tier: 3, evo: { to: 242, lv: 10 } },
  { id: 242, name: "해피너스", tier: 3 },
  { id: 133, name: "이브이",   tier: 1, evo: { to: 134, lv: 10 } },
  { id: 134, name: "샤미드",   tier: 3 },
  { id: 143, name: "잠만보",   tier: 3 },
  { id: 147, name: "미뇽",     tier: 1, evo: { to: 148, lv: 10 } },
  { id: 148, name: "신뇽",     tier: 2, evo: { to: 149, lv: 20 } },
  { id: 149, name: "망나뇽",   tier: 3 },
  { id: 172, name: "피츄",     tier: 1, evo: { to: 25, lv: 10 } },
  // 1세대 나머지 (PokeAPI 기준: 한국어 이름, 속성, 단계 등급. 전설 포켓몬은 랜덤 조우·관장에서 제외)
  { id: 10, name: "캐터피", tier: 1, type: "bug", evo: { to: 11, lv: 7 } },
  { id: 11, name: "단데기", tier: 2, type: "bug", evo: { to: 12, lv: 10 } },
  { id: 12, name: "버터플", tier: 3, type: "bug" },
  { id: 13, name: "뿔충이", tier: 1, type: "bug", evo: { to: 14, lv: 7 } },
  { id: 14, name: "딱충이", tier: 2, type: "bug", evo: { to: 15, lv: 10 } },
  { id: 15, name: "독침붕", tier: 3, type: "bug" },
  { id: 16, name: "구구", tier: 1, type: "normal", evo: { to: 17, lv: 18 } },
  { id: 17, name: "피죤", tier: 2, type: "normal", evo: { to: 18, lv: 36 } },
  { id: 18, name: "피죤투", tier: 3, type: "normal" },
  { id: 19, name: "꼬렛", tier: 1, type: "normal", evo: { to: 20, lv: 20 } },
  { id: 20, name: "레트라", tier: 3, type: "normal" },
  { id: 21, name: "깨비참", tier: 1, type: "normal", evo: { to: 22, lv: 20 } },
  { id: 22, name: "깨비드릴조", tier: 3, type: "normal" },
  { id: 23, name: "아보", tier: 1, type: "poison", evo: { to: 24, lv: 22 } },
  { id: 24, name: "아보크", tier: 3, type: "poison" },
  { id: 27, name: "모래두지", tier: 1, type: "ground", evo: { to: 28, lv: 22 } },
  { id: 28, name: "고지", tier: 3, type: "ground" },
  { id: 29, name: "니드런♀", tier: 1, type: "poison", evo: { to: 30, lv: 16 } },
  { id: 30, name: "니드리나", tier: 2, type: "poison" },
  { id: 31, name: "니드퀸", tier: 3, type: "poison" },
  { id: 32, name: "니드런♂", tier: 1, type: "poison", evo: { to: 33, lv: 16 } },
  { id: 33, name: "니드리노", tier: 2, type: "poison" },
  { id: 34, name: "니드킹", tier: 3, type: "poison" },
  { id: 37, name: "식스테일", tier: 1, type: "fire" },
  { id: 38, name: "나인테일", tier: 3, type: "fire" },
  { id: 41, name: "주뱃", tier: 1, type: "poison", evo: { to: 42, lv: 22 } },
  { id: 42, name: "골뱃", tier: 3, type: "poison" },
  { id: 43, name: "뚜벅쵸", tier: 1, type: "grass", evo: { to: 44, lv: 21 } },
  { id: 44, name: "냄새꼬", tier: 2, type: "grass" },
  { id: 45, name: "라플레시아", tier: 3, type: "grass" },
  { id: 46, name: "파라스", tier: 1, type: "bug", evo: { to: 47, lv: 24 } },
  { id: 47, name: "파라섹트", tier: 3, type: "bug" },
  { id: 48, name: "콘팡", tier: 1, type: "bug", evo: { to: 49, lv: 31 } },
  { id: 49, name: "도나리", tier: 3, type: "bug" },
  { id: 50, name: "디그다", tier: 1, type: "ground", evo: { to: 51, lv: 26 } },
  { id: 51, name: "닥트리오", tier: 3, type: "ground" },
  { id: 56, name: "망키", tier: 1, type: "fighting", evo: { to: 57, lv: 28 } },
  { id: 57, name: "성원숭", tier: 3, type: "fighting" },
  { id: 60, name: "발챙이", tier: 1, type: "water", evo: { to: 61, lv: 25 } },
  { id: 61, name: "슈륙챙이", tier: 2, type: "water" },
  { id: 62, name: "강챙이", tier: 3, type: "water" },
  { id: 63, name: "캐이시", tier: 1, type: "psychic", evo: { to: 64, lv: 16 } },
  { id: 64, name: "윤겔라", tier: 2, type: "psychic" },
  { id: 65, name: "후딘", tier: 3, type: "psychic" },
  { id: 66, name: "알통몬", tier: 1, type: "fighting", evo: { to: 67, lv: 28 } },
  { id: 67, name: "근육몬", tier: 2, type: "fighting" },
  { id: 68, name: "괴력몬", tier: 3, type: "fighting" },
  { id: 69, name: "모다피", tier: 1, type: "grass", evo: { to: 70, lv: 21 } },
  { id: 70, name: "우츠동", tier: 2, type: "grass" },
  { id: 71, name: "우츠보트", tier: 3, type: "grass" },
  { id: 72, name: "왕눈해", tier: 1, type: "water", evo: { to: 73, lv: 30 } },
  { id: 73, name: "독파리", tier: 3, type: "water" },
  { id: 77, name: "포니타", tier: 1, type: "fire", evo: { to: 78, lv: 40 } },
  { id: 78, name: "날쌩마", tier: 3, type: "fire" },
  { id: 79, name: "야돈", tier: 1, type: "water", evo: { to: 80, lv: 37 } },
  { id: 80, name: "야도란", tier: 3, type: "water" },
  { id: 81, name: "코일", tier: 1, type: "electric", evo: { to: 82, lv: 30 } },
  { id: 82, name: "레어코일", tier: 3, type: "electric" },
  { id: 83, name: "파오리", tier: 3, type: "normal" },
  { id: 84, name: "두두", tier: 1, type: "normal", evo: { to: 85, lv: 31 } },
  { id: 85, name: "두트리오", tier: 3, type: "normal" },
  { id: 86, name: "쥬쥬", tier: 1, type: "water", evo: { to: 87, lv: 34 } },
  { id: 87, name: "쥬레곤", tier: 3, type: "water" },
  { id: 88, name: "질퍽이", tier: 1, type: "poison", evo: { to: 89, lv: 38 } },
  { id: 89, name: "질뻐기", tier: 3, type: "poison" },
  { id: 90, name: "셀러", tier: 1, type: "water" },
  { id: 91, name: "파르셀", tier: 3, type: "water" },
  { id: 95, name: "롱스톤", tier: 3, type: "rock" },
  { id: 96, name: "슬리프", tier: 1, type: "psychic", evo: { to: 97, lv: 26 } },
  { id: 97, name: "슬리퍼", tier: 3, type: "psychic" },
  { id: 98, name: "크랩", tier: 1, type: "water", evo: { to: 99, lv: 28 } },
  { id: 99, name: "킹크랩", tier: 3, type: "water" },
  { id: 100, name: "찌리리공", tier: 1, type: "electric", evo: { to: 101, lv: 30 } },
  { id: 101, name: "붐볼", tier: 3, type: "electric" },
  { id: 102, name: "아라리", tier: 1, type: "grass" },
  { id: 103, name: "나시", tier: 3, type: "grass" },
  { id: 104, name: "탕구리", tier: 1, type: "ground", evo: { to: 105, lv: 28 } },
  { id: 105, name: "텅구리", tier: 3, type: "ground" },
  { id: 106, name: "시라소몬", tier: 3, type: "fighting" },
  { id: 107, name: "홍수몬", tier: 3, type: "fighting" },
  { id: 108, name: "내루미", tier: 3, type: "normal" },
  { id: 109, name: "또가스", tier: 1, type: "poison", evo: { to: 110, lv: 35 } },
  { id: 110, name: "또도가스", tier: 3, type: "poison" },
  { id: 111, name: "뿔카노", tier: 1, type: "ground", evo: { to: 112, lv: 42 } },
  { id: 112, name: "코뿌리", tier: 3, type: "ground" },
  { id: 114, name: "덩쿠리", tier: 3, type: "grass" },
  { id: 115, name: "캥카", tier: 3, type: "normal" },
  { id: 116, name: "쏘드라", tier: 1, type: "water", evo: { to: 117, lv: 32 } },
  { id: 117, name: "시드라", tier: 3, type: "water" },
  { id: 118, name: "콘치", tier: 1, type: "water", evo: { to: 119, lv: 33 } },
  { id: 119, name: "왕콘치", tier: 3, type: "water" },
  { id: 120, name: "별가사리", tier: 1, type: "water" },
  { id: 121, name: "아쿠스타", tier: 3, type: "water" },
  { id: 122, name: "마임맨", tier: 3, type: "psychic" },
  { id: 123, name: "스라크", tier: 3, type: "bug" },
  { id: 124, name: "루주라", tier: 3, type: "ice" },
  { id: 125, name: "에레브", tier: 3, type: "electric" },
  { id: 126, name: "마그마", tier: 3, type: "fire" },
  { id: 127, name: "쁘사이저", tier: 3, type: "bug" },
  { id: 128, name: "켄타로스", tier: 3, type: "normal" },
  { id: 129, name: "잉어킹", tier: 1, type: "water", evo: { to: 130, lv: 20 } },
  { id: 130, name: "갸라도스", tier: 3, type: "water" },
  { id: 131, name: "라프라스", tier: 3, type: "water" },
  { id: 132, name: "메타몽", tier: 3, type: "normal" },
  { id: 135, name: "쥬피썬더", tier: 3, type: "electric" },
  { id: 136, name: "부스터", tier: 3, type: "fire" },
  { id: 137, name: "폴리곤", tier: 3, type: "normal" },
  { id: 138, name: "암나이트", tier: 1, type: "rock", evo: { to: 139, lv: 40 } },
  { id: 139, name: "암스타", tier: 3, type: "rock" },
  { id: 140, name: "투구", tier: 1, type: "rock", evo: { to: 141, lv: 40 } },
  { id: 141, name: "투구푸스", tier: 3, type: "rock" },
  { id: 142, name: "프테라", tier: 3, type: "rock" },
  { id: 144, name: "프리져", tier: 3, type: "ice", legendary: true },
  { id: 145, name: "썬더", tier: 3, type: "electric", legendary: true },
  { id: 146, name: "파이어", tier: 3, type: "fire", legendary: true },
  { id: 150, name: "뮤츠", tier: 3, type: "psychic", legendary: true },
  { id: 151, name: "뮤", tier: 3, type: "psychic", legendary: true },
];
const byId = Object.fromEntries(POKEMON.map((p) => [p.id, p]));

// 고유 스킬: 포켓몬마다 1개. 대결에서 문제를 맞히면 SKILL_CHANCE 확률로 파트너의 스킬이 나갑니다.
// 스킬 이름과 연출 색은 직접 정한 것입니다 (APK 어셋에는 기술 목록 데이터가 없었습니다).
const SKILL_CHANCE = 0.35;
const SKILLS = {
  1: { name: "덩굴채찍", fx: "grass" }, 2: { name: "잎날가르기", fx: "grass" }, 3: { name: "솔라빔", fx: "grass" },
  4: { name: "불꽃세례", fx: "fire" }, 5: { name: "불꽃엄니", fx: "fire" }, 6: { name: "화염방사", fx: "fire" },
  7: { name: "물대포", fx: "water" }, 8: { name: "거품광선", fx: "water" }, 9: { name: "하이드로펌프", fx: "water" },
  25: { name: "10만볼트", fx: "electric" }, 26: { name: "번개", fx: "electric" }, 172: { name: "전기충격", fx: "electric" },
  35: { name: "노래하기", fx: "normal" }, 36: { name: "문포스", fx: "fairy" },
  39: { name: "구르기", fx: "normal" }, 40: { name: "파괴광선", fx: "normal" },
  52: { name: "할퀴기", fx: "normal" }, 53: { name: "악의파동", fx: "dark" },
  54: { name: "물의파동", fx: "water" }, 55: { name: "폭포오르기", fx: "water" },
  58: { name: "화염돌진", fx: "fire" }, 59: { name: "불대문자", fx: "fire" },
  74: { name: "바위던지기", fx: "rock" }, 75: { name: "바위깨기", fx: "fighting" }, 76: { name: "스톤에지", fx: "rock" },
  92: { name: "섀도볼", fx: "ghost" }, 93: { name: "나이트헤드", fx: "ghost" }, 94: { name: "섀도클로", fx: "ghost" },
  113: { name: "달콤한키스", fx: "fairy" }, 242: { name: "알폭탄", fx: "normal" },
  133: { name: "몸통박치기", fx: "normal" }, 134: { name: "아쿠아젯", fx: "water" }, 143: { name: "깔아뭉개기", fx: "normal" },
  147: { name: "용의숨결", fx: "dragon" }, 148: { name: "용의분노", fx: "dragon" }, 149: { name: "용성군", fx: "dragon" },
};
// SKILLS에 없는 포켓몬은 속성별 기본 스킬을 씁니다.
const TYPE_SKILL = { grass: "잎날가르기", fire: "불꽃세례", water: "물대포", electric: "전기충격", normal: "몸통박치기", ghost: "섀도볼", psychic: "사이코키네시스", rock: "바위던지기", ground: "머드샷", fighting: "힘껏치기", poison: "독침", bug: "벌레의저항", flying: "날개치기", ice: "얼음뭉치", dragon: "용의숨결", fairy: "달콤한키스", dark: "악의파동", steel: "쇠구슬" };
function skillOf(id) {
  if (SKILLS[id]) return SKILLS[id];
  const t = byId[id] && byId[id].type;
  return t && TYPE_SKILL[t] ? { name: TYPE_SKILL[t], fx: t } : null;
}
// 이번 공격에 파트너 스킬이 나갈지 정합니다. 나가면 스킬 정보를, 아니면 null을 돌려줍니다.
function rollSkill() {
  const p = partner();
  const sk = p && skillOf(p.id);
  if (!sk || Math.random() >= SKILL_CHANCE) return null;
  return sk;
}

// 마을 50개: 이름과 관장은 규칙으로 만들고, 관장 포켓몬은 마을 번호에 따라 고릅니다.
const VILLAGE_PREFIX = [
  "새싹", "푸른", "바람", "달빛", "별빛", "구름", "무지개", "은빛", "황금", "수정",
  "얼음", "불꽃", "숲속", "바다", "산", "하늘", "모래", "꽃잎", "반짝", "초원",
  "호수", "안개", "노을", "그림자", "보름달",
];
const LEADER_FIRST = ["솔이", "풀잎", "물결", "햇살", "바람", "달님", "별이", "구름", "이슬", "호수"];
const VILLAGES = Array.from({ length: VILLAGE_COUNT }, (_, i) => {
  const band = bandOf(i);
  const cap = band.cap;                                  // 관장 포켓몬의 최대 등급 (구간별)
  const pool = POKEMON.filter((p) => p.tier <= cap && !p.legendary);
  const ids = [0, 1, 2].map((k) => pool[(i * 3 + k) % pool.length].id);
  if (i >= 20) ids.push(pool[(i * 3 + 3) % pool.length].id); // 뒤쪽 마을은 4마리
  const gen = Math.floor(i / 10) + 1;
  return {
    name: `${VILLAGE_PREFIX[i % VILLAGE_PREFIX.length]} ${i < 25 ? "마을" : "타운"}`,
    leader: `${LEADER_FIRST[i % 10]} 관장${gen > 1 ? ` ${gen}세` : ""}`,
    ids,
  };
});

// 볼은 보유 개수(state.items)만큼 쓸 수 있습니다. 포켓스톱 퀴즈로 얻습니다.
const BALLS = [
  { key: "monster", name: "몬스터볼",   img: "assets/ui/pokeball_sprite.png",  base: 0.6 },
  { key: "great",   name: "그레이트볼", img: "assets/ui/greatball_sprite.png", base: 0.8 },
  { key: "ultra",   name: "울트라볼",   img: "assets/ui/ultraball_sprite.png", base: 0.95 },
];
const STOP_COUNT = 3;          // 마을마다 포켓스톱 개수 (map.js와 같아야 함)
const STOP_QUESTIONS = 3;      // 포켓스톱 한 번에 푸는 문제 수
const STOP_COOLDOWN_MS = 10 * 60 * 1000;
let stopSession = null;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

// ---------- 저장 (실패해도 게임은 동작) ----------
function defaultState() {
  return {
    age: null, gender: "male", village: 0, caught: {}, partnerId: null, stars: 0, streak: 0, bestStreak: 0, badges: [],
    items: { monster: 10, great: 0, ultra: 0 },
    stopUsedAt: {},
    hintPoints: 0, hintExp: 0, // 힌트 포인트 (보유 개수 / 다음 포인트까지 쌓인 경험치)
  };
}
function loadState() {
  const s = defaultState();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) Object.assign(s, JSON.parse(raw));
  } catch (e) { /* 저장소 사용 불가 */ }
  // 예전 저장 형식(caught: {id: true}) 변환
  for (const k of Object.keys(s.caught || {})) {
    const v = s.caught[k];
    if (!v || typeof v !== "object") s.caught[k] = { lv: 1, exp: 0 };
  }
  if (!Array.isArray(s.badges)) s.badges = [];
  if (!s.items) s.items = defaultState().items;
  if (s.gender !== "female") s.gender = "male";
  if (!s.stopUsedAt) s.stopUsedAt = {};
  s.village = clamp(s.village || 0, 0, VILLAGE_COUNT - 1);
  return s;
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
}
let state = loadState();

// ---------- 파트너 · 레벨 · 진화 ----------
function partner() {
  if (!state.partnerId || !state.caught[state.partnerId]) return null;
  return { id: state.partnerId, ...state.caught[state.partnerId] };
}
function partnerLv() {
  const p = partner();
  return p ? p.lv : 1;
}
const expToNext = (lv) => 20 + lv * 10;

// 파트너 진화 조건이 맞으면 진화시키고, 진화 이벤트를 돌려줍니다 (없으면 null)
function evolveIfReady() {
  const p = partner();
  if (!p) return null;
  const evo = byId[p.id].evo;
  if (!evo || p.lv < evo.lv) return null;
  const fromId = p.id;
  const entry = state.caught[p.id];
  delete state.caught[p.id];
  state.caught[evo.to] = { lv: entry.lv, exp: entry.exp };
  state.partnerId = evo.to;
  saveState();
  return { type: "evo", fromId, toId: evo.to, lv: entry.lv };
}

// 상대가 파트너보다 강할수록 경험치를 더 줍니다 (레벨 1 차이당 ±15%, 0.5배~2배).
function expMultiplier(enemyLv) {
  const d = enemyLv - partnerLv();
  return clamp(1 + d * 0.15, 0.5, 2);
}

// 파트너에게 경험치를 주고 레벨업/진화 이벤트 목록을 돌려줍니다 (없으면 빈 배열)
// enemyLv를 주면 상대 레벨 차이에 따라 경험치를 가감합니다 (최소 1).
function gainExp(amount, enemyLv) {
  const events = [];
  const p = partner();
  if (!p) return events;
  if (enemyLv != null) amount = Math.max(1, Math.round(amount * expMultiplier(enemyLv)));
  let entry = state.caught[p.id];
  entry.exp += amount;
  while (entry.lv < MAX_LV && entry.exp >= expToNext(entry.lv)) {
    entry.exp -= expToNext(entry.lv);
    const from = entry.lv;
    entry.lv += 1;
    events.push({ type: "lv", id: state.partnerId, from, to: entry.lv });
    const evo = evolveIfReady();
    if (evo) {
      events.push(evo);
      entry = state.caught[state.partnerId];
    }
  }
  saveState();
  return events;
}

// 레벨업/진화 카드 (썸네일 포함)
function eventCardHtml(ev) {
  if (ev.type === "evo") {
    return `
      <div class="event-card evo">
        <div class="event-tag">✨ 진화!</div>
        <div class="evo-pair">
          <figure><img src="assets/pokemon/${ev.fromId}.png" alt="${byId[ev.fromId].name}"><figcaption>${byId[ev.fromId].name}</figcaption></figure>
          <span class="evo-arrow">➜</span>
          <figure><img src="assets/pokemon/${ev.toId}.png" alt="${byId[ev.toId].name}"><figcaption>${byId[ev.toId].name}</figcaption></figure>
        </div>
        <p class="event-sub">${byId[ev.toId].name} Lv.${ev.lv}로 진화했어요</p>
      </div>`;
  }
  return `
    <div class="event-card lv">
      <img src="assets/pokemon/${ev.id}.png" alt="${byId[ev.id].name}">
      <div class="event-body">
        <div class="event-tag">🆙 레벨 업!</div>
        <b>${byId[ev.id].name}</b>
        <span class="lv-change">Lv.${ev.from} → Lv.${ev.to}</span>
      </div>
    </div>`;
}
const eventCardsHtml = (events) => events.map(eventCardHtml).join("");

// 지도 조우 중에는 화면을 가리지 않도록 위쪽에 잠깐 떴다가 사라지는 카드
let floatTimer = null;
function showFloatCards(events) {
  let box = document.getElementById("float-card");
  if (!box) {
    box = document.createElement("div");
    box.id = "float-card";
    document.body.appendChild(box);
  }
  box.innerHTML = eventCardsHtml(events);
  box.classList.add("show");
  clearTimeout(floatTimer);
  floatTimer = setTimeout(() => box.classList.remove("show"), 3000);
}

// ---------- 소리·음성·알림 ----------
function sfx(name) {
  try {
    const a = new Audio(`assets/sfx/${name}.wav`);
    a.volume = 0.6;
    a.play().catch(() => {});
  } catch (e) { /* 무시 */ }
}
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* 무시 */ }
}
// 화면을 바꿀 때는 항상 지도 화면을 먼저 숨깁니다.
const $app = () => {
  PokeMap.hide();
  return document.getElementById("app");
};
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

// 파트너 정보 카드 (문제 화면 아래에 표시)
function partnerPanel() {
  const p = partner();
  if (!p) {
    return `<div class="partner"><span>🤝 파트너가 없어요 (Lv.1 기준)</span></div>`;
  }
  const info = byId[p.id];
  const need = expToNext(p.lv);
  const pct = clamp((p.exp / need) * 100, 0, 100);
  return `
    <div class="partner">
      <img src="assets/pokemon/${p.id}.png" alt="${info.name}">
      <div class="partner-info">
        <b>🤝 ${info.name} Lv.${p.lv}</b>
        <div class="bar small"><div style="width:${pct}%"></div></div>
        <small>경험치 ${p.exp} / ${need}${info.evo ? ` · Lv.${info.evo.lv}에 진화` : ""}</small>
      </div>
    </div>`;
}

// ---------- 문제 생성 ----------
// lvl: 1~5 (높을수록 큰 수). 나이(5~8)에 따라 문제 종류가 달라집니다.
// 힌트 그림: 사과를 묶음으로 보여 줍니다 (5개씩 묶어서 세기 쉽게)
const apples = (n) => "🍎".repeat(n);
function appleGroups(n) {
  const out = [];
  for (let i = 0; i < n; i += 5) out.push(apples(Math.min(5, n - i)));
  return out.join("  ");
}

// 10칸 틀 그림 (2행 5열). 파란 칸 = 처음 수, 주황 칸 = 10을 채우는 데 쓴 수
function tenFrame(blue, orange = 0) {
  let cells = "";
  for (let i = 0; i < 10; i++) {
    const x = 6 + (i % 5) * 26, y = 6 + Math.floor(i / 5) * 26;
    const fill = i < blue ? "#3b82f6" : i < blue + orange ? "#ff9f43" : "#ffffff";
    cells += `<rect x="${x}" y="${y}" width="22" height="22" rx="5" fill="${fill}" stroke="#7b8fa3" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 136 58" width="120" height="51" role="img" aria-label="10칸 틀">${cells}</svg>`;
}
// n개를 10칸 틀로 나타냅니다 (10을 넘으면 틀을 여러 개 씁니다)
function tenFrames(n) {
  const out = [];
  for (let left = n; left > 0; left -= 10) out.push(tenFrame(Math.min(10, left)));
  return `<div class="ten-row">${out.join("")}</div>`;
}
// 두 자리 수를 막대(10개 묶음)와 낱개로 보여 줍니다.
// removedT / removedO: 덜어낼 막대·낱개 수 (오른쪽 끝부터 주황색으로 표시)
function bar(removed) {
  let cells = "";
  for (let i = 0; i < 10; i++) {
    cells += `<rect x="${3 + i * 12}" y="4" width="10" height="20" rx="3" fill="${removed ? "#ff9f43" : "#3b82f6"}" stroke="#7b8fa3" stroke-width="1.5"/>`;
  }
  return `<svg viewBox="0 0 126 28" width="110" height="24" role="img" aria-label="10 막대">${cells}</svg>`;
}
function one(removed) {
  return `<svg viewBox="0 0 24 28" width="18" height="22" role="img" aria-label="낱개"><rect x="2" y="4" width="20" height="20" rx="4" fill="${removed ? "#ff9f43" : "#3b82f6"}" stroke="#7b8fa3" stroke-width="1.5"/></svg>`;
}
function tensOnes(t, o, removedT = 0, removedO = 0) {
  const bars = Array.from({ length: t }, (_, i) => bar(i >= t - removedT)).join("");
  const ones = Array.from({ length: o }, (_, i) => one(i >= o - removedO)).join("");
  return bars + ones || "<b>0</b>";
}

// 두 자리 덧셈: 막대와 낱개를 따로 더하고, 낱개가 10이 되면 막대로 바꿉니다.
function addTensHint(a, b) {
  const ta = Math.floor(a / 10), oa = a % 10, tb = Math.floor(b / 10), ob = b % 10;
  const carry = oa + ob >= 10;
  const t = ta + tb + (carry ? 1 : 0), o = (oa + ob) % 10;
  return {
    title: "10 묶음과 낱개로 나누기",
    visual: `<div class="ten-row">${tensOnes(ta, oa)}<span>+</span>${tensOnes(tb, ob)}</div>
      <div class="ten-row"><span>=</span>${tensOnes(t, o)}</div>`,
    body: [
      carry ? "낱개가 10개 모이면 막대 1개로 바꿔요." : "낱개끼리 먼저 더해요.",
      "막대는 막대끼리, 낱개는 낱개끼리 더해요.",
    ],
  };
}

// 두 자리 뺄셈: 낱개부터 덜어냅니다. 낱개가 모자라면 막대 1개를 낱개 10개로 풉니다.
function subTensHint(a, b) {
  const ta = Math.floor(a / 10), oa = a % 10, tb = Math.floor(b / 10), ob = b % 10;
  let t = ta, o = oa;
  const unbundle = o < ob;
  if (unbundle) { t -= 1; o += 10; }
  const rt = t - tb, ro = o - ob;
  return {
    title: "10 묶음에서 덜어내기",
    visual: `<div class="ten-row">${tensOnes(t, o, tb, ob)}</div>
      <div class="ten-row"><span>→</span></div>
      <div class="ten-row">${tensOnes(rt, ro)}</div>`,
    body: [
      unbundle ? "낱개가 모자라면 막대 1개를 낱개 10개로 풀어요." : "낱개부터 덜어내요.",
      "주황색은 덜어낼 것, 남은 파란색이 답이에요.",
    ],
  };
}

// 뺄셈 힌트: 두 자리 수는 막대 그림, 한 자리 수는 사과 그림
function subHint(a, b, answer) {
  if (a >= 10) return subTensHint(a, b);
  return {
    title: "빼기는 덜어내기",
    visual: `${appleGroups(answer)}  ${"❌".repeat(b)}`,
    body: ["빼기는 덜어내고 남은 것이 답이에요.", "❌는 없어진 것이에요."],
  };
}

// 더하기 힌트: 두 자리 수는 막대 그림, 합이 10을 넘으면 10을 먼저 채우는 그림, 아니면 사과 묶음 그림
function addHint(a, b) {
  if (a >= 10 || b >= 10) return addTensHint(a, b);
  if (a < 10 && a + b > 10) {
    const need = 10 - a;
    return {
      title: "10을 먼저 채우기",
      visual: `<div class="ten-row">${tenFrame(a, need)}<span>→</span>${tenFrame(10)}<span>+</span>${tenFrames(b - need)}</div>`,
      body: ["10을 먼저 채우면 계산이 쉬워요.", "파란 칸은 처음 수, 주황 칸은 10을 채우는 수예요."],
    };
  }
  return {
    title: "더하기는 모으기",
    visual: `${appleGroups(a)}  +  ${appleGroups(b)}`,
    body: ["더하기는 두 무리를 하나로 모으는 거예요.", "10을 먼저 채우면 계산이 쉬워요."],
  };
}

// sumMax: 6살 문제에서 두 수의 합(a + b)을 이 값 이하로 제한합니다 (구간 sum 값). 다른 나이에는 영향 없음.
function makeQuestion(age, lvl, sumMax = Infinity) {
  let answer, text, visual = "", speech, count, hint;

  if (age === 5) {
    const max = clamp(2 + lvl * 2, 4, 10);
    answer = rand(1, max);
    visual = apples(answer);
    text = "사과가 몇 개일까요?";
    speech = "사과가 몇 개일까요? 하나씩 세어 보세요.";
    count = lvl <= 2 ? 2 : 3;
    hint = {
      title: "하나씩 세어 보기",
      visual: appleGroups(answer),
      body: ["하나씩 짚으면서 세는 것을 '세기'라고 해요.", "묶어서 세면 더 빨라요!"],
    };
  } else if (age === 6) {
    // 두 수의 합이 sumMax를 넘지 않도록 합니다 (초급 30, 중급 60). 제한이 없으면 기존과 같습니다.
    const max = Math.min(clamp(3 + lvl * 3, 6, 15), Math.floor(sumMax / 2));
    // 최상급(레벨 5)은 두 자리 수 덧셈·뺄셈이 70% 나옵니다 (합·차는 99 이하)
    const big = lvl >= 5 && Math.random() < 0.7;
    if (big && Math.random() < 0.5) {
      const a = rand(10, Math.min(89, sumMax - 10)), b = rand(10, Math.min(99 - a, sumMax - a));
      answer = a + b; text = `${a} + ${b} = ?`;
      hint = addHint(a, b);
    } else if (big) {
      // 뺄셈은 a + b(두 수의 합)가 sumMax 이하가 되도록 a, b를 고릅니다
      const a = rand(20, Math.min(99, sumMax - 10)), b = rand(10, Math.min(a - 10, sumMax - a));
      answer = a - b; text = `${a} - ${b} = ?`;
      hint = subHint(a, b, answer);
    } else if (Math.random() < 0.5) {
      const a = rand(0, max), b = rand(0, max - a);
      answer = a + b; text = `${a} + ${b} = ?`;
      hint = addHint(a, b);
    } else {
      const a = rand(0, max), b = rand(0, a);
      answer = a - b; text = `${a} - ${b} = ?`;
      hint = subHint(a, b, answer);
    }
    speech = text.replace("=", "은 얼마일까요").replace(" + ", " 더하기 ").replace(" - ", " 빼기 ");
    count = lvl <= 2 ? 3 : 4;
  } else if (age === 7) {
    const max = clamp(6 + lvl * 6, 12, 30);
    if (Math.random() < 0.5) {
      const a = rand(1, max), b = rand(1, max);
      answer = a + b; text = `${a} + ${b} = ?`;
      hint = addHint(a, b);
    } else {
      const a = rand(2, max), b = rand(1, a);
      answer = a - b; text = `${a} - ${b} = ?`;
      hint = subHint(a, b, answer);
    }
    speech = text.replace(" + ", " 더하기 ").replace(" - ", " 빼기 ").replace(" = ?", " 은 얼마일까요");
    count = 4;
  } else {
    const maxDan = clamp(2 + lvl, 3, 9);
    if (lvl >= 3 && Math.random() < 0.3) {
      const b = rand(2, maxDan), c = rand(2, 9);
      const a = b * c;
      answer = c; text = `${a} ÷ ${b} = ?`;
      speech = `${a} 나누기 ${b} 는 얼마일까요`;
      hint = {
        title: "나눗셈은 똑같이 나누기",
        visual: `${apples(a)} ÷ ${b}`,
        body: ["나눗셈은 똑같이 나누는 거예요.", "곱셈과 짝꿍이라고 생각하면 쉬워요."],
      };
    } else {
      const a = rand(2, maxDan), b = rand(2, 9);
      answer = a * b; text = `${a} × ${b} = ?`;
      speech = `${a} 곱하기 ${b} 는 얼마일까요`;
      hint = {
        title: "곱셈은 여러 번 더하기",
        visual: Array(b).fill(apples(a)).join(" "),
        body: ["곱셈은 같은 수를 여러 번 더하는 거예요.", "묶음이 몇 개인지 생각해 보세요."],
      };
    }
    count = 4;
  }

  const pool = [];
  for (let d = 1; d <= 5; d++) pool.push(answer - d, answer + d);
  const wrong = shuffle(pool.filter((n) => n >= 0 && n !== answer)).slice(0, count - 1);
  return { text, visual, answer, choices: shuffle([answer, ...wrong]), speech, hint };
}

// opts.hint: true이면 힌트 버튼을 보여 줍니다 (전투에서만 사용)
function showQuestion(q, onPick, opts = {}) {
  document.getElementById("qtext").textContent = q.text;
  document.getElementById("qvisual").textContent = q.visual;
  const box = document.getElementById("choices");
  box.innerHTML = q.choices.map((c) => `<button class="btn" data-n="${c}">${c}</button>`).join("");
  box.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => onPick(Number(b.dataset.n), b))
  );
  // 힌트 옆에 그림판 버튼을 둡니다 (힌트는 opts.hint일 때만)
  const hasHint = opts.hint && q.hint;
  box.insertAdjacentHTML("beforeend", `
    <div class="q-tools">
      ${hasHint ? `<button class="btn ghost hint-btn" id="hint-btn"></button>` : ""}
      <button class="btn ghost" id="draw-btn">✏️ 그림판</button>
    </div>`);
  document.getElementById("draw-btn").onclick = () => showDrawLayer(q.text);
  if (hasHint) {
    const hb = document.getElementById("hint-btn");
    const paint = () => {
      hb.textContent = q.hintUsed ? "💡 힌트를 봤어요" : `💡 힌트 보기 (포인트 ${state.hintPoints}개)`;
      hb.disabled = !!q.hintUsed;
    };
    paint();
    hb.onclick = () => {
      if (state.hintPoints <= 0) return toast(`힌트 포인트가 없어요. 정답 ${HINT_EXP_PER_POINT}번마다 1개씩 생겨요.`);
      state.hintPoints -= 1;
      q.hintUsed = true;
      saveState();
      paint();
      showHintLayer(q.hint, q.text);
    };
  }
  speak(q.speech);
}

// 그림판 색 (검정, 빨강, 파랑, 주황, 녹색)
const DRAW_COLORS = [
  { name: "검정", hex: "#111111" },
  { name: "빨강", hex: "#e5484d" },
  { name: "파랑", hex: "#3b82f6" },
  { name: "주황", hex: "#ff9f43" },
  { name: "녹색", hex: "#2fb36b" },
];

// 그림판 레이어: 화면에 마우스·손가락으로 끄적일 수 있습니다. 상단에는 문제와 색 선택을 둡니다.
function showDrawLayer(questionText) {
  document.getElementById("draw-layer")?.remove();
  const layer = document.createElement("div");
  layer.id = "draw-layer";
  layer.className = "draw-layer";
  layer.innerHTML = `
    <div class="draw-top">
      <div class="draw-question">${questionText}</div>
      <div class="draw-palette">
        ${DRAW_COLORS.map((c) => `<button class="swatch" data-color="${c.hex}" style="background:${c.hex}" aria-label="${c.name}" title="${c.name}"></button>`).join("")}
        <button class="eraser" id="draw-eraser">지우개</button>
      </div>
    </div>
    <canvas id="draw-canvas"></canvas>
    <div class="draw-bar">
      <button class="btn secondary" id="draw-reset">🧹 초기화</button>
      <button class="btn" id="draw-close">닫기</button>
    </div>`;
  document.body.appendChild(layer);

  const cv = document.getElementById("draw-canvas");
  const ctx = cv.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = cv.getBoundingClientRect();
  cv.width = rect.width * dpr;
  cv.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 현재 도구: 색 펜 또는 지우개 (지우개는 그린 선을 투명하게 지웁니다)
  let color = DRAW_COLORS[0].hex;
  let erasing = false;
  const applyTool = () => {
    ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    ctx.lineWidth = erasing ? 28 : 4;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  };
  const markTool = (el) => {
    layer.querySelectorAll(".swatch, .eraser").forEach((x) => x.classList.remove("sel"));
    el.classList.add("sel");
  };
  layer.querySelectorAll(".swatch").forEach((b) =>
    b.addEventListener("click", () => {
      color = b.dataset.color;
      erasing = false;
      applyTool();
      markTool(b);
    })
  );
  document.getElementById("draw-eraser").addEventListener("click", (e) => {
    erasing = true;
    applyTool();
    markTool(e.currentTarget);
  });
  applyTool();
  markTool(layer.querySelector(".swatch"));

  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let last = null;
  cv.addEventListener("pointerdown", (e) => {
    cv.setPointerCapture(e.pointerId);
    last = pos(e);
    ctx.beginPath();
    ctx.arc(last.x, last.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!last) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });
  const end = () => { last = null; };
  cv.addEventListener("pointerup", end);
  cv.addEventListener("pointercancel", end);

  document.getElementById("draw-reset").onclick = () => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.restore();
  };
  document.getElementById("draw-close").onclick = () => layer.remove();
}

// ---------- 힌트 포인트 (경험치처럼 쌓여서 힌트로 씁니다) ----------
const HINT_EXP_PER_POINT = 5; // 정답 5번 = 힌트 포인트 1개
const HINT_WIN_BONUS = 3;     // 관장 승리 보너스
function gainHintExp(amount) {
  let gained = 0;
  state.hintExp += amount;
  while (state.hintExp >= HINT_EXP_PER_POINT) {
    state.hintExp -= HINT_EXP_PER_POINT;
    state.hintPoints += 1;
    gained += 1;
  }
  saveState();
  return gained;
}

// 레이어 팝업: 아이가 그림과 함께 개념을 볼 수 있게 합니다.
function showHintLayer(h, questionText = "") {
  document.getElementById("hint-layer")?.remove();
  const layer = document.createElement("div");
  layer.id = "hint-layer";
  layer.className = "hint-layer";
  layer.innerHTML = `
    <div class="hint-box" role="dialog" aria-modal="true" aria-label="힌트">
      ${questionText ? `<div class="hint-question">문제: ${questionText}</div>` : ""}
      <h2>💡 ${h.title}</h2>
      <div class="hint-visual">${h.visual || "0개"}</div>
      ${h.body.map((l) => `<p>${l}</p>`).join("")}
      <button class="btn" id="hint-close">알았어요!</button>
    </div>`;
  document.body.appendChild(layer);
  document.getElementById("hint-close").onclick = () => layer.remove();
  speak(h.body.join(" "));
}

// ---------- 난이도 계산 ----------
// 야생 포켓몬 레벨 - 파트너 레벨 = d. d가 크면 어렵고, 음수면 쉽습니다.
function genWild() {
  const w = bandOf(state.village).weights;
  const r = Math.random();
  const tier = r < w[0] ? 1 : r < w[0] + w[1] ? 2 : 3;
  const list = POKEMON.filter((p) => p.tier === tier && !p.legendary);
  const poke = list[rand(0, list.length - 1)];
  // 파트너가 없어도(Lv.1) 첫 마을은 무난하도록 레벨을 낮게 시작합니다.
  const lv = clamp(Math.round(2 + state.village * 1.1 + (tier - 1) * 4 + rand(0, 2)), 1, WILD_MAX_LV); // 마을이 갈수록 완만하게 올라갑니다 (60 상한에 일찍 닿지 않게)
  return { poke, tier, lv };
}
function difficulty(wild, pLv) {
  const d = wild.lv - pLv;
  return {
    d,
    qLevel: clamp(wild.tier + state.village + Math.floor(d / 6), 1, 5), // 문제 난이도
    gauge: clamp(wild.tier + 1 + Math.floor(d / 4), 1, 6),              // 필요한 정답 수
    wrongMax: d >= 8 ? 1 : 2,                                            // 도망까지 오답 허용
    label: d <= -3 ? "쉬움" : d >= 5 ? "어려움" : "보통",
  };
}
function catchChance(ball, wild, d) {
  return clamp(ball.base - wild.tier * 0.08 - Math.max(0, d) * 0.02 + Math.max(0, -d) * 0.01, 0.1, 0.98);
}

// ---------- 화면: 홈 ----------
function renderHome() {
  Scene3D.dispose();
  const p = partner();
  const caughtCount = Object.keys(state.caught).length;
  $app().innerHTML = `
    <h1>🎯 포켓 수학 모험</h1>
    <p class="center">문제를 맞혀서 포켓몬을 잡고, 관장에게 도전해 보세요!</p>
    <div class="card">
      <h2>몇 살이에요?</h2>
      <div class="grid-age">
        ${[5, 6, 7, 8].map((a) => `<button class="btn" data-age="${a}">${a}살</button>`).join("")}
      </div>
      ${state.age ? `<p class="center">현재 선택: ${state.age}살</p>` : ""}
    </div>
    <div class="card">
      <h2>트레이너</h2>
      <div class="grid-age">
        <button class="btn ${state.gender === "male" ? "" : "secondary"}" data-gender="male">🧑 남자</button>
        <button class="btn ${state.gender === "female" ? "" : "secondary"}" data-gender="female">👧 여자</button>
      </div>
    </div>
    <div class="card">
      <p class="center">파트너: <b>${p ? `${byId[p.id].name} Lv.${p.lv}` : "아직 없어요"}</b> · 도감 ${caughtCount}/${POKEMON.length}<br>💡 힌트 포인트 ${state.hintPoints}개 (다음까지 ${state.hintExp}/${HINT_EXP_PER_POINT})</p>
      <button class="btn" id="go-map" ${state.age ? "" : "disabled"}>지도로 가기</button>
      <button class="btn secondary" id="go-dex">도감 보기</button>
    </div>
  `;
  document.querySelectorAll("[data-age]").forEach((b) =>
    b.addEventListener("click", () => {
      state.age = Number(b.dataset.age);
      saveState();
      renderHome();
      toast(`${state.age}살 문제로 설정했어요`);
    })
  );
  document.querySelectorAll("[data-gender]").forEach((b) =>
    b.addEventListener("click", () => {
      state.gender = b.dataset.gender;
      saveState();
      renderHome();
    })
  );
  document.getElementById("go-map").onclick = renderMap;
  document.getElementById("go-dex").onclick = renderDex;
}

// ---------- 화면: 지도 (마을) ----------
function renderMap(msg) {
  Scene3D.dispose();
  const v = VILLAGES[state.village];
  const beaten = state.badges.includes(state.village);
  const last = state.village >= VILLAGE_COUNT - 1;
  const canMove = !last; // 모든 마을 이동 가능 (관장 배지와 무관)
  const p = partner();
  $app().innerHTML = `
    <h1>🗺️ ${v.name}</h1>
    <p class="center">${state.village + 1} / ${VILLAGE_COUNT} 번째 마을</p>
    <div class="card">
      <p>관장: <b>${v.leader}</b> · ${beaten ? "배지 획득 ✅" : "아직 도전 전"}</p>
      <p>파트너: <b>${p ? `${byId[p.id].name} Lv.${p.lv}` : "없음 (Lv.1 기준으로 진행)"}</b></p>
      <p>배지 ${state.badges.length}/${VILLAGE_COUNT} · ⭐ ${state.stars} · 연속 정답 ${state.streak}</p>
    </div>
    <div class="card">
      <button class="btn" id="walk">🗺️ 마을 탐험하기</button>
      <button class="btn secondary" id="gym" ${beaten ? "disabled" : ""}>${beaten ? "✅ 관장을 이겼어요" : "⚔️ 관장에게 도전하기"}</button>
      <button class="btn" id="move" ${canMove ? "" : "disabled"}>${
        canMove ? "➡️ 다음 마을로 이동" : "마지막 마을입니다"
      }</button>
      <button class="btn secondary" id="pick">🧭 마을 선택</button>
      <button class="btn secondary" id="partner">🤝 파트너 고르기</button>
      <button class="btn secondary" id="dex">📖 도감</button>
      <button class="btn ghost" id="home">처음으로</button>
    </div>
    ${msg ? `<p class="center">${msg}</p>` : ""}
  `;
  document.getElementById("walk").onclick = openMap;
  document.getElementById("gym").onclick = () => confirmGym();
  document.getElementById("move").onclick = () => {
    state.village += 1;
    saveState();
    renderMap(`${VILLAGES[state.village].name}에 도착! 포켓몬과 관장이 더 강해집니다.`);
  };
  document.getElementById("pick").onclick = renderVillagePick;
  document.getElementById("partner").onclick = renderPartner;
  document.getElementById("dex").onclick = renderDex;
  document.getElementById("home").onclick = renderHome;
}

// 모든 마을 중에서 원하는 곳을 고릅니다 (관장 배지와 무관하게 이동 가능).
function renderVillagePick() {
  Scene3D.dispose();
  const list = VILLAGES.map((v, i) => `
        <button class="btn ${i === state.village ? "" : "secondary"}" data-village="${i}">
          ${i + 1}. ${v.name} · ${bandOf(i).name}${i === state.village ? " (현재)" : ""}${state.badges.includes(i) ? " ✅" : ""}
        </button>`).join("");
  $app().innerHTML = `
    <h1>🧭 마을 선택</h1>
    <div class="card">
      <p class="center">원하는 마을로 이동할 수 있어요.</p>
      ${list}
    </div>
    <button class="btn ghost" id="back">지도로</button>`;
  document.querySelectorAll("[data-village]").forEach((b) =>
    b.addEventListener("click", () => {
      state.village = Number(b.dataset.village);
      saveState();
      renderMap(`${VILLAGES[state.village].name}(으)로 이동했어요.`);
    })
  );
  document.getElementById("back").onclick = () => renderMap();
}

// 관장 도전은 직접 선택합니다 (랜덤 등장 없음)
function confirmGym() {
  const v = VILLAGES[state.village];
  $app().innerHTML = `
    <div class="card center">
      <h2>⚔️ ${v.leader}에게 도전할까요?</h2>
      <p>관장의 포켓몬은 ${v.ids.length}마리예요. 한 마리씩 차례로 상대하고, 모두 이기면 배지를 받아요.</p>
      <button class="btn" id="fight">배틀 시작</button>
      <button class="btn ghost" id="back">지도로</button>
    </div>`;
  speak(`${v.leader}에게 도전할까요?`);
  document.getElementById("fight").onclick = startBattle;
  document.getElementById("back").onclick = () => renderMap();
}

// ---------- 지도 탐험 연결 ----------
// 마을마다 야생 포켓몬 조우 지점을 미리 정합니다 (지도 위에 보이고, 찾아가서 만남).
// 잡으면 done이 되어 사라지고, 도망가면 다른 풀밭에 새 포켓몬으로 다시 나타납니다.
// 기록은 이 실행 동안만 유지됩니다.
const SPOT_COUNT = 5;
const spotCache = {}; // { [village]: [{ x, y, wild, done }] }
function spotsFor(village) {
  if (!spotCache[village]) {
    const { spots } = PokeMap.layout(village);
    spotCache[village] = spots.slice(0, SPOT_COUNT).map((p) => ({ x: p.x, y: p.y, wild: genWild(), done: false }));
  }
  return spotCache[village];
}
// 도망간 지점을 다른 풀밭 칸에 새 포켓몬으로 바꿉니다. (다른 조우 지점과 3칸 이상, 원래 자리와도 3칸 이상)
function respawnSpot(index) {
  const spots = spotsFor(state.village);
  const old = spots[index];
  const { cand } = PokeMap.layout(state.village);
  const near = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) < 3;
  const others = spots.filter((s, i) => i !== index && !s.done);
  const ok = cand.filter((c) => near(old, c) === false && others.every((o) => !near(o, c)));
  if (!ok.length) return; // 자리가 없으면 그대로 둡니다
  const c = ok[Math.floor(Math.random() * ok.length)];
  spots[index] = { x: c.x, y: c.y, wild: genWild(), done: false };
}

function openMap() {
  if (!PokeMap.available) return startWalk(); // Phaser를 못 불러오면 간단 모드
  const v = VILLAGES[state.village];
  const beaten = state.badges.includes(state.village);
  const now = Date.now();
  const stopReady = Array.from({ length: STOP_COUNT }, (_, i) =>
    now - (state.stopUsedAt[`${state.village}-${i}`] || 0) >= STOP_COOLDOWN_MS
  );
  const sp = spotsFor(state.village);
  const ok = PokeMap.show(state.village, {
    gender: state.gender,
    title: `${v.name} · ${bandOf(state.village).name} · ${state.village + 1}/${VILLAGE_COUNT}`,
    gymLabel: beaten ? "관장 ✅" : "관장",
    stopReady,
    spots: sp.map((s) => ({ x: s.x, y: s.y, name: s.wild.poke.name, done: s.done })),
  });
  if (!ok) startWalk();
}

// 지도에서 일어난 일 (조우 지점, 포켓스톱, 관장 건물, 메뉴)
function onMapEvent(e) {
  if (e.type === "menu") return renderMap();
  if (e.type === "grass") return startEncounter(); // 풀숲에서 랜덤 조우
  if (e.type === "spot") {
    // 잡아야 지점이 사라집니다. 도망가면 다른 자리에 새 포켓몬이 나타나요.
    const s = spotsFor(state.village)[e.index];
    if (!s || s.done) return;
    return startEncounter(s.wild, e.index);
  }
  if (e.type === "stop") return startStop(e.index);
  if (e.type === "gym") {
    if (state.badges.includes(state.village)) return toast("관장을 이겼어요! 다음 마을로 갈 수 있어요.");
    return confirmGym();
  }
}

// ---------- 포켓스톱 (문제 풀고 볼 받기) ----------
function startStop(index) {
  const key = `${state.village}-${index}`;
  const wait = STOP_COOLDOWN_MS - (Date.now() - (state.stopUsedAt[key] || 0));
  if (wait > 0) return toast(`포켓스톱은 ${Math.ceil(wait / 60000)}분 뒤에 다시 쓸 수 있어요`);
  stopSession = { key, done: 0, rewards: { monster: 0, great: 0, ultra: 0 }, q: null };
  $app().innerHTML = `
    <div class="card center">
      <h2>🏠 포켓스톱</h2>
      <p>문제를 ${STOP_QUESTIONS}개 풀면 볼을 받아요. 맞힌 문제마다 볼을 하나씩 뽑아요!</p>
      <button class="btn" id="start-stop">문제 풀기</button>
      <button class="btn ghost" id="back">지도로</button>
    </div>`;
  speak("포켓스톱에 왔어요!");
  document.getElementById("start-stop").onclick = nextStopQ;
  document.getElementById("back").onclick = openMap;
}

function nextStopQ() {
  const s = stopSession;
  s.q = makeQuestion(state.age, clamp(state.village + 1, 1, 5), bandOf(state.village).sum);
  $app().innerHTML = `
    <div class="hud"><span>🏠 포켓스톱</span><span>${s.done + 1} / ${STOP_QUESTIONS}</span></div>
    <div class="card">
      <div class="question" id="qtext"></div>
      <div class="visual" id="qvisual"></div>
      <div class="choices" id="choices"></div>
      ${partnerPanel()}
    </div>`;
  showQuestion(s.q, stopAnswer);
}

function stopAnswer(n, btn) {
  const s = stopSession;
  if (!s) return;
  if (n !== s.q.answer) {
    btn.style.background = "var(--bad)";
    btn.disabled = true;
    speak("다시 생각해 볼까요?");
    return;
  }
  document.querySelectorAll("#choices button").forEach((b) => (b.disabled = true));
  btn.style.background = "var(--ok)";
  const r = Math.random();
  const ball = r < 0.7 ? "monster" : r < 0.95 ? "great" : "ultra";
  s.rewards[ball] += 1;
  state.items[ball] = (state.items[ball] || 0) + 1;
  saveState();
  sfx("se_go_pokestop_item");
  const hintGot = gainHintExp(2 * 1); // 포켓스톱 정답은 전투의 2배 힌트 경험치 (전투 정답 = 1)
  toast(`${BALLS.find((b) => b.key === ball).name} 획득!${hintGot ? ` 💡 힌트 +${hintGot}` : ""}`);
  s.done += 1;
  setTimeout(() => (s.done >= STOP_QUESTIONS ? finishStop() : nextStopQ()), 900);
}

function finishStop() {
  const s = stopSession;
  state.stopUsedAt[s.key] = Date.now();
  saveState();
  const r = s.rewards;
  stopSession = null;
  $app().innerHTML = `
    <div class="card center">
      <h2>🎁 포켓스톱 완료!</h2>
      <p>이번에 받은 볼: 몬스터볼 ${r.monster} · 그레이트볼 ${r.great} · 울트라볼 ${r.ultra}</p>
      <p>현재 보유: 몬스터볼 ${state.items.monster} · 그레이트볼 ${state.items.great} · 울트라볼 ${state.items.ultra}</p>
      <button class="btn" id="map">지도로 돌아가기</button>
    </div>`;
  document.getElementById("map").onclick = openMap;
}

// ---------- 화면: 근처 돌기 (지도를 못 쓸 때의 간단 모드) ----------
function startWalk() {
  Scene3D.dispose();
  $app().innerHTML = `
    <div class="card center">
      <h2>🌿 ${VILLAGES[state.village].name} 근처</h2>
      <p>조용한 길을 걸어 봐요. 포켓몬을 만날 수 있어요.</p>
      <button class="btn" id="step">🚶 한 걸음 걷기</button>
      <button class="btn ghost" id="back">지도로</button>
    </div>`;
  document.getElementById("step").onclick = step;
  document.getElementById("back").onclick = () => renderMap();
}

function step() {
  if (Math.random() < 0.7) return startEncounter();
  toast("아무것도 없었어요");
}

// ---------- 화면: 야생 포켓몬 포획 ----------
function startEncounter(wild = genWild(), spot = null) {
  const d = difficulty(wild, partnerLv());
  const enc = { wild, d, gauge: d.gauge, wrong: 0, q: null, spot };
  sfx("se_go_pokemon_appear");
  speak(`${wild.poke.name}이 나타났어요!`);
  renderEncounter(enc);
  // 야생 조우: 구간 기준 시간 + 3분. 시간이 다 되면 포켓몬이 도망갑니다.
  startClock(bandOf(state.village).time + WILD_EXTRA_SEC, () => runAway(enc, "시간이 다 됐어요... 도망갔어요."));
  nextQuestion(enc);
}

function renderEncounter(enc) {
  const p = enc.wild.poke;
  $app().innerHTML = `
    <div class="hud">
      <span>${p.name} Lv.${enc.wild.lv} · 난이도 ${enc.d.label}</span>
      <span id="hud-gauge">마음 ${"♥".repeat(enc.gauge)}</span>
    </div>
    ${clockHTML()}
    <div class="encounter stage" id="stage"></div>
    <div class="card">
      <div class="question" id="qtext"></div>
      <div class="visual" id="qvisual"></div>
      <div class="choices" id="choices"></div>
      ${partnerPanel()}
      <div class="hud"><span></span><span id="hud-left">도망까지 ${enc.d.wrongMax - enc.wrong}번</span></div>
    </div>
    <div class="card" id="ball-area" hidden>
      <h2>볼을 골라 던지세요!</h2>
      <div class="balls" id="balls"></div>
    </div>`;
  Scene3D.init(document.getElementById("stage"));
  Scene3D.showPokemon(p.id);
}

function nextQuestion(enc) {
  enc.q = makeQuestion(state.age, enc.d.qLevel, bandOf(state.village).sum);
  showQuestion(enc.q, (n, b) => answer(enc, n, b), { hint: true });
}

function answer(enc, n, btn) {
  if (n === enc.q.answer) {
    sfx("se_go_sys_select");
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.stars += 1;
    enc.gauge -= 1;
    saveState();
    const lvEvents = gainExp(1, enc.wild.lv);
    const hintGot = gainHintExp(1);
    if (lvEvents.length) showFloatCards(lvEvents);
    else if (hintGot) toast(`💡 힌트 포인트 +${hintGot}`);
    btn.style.background = "var(--ok)";
    document.getElementById("hud-gauge").textContent = `마음 ${"♥".repeat(Math.max(0, enc.gauge))}`;
    speak("정답이에요!");
    if (enc.gauge <= 0) return showBalls(enc);
    setTimeout(() => nextQuestion(enc), 700);
  } else {
    sfx("se_go_ball_mistake_hit_pokemon");
    state.streak = 0;
    saveState();
    enc.wrong += 1;
    btn.style.background = "var(--bad)";
    btn.disabled = true;
    speak("다시 생각해 볼까요?");
    Scene3D.shakePokemon();
    document.getElementById("hud-left").textContent = `도망까지 ${enc.d.wrongMax - enc.wrong}번`;
    if (enc.wrong >= enc.d.wrongMax) return runAway(enc, "도망갔어요...");
  }
}

function showBalls(enc) {
  document.getElementById("qtext").textContent = "마음이 열렸어요! 🎉";
  document.getElementById("qvisual").textContent = "";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("ball-area").hidden = false;
  const box = document.getElementById("balls");
  const total = BALLS.reduce((sum, b) => sum + (state.items[b.key] || 0), 0);
  if (total === 0) {
    box.innerHTML = `<p class="center">볼이 없어요! 포켓스톱에서 문제를 풀고 볼을 받아 보세요.</p>
      <button class="btn ghost" id="flee">도망가기</button>`;
    document.getElementById("flee").onclick = () => runAway(enc, "볼이 없어서 도망갔어요...");
    return;
  }
  box.innerHTML = BALLS.map((b) => {
    const n = state.items[b.key] || 0;
    return `<button class="ball-btn" data-ball="${b.key}" ${n > 0 ? "" : "disabled"}>
      <img src="${b.img}" alt="">${b.name}<br>${n}개 보유
    </button>`;
  }).join("");
  box.querySelectorAll("[data-ball]").forEach((btn) =>
    btn.addEventListener("click", () => throwBall(enc, btn.dataset.ball))
  );
  box.insertAdjacentHTML("beforeend", `<button class="btn ghost" id="no-throw">몬스터볼을 던지지 않기</button>`);
  document.getElementById("no-throw").onclick = () => runAway(enc, "그냥 떠났어요.");
}

async function throwBall(enc, key) {
  stopClock(); // 볼을 던진 뒤에는 시간 제한을 멈춥니다.
  const ball = BALLS.find((b) => b.key === key);
  const chance = catchChance(ball, enc.wild, enc.d.d);
  document.querySelectorAll("#balls button").forEach((b) => (b.disabled = true));
  sfx("se_go_ball_take_in");
  state.items[key] = Math.max(0, (state.items[key] || 0) - 1);
  saveState();
  const success = Math.random() < chance;
  await Scene3D.throwBall(key, success);
  if (success) {
    sfx("101_gotcha");
    if (enc.spot !== null) spotsFor(state.village)[enc.spot].done = true; // 잡은 지점만 지도에서 사라짐
    catchSuccess(enc.wild);
  } else {
    sfx("se_go_ball_mistake_hit_pokemon");
    runAway(enc, "빠져나갔어요!");
  }
}

function catchSuccess(wild) {
  stopClock();
  Scene3D.dispose();
  const id = wild.poke.id;
  const isNew = !state.caught[id];
  if (isNew) state.caught[id] = { lv: wild.lv, exp: 0 };
  state.stars += 3 + wild.tier;
  saveState();
  const lvEvents = gainExp(wild.lv * 5, wild.lv);
  $app().innerHTML = `
    <div class="card center">
      <h2>🎉 ${wild.poke.name} 잡았다!</h2>
      <div class="encounter stage"><img class="poke" src="assets/pokemon/${id}.png" alt="${wild.poke.name}"></div>
      <p>${isNew ? `도감에 새로 등록됐어요! (Lv.${wild.lv})` : "이미 도감에 있는 친구예요."}</p>
      ${lvEvents.length ? `<div class="event-list">${eventCardsHtml(lvEvents)}</div>` : "<p>파트너가 경험치를 얻었어요.</p>"}
      <p>⭐ ${state.stars}</p>
      <button class="btn" id="again">계속 걷기</button>
      <button class="btn secondary" id="map">지도로</button>
    </div>`;
  speak(`${wild.poke.name}을 잡았어요!`);
  sfx("302_ME_levelup");
  document.getElementById("again").onclick = openMap;
  document.getElementById("map").onclick = () => renderMap();
}

function runAway(enc, msg) {
  stopClock();
  toast(msg);
  speak(msg);
  Scene3D.setMood("run");
  if (enc.spot !== null) respawnSpot(enc.spot); // 지도 위 조우 지점이었다면 다른 곳에 새 포켓몬
  setTimeout(openMap, 1200);
}

// ---------- 화면: 관장 배틀 ----------
let battle = null;

function startBattle() {
  stopClock();
  const idx = state.village;
  const v = VILLAGES[idx];
  const party = v.ids.map((id, i) => {
    const lv = clamp(4 + idx * 3 + i * 2, 1, WILD_MAX_LV);
    const maxHp = 30 + lv * 3;
    return { id, lv, hp: maxHp, maxHp };
  });
  const pLv = partnerLv();
  const pMax = 50 + pLv * 4;
  battle = { idx, party, cur: 0, pHp: pMax, pMax, pLv, q: null, over: false, limit: bandOf(idx).time };
  renderBattle();
  nextBattleQ();
  startBattleClock();
}

// 관장전은 상대 포켓몬 한 마리마다 제한 시간이 새로 시작됩니다.
function startBattleClock() {
  startClock(battle.limit, () => battleEnd(false, "시간이 다 됐어요!"));
}

// ---------- 공용 제한 시간 타이머 (야생 조우 / 관장전) ----------
const WILD_EXTRA_SEC = 180; // 야생 조우는 구간 기준 시간에 3분을 더합니다.
let clock = null; // { left, limit, id, onZero }

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function stopClock() {
  if (clock && clock.id !== null) clearInterval(clock.id);
  clock = null;
}

function startClock(limit, onZero) {
  stopClock();
  clock = { left: limit, limit, id: null, onZero };
  clock.id = setInterval(tickClock, 1000);
  updateClockUI();
}

function tickClock() {
  if (!clock) return;
  clock.left -= 1;
  updateClockUI();
  if (clock.left <= 0) {
    const cb = clock.onZero;
    stopClock();
    cb();
  }
}

function updateClockUI() {
  const tl = document.getElementById("tleft");
  const tb = document.getElementById("tbar");
  const left = clock ? Math.max(0, clock.left) : 0;
  if (tl) tl.textContent = fmtTime(left);
  if (tb && clock) {
    tb.style.width = `${(left / clock.limit) * 100}%`;
    tb.style.background = left <= 10 ? "var(--bad)" : "var(--ok)";
  }
}

function clockHTML() {
  return `<div class="hud"><span>⏱ 남은 시간 <b id="tleft"></b></span></div>
    <div class="bar small"><div id="tbar"></div></div>`;
}

function renderBattle() {
  Scene3D.dispose();
  const v = VILLAGES[battle.idx];
  const e = battle.party[battle.cur];
  $app().innerHTML = `
    <div class="hud">
      <span>🏟️ ${v.leader}</span>
      <span>${battle.cur + 1}/${battle.party.length} 번째 포켓몬</span>
    </div>
    ${clockHTML()}
    <div class="card">
      <b>${byId[e.id].name} Lv.${e.lv}</b>
      <div class="bar"><div id="ehp"></div></div>
    </div>
    <div class="encounter stage" id="stage"></div>
    <div class="card">
      <div class="question" id="qtext"></div>
      <div class="visual" id="qvisual"></div>
      <div class="choices" id="choices"></div>
      ${partnerPanel()}
      <div class="bar me-bar"><div id="php" class="me"></div></div>
      <small>나의 HP</small>
      <button class="btn ghost" id="flee">🏃 도망가기</button>
    </div>`;
  Scene3D.init(document.getElementById("stage"));
  Scene3D.showPokemon(e.id);
  document.getElementById("flee").onclick = fleeBattle;
  updateBattleBars();
}

function updateBattleBars() {
  const e = battle.party[battle.cur];
  const eh = document.getElementById("ehp");
  const ph = document.getElementById("php");
  if (eh) eh.style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;
  if (ph) ph.style.width = `${Math.max(0, (battle.pHp / battle.pMax) * 100)}%`;
  updateClockUI();
}

function fleeBattle() {
  if (!battle || battle.over) return;
  battle.over = true;
  stopClock();
  Scene3D.dispose();
  toast("도망쳤어요!");
  renderMap("관장에게서 도망쳤어요. 다시 도전할 수 있어요.");
}

function nextBattleQ() {
  if (battle.over) return;
  // 관장전은 마을 난이도보다 한 단계 높게 냅니다.
  const qLevel = clamp(battle.idx + 3, 1, 5);
  battle.q = makeQuestion(state.age, qLevel, bandOf(state.village).sum);
  showQuestion(battle.q, battleAnswer, { hint: true });
}

function battleAnswer(n, btn) {
  if (battle.over) return;
  const e = battle.party[battle.cur];
  if (n === battle.q.answer) {
    gainHintExp(1); // 전투에서 맞힌 문제도 힌트 경험치가 됩니다.
    let dmg = 15 + Math.round(battle.pLv * 0.8);
    const skill = rollSkill();
    if (skill) dmg += 20 + Math.round(battle.pLv * 1.2); // 스킬이 나가면 추가 피해
    e.hp -= dmg;
    sfx("se_go_sys_select");
    btn.style.background = "var(--ok)";
    if (skill) {
      Scene3D.impact(skill.fx);
      toast(`✨ ${skill.name}! -${dmg}`);
    } else {
      toast(`공격! -${dmg}`);
    }
    updateBattleBars();
    if (e.hp <= 0) {
      battle.cur += 1;
      if (battle.cur >= battle.party.length) return battleEnd(true);
      toast(`${byId[e.id].name} 쓰러졌다!`);
      setTimeout(() => {
        if (battle.over) return;
        renderBattle();
        nextBattleQ();
        startBattleClock(); // 다음 상대마다 시간을 새로 줍니다.
      }, 900);
      return;
    }
    setTimeout(nextBattleQ, 600);
  } else {
    const dmg = 8 + Math.round(e.lv * 0.6);
    battle.pHp -= dmg;
    sfx("se_go_ball_mistake_hit_pokemon");
    btn.style.background = "var(--bad)";
    btn.disabled = true;
    toast(`아야! -${dmg}`);
    Scene3D.shakePokemon();
    updateBattleBars();
    if (battle.pHp <= 0) return battleEnd(false);
  }
}

function battleEnd(win, reason = "문제를 더 맞혀서 다시 도전해 보세요.") {
  battle.over = true;
  stopClock();
  Scene3D.dispose();
  const v = VILLAGES[battle.idx];
  if (win) {
    if (!state.badges.includes(battle.idx)) state.badges.push(battle.idx);
    state.stars += 10;
    const avgLv = battle.party.reduce((s, m) => s + m.lv, 0) / battle.party.length;
    const lvEvents = gainExp(40 + battle.idx * 20, avgLv);
    const hintWin = gainHintExp(HINT_WIN_BONUS * HINT_EXP_PER_POINT); // 관장 승리: 힌트 포인트 3개
    saveState();
    $app().innerHTML = `
      <div class="card center">
        <h2>🏆 승리!</h2>
        <p>${v.leader}를 이기고 배지를 얻었어요.</p>
        ${lvEvents.length ? `<div class="event-list">${eventCardsHtml(lvEvents)}</div>` : "<p>파트너가 큰 경험치를 얻었어요.</p>"}
        <p>💡 힌트 포인트 +${hintWin} (보유 ${state.hintPoints}개)</p>
        <button class="btn" id="map">지도로</button>
      </div>`;
    speak("승리했어요!");
    sfx("302_ME_levelup");
    document.getElementById("map").onclick = () => renderMap(`${v.leader}를 이겼어요! 다음 마을로 갈 수 있어요.`);
  } else {
    $app().innerHTML = `
      <div class="card center">
        <h2>😢 패배...</h2>
        <p>${reason}</p>
        <button class="btn" id="retry">다시 도전</button>
        <button class="btn secondary" id="map">지도로</button>
      </div>`;
    speak("이번엔 졌어요. 다시 도전해 봐요!");
    document.getElementById("retry").onclick = startBattle;
    document.getElementById("map").onclick = () => renderMap();
  }
}

// ---------- 화면: 파트너 선택 ----------
let pickEvents = []; // 파트너를 고르면서 일어난 진화 (다음 렌더링에 카드로 표시)
function renderPartner() {
  Scene3D.dispose();
  const entries = Object.entries(state.caught);
  const list = entries.length
    ? `<div class="pick-grid">${entries.map(([id, c]) => {
        const isPartner = Number(id) === state.partnerId;
        return `
        <button class="pick-card ${isPartner ? "selected" : ""}" data-pick="${id}">
          <img src="assets/pokemon/${id}.png" alt="${byId[id].name}">
          <strong>${isPartner ? "✅ " : ""}${byId[id].name}</strong>
          <span>Lv.${c.lv}</span>
          <span class="pick-exp">경험치 ${c.exp}/${expToNext(c.lv)}</span>
        </button>`;
      }).join("")}</div>`
    : `<p class="center">아직 잡은 포켓몬이 없어요. 먼저 잡아 보세요!</p>`;
  const notice = pickEvents.length ? `<div class="event-list">${eventCardsHtml(pickEvents)}</div>` : "";
  pickEvents = [];
  $app().innerHTML = `
    <h1>🤝 파트너 고르기</h1>
    ${notice}
    <div class="card">
      <p class="center">파트너는 경험치를 얻어 레벨이 오르고, 레벨 10이 되면 진화해요. 파트너의 레벨이 높을수록 배틀에서 더 세게 공격해요.</p>
      ${list}
    </div>
    <button class="btn ghost" id="map">지도로</button>`;
  document.querySelectorAll("[data-pick]").forEach((b) =>
    b.addEventListener("click", () => {
      state.partnerId = Number(b.dataset.pick);
      const evo = evolveIfReady();
      saveState();
      if (evo) pickEvents = [evo];
      else toast(`${byId[state.partnerId].name}을(를) 파트너로 골랐어요`);
      renderPartner();
    })
  );
  document.getElementById("map").onclick = () => renderMap();
}

// ---------- 화면: 도감 ----------
function renderDex() {
  Scene3D.dispose();
  const slots = POKEMON.map((p) => {
    const c = state.caught[p.id];
    return `<div class="slot ${c ? "" : "empty"}">
      <img src="assets/pokemon/${p.id}.png" alt="">
      <span>${c ? `${p.name} Lv.${c.lv}` : "???"}</span>
    </div>`;
  }).join("");
  $app().innerHTML = `
    <h1>📖 도감</h1>
    <p class="center">${Object.keys(state.caught).length} / ${POKEMON.length} 잡음</p>
    <div class="card"><div class="dex">${slots}</div></div>
    <button class="btn" id="home">처음으로</button>
    <button class="btn secondary" id="reset">진행 기록 지우기</button>
  `;
  document.getElementById("home").onclick = renderHome;
  document.getElementById("reset").onclick = () => {
    if (!confirm("도감, 파트너, 배지, 별을 모두 지울까요?")) return;
    const age = state.age;
    state = defaultState();
    state.age = age;
    saveState();
    renderDex();
  };
}

PokeMap.setHandler(onMapEvent);
renderHome();
