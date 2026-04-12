import { useCallback, useEffect, useState } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { HelpOverlay } from './components/HelpOverlay';
import { ChallengeCard } from './components/challenge/ChallengeCard';
import { AppRuntime } from './components/AppRuntime';
import { parseShareParams, clearShareParams } from './core/share';
import type { ShareParams } from './core/share';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const [challengeFrom, setChallengeFrom] = useState<ShareParams | null>(null);
  const [initialJutsuId, setInitialJutsuId] = useState<string | null>(null);
  useEffect(() => {
    const params = parseShareParams(window.location.search);
    if (params) {
      setChallengeFrom(params);
      clearShareParams();
    }
  }, []);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('ketsuin_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowHelp(true);
    }
  }, []);

  const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
    localStorage.setItem('ketsuin_tutorial_seen', 'true');
  }, []);

  const handleOpenHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

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

      <AppRuntime
        initialJutsuId={initialJutsuId}
        onInitialJutsuConsumed={() => setInitialJutsuId(null)}
        onOpenHelp={handleOpenHelp}
      />

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
