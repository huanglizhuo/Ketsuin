import { CONFIG, WORD_MAPPINGS, SPECIAL_KEY_MAPPINGS, SHORTCUT_MAPPINGS } from '../config/data';

interface SignEvent {
    type: 'SIGN' | 'COMMAND' | 'KEY';
    data: any;
}

export class SignManager {
    private displayQueue: number[] = [];
    private historyQueue: number[] = [];
    private signSequence: number[] = []; // For key combos

    // Stability / Hold Logic
    private pendingSign: number | null = null;
    private pendingStartTime: number = 0;
    private pendingEmitted: boolean = false;
    private readonly SIGN_HOLD_MS = 100;

    private lastSignTime = 0;

    constructor() {
        this.displayQueue = [];
        this.historyQueue = [];
        this.signSequence = [];
    }

    process(classId: number): SignEvent[] {
        const events: SignEvent[] = [];
        const signId = classId + 1; // 0-based to 1-based

        // Check if sign changed
        if (signId !== this.pendingSign) {
            this.pendingSign = signId;
            this.pendingStartTime = Date.now();
            this.pendingEmitted = false;
            return events; // wait for stability
        }

        // Sign matches pending, check duration
        if (!this.pendingEmitted) {
            const duration = Date.now() - this.pendingStartTime;

            // Special threshold for Space (Sign 11)
            const threshold = (signId === 11) ? 40 : this.SIGN_HOLD_MS;

            if (duration >= threshold) {
                // COMMIT SIGN
                this.pendingEmitted = true;

                // Logic moved from old chattering block:
                const stableSign = signId;
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
                }
            }
        }

        return events;
    }

    resetStability() {
        this.pendingSign = null;
        this.pendingEmitted = false;
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

        return events;
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
}
