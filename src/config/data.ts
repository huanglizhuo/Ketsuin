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

export interface Jutsu {
  id: string;
  name: string;
  nameEn: string;
  sequence: number[]; // Array of HandSign IDs
  trigger: JutsuTriggerType;
  description?: string;
}

// The main requested Jutsus
export const SUPPORTED_JUTSUS: Jutsu[] = [
  {
    id: 'fireball',
    name: '火遁·豪火球之术',
    nameEn: 'Fire Style: Fireball Jutsu',
    sequence: [6, 8, 9, 12, 7, 3], // 巳－未－申－亥－午－寅
    trigger: 'mouth_blow',
    description: 'Blow fire from your mouth after completing the signs.'
  },
  {
    id: 'chidori',
    name: '雷切',
    nameEn: 'Chidori / Raikiri',
    sequence: [3, 6, 9, 3], // 寅 → 巳 → 申 → 寅 (Simplified Chidori sequence)
    trigger: 'hand_hold', // Tracks right hand
    description: 'Focus chakra in your hand to create lightning.'
  },
  {
    id: 'summoning',
    name: '通灵之术',
    nameEn: 'Summoning Jutsu',
    sequence: [12, 11, 10, 9, 8], // 亥 → 戌 → 酉 → 申 → 未
    trigger: 'auto',
    description: 'Summon a spirit animal.'
  }
];

// Legacy list for reference or basic recognition mode
export const LEGACY_JUTSU_LIST: Omit<Jutsu, 'id' | 'trigger'>[] = [
  {
    name: '豪火球术',
    nameEn: 'Fireball Jutsu',
    sequence: [6, 3, 9, 12, 7, 3],
  },
  {
    name: '分身术',
    nameEn: 'Clone Jutsu',
    sequence: [8, 6, 3],
  },
  // ... more can be added back if needed
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
