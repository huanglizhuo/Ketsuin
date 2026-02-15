import React, { useRef, useEffect, useCallback, useState } from 'react';
import { JutsuSelect } from './JutsuSelect';
import { ChallengeArena } from './ChallengeArena';
import { ChallengeResult } from './ChallengeResult';
import { Leaderboard } from './Leaderboard';
import { ChallengeEngine } from '../../core/ChallengeEngine';
import type { ChallengeState, ChallengeResult as ChallengeResultType } from '../../core/ChallengeEngine';
import type { Jutsu } from '../../config/data';
import type { Detection } from '../../core/yolox';
import { SignManager } from '../../core/SignManager';
import { VideoFeed } from '../VideoFeed';

interface ChallengeModeProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    detections: Detection[];
    isRunning: boolean;
    start: () => void;
    stop: () => void;
}

type ChallengeView = 'select' | 'arena' | 'result' | 'leaderboard';

export const ChallengeMode: React.FC<ChallengeModeProps> = ({
    videoRef,
    detections,
    isRunning,
    start,
    stop,
}) => {
    const engineRef = useRef(new ChallengeEngine());
    const signManagerRef = useRef(new SignManager());
    const [state, setState] = useState<ChallengeState>(engineRef.current.getState());
    const [view, setView] = useState<ChallengeView>('select');
    const [lastResult, setLastResult] = useState<ChallengeResultType | null>(null);
    // Track whether we auto-started the camera so we know to auto-stop it
    const autoStartedRef = useRef(false);

    // Sync engine state changes
    useEffect(() => {
        engineRef.current.setOnStateChange(() => {
            const newState = engineRef.current.getState();
            setState(newState);

            // Auto-transition to result view on complete
            if (newState.phase === 'complete' && newState.result) {
                setLastResult(newState.result);
                setView('result');

                // Auto-stop camera if we auto-started it
                if (autoStartedRef.current) {
                    autoStartedRef.current = false;
                    stop();
                }
            }
        });

        return () => {
            engineRef.current.destroy();
        };
    }, [stop]);

    // Auto-start camera when countdown begins (so model warms up before timer starts)
    useEffect(() => {
        if (state.phase === 'countdown' && !isRunning) {
            autoStartedRef.current = true;
            start();
        }
    }, [state.phase, isRunning, start]);

    // Process detections during active challenge
    useEffect(() => {
        if (state.phase !== 'active') return;
        if (detections.length === 0) {
            signManagerRef.current.resetStability();
            return;
        }

        const best = detections[0];
        const events = signManagerRef.current.process(best.classId);

        events.forEach(event => {
            if (event.type === 'SIGN') {
                const signId = event.data as number;
                engineRef.current.processSign(signId);
            }
        });
    }, [detections, state.phase]);

    // --- Handlers ---

    const handleJutsuSelect = useCallback((jutsu: Jutsu) => {
        engineRef.current.selectJutsu(jutsu);
        engineRef.current.startCountdown();
        signManagerRef.current.clearHistory();
        setView('arena');
    }, []);

    const handleRetry = useCallback(() => {
        signManagerRef.current.clearHistory();
        engineRef.current.retryCurrentJutsu();
        setView('arena');
    }, []);

    const handleBackToSelect = useCallback(() => {
        engineRef.current.resetToIdle();
        // Stop camera if still running from challenge
        if (autoStartedRef.current) {
            autoStartedRef.current = false;
            stop();
        }
        setView('select');
    }, [stop]);

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

    // --- Render ---

    return (
        <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-y-auto relative">
            {view === 'select' && (
                <JutsuSelect onSelect={handleJutsuSelect} />
            )}

            {view === 'arena' && (
                <ChallengeArena state={state}>
                    <VideoFeed videoRef={videoRef} detections={detections} />
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
