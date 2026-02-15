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
}

type ChallengeView = 'select' | 'arena' | 'result' | 'leaderboard';

export const ChallengeMode: React.FC<ChallengeModeProps> = ({
    videoRef,
    detections,
    isRunning,
}) => {
    const engineRef = useRef(new ChallengeEngine());
    const signManagerRef = useRef(new SignManager());
    const [state, setState] = useState<ChallengeState>(engineRef.current.getState());
    const [view, setView] = useState<ChallengeView>('select');
    const [lastResult, setLastResult] = useState<ChallengeResultType | null>(null);

    // Sync engine state changes
    useEffect(() => {
        engineRef.current.setOnStateChange(() => {
            const newState = engineRef.current.getState();
            setState(newState);

            // Auto-transition to result view on complete
            if (newState.phase === 'complete' && newState.result) {
                setLastResult(newState.result);
                setView('result');
            }
        });

        return () => {
            engineRef.current.destroy();
        };
    }, []);

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
        setView('select');
    }, []);

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

            {/* Camera status warning in challenge */}
            {view === 'arena' && !isRunning && state.phase === 'active' && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 px-4 py-2 rounded
                        text-red-200 text-sm font-mono z-50 animate-pulse">
                    ⚠ カメラ未起動 — Press "結印 Start" first!
                </div>
            )}
        </div>
    );
};
