import { useEffect, useState, useRef } from 'react';
import { useDetector } from './hooks/useDetector';
import { VideoFeed } from './components/VideoFeed';
import { Header } from './components/Header';
import { T9EditorDisplay } from './components/T9EditorDisplay';
import { T9Keyboard } from './components/T9Keyboard';
import { SignManager } from './core/SignManager';
import { T9Engine } from './core/T9Engine';

const signManager = new SignManager();

function App() {
  const { loading, isRunning, start, stop, detections, videoRef } = useDetector('model/yolox_nano.onnx');

  // T9 Engine State
  const t9EngineRef = useRef(new T9Engine());
  const [t9State, setT9State] = useState(t9EngineRef.current.getState());

  // Delete Hold Tracking
  const deleteHoldStartRef = useRef<number | null>(null);
  const nextDeleteTimeRef = useRef<number>(0);

  // Unified Processing Effect
  useEffect(() => {
    if (detections.length > 0) {
      const best = detections[0];
      const signId = best.classId + 1; // 0->1 mapping

      // --- Basic Mode (T9) Logic ---
      const events = signManager.process(best.classId);
      // Only trigger T9 Engine on NEW STABLE SIGNS
      events.forEach(event => {
        if (event.type === 'SIGN') {
          const newSignId = event.data;
          t9EngineRef.current.handleInput(newSignId);
          setT9State(t9EngineRef.current.getState());
        }
      });

      // --- Continuous Delete Logic ---
      // Sign 10 (Bird) is Delete
      if (signId === 10) {
        const now = Date.now();
        if (deleteHoldStartRef.current === null) {
          deleteHoldStartRef.current = now;
        } else {
          const holdDuration = now - deleteHoldStartRef.current;
          if (holdDuration > 2000) { // 2 seconds threshold
            if (now >= nextDeleteTimeRef.current) {
              t9EngineRef.current.handleInput(10); // Trigger Backspace
              setT9State(t9EngineRef.current.getState());
              nextDeleteTimeRef.current = now + 100; // 100ms interval
            }
          }
        }
      } else {
        // Reset if not holding delete
        deleteHoldStartRef.current = null;
      }

    } else {
      // No detections
      deleteHoldStartRef.current = null;

      if (signManager.checkTimeout()) {
        // Optional: Clear T9 sequence on timeout? 
      }
    }
  }, [detections]);

  return (
    <div className="min-h-screen bg-ninja-black text-gray-200 font-sans flex flex-col overflow-hidden relative">
      {/* Background Image: Shinra Tensei */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/asset/shinra.png"
          alt="Background"
          className="w-full h-full object-cover blur-none scale-105 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Header */}
      <Header
        loading={loading}
        isRunning={isRunning}
        start={start}
        stop={stop}
      />

      {/* Main Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative z-10">

        {/* Center Content */}
        <div className="flex-1 flex flex-col gap-4 p-4 min-w-0 overflow-visible md:overflow-y-auto relative order-1 md:order-2">

          {/* Video Feed */}
          <div className="relative w-full max-w-2xl mx-auto z-0 shrink-0">
            <div className={`relative aspect-video bg-black rounded-lg overflow-hidden border-2 shadow-2xl group transition-colors duration-500 border-gray-700 hover:border-konoha-orange`}>

              <VideoFeed videoRef={videoRef} detections={detections} />

              {/* Scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full pointer-events-none animate-scan"></div>
            </div>

            {/* Status Indicator */}
            <div className="absolute top-4 left-4 px-2 py-1 bg-black/80 border border-green-500 text-green-500 text-xs font-mono rounded backdrop-blur-sm shadow flex flex-col gap-1">
              <span>SYS: {isRunning ? 'ACTIVE' : 'STANDBY'}</span>
            </div>
          </div>

          {/* Basic Mode UI: T9 Ninja Input Split Layout */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 shrink-0">
            {/* Left Col: T9 Keyboard Reference */}
            <div className="flex-1 flex flex-col gap-2 min-w-0 justify-center order-2 md:order-1">
              <div className="rounded-lg p-2 flex-1 flex flex-col justify-center backdrop-blur-sm bg-black/30 border border-white/10">
                <h3 className="text-x text-gray-400 font-mono text-center mb-2 uppercase tracking-widest text-shadow">Ninja Keypad</h3>
                <T9Keyboard activeSignId={detections.length > 0 ? detections[0].classId + 1 : null} />
                <div className="text-center text-gray-400 text-[20px] font-mono mt-2 text-shadow">
                  戌(0)=Space | 亥(1)=Next | 酉(*)=Del
                </div>
              </div>
            </div>

            {/* Right Col: Editor Result */}
            <div className="flex-[1.5] min-w-0 order-1 md:order-2">
              <T9EditorDisplay
                {...t9State}
                onTextChange={(text) => {
                  t9EngineRef.current.setText(text);
                  setT9State(t9EngineRef.current.getState());
                }}
              />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}


export default App;
