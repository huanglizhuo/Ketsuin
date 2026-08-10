import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDetector, warmupDetector } from '../hooks/useDetector';
import { Header } from './Header';
import { SignOverlay } from './SignOverlay';
import { EasterEggOverlay } from './EasterEggOverlay';
import { T9View } from '../views/T9View';
import { SignManager } from '../core/SignManager';
import { T9Engine } from '../core/T9Engine';

// Challenge + Leaderboard ship as separate chunks — they pull in
// the leaderboard API client + html2canvas which the default T9 view never needs.
const ChallengeMode = lazy(() =>
    import('./challenge/ChallengeMode').then(m => ({ default: m.ChallengeMode }))
);
const Leaderboard = lazy(() =>
    import('./challenge/Leaderboard').then(m => ({ default: m.Leaderboard }))
);
const AboutView = lazy(() => import('../views/AboutView'));
const HandSignsView = lazy(() => import('../views/HandSignsView'));

function RouteFallback() {
    return (
        <div className="flex-1 flex items-center justify-center p-8 text-konoha-orange font-mono text-sm">
            <div className="w-8 h-8 border-2 border-konoha-orange border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

interface AppRuntimeProps {
    initialJutsuId: string | null;
    onInitialJutsuConsumed: () => void;
    onOpenHelp: () => void;
}

const signManager = new SignManager();

export function AppRuntime({
    initialJutsuId,
    onInitialJutsuConsumed,
    onOpenHelp,
}: AppRuntimeProps) {
    const { loading, isRunning, start, stop, detections, videoRef, error, mediaStream } = useDetector();
    const navigate = useNavigate();
    const location = useLocation();
    const isT9Mode = location.pathname === '/';

    const t9EngineRef = useRef(new T9Engine());
    const [t9State, setT9State] = useState(t9EngineRef.current.getState());

    // The 100KB T9 dictionary ships as its own chunk, fetched off the critical path
    useEffect(() => {
        let cancelled = false;
        void import('../config/t9_dictionary').then(m => {
            if (!cancelled) t9EngineRef.current.setDictionary(m.T9_DICTIONARY);
        });
        return () => { cancelled = true; };
    }, []);

    // Warm the detector chunk + model bytes during idle time so Start feels instant
    useEffect(() => {
        const idle = window.requestIdleCallback ?? ((cb: () => void) => { setTimeout(cb, 1500); return 0; });
        idle(() => warmupDetector());
    }, []);
    const [lastConfirmedSign, setLastConfirmedSign] = useState<number | null>(null);
    const [showEasterEgg, setShowEasterEgg] = useState(false);

    const deleteHoldStartRef = useRef<number | null>(null);
    const nextDeleteTimeRef = useRef<number>(0);
    const cycleHoldStartRef = useRef<number | null>(null);
    const nextCycleTimeRef = useRef<number>(0);
    const prevConfirmedSignRef = useRef<number | null>(null);
    const easterEggCooldownRef = useRef<number>(0);

    const handleBeforeNavigate = useCallback((path: '/' | '/challenge' | '/ranking') => {
        if (path !== location.pathname && isRunning) {
            stop();
        }
    }, [isRunning, location.pathname, stop]);

    const handleTextChange = useCallback((text: string) => {
        t9EngineRef.current.setText(text);
        setT9State(t9EngineRef.current.getState());
    }, []);

    useEffect(() => {
        if (!isT9Mode) return;

        if (detections.length > 0) {
            const best = detections[0];
            const signId = best.classId + 1;
            const events = signManager.process(best.classId);

            events.forEach(event => {
                if (event.type !== 'SIGN') return;

                const newSignId = event.data;
                const now = Date.now();
                const eggStart = new Date('2026-02-16T00:00:00').getTime();
                const eggEnd = new Date('2026-03-04T00:00:00').getTime();

                if (
                    prevConfirmedSignRef.current === 6 &&
                    newSignId === 7 &&
                    now > easterEggCooldownRef.current &&
                    now >= eggStart && now < eggEnd
                ) {
                    setShowEasterEgg(true);
                    easterEggCooldownRef.current = now + 60_000;
                    setTimeout(() => setShowEasterEgg(false), 4500);
                }

                prevConfirmedSignRef.current = newSignId;
                setLastConfirmedSign(newSignId);
                t9EngineRef.current.handleInput(newSignId);
                setT9State(t9EngineRef.current.getState());
            });

            const now = Date.now();

            if (signId === 10) {
                if (deleteHoldStartRef.current === null) {
                    deleteHoldStartRef.current = now;
                } else if (now - deleteHoldStartRef.current > 300 && now >= nextDeleteTimeRef.current) {
                    t9EngineRef.current.handleInput(10);
                    setT9State(t9EngineRef.current.getState());
                    setLastConfirmedSign(10);
                    nextDeleteTimeRef.current = now + 100;
                }
                cycleHoldStartRef.current = null;
            } else {
                deleteHoldStartRef.current = null;
            }

            if (signId === 12) {
                if (cycleHoldStartRef.current === null) {
                    cycleHoldStartRef.current = now;
                } else if (now - cycleHoldStartRef.current > 300 && now >= nextCycleTimeRef.current) {
                    t9EngineRef.current.handleInput(12);
                    setT9State(t9EngineRef.current.getState());
                    setLastConfirmedSign(12);
                    nextCycleTimeRef.current = now + 300;
                }
                deleteHoldStartRef.current = null;
            } else {
                cycleHoldStartRef.current = null;
            }
        } else {
            deleteHoldStartRef.current = null;
            cycleHoldStartRef.current = null;
            signManager.resetStability();
            signManager.checkTimeout();
        }
    }, [detections, isT9Mode]);

    return (
        <>
            <SignOverlay currentSign={lastConfirmedSign} />
            <EasterEggOverlay show={showEasterEgg} />

            <Header
                onOpenHelp={onOpenHelp}
                onBeforeNavigate={handleBeforeNavigate}
            />

            <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative z-0">
                <Routes>
                    <Route path="/" element={
                        <T9View
                            videoRef={videoRef}
                            detections={detections}
                            isRunning={isRunning}
                            loading={loading}
                            error={error}
                            onStart={start}
                            onStop={stop}
                            t9State={t9State}
                            onTextChange={handleTextChange}
                            activeSignId={detections.length > 0 ? detections[0].classId + 1 : null}
                            mediaStream={mediaStream}
                        />
                    } />
                    <Route path="/challenge" element={
                        <Suspense fallback={<RouteFallback />}>
                            <ChallengeMode
                                videoRef={videoRef}
                                detections={detections}
                                isRunning={isRunning}
                                start={start}
                                stop={stop}
                                initialJutsuId={initialJutsuId}
                                onInitialJutsuConsumed={onInitialJutsuConsumed}
                                onSignConfirmed={setLastConfirmedSign}
                                mediaStream={mediaStream}
                            />
                        </Suspense>
                    } />
                    <Route path="/ranking" element={
                        <Suspense fallback={<RouteFallback />}>
                            <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-y-auto relative">
                                <Leaderboard onBack={() => navigate('/')} />
                            </div>
                        </Suspense>
                    } />
                    <Route path="/about" element={
                        <Suspense fallback={<RouteFallback />}>
                            <AboutView />
                        </Suspense>
                    } />
                    <Route path="/hand-signs" element={
                        <Suspense fallback={<RouteFallback />}>
                            <HandSignsView />
                        </Suspense>
                    } />
                </Routes>
            </main>
        </>
    );
}
