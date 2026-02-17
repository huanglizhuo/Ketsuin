export interface HandSign {
  id: number;
  name: string;
  kanji: string;
}

export const HAND_SIGNS: HandSign[] = [
  { id: 0, name: 'None', kanji: '無' },
  { id: 1, name: 'Rat', kanji: '子' },
  { id: 2, name: 'Ox', kanji: '丑' },
  { id: 3, name: 'Tiger', kanji: '寅' },
  { id: 4, name: 'Hare', kanji: '卯' },
  { id: 5, name: 'Dragon', kanji: '辰' },
  { id: 6, name: 'Snake', kanji: '巳' },
  { id: 7, name: 'Horse', kanji: '午' },
  { id: 8, name: 'Ram', kanji: '未' },
  { id: 9, name: 'Monkey', kanji: '申' },
  { id: 10, name: 'Bird', kanji: '酉' },
  { id: 11, name: 'Dog', kanji: '戌' },
  { id: 12, name: 'Boar', kanji: '亥' },
  { id: 13, name: 'Prayer', kanji: '祈' },
  { id: 14, name: 'Unknown', kanji: '謎' },
  { id: 15, name: 'Mizunoe', kanji: '壬' },
];

export type JutsuTriggerType = 'auto' | 'mouth_blow' | 'hand_hold';

export interface JutsuSoundEffect {
  onStart?: string;    // Audio URL for challenge start
  onComplete?: string; // Audio URL for jutsu activation
}

export interface Jutsu {
  id: string;
  name: string;
  nameEn: string;
  sequence: number[]; // Array of HandSign IDs
  trigger: JutsuTriggerType;
  description?: string;
  difficulty: number;  // 1-5 stars
  character?: string;  // Iconic character(s) associated
  soundEffect?: JutsuSoundEffect; // Hook for future audio
}

// --- Ninja Rank System ---
export interface NinjaRank {
  id: string;
  title: string;
  titleJp: string;
  emoji: string;
  maxSecondsPerSign: number; // Upper threshold (exclusive), Infinity for lowest
  description: string;
}

export const NINJA_RANKS: NinjaRank[] = [
  { id: 'six_paths', title: 'Six Paths', titleJp: '六道級', emoji: '🌟', maxSecondsPerSign: 0.6, description: 'Godlike speed!' },
  { id: 'kage', title: 'Kage', titleJp: '影級', emoji: '🏆', maxSecondsPerSign: 1.0, description: 'Legendary ninja' },
  { id: 'jonin', title: 'Jōnin', titleJp: '上忍', emoji: '🔥', maxSecondsPerSign: 1.5, description: 'Elite ninja' },
  { id: 'chunin', title: 'Chūnin', titleJp: '中忍', emoji: '⚡', maxSecondsPerSign: 2.5, description: 'Qualified ninja' },
  { id: 'genin', title: 'Genin', titleJp: '下忍', emoji: '🌿', maxSecondsPerSign: Infinity, description: 'Rookie ninja' },
];

export function getRankForTime(timeMs: number, signCount: number): NinjaRank {
  const secondsPerSign = (timeMs / 1000) / signCount;
  for (const rank of NINJA_RANKS) {
    if (secondsPerSign < rank.maxSecondsPerSign) return rank;
  }
  return NINJA_RANKS[NINJA_RANKS.length - 1];
}

// --- Challenge Quotes ---
export const CHALLENGE_QUOTES: { text: string; character: string }[] = [
  { text: '結印之速，決定術之強弱。', character: '千手扉間' },
  { text: '我要成為火影！', character: '漩渦鳴人' },
  { text: '拋棄同伴的人比垃圾還不如。', character: '旗木卡卡西' },
  { text: '後輩永遠會超越前輩，這就是忍者。', character: '自來也' },
  { text: '有光的地方，就會有影。', character: '宇智波斑' },
  { text: '千鳥…雷切！', character: '旗木卡卡西' },
  { text: '我的存在不會就這樣消失的！', character: '漩渦鳴人' },
  { text: '力量就是讓事情發生的能力。', character: '宇智波斑' },
];

// --- Supported Jutsus (ordered by difficulty) ---
export const SUPPORTED_JUTSUS: Jutsu[] = [
  // {
  //   id: 'shadow_clone',
  //   name: '影分身の術',
  //   nameEn: 'Shadow Clone Jutsu',
  //   sequence: [4, 3, 8], // 卯→寅→未
  //   trigger: 'auto',
  //   difficulty: 1,
  //   character: '漩涡鸣人',
  //   description: '鸣人の招牌术！多重影分身！',
  // },
  {
    id: 'chidori',
    name: '雷切・千鳥',
    nameEn: 'Chidori / Raikiri',
    sequence: [2, 4, 9, 2], // 丑->卯->申
    trigger: 'hand_hold',
    difficulty: 1,
    character: '旗木卡卡西 / 宇智波佐助',
    description: '将查克拉集中于手掌，化为雷电！',
  },
  {
    id: 'reanimation',
    name: '穢土転生',
    nameEn: 'Reanimation Jutsu',
    sequence: [3, 6, 11, 5], // 寅→巳→戌→辰
    trigger: 'auto',
    difficulty: 2,
    character: '大蛇丸',
    description: '召唤逝去的忍者重返战场的禁术。',
  },
  {
    id: 'summoning',
    name: '口寄せの術',
    nameEn: 'Summoning Jutsu',
    sequence: [12, 11, 10, 9, 8], // 亥→戌→酉→申→未
    trigger: 'auto',
    difficulty: 2,
    character: '自来也 / 漩涡鸣人',
    description: '咬破拇指，召唤通灵兽！',
  },
  {
    id: 'edo_tensei_release',
    name: '穢土転生・解',
    nameEn: 'Edo Tensei: Release',
    sequence: [1, 2, 9, 3, 5, 12], // 子→丑→申→寅→辰→亥
    trigger: 'auto',
    difficulty: 2,
    character: '药师兜',
    description: '解除秽土转生的通灵契约，将亡者的灵魂送回。',
  },
  {
    id: 'great_waterfall',
    name: '水遁・大瀑布の術',
    nameEn: 'Water Style: Great Waterfall Jutsu',
    sequence: [3, 2, 9, 4, 1, 12, 10, 2, 7], // 寅→丑→申→卯→子→亥→酉→丑→午
    trigger: 'auto',
    difficulty: 3,
    character: '千手扉间 / 桃地再不斩 / 旗木卡卡西',
    description: '将大量的水卷上高空，像瀑布一样将对手卷入其中。',
  },
  {
    id: 'fireball',
    name: '火遁・豪火球の術',
    nameEn: 'Fire Style: Fireball Jutsu',
    sequence: [6, 8, 9, 12, 7, 3], // 巳→未→申→亥→午→寅
    trigger: 'mouth_blow',
    difficulty: 3,
    character: '宇智波一族',
    description: '宇智波一族的入门术，火遁的基础。',
  },
  {
    id: 'tsukuyomi',
    name: '月読',
    nameEn: 'Tsukuyomi',
    sequence: [1, 2, 3, 6, 12, 10, 4, 7, 5, 8, 9, 11], // 子→丑→寅→巳→亥→酉→卯→午→辰→未→申→戌
    trigger: 'auto',
    difficulty: 4,
    character: '宇智波鼬',
    description: '万花筒写轮眼的究极幻术，将对手困于幻境。',
  },
  {
    id: 'water_dragon',
    name: '水遁・水龍弾の術',
    nameEn: 'Water Style: Water Dragon Jutsu',
    sequence: [
      2, 9, 4, 1, 12, 10, 2, 7, 10, 6, 3, 11, 1, 8, 6, 2, 5, 4, 1, 9,
      10, 1, 3, 2, 7, 6, 5, 8, 1, 4, 10, 12, 6, 8, 2, 7, 8, 3, 11, 1,
      10, 5, 2, 4
    ], // 44 seals — the legendary sequence
    trigger: 'auto',
    difficulty: 5,
    character: '桃地再不斩 / 旗木卡卡西',
    description: '传说中的44印！再不斩 vs 卡卡西的经典名场面。',
  },
];

export const WORD_MAPPINGS: Record<string, string> = {
  '1': 'l', // 子 -> l
  '2': 'h', // 丑 -> h
  '3': 'e', // 寅 -> e
  '5': 'r', // 辰 -> r
  '6': 'd', // 巳 -> d
  '7': 'w', // 午 -> w
  '8': 'o', // 未 -> o
  '9': 'x', // 申 -> x
};

export const SPECIAL_KEY_MAPPINGS: Record<string, string> = {
  '11': 'space', // 戌 -> space
};

export const SHORTCUT_MAPPINGS: Record<string, string[]> = {
  '13': ['Control', 'Enter'],
  '10': ['Control', 'o'],
};

export const CONFIG = {
  INPUT_SHAPE: 416,
  CONFIDENCE_THRESHOLD: 0.7,
  NMS_THRESH: 0.45,
  NMS_SCORE_THRESH: 0.1,
  SIGN_INTERVAL: 2000, // ms
  JUTSU_DISPLAY_TIME: 5000, // ms
  CHATTERING_CHECK: 1, // frame count
  MAX_HISTORY: 44,
  MAX_DISPLAY: 18,
  JUTSU_WINDOW_MS: 5000, // New: 5s window for jutsu mode
};
