import { JUTSU_LIST, CONFIG, WORD_MAPPINGS, SPECIAL_KEY_MAPPINGS, SHORTCUT_MAPPINGS } from '../config/data';
import type { Jutsu } from '../config/data';

interface SignEvent {
    type: 'SIGN' | 'JUTSU' | 'COMMAND' | 'KEY';
    data: any;
}

export class SignManager {
    private displayQueue: number[] = [];
    private historyQueue: number[] = [];
    private signSequence: number[] = []; // For key combos
    private chatteringQueue: number[] = [];
    private chatteringSize = CONFIG.CHATTERING_CHECK;

    private lastSignTime = 0;
    private jutsuStartTime = 0;
    private currentJutsu: Jutsu | null = null;

    constructor() {
        this.displayQueue = [];
        this.historyQueue = [];
        this.signSequence = [];
        this.chatteringQueue = [];
    }

    process(classId: number): SignEvent[] {
        const events: SignEvent[] = [];
        // classId from detector is 0-based.
        // Map to 1-based ID:
        const signId = classId + 1;

        // Chattering check
        this.chatteringQueue.push(signId);
        if (this.chatteringQueue.length > this.chatteringSize) {
            this.chatteringQueue.shift();
        }

        // Only proceed if queue is full and all values are same
        if (this.chatteringQueue.length < this.chatteringSize) return events;
        const allSame = this.chatteringQueue.every(v => v === this.chatteringQueue[0]);
        if (!allSame) return events;

        const stableSign = this.chatteringQueue[0];

        // Check if new sign
        const lastDisplayed = this.displayQueue.length > 0 ? this.displayQueue[this.displayQueue.length - 1] : -1;

        if (lastDisplayed !== stableSign) {
            this.displayQueue.push(stableSign);
            this.historyQueue.push(stableSign);
            this.signSequence.push(stableSign);

            if (this.displayQueue.length > CONFIG.MAX_DISPLAY) this.displayQueue.shift();
            if (this.historyQueue.length > CONFIG.MAX_HISTORY) this.historyQueue.shift();

            this.lastSignTime = Date.now();

            events.push({ type: 'SIGN', data: stableSign });

            // Check Mappings
            const mappingEvents = this.checkMappings();
            events.push(...mappingEvents);

            // Check Jutsu
            const jutsu = this.checkJutsu();
            if (jutsu) {
                this.currentJutsu = jutsu;
                this.jutsuStartTime = Date.now();
                events.push({ type: 'JUTSU', data: jutsu });
            }
        }

        return events;
    }

    checkMappings(): SignEvent[] {
        const events: SignEvent[] = [];

        // Word Mappings
        // Check last 1
        if (this.signSequence.length >= 1) {
            const key = this.signSequence.slice(-1).join(',');
            if (WORD_MAPPINGS[key]) {
                events.push({ type: 'COMMAND', data: { action: 'write', text: WORD_MAPPINGS[key] } });
                this.signSequence = [];
                return events;
            }
            if (SPECIAL_KEY_MAPPINGS[key]) {
                events.push({ type: 'KEY', data: { key: SPECIAL_KEY_MAPPINGS[key] } });
                this.signSequence = [];
                return events;
            }
            if (SHORTCUT_MAPPINGS[key]) {
                events.push({ type: 'COMMAND', data: { action: 'shortcut', keys: SHORTCUT_MAPPINGS[key] } });
                this.signSequence = [];
                return events;
            }
        }

        // Check last 2
        if (this.signSequence.length >= 2) {
            const key = this.signSequence.slice(-2).join(',');
            if (WORD_MAPPINGS[key]) {
                events.push({ type: 'COMMAND', data: { action: 'write', text: WORD_MAPPINGS[key] } });
                this.signSequence = [];
                return events;
            }
        }
        // Check last 3 (for shortcuts potentially)
        // NOTE: Python checked 1, then 2 for words/special.
        // For Shortcuts it checked 1 then 3?
        // We can just iterate lengths 1, 2, 3 reversed?
        // Python priority was: 1 (Word), 2 (Word), 1 (Special), 2 (Special), 3 (Special), 1 (Short), 3 (Short).
        // Current implementation simplifies this but order matters.

        return events;
    }

    checkJutsu(): Jutsu | undefined {
        // Current history sequence
        // Optimization: Just check if the tail of history matches any jutsu sequence
        // Jutsu sequences are relatively short.

        // Only check if history updated.

        for (const jutsu of JUTSU_LIST) {
            const seq = jutsu.sequence;
            if (this.historyQueue.length >= seq.length) {
                // Check tail
                const subHistory = this.historyQueue.slice(-seq.length);
                if (subHistory.every((val, idx) => val === seq[idx])) {
                    return jutsu;
                }
            }
        }
        return undefined;
    }

    clearHistory() {
        this.displayQueue = [];
        this.historyQueue = [];
        this.signSequence = [];
    }

    checkTimeout() {
        if (Date.now() - this.lastSignTime > CONFIG.SIGN_INTERVAL) {
            this.displayQueue = [];
            this.historyQueue = [];
            this.signSequence = [];
            return true; // cleared
        }
        return false;
    }

    getDisplayQueue() {
        return this.displayQueue;
    }

    getCurrentJutsu() {
        if (Date.now() - this.jutsuStartTime < CONFIG.JUTSU_DISPLAY_TIME) {
            return this.currentJutsu;
        }
        return null;
    }
}
