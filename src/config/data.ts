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

export interface Jutsu {
  name: string;
  nameEn: string;
  sequence: number[]; // Array of HandSign IDs
}

// Derived from jutsu.csv
// Format: Type, TypeEn, Name, NameEn, Sign1, Sign2, ...
// We map Kanji to IDs.
export const JUTSU_LIST: Jutsu[] = [
  {
    name: '豪火球术',
    nameEn: 'Fireball Jutsu',
    sequence: [6, 3, 9, 12, 7, 3], // 巳,寅,申,亥,午,寅
  },
  {
    name: '豪火球术',
    nameEn: 'Fireball Jutsu',
    sequence: [6, 8, 9, 12, 7, 3], // 巳,未,申,亥,午,寅
  },
  {
    name: '分身术',
    nameEn: 'Clone Jutsu',
    sequence: [8, 6, 3], // 未,巳,寅
  },
  {
    name: '通灵术',
    nameEn: 'Summoning Jutsu',
    sequence: [11, 12, 10, 9, 8], // 戌,亥,酉,申,未
  },
  {
    name: '通灵 土遁追牙术',
    nameEn: 'Summoning: Earth Style: Fanged Pursuit Jutsu',
    sequence: [3, 6, 5, 11], // 寅,巳,辰,戌
  },
  {
    name: '凤仙花术',
    nameEn: 'Phoenix Flower Jutsu',
    sequence: [1, 3, 11, 2, 4, 3], // 子,寅,戌,丑,卯,寅
  },
  {
    name: '水乱破术',
    nameEn: 'Water Trumpet',
    sequence: [5, 3, 4], // 辰,寅,卯
  },
  {
    name: '通灵 秽土转生术',
    nameEn: 'Summoning Jutsu: Impure World Reincarnation',
    sequence: [3, 6, 11, 5, 13], // 寅,巳,戌,辰,祈
  },
  {
    name: '龙火术',
    nameEn: 'Dragon Flame Jutsu',
    sequence: [6, 5, 4, 3], // 巳,辰,卯,寅
  },
  {
    name: '水鲛弹术',
    nameEn: 'Water Shark Bomb Jutsu',
    sequence: [3, 2, 5, 4, 10, 5, 8], // 寅,丑,辰,卯,酉,辰,未
  },
  {
    name: '尸鬼封尽术',
    nameEn: 'Sealing Jutsu: Reaper Death Seal',
    sequence: [6, 12, 8, 4, 11, 1, 10, 7, 6, 13], // 巳,亥,未,卯,戌,子,酉,午,巳,祈
  },
  {
    name: '水龙弹术',
    nameEn: 'Water Dragon Jutsu',
    sequence: [
      2, 9, 4, 1, 12, 10, 2, 7, 10, 1, 3, 11, 3, 6, 2, 8, 6, 12, 8, 1, 15, 9, 10, 5, 10, 2, 7, 8, 3, 6, 1, 9, 4, 12, 5, 8, 1, 2, 9, 10, 15, 1, 12, 10
    ], // Long sequence
  },
  {
    name: '火龙炎弹术',
    nameEn: 'Dragon Flame Bomb',
    sequence: [8, 7, 6, 5, 1, 2, 3], // 未,午,巳,辰,子,丑,寅
  },
  {
    name: '替身术',
    nameEn: 'Substitution Jutsu',
    sequence: [8, 12, 2, 11, 6], // 未,亥,丑,戌,巳
  },
];

// Mappings from sign sequences (tuple as string or array) to actions
// Using array of IDs as key is tricky in Map, so we'll use string join ','

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
  '13': ['Control', 'Enter'], // 祈 -> Ctrl+Enter (Assuming 13 is Prayer which triggers run in App?? CHECK: Original Py mapped 13 to Ctrl+Enter?)
  // Python: (13,): ['ctrl', 'enter']
  // Python: (10,): ['ctrl', 'o']
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
};
