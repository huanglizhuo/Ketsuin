import { useEffect, useState } from 'react';
import { useDetector } from './hooks/useDetector';
import { VideoFeed } from './components/VideoFeed';
import { SignManager } from './core/SignManager';
import { HAND_SIGNS } from './config/data';

const signManager = new SignManager();

function App() {
  const { loading, isRunning, start, stop, detections, videoRef } = useDetector('model/yolox_nano.onnx');
  const [history, setHistory] = useState<number[]>([]);
  const [editorText, setEditorText] = useState('');
  const [activeJutsu, setActiveJutsu] = useState<{ name: string, nameEn: string } | null>(null);

  useEffect(() => {
    // Process detections
    if (detections.length > 0) {
      const best = detections[0];

      const events = signManager.process(best.classId);

      if (events.length > 0) {
        // Update history view
        setHistory([...signManager.getDisplayQueue()]);

        // Handle events
        events.forEach(event => {
          if (event.type === 'COMMAND') {
            const { action, text, keys } = event.data;
            if (action === 'write') {
              setEditorText(prev => prev + text);
            } else if (action === 'shortcut') {
              if (keys) {
                if (keys.includes('Enter')) {
                  setEditorText(prev => prev + '\n');
                }
                if (keys.includes('o') && keys.includes('Control')) {
                  setEditorText("print(\"\")");
                }
              }
            }
          } else if (event.type === 'KEY') {
            const { key } = event.data;
            if (key === 'space') setEditorText(prev => prev + ' ');
          } else if (event.type === 'JUTSU') {
            const jutsu = event.data;
            setActiveJutsu({ name: jutsu.name, nameEn: jutsu.nameEn });
            setTimeout(() => setActiveJutsu(null), 5000);
          }
        });
      }
    } else {
      if (signManager.checkTimeout()) {
        setHistory([]);
      }
    }
  }, [detections]);

  // UI Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#eee',
    fontFamily: 'sans-serif'
  };

  const mainStyle = {
    display: 'flex',
    flex: 1,
    padding: '20px',
    gap: '20px',
    overflow: 'hidden'
  };

  const sideColStyle = {
    width: '180px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    overflowY: 'auto' as const
  };

  const centerColStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    minWidth: '640px'
  };

  const signItemStyle = (active: boolean) => ({
    padding: '5px',
    backgroundColor: active ? '#444' : '#222',
    border: active ? '2px solid #0f0' : '1px solid #444',
    borderRadius: '8px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  });

  return (
    <div style={containerStyle}>
      <header style={{ padding: '10px 20px', backgroundColor: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>NARUTO CODING WEB</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={isRunning ? stop : start}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: isRunning ? '#d32f2f' : '#388e3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? 'Loading Model...' : isRunning ? 'Stop Jutsu' : '开始结印'}
          </button>
        </div>
      </header>

      <main style={mainStyle}>
        {/* Left Signs */}
        <div style={sideColStyle}>
          {HAND_SIGNS.slice(1, 7).map(sign => (
            <div key={sign.id} style={signItemStyle(false)}>
              <img src={`asset/${sign.kanji}.png`} alt={sign.name} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
              <span>{sign.name} ({sign.kanji})</span>
            </div>
          ))}
        </div>

        {/* Center */}
        <div style={centerColStyle}>
          {/* Video Area */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <VideoFeed videoRef={videoRef} detections={detections} />
          </div>

          {/* History and Jutsu */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: '10px', borderRadius: '4px' }}>
            <div>
              <strong>History: </strong>
              {history.map(id => HAND_SIGNS.find(s => s.id === id)?.kanji).join(' -> ')}
            </div>
            {activeJutsu && (
              <div style={{ color: '#ff5722', fontWeight: 'bold', fontSize: '1.2em' }}>
                {activeJutsu.name} ({activeJutsu.nameEn})
              </div>
            )}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#333', padding: '5px 10px', fontSize: '0.8em' }}>Virtual Code Editor</div>
            <textarea
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: '#1e1e1e',
                color: '#dcdcdc',
                fontFamily: 'monospace',
                padding: '10px',
                border: 'none',
                resize: 'none'
              }}
              spellCheck={false}
            />
          </div>

          <div style={{ backgroundColor: '#222', padding: '10px', fontSize: '0.9em' }}>
            <strong>Tutorial:</strong> Rat(子)=l, Ox(丑)=h, Tiger(寅)=e, Dragon(辰)=r, Snake(巳)=d, Horse(午)=w, Ram(未)=o, Monkey(申)=x
          </div>
        </div>

        {/* Right Signs */}
        <div style={sideColStyle}>
          {HAND_SIGNS.slice(7, 13).map(sign => (
            <div key={sign.id} style={signItemStyle(false)}>
              <img src={`asset/${sign.kanji}.png`} alt={sign.name} style={{ width: '100%', height: 'auto', objectFit: 'contain' }} onError={(e) => e.currentTarget.style.display = 'none'} />
              <span>{sign.name} ({sign.kanji})</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
