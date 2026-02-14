import { SUPPORTED_JUTSUS, CONFIG } from '../config/data';
import type { Jutsu } from '../config/data';

export type EngineMode = 'basic' | 'jutsu_challenge' | 'jutsu_practice';

interface BufferedSign {
    signId: number;
    timestamp: number;
}

export interface JutsuMatchResult {
    jutsu: Jutsu;
    timestamp: number;
}

export class JutsuEngine {
    private mode: EngineMode = 'basic';
    private buffer: BufferedSign[] = [];
    private lastInputTime: number = 0;
    private selectedPracticeJutsu: Jutsu | null = null;

    // Strict Mode Tracking
    private candidates: Jutsu[] = [];

    constructor() {
        this.buffer = [];
        this.candidates = [...SUPPORTED_JUTSUS];
    }

    setMode(mode: EngineMode) {
        this.mode = mode;
        this.clearBuffer();
    }

    setPracticeJutsu(jutsuId: string | null) {
        if (jutsuId) {
            this.selectedPracticeJutsu = SUPPORTED_JUTSUS.find(j => j.id === jutsuId) || null;
            // In practice mode, we effectively have only 1 candidate
            this.candidates = this.selectedPracticeJutsu ? [this.selectedPracticeJutsu] : [];
        } else {
            this.selectedPracticeJutsu = null;
            this.candidates = [...SUPPORTED_JUTSUS];
        }
        this.clearBuffer();
    }

    clearBuffer() {
        this.buffer = [];
        this.lastInputTime = 0;

        // Reset candidates
        if (this.mode === 'jutsu_practice' && this.selectedPracticeJutsu) {
            this.candidates = [this.selectedPracticeJutsu];
        } else {
            this.candidates = [...SUPPORTED_JUTSUS];
        }
    }

    /**
     * Process a new input sign. Returns a Jutsu if one is completed.
     */
    process(signId: number): JutsuMatchResult | null {
        const now = Date.now();

        if (this.mode === 'basic') {
            return null;
        }

        // 2. Timeout Check (Challenge Mode only)
        if (this.mode === 'jutsu_challenge') {
            if (this.buffer.length > 0 && (now - this.lastInputTime > CONFIG.JUTSU_WINDOW_MS)) {
                this.clearBuffer();
            }
        }

        // 3. Chattering Check
        const lastSign = this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].signId : -1;
        if (signId === lastSign) {
            this.lastInputTime = now;
            return null;
        }

        // 4. Strict Candidate Filtering (The "Lock-in" Logic)
        const nextDepth = this.buffer.length; // Index of the new sign in the sequence

        const nextCandidates = this.candidates.filter(jutsu => {
            if (jutsu.sequence.length <= nextDepth) return false;
            return jutsu.sequence[nextDepth] === signId;
        });

        if (nextCandidates.length > 0) {
            // Valid step! Accept it.
            this.buffer.push({ signId, timestamp: now });
            this.lastInputTime = now;
            this.candidates = nextCandidates;

            // 5. Check for matches (Full completion)
            const match = this.candidates.find(j => j.sequence.length === this.buffer.length);
            if (match) {
                this.clearBuffer();
                return { jutsu: match, timestamp: now };
            }
        } else {
            // Invalid step for ANY current candidate.
            // Requirement: "only can continue this jutsu don't switch to different once"
            // Implementation: We IGNORE this input. The user must input the correct next sign.
            // If the buffer was empty, this means we ignore signs that don't start ANY jutsu.
        }

        return null;
    }

    // No longer using strict prefix matching logic from before because we filter incrementally.
    // However, getBuffer() is still needed.

    getBuffer(): number[] {
        return this.buffer.map(b => b.signId);
    }

    /**
     * DEBUG: Instantly complete the current practice jutsu
     */
    debugComplete(): JutsuMatchResult | null {
        if (this.mode === 'jutsu_practice') {
            let target = this.selectedPracticeJutsu;

            // If no specific jutsu selected, grab the first available candidate
            // (Takes into account partial progress lock-in)
            if (!target && this.candidates.length > 0) {
                target = this.candidates[0];
            }

            if (target) {
                this.clearBuffer();
                return { jutsu: target, timestamp: Date.now() };
            }
        }
        return null;
    }
}
