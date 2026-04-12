import React, { useEffect, useCallback, useState, useRef } from 'react';
import { JutsuSelect } from './JutsuSelect';
import { ChallengeArena } from './ChallengeArena';
import { ChallengeResult } from './ChallengeResult';
import { Leaderboard } from './Leaderboard';
import { ChallengeEngine } from '../../core/ChallengeEngine';
import type { ChallengeState, ChallengeResult as ChallengeResultType } from '../../core/ChallengeEngine';
import type { Jutsu } from '../../config/data';
import { SUPPORTED_JUTSUS } from '../../config/data';
import type { Detection } from '../../core/yolox';
import { SignManager } from '../../core/SignManager';
import { VideoFeed } from '../VideoFeed';

interface ChallengeModeProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    detections: Detection[];
    isRunning: boolean;
    start: () => void;
    stop: () => void;
    initialJutsuId?: string | null;
    onInitialJutsuConsumed?: () => void;
    onSignConfirmed?: (signId: number) => void;
    mediaStream?: MediaStream | null;
}

type ChallengeView = 'select' | 'arena' | 'result' | 'leaderboard';

export const ChallengeMode: React.FC<ChallengeModeProps> = ({
    videoRef,
    detections,
    isRunning,
    start,
    stop,
    initialJutsuId,
    onInitialJutsuConsumed,
    onSignConfirmed,
    mediaStream
}) => {
    const [engine] = useState(() => new ChallengeEngine());
    const [signManager] = useState(() => new SignManager());
    const [state, setState] = useState<ChallengeState>(() => engine.getState());
    const [view, setView] = useState<ChallengeView>('select');
    const [lastResult, setLastResult] = useState<ChallengeResultType | null>(null);
    // Track whether we auto-started the camera so we know to auto-stop it
    const autoStartedRef = useRef(false);
    const didResetCameraOnEntryRef = useRef(false);

    const log = useCallback((message: string, details?: Record<string, unknown>) => {
        if (details) {
            console.log('[ChallengeMode]', message, details);
            return;
        }
        console.log('[ChallengeMode]', message);
    }, []);

    // --- Handlers ---

    const handleJutsuSelect = useCallback((jutsu: Jutsu) => {
        log('Jutsu selected', { jutsuId: jutsu.id, isRunning });
        engine.selectJutsu(jutsu);
        setView('arena');
        signManager.clearHistory();
        engine.startCountdown();
    }, [engine, isRunning, log, signManager]);

    const handleRetry = useCallback(() => {
        log('Retrying current challenge');
        signManager.clearHistory();
        setView('arena');
        engine.retryCurrentJutsu();
    }, [engine, log, signManager]);

    const handleBackToSelect = useCallback(() => {
        log('Returning from challenge to jutsu select', {
            autoStarted: autoStartedRef.current,
            isRunning,
        });
        engine.resetToIdle();
        // Stop camera if still running from challenge
        if (autoStartedRef.current) {
            autoStartedRef.current = false;
            stop();
        }
        setView('select');
    }, [engine, isRunning, log, stop]);

    const handleViewLeaderboard = useCallback(() => {
        setView('leaderboard');
    }, []);

    const handleLeaderboardBack = useCallback(() => {
        if (lastResult) {
            setView('result');
        } else {
            setView('select');
        }
    }, [lastResult]);

    // Sync engine state changes
    useEffect(() => {
        engine.setOnStateChange(() => {
            const newState = engine.getState();
            setState(newState);

            // Auto-transition to result view on complete
            if (newState.phase === 'complete' && newState.result) {
                setLastResult(newState.result);
                setView('result');

                // Auto-stop camera if we auto-started it
                if (autoStartedRef.current) {
                    log('Challenge completed, auto-stopping challenge camera');
                    autoStartedRef.current = false;
                    stop();
                }
            }
        });

        return () => {
            engine.destroy();
        };
    }, [engine, log, stop]);

    useEffect(() => {
        if (didResetCameraOnEntryRef.current) return;
        didResetCameraOnEntryRef.current = true;

        if (isRunning) {
            log('Stopping inherited T9 camera before challenge flow begins');
            autoStartedRef.current = false;
            stop();
        } else {
            log('Challenge entered with camera already stopped');
        }
    }, [isRunning, log, stop]);

    // Auto-start camera when countdown begins (so model warms up before timer starts)
    useEffect(() => {
        if (view === 'arena' && state.phase === 'countdown' && !isRunning) {
            log('Countdown started, auto-starting challenge camera');
            autoStartedRef.current = true;
            start();
        }
    }, [isRunning, log, start, state.phase, view]);

    // Auto-select jutsu from shared challenge URL
    useEffect(() => {
        if (!initialJutsuId) return;
        const jutsu = SUPPORTED_JUTSUS.find(j => j.id === initialJutsuId);
        if (jutsu) {
            queueMicrotask(() => {
                handleJutsuSelect(jutsu);
            });
        }
        onInitialJutsuConsumed?.();
    }, [handleJutsuSelect, initialJutsuId, onInitialJutsuConsumed]);

    // Process detections during active challenge
    useEffect(() => {
        if (state.phase !== 'active') return;
        if (detections.length === 0) {
            signManager.resetStability();
            return;
        }

        const best = detections[0];
        const events = signManager.process(best.classId);

        events.forEach(event => {
            if (event.type === 'SIGN') {
                const signId = event.data as number;
                engine.processSign(signId);
                onSignConfirmed?.(signId);
            }
        });
    }, [detections, engine, onSignConfirmed, signManager, state.phase]);

    const [showHandHints, setShowHandHints] = useState(true);

    // --- Render ---

    return (
        <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-y-auto relative">
            {view === 'select' && (
                <JutsuSelect onSelect={handleJutsuSelect} />
            )}

            {view === 'arena' && (
                <ChallengeArena
                    state={state}
                    showHandHints={showHandHints}
                    onToggleHandHints={() => setShowHandHints(prev => !prev)}
                >
                    <VideoFeed videoRef={videoRef} detections={detections} srcObject={mediaStream} />
                </ChallengeArena>
            )}

            {view === 'result' && lastResult && (
                <ChallengeResult
                    result={lastResult}
                    onRetry={handleRetry}
                    onBackToSelect={handleBackToSelect}
                    onViewLeaderboard={handleViewLeaderboard}
                />
            )}

            {view === 'leaderboard' && (
                <Leaderboard
                    initialJutsuId={lastResult?.jutsu.id}
                    playerTimeMs={lastResult?.timeMs}
                    onBack={handleLeaderboardBack}
                />
            )}
        </div>
    );
};
