import type { Jutsu, NinjaRank } from '../config/data';
import { getRankForTime } from '../config/data';

// --- Types ---

export type ChallengePhase = 'idle' | 'countdown' | 'active' | 'complete';

export interface ChallengeResult {
    jutsu: Jutsu;
    timeMs: number;
    signCount: number;
    rank: NinjaRank;
    signTimestamps: number[]; // Per-seal completion timestamps (ms from start)
    secondsPerSign: number;
}

export interface ChallengeState {
    phase: ChallengePhase;
    selectedJutsu: Jutsu | null;
    currentSignIndex: number;
    totalSigns: number;
    elapsedMs: number;
    lastError: boolean;
    result: ChallengeResult | null;
    countdownValue: number; // 3, 2, 1
}

type SoundEvent = 'start' | 'correct' | 'wrong' | 'complete';

// Anti-cheat: minimum ms between consecutive signs
const MIN_SIGN_INTERVAL_MS = 200;

export class ChallengeEngine {
    private phase: ChallengePhase = 'idle';
    private selectedJutsu: Jutsu | null = null;
    private currentSignIndex = 0;
    private startTime = 0;
    private endTime = 0;
    private signTimestamps: number[] = [];
    private lastSignTime = 0;
    private lastError = false;
    private countdownValue = 3;
    private countdownTimer: ReturnType<typeof setInterval> | null = null;

    // Sound hook — consumer can set this to play audio
    public onSoundEvent: ((event: SoundEvent) => void) | null = null;

    // Callback for state updates
    private onStateChange: (() => void) | null = null;

    setOnStateChange(cb: () => void) {
        this.onStateChange = cb;
    }

    private emitChange() {
        this.onStateChange?.();
    }

    private emitSound(event: SoundEvent) {
        this.onSoundEvent?.(event);
    }

    // --- Public API ---

    selectJutsu(jutsu: Jutsu) {
        this.selectedJutsu = jutsu;
        this.phase = 'idle';
        this.reset();
        this.emitChange();
    }

    startCountdown() {
        if (!this.selectedJutsu) return;

        this.phase = 'countdown';
        this.countdownValue = 3;
        this.reset();
        this.emitChange();

        this.countdownTimer = setInterval(() => {
            this.countdownValue -= 1;
            if (this.countdownValue <= 0) {
                this.clearCountdown();
                this.startChallenge();
            }
            this.emitChange();
        }, 1000);
    }

    private clearCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    private startChallenge() {
        this.phase = 'active';
        this.startTime = Date.now();
        this.lastSignTime = this.startTime;
        this.emitSound('start');
        this.emitChange();
    }

    /**
     * Process an incoming sign detection during an active challenge.
     * Returns true if the sign advanced the challenge.
     */
    processSign(signId: number): boolean {
        if (this.phase !== 'active' || !this.selectedJutsu) return false;

        const expectedSignId = this.selectedJutsu.sequence[this.currentSignIndex];
        const now = Date.now();

        // Anti-cheat: too fast
        if (now - this.lastSignTime < MIN_SIGN_INTERVAL_MS) {
            return false;
        }

        if (signId !== expectedSignId) {
            this.lastError = true;
            this.emitSound('wrong');
            this.emitChange();
            return false;
        }

        // Correct sign!
        this.lastError = false;
        this.lastSignTime = now;
        this.signTimestamps.push(now - this.startTime);
        this.currentSignIndex += 1;
        this.emitSound('correct');

        // Check completion
        if (this.currentSignIndex >= this.selectedJutsu.sequence.length) {
            this.endTime = now;
            this.phase = 'complete';
            this.emitSound('complete');
        }

        this.emitChange();
        return true;
    }

    getElapsedMs(): number {
        if (this.phase === 'active') {
            return Date.now() - this.startTime;
        }
        if (this.phase === 'complete') {
            return this.endTime - this.startTime;
        }
        return 0;
    }

    getState(): ChallengeState {
        return {
            phase: this.phase,
            selectedJutsu: this.selectedJutsu,
            currentSignIndex: this.currentSignIndex,
            totalSigns: this.selectedJutsu?.sequence.length ?? 0,
            elapsedMs: this.getElapsedMs(),
            lastError: this.lastError,
            countdownValue: this.countdownValue,
            result: this.phase === 'complete' ? this.getResult() : null,
        };
    }

    getResult(): ChallengeResult | null {
        if (!this.selectedJutsu || this.phase !== 'complete') return null;

        const timeMs = this.endTime - this.startTime;
        const signCount = this.selectedJutsu.sequence.length;

        return {
            jutsu: this.selectedJutsu,
            timeMs,
            signCount,
            rank: getRankForTime(timeMs, signCount),
            signTimestamps: [...this.signTimestamps],
            secondsPerSign: (timeMs / 1000) / signCount,
        };
    }

    resetToIdle() {
        this.clearCountdown();
        this.phase = 'idle';
        this.selectedJutsu = null;
        this.reset();
        this.emitChange();
    }

    retryCurrentJutsu() {
        if (this.selectedJutsu) {
            this.startCountdown();
        }
    }

    private reset() {
        this.currentSignIndex = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.signTimestamps = [];
        this.lastSignTime = 0;
        this.lastError = false;
    }

    destroy() {
        this.clearCountdown();
    }
}
