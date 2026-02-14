import { useEffect, useState } from 'react';
import { useDetector } from './hooks/useDetector';
import { useJutsuGame } from './hooks/useJutsuGame';
import { useFaceMesh } from './hooks/useFaceMesh';
import { VideoFeed } from './components/VideoFeed';
import { Header } from './components/Header';
import { SignList } from './components/SignList';
import { BasicModeEditor } from './components/BasicModeEditor';
import { JutsuHUD } from './components/JutsuHUD';
import { VFXCanvas } from './components/VFXCanvas';
import { SignManager } from './core/SignManager';
import { HAND_SIGNS } from './config/data';

const signManager = new SignManager();

function App() {
  const { loading, isRunning, start, stop, detections, videoRef } = useDetector('model/yolox_nano.onnx');
  const faceState = useFaceMesh(videoRef, isRunning);

  // Basic Mode State
  const [history, setHistory] = useState<number[]>([]);
  const [editorText, setEditorText] = useState('');

  // Jutsu Mode State
  const { mode, setMode, inputBuffer, lastInputTime, activeJutsu, processSign, clearBuffer, debugTrigger } = useJutsuGame();

  // Unified Processing Effect
  useEffect(() => {
    if (detections.length > 0) {
      const best = detections[0];
      const signId = best.classId + 1; // 0->1 mapping

      if (mode === 'basic') {
        // --- Legacy Basic Logic ---
        const events = signManager.process(best.classId); // passing 0-indexed ID to legacy manager
        if (events.length > 0) {
          setHistory([...signManager.getDisplayQueue()]);
          events.forEach(event => {
            if (event.type === 'COMMAND') {
              const { action, text, keys } = event.data;
              if (action === 'write') setEditorText(prev => prev + text);
              else if (action === 'shortcut') {
                if (keys) {
                  if (keys.includes('Enter')) setEditorText(prev => prev + '\n');
                  if (keys.includes('o') && keys.includes('Control')) setEditorText("print(\"\")");
                }
              }
            } else if (event.type === 'KEY') {
              const { key } = event.data;
              if (key === 'space') setEditorText(prev => prev + ' ');
            }
          });
        }
      } else {
        // --- Jutsu Game Logic ---
        processSign(signId);
      }
    } else {
      // Timeout checks for basic mode
      if (mode === 'basic' && signManager.checkTimeout()) {
        setHistory([]);
      }
    }
  }, [detections, mode, processSign]);

  return (
    <div className="min-h-screen bg-ninja-black text-gray-200 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <Header
        mode={mode}
        setMode={setMode}
        loading={loading}
        isRunning={isRunning}
        start={start}
        stop={stop}
      />

      {/* Main Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Background Pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_#333_1px,_transparent_1px)] bg-[length:20px_20px]"></div>

        {/* Left Signs (Desktop) */}
        <SignList
          className="w-48 border-r"
          signs={HAND_SIGNS.slice(1, 7)} // A: 1-6
          title="Hand Signs A"
        />

        {/* Center Content */}
        <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-y-auto relative">

          {/* Jutsu HUD Overlay (Only in Jutsu Mode) */}
          {mode !== 'basic' && (
            <>
              <JutsuHUD inputBuffer={inputBuffer} lastInputTime={lastInputTime} highlightJutsu={activeJutsu} />

              {/* Practice Mode: Manual Clear Button & Debug */}
              {mode === 'jutsu_practice' && (
                <div className="absolute bottom-20 right-4 z-40 pointer-events-auto flex flex-col gap-2 items-end">
                  {inputBuffer.length > 0 && (
                    <button
                      onClick={clearBuffer}
                      className="bg-red-900/80 hover:bg-red-700 text-white px-4 py-2 rounded border border-red-500 shadow-lg text-xs font-bold uppercase tracking-widest backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <span>🗑️</span> Clear Seals
                    </button>
                  )}
                  <button
                    onClick={debugTrigger}
                    className="bg-blue-900/80 hover:bg-blue-700 text-white px-4 py-2 rounded border border-blue-500 shadow-lg text-xs font-bold uppercase tracking-widest backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <span>⚡</span> Debug: Instant Cast
                  </button>
                </div>
              )}
            </>
          )}

          {/* Video Feed */}
          <div className="relative w-full max-w-2xl mx-auto z-0">
            <div className={`relative aspect-video bg-black rounded-lg overflow-hidden border-2 shadow-2xl group transition-colors duration-500 ${activeJutsu ? 'border-red-500 shadow-[0_0_30px_#f00]' : 'border-gray-700 hover:border-konoha-orange'}`}>

              {/* VFX Layer (Simple Active Jutsu Overlay for now) */}
              {activeJutsu && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-ping-slow">
                  <h2 className="text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] stroke-black tracking-widest font-ninja">
                    {activeJutsu.name}
                  </h2>
                </div>
              )}

              <VideoFeed videoRef={videoRef} detections={detections} />

              {/* VFX Overlay */}
              <VFXCanvas
                activeJutsu={activeJutsu}
                faceState={faceState}
                detections={detections}
                width={640}
                height={480}
              />

              {/* Scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full pointer-events-none animate-scan"></div>
            </div>

            {/* Status Indicator */}
            <div className="absolute top-4 left-4 px-2 py-1 bg-black/80 border border-green-500 text-green-500 text-xs font-mono rounded backdrop-blur-sm shadow flex flex-col gap-1">
              <span>SYS: {isRunning ? 'ACTIVE' : 'STANDBY'}</span>
              <span>FACE: {faceState.faceDetected ? 'LOCKED' : 'SEARCHING'}</span>
            </div>
          </div>

          {/* Basic Mode UI: History & Editor */}
          {mode === 'basic' && (
            <BasicModeEditor
              history={history}
              editorText={editorText}
              setEditorText={setEditorText}
            />
          )}
        </div>

        {/* Right Signs (Desktop) */}
        <SignList
          className="w-48 border-l"
          signs={HAND_SIGNS.slice(7, 13)} // B: 7-12
          title="Hand Signs B"
        />


      </main>
    </div>
  );
}

export default App;
