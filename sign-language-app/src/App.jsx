import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Globe, Type, MessageSquare, Volume2, Bot, HelpCircle, Hand, Sun, Moon, Trophy } from 'lucide-react';
import { SignRecognizer } from './services/SignRecognizer';
import { ChatPanel } from './components/ChatPanel';
import { FAQ } from './components/FAQ';
import { PracticePanel } from './components/PracticePanel';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const recognizerRef = useRef(null);
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const [initializing, setInitializing] = useState(true);
  const [result, setResult] = useState("...");
  const [accumulatedText, setAccumulatedText] = useState("");
  const [mode, setMode] = useState("LETTERS");
  const [language, setLanguage] = useState("EN");
  const [activeSection, setActiveSection] = useState('translator');
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const activeSectionRef = useRef(activeSection);
  activeSectionRef.current = activeSection;

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    return () => document.body.classList.remove('theme-light');
  }, [theme]);

  useEffect(() => {
    const isRtl = language === 'AR';
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', isRtl ? 'ar' : 'en');
  }, [language]);

  useEffect(() => {
    const init = async () => {
      try {
        const recognizer = new SignRecognizer();
        await recognizer.initialize();
        recognizerRef.current = recognizer;
        setInitializing(false);
      } catch (error) {
        console.error("Failed to init MediaPipe:", error);
      }
    };
    init();
  }, []);

  const speak = useCallback((text) => {
    if (!text || text === "?" || text === "..." || text.length === 0) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'AR' ? 'ar-SA' : 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const [lastSpoken, setLastSpoken] = useState("");
  useEffect(() => {
    if (result !== lastSpoken && result !== "?" && result !== "...") {
      const timer = setTimeout(() => {
        speak(result);
        setLastSpoken(result);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, speak, lastSpoken]);

  // Keep latest result in a ref so the interval can read it every tick
  const resultRef = useRef(result);
  resultRef.current = result;

  const stableResultRef = useRef(null);
  const stableTimeRef = useRef(0);
  const lastAppendedRef = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Periodic check: append to text when the same letter/word has been held for 1.2s
  useEffect(() => {
    const STABLE_MS = 1200;
    const interval = setInterval(() => {
      const current = resultRef.current;
      const valid = current && current !== "?" && current !== "...";
      const now = Date.now();
      if (valid) {
        if (stableResultRef.current !== current) {
          stableResultRef.current = current;
          stableTimeRef.current = now;
          lastAppendedRef.current = null;
        }
        if (activeSectionRef.current === 'translator' && now - stableTimeRef.current >= STABLE_MS && lastAppendedRef.current !== current) {
          setAccumulatedText(prev => prev + (modeRef.current === 'WORDS' ? " " + current : current));
          lastAppendedRef.current = current;
        }
      } else {
        stableResultRef.current = null;
        lastAppendedRef.current = null;
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const animate = () => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4 &&
      recognizerRef.current
    ) {
      const video = webcamRef.current.video;
      const { videoWidth, videoHeight } = video;
      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        if (lastVideoTimeRef.current !== video.currentTime) {
          lastVideoTimeRef.current = video.currentTime;
          const results = recognizerRef.current.detect(video, performance.now());
          if (results?.landmarks) {
            drawLandmarks(ctx, results.landmarks);
            const effectiveMode = activeSectionRef.current === 'practice' ? 'LETTERS' : mode;
            const prediction = recognizerRef.current.predict(results.landmarks, effectiveMode, language);
            setResult(prediction || "...");
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  });

  const drawLandmarks = (ctx, landmarksArray) => {
    for (const landmarks of landmarksArray) {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#ffffff';
      for (const point of landmarks) {
        const x = point.x * ctx.canvas.width;
        const y = point.y * ctx.canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
  };

  const navItems = [
    { id: 'translator', label: 'Translator', icon: Hand },
    { id: 'practice', label: 'Practice', icon: Trophy },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  const isRtl = language === 'AR';

  return (
    <div className={`app ${theme === 'light' ? 'theme-light' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="header">
        <div className="header-inner">
          <a href="#translator" className="logo" onClick={(e) => { e.preventDefault(); setActiveSection('translator'); }}>
            <img src="/logo.png" alt="King Faisal University" className="logo-img" />
            <span className="logo-text">GestureAI</span>
          </a>
          <div className="header-language">
            <button
              type="button"
              className="pill pill--action"
              onClick={() => setLanguage(l => l === 'EN' ? 'AR' : 'EN')}
              title={isRtl ? 'English' : 'العربية'}
            >
              <Globe size={18} />
              <span>{language}</span>
            </button>
          </div>
          <nav className="nav">
            <button
              type="button"
              className="nav-link"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`nav-link ${activeSection === id ? 'nav-link--active' : ''}`}
                onClick={() => setActiveSection(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {/* Section: Translator — camera left, text field (result card) right */}
        {activeSection === 'translator' && (
          <section className="section section-translator section--active" id="translator">
            <div className="section-header">
              <div className="section-icon">
                <Hand size={28} />
              </div>
              <div>
                <h1 className="section-title">Sign Language Translator</h1>
                <p className="section-subtitle">
                  Use your camera to spell or sign words. Hold a sign steady to add it to the text below.
                </p>
              </div>
            </div>

            <div className="translator-layout">
              <div className="camera-card">
                {initializing ? (
                  <div className="camera-loading">
                    <div className="camera-loading-spinner" />
                    <p>Loading hand recognition...</p>
                  </div>
                ) : (
                  <>
                    <Webcam
                      ref={webcamRef}
                      className="video-feed"
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                    />
                    <canvas ref={canvasRef} className="canvas-overlay" />
                    <span className="camera-badge">
                      <span className="camera-badge-dot" />
                      Tracking
                    </span>
                  </>
                )}
              </div>
              <div className="result-card">
                <div className="result-controls">
                  <button
                  type="button"
                  className="pill pill--action"
                  onClick={() => { setMode(m => m === 'LETTERS' ? 'WORDS' : 'LETTERS'); setResult("..."); }}
                  title="Switch mode"
                >
                  {mode === 'LETTERS' ? <Type size={18} /> : <MessageSquare size={18} />}
                  <span>{mode === 'LETTERS' ? (language === 'EN' ? 'Letters' : 'حروف') : 'Words'}</span>
                </button>
              </div>
              <p className="result-label">Detected {mode === 'LETTERS' ? 'character' : 'word'}</p>
              <div className="result-value">{result}</div>
              <button type="button" className="btn-voice" onClick={() => speak(result)} title="Speak">
                <Volume2 size={22} />
              </button>
              <div className="result-actions">
                <button type="button" className="btn-secondary" onClick={() => result !== "?" && result !== "..." && setAccumulatedText(prev => prev + (mode === 'WORDS' ? " " + result : result))}>Append</button>
                <button type="button" className="btn-secondary" onClick={() => setAccumulatedText(prev => prev + " ")}>Space</button>
                <button type="button" className="btn-secondary" onClick={() => setAccumulatedText(prev => prev.slice(0, -1))}>⌫</button>
                <button type="button" className="btn-secondary btn-danger" onClick={() => setAccumulatedText("")}>Clear</button>
              </div>
              <textarea
                className="result-textarea"
                value={accumulatedText}
                onChange={(e) => setAccumulatedText(e.target.value)}
                placeholder="Detected letters and words appear here. Hold a sign ~1s to auto-add."
                rows={4}
              />
            </div>
          </div>
        </section>
        )}

        {/* Section: Practice — camera + panel in one section */}
        {activeSection === 'practice' && (
          <section className="section section-practice section--active" id="practice">
            <div className="section-header">
              <div className="section-icon">
                <Trophy size={28} />
              </div>
              <div>
                <h1 className="section-title">{language === 'AR' ? 'تدريب الحروف' : 'Practice mode'}</h1>
                <p className="section-subtitle">
                  {language === 'AR' ? 'امسح الحرف المعروض أمام الكاميرا.' : 'Sign the letter shown. Hold steady for about a second.'}
                </p>
              </div>
            </div>
            <div className="practice-layout">
              <div className="camera-card">
                {initializing ? (
                  <div className="camera-loading">
                    <div className="camera-loading-spinner" />
                    <p>Loading hand recognition...</p>
                  </div>
                ) : (
                  <>
                    <Webcam
                      ref={webcamRef}
                      className="video-feed"
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                    />
                    <canvas ref={canvasRef} className="canvas-overlay" />
                    <span className="camera-badge">
                      <span className="camera-badge-dot" />
                      Tracking
                    </span>
                  </>
                )}
              </div>
              <div className="practice-panel-wrap">
                <PracticePanel result={result} language={language} onSpeak={speak} />
              </div>
            </div>
          </section>
        )}

        {/* Section: AI Assistant */}
        {activeSection === 'ai-assistant' && (
          <section className="section section-chat section--active" id="ai-assistant">
            <ChatPanel />
          </section>
        )}

        {/* Section: FAQ */}
        {activeSection === 'faq' && (
          <section className="section section-faq section--active" id="faq">
            <FAQ />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
