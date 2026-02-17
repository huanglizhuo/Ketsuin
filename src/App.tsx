import { useEffect, useState, useRef } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useDetector } from './hooks/useDetector';
import { Header } from './components/Header';
import { SignManager } from './core/SignManager';
import { T9Engine } from './core/T9Engine';
import { SignOverlay } from './components/SignOverlay';
import { EasterEggOverlay } from './components/EasterEggOverlay';
import { HelpOverlay } from './components/HelpOverlay';
import { ChallengeMode } from './components/challenge/ChallengeMode';
import { Leaderboard } from './components/challenge/Leaderboard';
import { ChallengeCard } from './components/challenge/ChallengeCard';
import { parseShareParams, clearShareParams } from './core/share';
import type { ShareParams } from './core/share';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { T9View } from './views/T9View';

const signManager = new SignManager();

function App() {
  const { loading, isRunning, start, stop, detections, videoRef, error, mediaStream } = useDetector();
  const navigate = useNavigate();

  // App Mode removed, using routing now

  // Share challenge state
  const [challengeFrom, setChallengeFrom] = useState<ShareParams | null>(null);
  const [initialJutsuId, setInitialJutsuId] = useState<string | null>(null);

  // Parse URL challenge params on mount
  useEffect(() => {
    const params = parseShareParams(window.location.search);
    if (params) {
      setChallengeFrom(params);
      clearShareParams();
    }
  }, []);

  // T9 Engine State
  const t9EngineRef = useRef(new T9Engine());
  const [t9State, setT9State] = useState(t9EngineRef.current.getState());

  // Visual Overlay State
  const [lastConfirmedSign, setLastConfirmedSign] = useState<number | null>(null);

  // Delete Hold Tracking
  const deleteHoldStartRef = useRef<number | null>(null);
  const nextDeleteTimeRef = useRef<number>(0);

  // Cycle Hold Tracking
  const cycleHoldStartRef = useRef<number | null>(null);
  const nextCycleTimeRef = useRef<number>(0);

  // Easter Egg: 巳(6)→午(7) = 丙午年
  const prevConfirmedSignRef = useRef<number | null>(null);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const easterEggCooldownRef = useRef<number>(0);

  // Help Overlay State
  const [showHelp, setShowHelp] = useState(false);

  // Auto-show help on first visit
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('ketsuin_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowHelp(true);
    }
  }, []);

  const handleCloseHelp = () => {
    setShowHelp(false);
    localStorage.setItem('ketsuin_tutorial_seen', 'true');
  };

  // Unified Processing Effect (T9 mode only)
  const location = useLocation();
  const isT9Mode = location.pathname === '/';

  useEffect(() => {
    if (!isT9Mode) return; // Skip T9 processing in challenge mode

    if (detections.length > 0) {
      const best = detections[0];
      const signId = best.classId + 1; // 0->1 mapping

      // --- Basic Mode (T9) Logic ---
      const events = signManager.process(best.classId);
      // Only trigger T9 Engine on NEW STABLE SIGNS
      events.forEach(event => {
        if (event.type === 'SIGN') {
          const newSignId = event.data;

          // Easter Egg check: 巳(6) → 午(7), only during 春节 (Feb 16 – Mar 3, 2026)
          const now = Date.now();
          const eggStart = new Date('2026-02-16T00:00:00').getTime();
          const eggEnd = new Date('2026-03-04T00:00:00').getTime(); // Mar 3 inclusive
          if (
            prevConfirmedSignRef.current === 6 &&
            newSignId === 7 &&
            now > easterEggCooldownRef.current &&
            now >= eggStart && now < eggEnd
          ) {
            setShowEasterEgg(true);
            easterEggCooldownRef.current = now + 60_000; // 60s cooldown
            setTimeout(() => setShowEasterEgg(false), 4500);
          }
          prevConfirmedSignRef.current = newSignId;

          // Update Overlay
          setLastConfirmedSign(newSignId);

          t9EngineRef.current.handleInput(newSignId);
          setT9State(t9EngineRef.current.getState());
        }
      });

      const now = Date.now();

      // --- Continuous Delete Logic (Sign 10) ---
      // --- Continuous Delete Logic (Sign 10) ---
      if (signId === 10) {
        if (deleteHoldStartRef.current === null) {
          deleteHoldStartRef.current = now;
        } else {
          const holdDuration = now - deleteHoldStartRef.current;
          // Use a similar threshold to SignManager stability (plus a buffer) or just the same
          // Use explicit 300ms threshold (decoupled from SignManager.SIGN_HOLD_MS)
          if (holdDuration > 300) { // 300ms hold start
            if (now >= nextDeleteTimeRef.current) {
              t9EngineRef.current.handleInput(10); // Trigger Backspace
              setT9State(t9EngineRef.current.getState());
              setLastConfirmedSign(10); // Trigger Overlay
              nextDeleteTimeRef.current = now + 100; // 100ms interval
            }
          }
        }
        // Reset other hold refs if this one is active
        cycleHoldStartRef.current = null;
      } else {
        deleteHoldStartRef.current = null;
      }

      // --- Continuous Cycle Logic (Sign 12) ---
      if (signId === 12) {
        if (cycleHoldStartRef.current === null) {
          cycleHoldStartRef.current = now;
        } else {
          const holdDuration = now - cycleHoldStartRef.current;
          if (holdDuration > 300) { // 300ms hold start
            if (now >= nextCycleTimeRef.current) {
              t9EngineRef.current.handleInput(12); // Cycle Candidate
              setT9State(t9EngineRef.current.getState());
              setLastConfirmedSign(12); // Trigger Overlay
              nextCycleTimeRef.current = now + 300; // 300ms interval
            }
          }
        }
        // Reset other hold refs if this one is active
        deleteHoldStartRef.current = null;
      } else {
        cycleHoldStartRef.current = null;
      }

    } else {
      // No detections
      deleteHoldStartRef.current = null;
      cycleHoldStartRef.current = null;
      signManager.resetStability();

      if (signManager.checkTimeout()) {
        // Optional: Clear T9 sequence on timeout? 
      }
    }
  }, [detections, isT9Mode]);

  return (
    <div className="min-h-screen bg-ninja-black text-gray-200 font-sans flex flex-col overflow-hidden relative">
      {/* Background Image: Shinra Tensei */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={`${import.meta.env.BASE_URL}asset/shinra.png`}
          alt="Background"
          className="w-full h-full object-cover blur-none scale-105 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Sekiro-Style Overlay */}
      <SignOverlay currentSign={lastConfirmedSign} />

      {/* Easter Egg: 丙午年 */}
      <EasterEggOverlay show={showEasterEgg} />

      {/* Header */}
      <Header
        loading={loading}
        isRunning={isRunning}
        error={error}
        start={start}
        stop={stop}
        onOpenHelp={() => setShowHelp(true)}
      />

      {/* Main Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative z-10">
        <Routes>
          <Route path="/" element={
            <T9View
              videoRef={videoRef}
              detections={detections}
              isRunning={isRunning}
              t9State={t9State}
              onTextChange={(text) => {
                t9EngineRef.current.setText(text);
                setT9State(t9EngineRef.current.getState());
              }}
              activeSignId={detections.length > 0 ? detections[0].classId + 1 : null}
              mediaStream={mediaStream}
            />
          } />
          <Route path="/challenge" element={
            <ChallengeMode
              videoRef={videoRef}
              detections={detections}
              isRunning={isRunning}
              start={start}
              stop={stop}
              initialJutsuId={initialJutsuId}
              onInitialJutsuConsumed={() => setInitialJutsuId(null)}
              onSignConfirmed={setLastConfirmedSign}
              mediaStream={mediaStream}
            />
          } />
          <Route path="/ranking" element={
            <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-y-auto relative">
              <Leaderboard onBack={() => navigate('/')} />
            </div>
          } />
        </Routes>
      </main>
      {/* Challenge Card Modal from shared URL */}
      {challengeFrom && (
        <ChallengeCard
          challengerName={challengeFrom.ninjaName}
          jutsuId={challengeFrom.jutsuId}
          timeMs={challengeFrom.timeMs}
          rankId={challengeFrom.rankId}
          onAccept={() => {
            setInitialJutsuId(challengeFrom.jutsuId);
            navigate('/challenge');
            setChallengeFrom(null);
          }}
          onDismiss={() => setChallengeFrom(null)}
        />
      )}

      <Analytics />
      <SpeedInsights />

      {/* Help Overlay (Root Level) */}
      <HelpOverlay isOpen={showHelp} onClose={handleCloseHelp} />
    </div>
  );
}


export default App;
