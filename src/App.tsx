import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Send,
  Mail,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Terminal,
  Activity,
  Check,
  Home,
  FileText,
  MousePointer,
  Cpu,
  Layers,
  Code
} from 'lucide-react';

class SynthEngine {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfos: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private mainGain: GainNode | null = null;

  private getOrInitCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (err) {
        console.warn("Failed to create AudioContext:", err);
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  start() {
    const ctx = this.getOrInitCtx();
    if (!ctx) return;
    
    if (this.oscillators.length > 0) return;

    try {
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(280, ctx.currentTime);
      this.filter.Q.setValueAtTime(1.5, ctx.currentTime);

      this.mainGain = ctx.createGain();
      this.mainGain.gain.setValueAtTime(0, ctx.currentTime);
      this.mainGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);

      this.filter.connect(this.mainGain);
      this.mainGain.connect(ctx.destination);

      const frequencies = [110.0, 130.81, 164.81, 196.0];

      frequencies.forEach((freq, idx) => {
        if (!ctx || !this.filter) return;
        
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        osc.detune.setValueAtTime((idx - 1.5) * 8, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.18, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        osc.connect(oscGain);
        oscGain.connect(this.filter);

        osc.start();
        lfo.start();

        this.oscillators.push(osc);
        this.lfos.push(lfo);
      });
    } catch (err) {
      console.warn("Failed to initialize Synth Engine:", err);
    }
  }

  stop() {
    if (!this.ctx) return;
    
    if (this.mainGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now);
        this.mainGain.gain.linearRampToValueAtTime(0, now + 0.3);
      } catch {}
    }
    
    const activeOscillators = [...this.oscillators];
    const activeLfos = [...this.lfos];
    
    this.oscillators = [];
    this.lfos = [];
    this.filter = null;
    this.mainGain = null;

    setTimeout(() => {
      activeOscillators.forEach(osc => { try { osc.stop(); } catch {} });
      activeLfos.forEach(lfo => { try { lfo.stop(); } catch {} });
    }, 350);
  }

  playClick() {
    const ctx = this.getOrInitCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (err) {
      console.warn("Click sound failed:", err);
    }
  }

  playSuccess() {
    const ctx = this.getOrInitCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, vol: number) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(vol, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.22, 0.02);
      playTone(659.25, now + 0.06, 0.22, 0.02);
      playTone(783.99, now + 0.12, 0.3, 0.03);
    } catch (err) {
      console.warn("Success sound failed:", err);
    }
  }

  playToastPop() {
    const ctx = this.getOrInitCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
      console.warn("Toast pop sound failed:", err);
    }
  }
}

const synth = new SynthEngine();

interface LocalToast {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'projects'>('home');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('warriorog-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [toasts, setToasts] = useState<LocalToast[]>([]);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const [portfolioStep, setPortfolioStep] = useState<number>(0);
  const [matrixText, setMatrixText] = useState<string>("SYSTEM_ACTIVE: YES");

  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [buildProgress, setBuildProgress] = useState<number>(0);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'complete'>('idle');

  const [avatarSrc, setAvatarSrc] = useState<string>('https://i.ibb.co/zVkmZxyk/file-0000000092708243a1900ced151de552.png');
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarErrorCount, setAvatarErrorCount] = useState(0);

  const handleAvatarError = () => {
    if (avatarErrorCount === 0) {
      setAvatarSrc('https://upload.wikimedia.org/wikipedia/commons/a/a5/Cillian_Murphy_2014.jpg');
      setAvatarErrorCount(1);
    } else if (avatarErrorCount === 1) {
      setAvatarSrc('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200');
      setAvatarErrorCount(2);
    } else {
      setAvatarLoaded(false);
    }
  };

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChatHistory([
      {
        id: 'welcome',
        role: 'model',
        text: "Hey! I'm Naman's AI Twin. I'm trained on his specific fullstack tech stack and projects. Ask me anything about Python backend systems, PyTorch models, or agent automation! 🚀"
      }
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem('warriorog-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#000000';
      document.body.style.backgroundColor = '#000000';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f7f7f6';
      document.body.style.backgroundColor = '#f7f7f6';
    }
  }, [theme]);

  useEffect(() => {
    const resumeAudioOnInteraction = () => {
      if (!isMuted) {
        synth.start();
      }
    };
    window.addEventListener('click', resumeAudioOnInteraction, { once: true });
    window.addEventListener('keydown', resumeAudioOnInteraction, { once: true });

    if (!isMuted) {
      synth.start();
    } else {
      synth.stop();
    }
    return () => {
      window.removeEventListener('click', resumeAudioOnInteraction);
      window.removeEventListener('keydown', resumeAudioOnInteraction);
      synth.stop();
    };
  }, [isMuted]);

  const handleTriggerClick = () => {
    if (!isMuted) {
      synth.playClick();
    }
  };

  const toggleSound = () => {
    setIsMuted(prev => !prev);
    if (isMuted) {
      setTimeout(() => synth.playClick(), 50);
    }
  };

  const toggleTheme = (e: React.MouseEvent) => {
    handleTriggerClick();
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const splash = document.createElement('div');
    splash.className = `fixed pointer-events-none rounded-full z-[9999] transition-all duration-[600ms] ease-out`;
    splash.style.left = `${x}px`;
    splash.style.top = `${y}px`;
    splash.style.width = '0px';
    splash.style.height = '0px';
    splash.style.transform = 'translate(-50%, -50%)';
    splash.style.backgroundColor = theme === 'dark' ? '#f7f7f6' : '#080808';

    document.body.appendChild(splash);

    requestAnimationFrame(() => {
      splash.style.width = '320vw';
      splash.style.height = '320vw';
    });

    setTimeout(() => {
      setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
      splash.style.opacity = '0';
    }, 400);

    setTimeout(() => {
      splash.remove();
    }, 1000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: e.pageX,
      y: e.pageY
    });
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const spawnToast = (type: 'success' | 'warning' | 'error', message: string) => {
    if (!isMuted) {
      synth.playToastPop();
    }
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('vortex517@proton.me');
    if (!isMuted) {
      synth.playSuccess();
    }
    spawnToast('success', 'Email copied to clipboard!');
  };

  const handleSendChat = async (messageText?: string) => {
    const textToSend = messageText || inputVal;
    if (!textToSend.trim() || isTyping) return;

    handleTriggerClick();
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend
    };

    setChatHistory(prev => [...prev, newUserMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      const formattedLog = chatHistory.concat(newUserMsg).map(item => ({
        role: item.role,
        content: item.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: formattedLog
        })
      });

      const data = await response.json();
      
      setIsTyping(false);
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: data.text || "I'm having a connection blip, but let's keep building! What else can I share about Naman?"
      }]);

      if (!isMuted) {
        synth.playToastPop();
      }

      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (err) {
      setIsTyping(false);
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm currently in offline fallback mode, but Naman's system is fully operational. Ask me anything about Python, PyTorch, or React!"
      }]);
    }
  };

  useEffect(() => {
    let timer: any;
    if (hoveredProject === 'vrtfolio') {
      timer = setInterval(() => {
        setPortfolioStep(prev => (prev + 1) % 5);
        const matrixPhrases = [
          "CONNECT: OK",
          "MODEL_LOADED: YES",
          "AI_TWIN: READY",
          "LATENCY: 12ms",
          "AGENT_UPTIME: 100%"
        ];
        setMatrixText(matrixPhrases[Math.floor(Math.random() * matrixPhrases.length)]);
      }, 1500);
    } else {
      setPortfolioStep(0);
      setMatrixText("SYSTEM_ACTIVE: YES");
    }
    return () => clearInterval(timer);
  }, [hoveredProject]);

  useEffect(() => {
    let timer: any;
    let progressTimer: any;
    if (hoveredProject === 'vortexstream') {
      setBuildStatus('building');
      setBuildProgress(0);
      setBuildLogs(["🚀 INITIALIZING BUILD ENVIRONMENT...", "📦 COMPILING FLUID MODULES..."]);
      
      timer = setInterval(() => {
        const nextLogs = [
          "🔍 SECURING COMPILING SCHEMA...",
          "🐳 GENERATING DOCKER CONTAINER IMAGE...",
          "⚡ CACHE RESOLVED: 100% HIT",
          "⚙️ INJECTING PORT ROUTING...",
          "🌿 COMPRESSION COMPLETED IN 0.3s",
          "📡 PROVISIONING WORKSPACE ROUTE...",
          "✔ DEPLOYED SUCCESSFULLY TO CLOUD RUN!"
        ];
        
        setBuildLogs(prev => {
          if (prev.length >= 8) {
            clearInterval(timer);
            setBuildStatus('complete');
            if (!isMuted) {
              synth.playSuccess();
            }
            return [...prev, "✔ CONTAINER DEPLOYED TO https://vortexstram.qzz.io/"];
          }
          return [...prev, nextLogs[prev.length - 2]];
        });
      }, 1000);

      progressTimer = setInterval(() => {
        setBuildProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + 12;
        });
      }, 600);
    } else {
      setBuildStatus('idle');
      setBuildProgress(0);
      setBuildLogs([]);
    }
    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [hoveredProject]);

  const upToDownFadeBlur = {
    initial: { opacity: 0, y: -25, filter: 'blur(12px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: 25, filter: 'blur(12px)' },
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div
      id="portfolio-root"
      className={`min-h-screen relative flex flex-col items-center justify-center transition-colors duration-500 overflow-x-hidden font-sans selection:bg-amber-400/30 selection:text-neutral-900 ${
        theme === 'dark' ? 'bg-black text-[#f5f5f5]' : 'bg-[#f7f7f6] text-[#1c1c1c]'
      }`}
      onMouseMove={handleMouseMove}
    >
      <div
        id="dotted-grid-bg"
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          backgroundImage: theme === 'dark'
            ? 'linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)'
            : 'linear-gradient(to right, rgba(0, 0, 0, 0.012) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.012) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at 50% 50%, black 80%, transparent)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 80%, transparent)'
        }}
      />

      <div
        id="glow-aura"
        className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500 opacity-70"
        style={{
          background: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, ${
            theme === 'dark' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(59, 130, 246, 0.04)'
          }, transparent 100%)`
        }}
      />

      <div
        className={`w-full px-6 py-14 relative z-10 flex flex-col justify-center transition-all duration-500 ${
          currentPage === 'home' ? 'max-w-[490px]' : 'max-w-[720px]'
        }`}
      >
        <AnimatePresence mode="wait">
          
          {currentPage === 'home' && (
            <motion.div
              key="home"
              {...upToDownFadeBlur}
              className="w-full flex flex-col"
            >
              <header className="flex items-start justify-between w-full mb-12">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-200/60 dark:border-neutral-800/70 bg-neutral-100 dark:bg-neutral-900 shadow-sm flex items-center justify-center">
                    <img
                      src={avatarSrc}
                      alt="Naman Kumar"
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 z-10 ${
                        avatarLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setAvatarLoaded(true)}
                      onError={handleAvatarError}
                    />

                    <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-stone-950">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500">
                        <defs>
                          <radialGradient id="shelbyGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#171717" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#451a03" />
                            <stop offset="100%" stopColor="#171717" />
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="50" fill="#0c0a09" />
                        <circle cx="50" cy="45" r="35" fill="url(#shelbyGlow)" />
                        <g transform="translate(0, 5)">
                          <path d="M 12,90 C 12,70 25,60 40,58 L 44,65 L 50,65 L 56,65 L 60,58 C 75,60 88,70 88,90 Z" fill="#1c1917" stroke="#2e2a24" strokeWidth="1" />
                          <path d="M 42,58 L 50,75 L 58,58 Z" fill="#fafaf9" />
                          <path d="M 48,68 L 52,68 L 54,90 L 46,90 Z" fill="#0c0a09" />
                          <path d="M 40,58 L 47,69 L 45,58 Z" fill="#e7e5e4" />
                          <path d="M 60,58 L 53,69 L 55,58 Z" fill="#e7e5e4" />
                          <path d="M 44,45 C 44,55 46,60 50,60 C 54,60 56,55 56,45 Z" fill="#2e2a24" />
                          <path d="M 38,32 C 38,18 48,15 58,18 C 66,20 68,32 64,44 C 60,50 50,52 44,50 C 38,48 38,40 38,32 Z" fill="#1c1917" />
                          <path d="M 39,32 C 39,24 44,19 50,19 C 54,19 55,23 53,28 C 50,33 46,36 41,36 Z" fill="#d97706" opacity="0.4" />
                          <path d="M 36,32 C 36,20 46,12 58,14 C 66,15 67,23 62,26 C 58,28 50,23 44,28 C 40,31 38,34 36,32 Z" fill="url(#hairGrad)" stroke="#d97706" strokeWidth="0.5" />
                          <path d="M 34,26 C 35,16 45,10 58,11 C 66,12 70,18 70,24 C 62,24 50,20 42,24 C 38,26 36,28 34,26 Z" fill="#292524" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold font-serif italic tracking-tight text-neutral-900 dark:text-white flex items-center gap-1">
                      Naman Kumar
                    </h1>
                    <p className="text-[11px] font-sans text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
                      Frontend Engineer & Bot Developer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/60 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                  <button
                    onClick={toggleSound}
                    className="p-1 rounded-full hover:bg-neutral-500/10 cursor-pointer transition-colors"
                    title={isMuted ? "Unmute Sound" : "Mute Sound"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-500" />
                    )}
                  </button>
                  <div className="w-[1px] h-3.5 bg-neutral-300 dark:bg-neutral-800" />
                  <button
                    onClick={toggleTheme}
                    className="p-1 rounded-full hover:bg-neutral-500/10 cursor-pointer transition-colors"
                    title="Toggle Theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-800" />
                    )}
                  </button>
                </div>
              </header>

              <main className="space-y-6 text-neutral-700 dark:text-neutral-300 leading-[1.75] text-[15px] md:text-[16px]">
                <p>
                  I'm a 17 y/o mobile design engineer working in{' '}
                  <span
                    onClick={() => { handleTriggerClick(); spawnToast('success', 'Python powers Naman Kumar\'s custom intelligence workflows!'); }}
                    className="inline-flex items-center gap-1 font-semibold text-neutral-900 dark:text-white cursor-pointer select-none border-b-2 border-amber-500/40 hover:border-amber-500 transition-all pb-0.5"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.65 14.5c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9zm.35-4.5H10V9.5h4V12z" />
                    </svg>
                    Python
                  </span>
                  ,{' '}
                  <span
                    onClick={() => { handleTriggerClick(); spawnToast('success', 'PyTorch drives machine learning and automated modeling!'); }}
                    className="inline-flex items-center gap-1 font-semibold text-neutral-900 dark:text-white cursor-pointer select-none border-b-2 border-orange-500/40 hover:border-orange-500 transition-all pb-0.5"
                  >
                    <svg className="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 13l-4-4h8l-4 4z" />
                    </svg>
                    PyTorch
                  </span>
                  , and{' '}
                  <span
                    onClick={() => { handleTriggerClick(); spawnToast('success', 'React is used to construct elegant, highly responsive frontends!'); }}
                    className="inline-flex items-center gap-1 font-semibold text-neutral-900 dark:text-white cursor-pointer select-none border-b-2 border-cyan-500/40 hover:border-cyan-500 transition-all pb-0.5"
                  >
                    <svg className="w-3.5 h-3.5 text-cyan-500 animate-[spin_8s_linear_infinite]" viewBox="-11.5 -10.23 23 20.46">
                      <circle cx="0" cy="0" r="2.05" fill="currentColor" />
                      <g stroke="currentColor" strokeWidth="1" fill="none">
                        <ellipse rx="11" ry="4.2" />
                        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                      </g>
                    </svg>
                    React
                  </span>
                  .
                </p>

                <p>
                  Currently exploring{' '}
                  <span className="relative inline-block group cursor-pointer font-semibold text-neutral-900 dark:text-white transition-colors hover:text-pink-400">
                    native motion
                    <svg className="absolute left-0 -bottom-1 w-full h-1.5 pointer-events-none" viewBox="0 0 100 8" preserveAspectRatio="none">
                      <path d="M 0,4 Q 25,1 50,4 T 100,4" fill="none" stroke="#f472b6" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </span>
                  , haptics, and the small details that make apps feel alive.
                </p>

                <p>
                  Check out some of my highlighted{' '}
                  <button
                    onClick={() => {
                      handleTriggerClick();
                      setCurrentPage('projects');
                    }}
                    className="relative inline-flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white cursor-pointer group"
                  >
                    <span className="relative z-10 hover:text-pink-400 transition-colors">
                      projects
                      <svg className="absolute left-0 -bottom-1 w-full h-1.5 pointer-events-none" viewBox="0 0 100 8" preserveAspectRatio="none">
                        <path d="M 1,5 Q 35,2 70,5 T 99,3" fill="none" stroke="#f472b6" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="inline-block relative -top-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                      <svg className="w-3.5 h-3.5 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </span>
                  </button>
                  .
                </p>
              </main>

              <div className="flex items-center gap-3.5 mt-12 pt-8 border-t border-neutral-200/40 dark:border-neutral-800/50">
                <button
                  id="cta-send"
                  onClick={() => {
                    handleTriggerClick();
                    setIsChatOpen(true);
                  }}
                  className={`px-6 py-3.5 rounded-full font-bold flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs uppercase tracking-wider ${
                    theme === 'dark'
                      ? 'bg-white hover:bg-neutral-200 text-[#080808]'
                      : 'bg-[#1c1c1c] hover:bg-[#2d2d2d] text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Message
                </button>

                <button
                  id="cta-copy"
                  onClick={copyEmail}
                  className={`px-6 py-3.5 rounded-full font-semibold flex items-center gap-2 border hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer text-xs uppercase tracking-wider ${
                    theme === 'dark'
                      ? 'bg-transparent border-neutral-800 text-neutral-300 hover:bg-neutral-900/40'
                      : 'bg-transparent border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Copy Email
                </button>
              </div>
            </motion.div>
          )}

          {currentPage === 'projects' && (
            <motion.div
              key="projects"
              {...upToDownFadeBlur}
              className="w-full flex flex-col"
            >
              <header className="flex items-center justify-between w-full mb-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleTriggerClick();
                      setCurrentPage('home');
                    }}
                    className="p-3 bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors shadow-sm"
                    title="Go Home"
                  >
                    <Home className="w-4 h-4 text-neutral-800 dark:text-white" />
                  </button>
                  <button
                    onClick={() => {
                      handleTriggerClick();
                      setCurrentPage('home');
                    }}
                    className="p-3 bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/60 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors shadow-sm"
                    title="Back"
                  >
                    <ArrowLeft className="w-4 h-4 text-neutral-800 dark:text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-800/60 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
                  <button
                    onClick={toggleSound}
                    className="p-1 rounded-full hover:bg-neutral-500/10 cursor-pointer transition-colors"
                    title={isMuted ? "Unmute Sound" : "Mute Sound"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-500" />
                    )}
                  </button>
                  <div className="w-[1px] h-3.5 bg-neutral-300 dark:bg-neutral-800" />
                  <button
                    onClick={toggleTheme}
                    className="p-1 rounded-full hover:bg-neutral-500/10 cursor-pointer transition-colors"
                    title="Toggle Theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-800" />
                    )}
                  </button>
                </div>
              </header>

              <div className="mb-10 text-left">
                <h2 className="text-4xl md:text-[46px] font-bold font-serif italic text-neutral-900 dark:text-white leading-tight">
                  Highlighted Projects
                </h2>
                <p className="text-sm font-sans opacity-60 text-neutral-500 dark:text-neutral-400 mt-2.5">
                  A few highlighted projects I've worked on.
                </p>
              </div>

              <div className="space-y-12">
                
                <div className="flex flex-col w-full">
                  <div
                    onMouseEnter={() => {
                      setHoveredProject('warriorog');
                      if (!isMuted) synth.playClick();
                    }}
                    onMouseLeave={() => setHoveredProject(null)}
                    onMouseMove={handleCardMouseMove}
                    className="relative w-full aspect-[16/10] rounded-3xl bg-neutral-50 dark:bg-[#0a0a0c] border border-neutral-250 dark:border-neutral-900 overflow-hidden shadow-md transition-all duration-500 hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:scale-[1.015] hover:shadow-2xl hover:shadow-amber-500/[0.02] group cursor-pointer"
                  >
                    <div className="absolute inset-4 rounded-2xl bg-[#ebebeb] dark:bg-[#121212] border border-neutral-200/60 dark:border-neutral-800/80 overflow-hidden shadow-inner flex flex-col justify-between p-6" />
                  </div>

                  <div className="flex items-center justify-between w-full mt-4 px-1.5">
                    <a
                      href="https://vrtfolio.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-lg font-sans text-neutral-900 dark:text-white flex items-center gap-1.5 hover:text-pink-400 transition-colors"
                    >
                      vrtfolio.vercel.app Portfolio
                      <span className="inline-block relative -top-0.5">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </span>
                    </a>
                    <span className="font-mono text-sm opacity-50 font-semibold text-neutral-500 dark:text-neutral-400">2026</span>
                  </div>
                </div>

                <div className="flex flex-col w-full">
                  <div
                    onMouseEnter={() => {
                      setHoveredProject('buildnix');
                      if (!isMuted) synth.playClick();
                    }}
                    onMouseLeave={() => setHoveredProject(null)}
                    onMouseMove={handleCardMouseMove}
                    className="relative w-full aspect-[16/10] rounded-3xl bg-neutral-50 dark:bg-[#0a0a0c] border border-neutral-250 dark:border-neutral-900 overflow-hidden shadow-md transition-all duration-500 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 hover:scale-[1.015] hover:shadow-2xl hover:shadow-cyan-500/[0.02] group cursor-pointer"
                  >
                    <div className="absolute inset-4 rounded-2xl bg-[#ebebeb] dark:bg-[#121212] border border-neutral-200/60 dark:border-neutral-800/80 overflow-hidden shadow-inner flex flex-col justify-between p-6" />
                  </div>

                  <div className="flex items-center justify-between w-full mt-4 px-1.5">
                    <a
                      href="https://vortexstream.qzz.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-lg font-sans text-neutral-900 dark:text-white flex items-center gap-1.5 hover:text-pink-400 transition-colors"
                    >
                      vortexstream.qzz.io
                      <span className="inline-block relative -top-0.5">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </span>
                    </a>
                    <span className="font-mono text-sm opacity-50 font-semibold text-neutral-500 dark:text-neutral-400">2026</span>
                  </div>
                </div>

              </div>

              <footer className="w-full text-center mt-16 pt-8 border-t border-neutral-200/40 dark:border-neutral-800/50">
                <p className="text-[10px] font-mono opacity-45 uppercase tracking-widest flex items-center justify-center gap-1 text-neutral-500 dark:text-neutral-400">
                  made by namankumar
                </p>
              </footer>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/40 backdrop-blur-[3px] pointer-events-auto">
            <div className="absolute inset-0" onClick={() => setIsChatOpen(false)} />

            <motion.div
              initial={{ x: '100%', filter: 'blur(10px)' }}
              animate={{ x: 0, filter: 'blur(0px)' }}
              exit={{ x: '100%', filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className={`w-full max-w-md h-full relative z-10 flex flex-col shadow-2xl ${
                theme === 'dark' ? 'bg-[#0d0d0f] border-l border-neutral-800/80' : 'bg-white border-l border-neutral-200'
              }`}
            >
              <div className={`p-4 border-b flex items-center justify-between ${
                theme === 'dark' ? 'border-neutral-800/80' : 'border-neutral-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-serif font-bold italic text-md text-neutral-900 dark:text-white">Naman Kumar AI Twin</span>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-500/10 cursor-pointer transition-colors text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
                {chatHistory.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? theme === 'dark'
                            ? 'bg-white text-neutral-950 font-semibold'
                            : 'bg-neutral-900 text-white'
                          : theme === 'dark'
                          ? 'bg-neutral-900/60 text-neutral-200 border border-neutral-800/80'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div
                      className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 ${
                        theme === 'dark' ? 'bg-neutral-900/50 border border-neutral-800/50' : 'bg-neutral-100 border border-neutral-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              <div className="px-4 py-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto border-t border-neutral-500/10 pt-3">
                <button
                  onClick={() => handleSendChat("Tell me about WarriorOG.in")}
                  className="px-3 py-1 rounded-full border border-neutral-500/15 text-[10px] hover:border-pink-400 hover:text-pink-400 transition-colors cursor-pointer text-left font-mono"
                >
                  Portfolio Site 🎨
                </button>
                <button
                  onClick={() => handleSendChat("What build processes does buildnix.com compile?")}
                  className="px-3 py-1 rounded-full border border-neutral-500/15 text-[10px] hover:border-pink-400 hover:text-pink-400 transition-colors cursor-pointer text-left font-mono"
                >
                  Streaming Site ⚡
                </button>
                <button
                  onClick={() => handleSendChat("What is your developer tech stack?")}
                  className="px-3 py-1 rounded-full border border-neutral-500/15 text-[10px] hover:border-pink-400 hover:text-pink-400 transition-colors cursor-pointer text-left font-mono"
                >
                  Tech Stack 🧠
                </button>
              </div>

              <div className={`p-3.5 border-t flex items-center gap-2.5 ${
                theme === 'dark' ? 'border-neutral-800/80' : 'border-neutral-200'
              }`}>
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  placeholder="Ask WarriorOG's AI Twin..."
                  className={`flex-1 px-4 py-3 rounded-xl text-xs border focus:outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-neutral-900/60 border-neutral-800 focus:border-white text-white'
                      : 'bg-neutral-50 border-neutral-200 focus:border-neutral-900 text-neutral-950'
                  }`}
                />
                <button
                  onClick={() => handleSendChat()}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white hover:bg-neutral-200 text-neutral-950'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ y: 50, opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`px-4.5 py-3 rounded-xl border shadow-lg text-[10px] font-mono flex items-center gap-2 pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-green-950/90 border-green-500/30 text-green-200'
                  : toast.type === 'warning'
                  ? 'bg-yellow-950/90 border-yellow-500/30 text-yellow-200'
                  : 'bg-red-950/90 border-red-500/30 text-red-200'
              }`}
            >
              <Check className="w-4 h-4 text-green-400" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
