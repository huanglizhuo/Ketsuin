export type Locale = 'en' | 'zh' | 'ja' | 'fr';

export const LOCALE_LABELS: Record<Locale, string> = {
    en: 'EN',
    zh: '中文',
    ja: '日本語',
    fr: 'FR',
};

export const LOCALES: Locale[] = ['en', 'zh', 'ja', 'fr'];

// Flat key–value translation map
export type TranslationKeys = typeof translations['en'];

export const translations = {
    // ───────── English ─────────
    en: {
        // Header
        'header.loading': 'Gathering Chakra...',
        'header.start': 'Start',
        'header.stop': 'Release Jutsu',
        'header.tooltip': 'Click to Start!',
        'header.tab.t9': 'T9 Input',
        'header.tab.challenge': '🔥 Challenge',
        'header.tab.ranking': '🏆 Ranking',

        // T9 Mode
        't9.keypad': 'Ninja Keypad',
        't9.hint': '戌=Space | 亥=Next | 酉=Del',
        't9.status.active': 'ACTIVE',
        't9.status.standby': 'STANDBY',

        // Jutsu Select
        'jutsu.title': 'Select a Jutsu',
        'jutsu.subtitle': 'Select a jutsu to challenge your seal speed',
        'jutsu.seals': 'SEALS',
        'jutsu.challenge': 'Challenge →',

        // Challenge Arena
        'arena.retry': 'Try again!',

        // Challenge Result
        'result.globalRank': 'Global Rank:',
        'result.ninjaNameLabel': 'Enter Ninja Name',
        'result.ninjaNameHint': '1-12 characters · Any language OK',
        'result.submit': 'Submit Score',
        'result.submitting': 'Submitting...',
        'result.submitted': '✓ Score submitted!',
        'result.submitError': 'Submission failed, but saved locally',
        'result.nameError': 'Name must be 1-12 characters',
        'result.time': 'Time (s)',
        'result.seals': 'Seals',
        'result.sealSpeed': 's/seal',
        'result.retry': 'Retry',
        'result.leaderboard': 'Leaderboard',
        'result.backToSelect': 'Select Jutsu',

        // Leaderboard
        'leaderboard.title': '🏆 Ninja Leaderboard',
        'leaderboard.back': '← Back',
        'leaderboard.global': '🌐 GLOBAL LEADERBOARD',
        'leaderboard.local': '💾 LOCAL ONLY',
        'leaderboard.loading': 'Focusing chakra...',
        'leaderboard.loadError': 'Failed to load leaderboard',
        'leaderboard.empty': 'No records yet',
        'leaderboard.emptyHint': 'Be the first ninja to conquer this jutsu!',
        'leaderboard.rank': 'Rank',
        'leaderboard.ninja': 'Ninja',
        'leaderboard.time': 'Time',
        'leaderboard.level': 'Level',
    },

    // ───────── 中文 ─────────
    zh: {
        'header.loading': '聚气中...',
        'header.start': '开始',
        'header.stop': '释放忍术',
        'header.tooltip': '点击开始结印！',
        'header.tab.t9': 'T9 输入',
        'header.tab.challenge': '🔥 挑战模式',
        'header.tab.ranking': '🏆 排行榜',

        't9.keypad': '忍者键盘',
        't9.hint': '戌=空格 | 亥=下一个 | 酉=删除',
        't9.status.active': '运行中',
        't9.status.standby': '待命',

        'jutsu.title': '选择忍术',
        'jutsu.subtitle': '选择一个忍术来挑战你的结印速度',
        'jutsu.seals': '印',
        'jutsu.challenge': '挑战 →',

        'arena.retry': '再来！',

        'result.globalRank': '全球排名：',
        'result.ninjaNameLabel': '输入忍者名',
        'result.ninjaNameHint': '1-12个字符 · 中日英均可',
        'result.submit': '提交成绩',
        'result.submitting': '提交中...',
        'result.submitted': '✓ 成绩已提交！',
        'result.submitError': '提交失败，已保存到本地',
        'result.nameError': '忍者名需 1-12 个字符',
        'result.time': '耗时 (秒)',
        'result.seals': '印数',
        'result.sealSpeed': '秒/印',
        'result.retry': '再挑战',
        'result.leaderboard': '排行榜',
        'result.backToSelect': '选择忍术',

        'leaderboard.title': '🏆 忍者排行榜',
        'leaderboard.back': '← 返回',
        'leaderboard.global': '🌐 全球排行榜',
        'leaderboard.local': '💾 仅本地数据',
        'leaderboard.loading': '查克拉集中中...',
        'leaderboard.loadError': '排行榜加载失败',
        'leaderboard.empty': '暂无记录',
        'leaderboard.emptyHint': '成为第一个征服此忍术的忍者！',
        'leaderboard.rank': '排名',
        'leaderboard.ninja': '忍者',
        'leaderboard.time': '时间',
        'leaderboard.level': '等级',
    },

    // ───────── 日本語 ─────────
    ja: {
        'header.loading': 'チャクラ集中中...',
        'header.start': 'スタート',
        'header.stop': '術解放',
        'header.tooltip': 'クリックして開始！',
        'header.tab.t9': 'T9 入力',
        'header.tab.challenge': '🔥 挑戦モード',
        'header.tab.ranking': '🏆 ランキング',

        't9.keypad': '忍者キーパッド',
        't9.hint': '戌=Space | 亥=Next | 酉=Del',
        't9.status.active': '稼働中',
        't9.status.standby': 'スタンバイ',

        'jutsu.title': '忍術を選べ',
        'jutsu.subtitle': '忍術を選んで結印スピードに挑戦',
        'jutsu.seals': '印',
        'jutsu.challenge': '挑戦 →',

        'arena.retry': 'やり直し！',

        'result.globalRank': '世界ランク：',
        'result.ninjaNameLabel': '忍者名を入力',
        'result.ninjaNameHint': '1〜12文字 · 日中英OK',
        'result.submit': '成績提出',
        'result.submitting': '提出中...',
        'result.submitted': '✓ 成績提出完了！',
        'result.submitError': '提出失敗、ローカルに保存しました',
        'result.nameError': '忍者名は1〜12文字で入力してください',
        'result.time': 'タイム (秒)',
        'result.seals': '印数',
        'result.sealSpeed': '秒/印',
        'result.retry': '再挑戦',
        'result.leaderboard': 'ランキング',
        'result.backToSelect': '忍術選択へ',

        'leaderboard.title': '🏆 忍者ランキング',
        'leaderboard.back': '← 戻る',
        'leaderboard.global': '🌐 グローバルランキング',
        'leaderboard.local': '💾 ローカルのみ',
        'leaderboard.loading': 'チャクラ集中中...',
        'leaderboard.loadError': 'ランキング読込失敗',
        'leaderboard.empty': 'まだ記録なし',
        'leaderboard.emptyHint': '最初の忍者になれ！',
        'leaderboard.rank': '順位',
        'leaderboard.ninja': '忍者',
        'leaderboard.time': 'タイム',
        'leaderboard.level': 'レベル',
    },

    // ───────── Français ─────────
    fr: {
        'header.loading': 'Concentration du chakra...',
        'header.start': 'Démarrer',
        'header.stop': 'Libérer le jutsu',
        'header.tooltip': 'Cliquez pour commencer !',
        'header.tab.t9': 'Saisie T9',
        'header.tab.challenge': '🔥 Défi',
        'header.tab.ranking': '🏆 Classement',

        't9.keypad': 'Clavier Ninja',
        't9.hint': '戌=Espace | 亥=Suivant | 酉=Suppr',
        't9.status.active': 'ACTIF',
        't9.status.standby': 'EN ATTENTE',

        'jutsu.title': 'Choisir un Jutsu',
        'jutsu.subtitle': 'Sélectionnez un jutsu pour tester votre vitesse',
        'jutsu.seals': 'SCEAUX',
        'jutsu.challenge': 'Défier →',

        'arena.retry': 'Réessayez !',

        'result.globalRank': 'Rang mondial :',
        'result.ninjaNameLabel': 'Entrez votre nom de ninja',
        'result.ninjaNameHint': '1-12 caractères · Toute langue',
        'result.submit': 'Soumettre',
        'result.submitting': 'Envoi...',
        'result.submitted': '✓ Score soumis !',
        'result.submitError': 'Échec, sauvegardé localement',
        'result.nameError': 'Le nom doit comporter 1 à 12 caractères',
        'result.time': 'Temps (s)',
        'result.seals': 'Sceaux',
        'result.sealSpeed': 's/sceau',
        'result.retry': 'Réessayer',
        'result.leaderboard': 'Classement',
        'result.backToSelect': 'Choisir un jutsu',

        'leaderboard.title': '🏆 Classement Ninja',
        'leaderboard.back': '← Retour',
        'leaderboard.global': '🌐 CLASSEMENT MONDIAL',
        'leaderboard.local': '💾 LOCAL UNIQUEMENT',
        'leaderboard.loading': 'Concentration du chakra...',
        'leaderboard.loadError': 'Échec du chargement',
        'leaderboard.empty': 'Aucun record',
        'leaderboard.emptyHint': 'Soyez le premier ninja à conquérir ce jutsu !',
        'leaderboard.rank': 'Rang',
        'leaderboard.ninja': 'Ninja',
        'leaderboard.time': 'Temps',
        'leaderboard.level': 'Niveau',
    },
} as const;
