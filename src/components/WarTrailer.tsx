// src/components/WarTrailer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Timer, CheckCircle2 } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// СТИЛИ (без edge-glow)
// ============================================================================
const WarStyles = () => (
  <style>{`
    .epic-color-grade {
      filter: contrast(1.12) saturate(1.08) brightness(0.97);
    }
   
    .film-grain-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 9997;
      opacity: 0.15;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
    }

    .war-vignette { 
      position: absolute; 
      inset: 0; 
      background: radial-gradient(circle at 50% 45%, transparent 28%, rgba(0,0,0,0.92) 68%, rgba(80,0,0,0.75) 100%); 
      z-index: 100; 
      pointer-events: none; 
    }

    .tactical-scanlines { 
      position: absolute; 
      inset: 0; 
      background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 50%); 
      background-size: 100% 4px; 
      z-index: 99; 
      opacity: 0.35; 
      pointer-events: none; 
    }
  `}</style>
);

// Лёгкий математический дождь
const SubtleMathRain = ({ density = 8 }: { density?: number }) => {
  const equations =[
    "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
    "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
    "e^{i\\pi} + 1 = 0",
    "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
    "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
    "A = U \\Sigma V^T",
    "\\phi = \\frac{1+\\sqrt{5}}{2}"
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
      {Array.from({ length: density }).map((_, i) => {
        const eq = equations[i % equations.length];
        return (
          <motion.div
            key={i}
            initial={{ y: -120, x: Math.random() * 100 + "vw", opacity: 0 }}
            animate={{ y: "115vh", opacity:[0, 1, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: i * 0.45, ease: 'linear' }}
            className="absolute text-slate-300 font-medium text-lg md:text-2xl"
            style={{ left: `${Math.random() * 80}vw` }}
          >
            <Latex>{`$${eq}$`}</Latex>
          </motion.div>
        );
      })}
    </div>
  );
};

// Кибер-HUD
const TacticalHUD = () => (
  <div className="absolute inset-0 pointer-events-none z-[90] opacity-20 text-white font-mono text-[10px] uppercase">
    <div className="absolute top-8 left-8 border-t-2 border-l-2 border-white w-16 h-16 opacity-50" />
    <div className="absolute top-8 right-8 border-t-2 border-r-2 border-white w-16 h-16 opacity-50" />
    <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-white w-16 h-16 opacity-50" />
    <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-white w-16 h-16 opacity-50" />
    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4">
      <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE</span>
      <span>SYS_OVERRIDE: ENGAGED</span>
    </div>
  </div>
);

// Клавиатура арены
const ArenaKeypad = ({ pressedKey, combo }: { pressedKey: string | null; combo?: number }) => {
  const rows = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','−'],['±','0','.','+']];
  return (
    <div className="bg-black/30 backdrop-blur-2xl border-t border-white/10 p-3 pb-6 relative z-20">
      <div className="flex justify-between items-center px-2 py-2 mb-2 border-b border-white/5">
        <div className="text-slate-400 font-bold text-xs tracking-widest">COMBO <span className="font-mono text-white">{combo ?? 0}</span></div>
        <div className="text-cyan-400 font-bold text-xs tracking-widest">ENTER</div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {rows.flat().map(k => {
          const isPressed = pressedKey === k;
          return (
            <div key={k} className={`h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-75 ${
              isPressed
                ? 'bg-cyan-500 text-slate-900 scale-95 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                : ['÷','×','−','+'].includes(k)
                  ? 'bg-white/10 text-cyan-300 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                  : 'bg-white/5 text-white border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
            }`}>
              {k}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <div className="h-12 flex- bg-white/5 border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] rounded-xl flex items-center justify-center text-sm font-bold text-slate-400">abc</div>
        <div className={`h-12 flex-[3.5] rounded-xl flex items-center justify-center font-bold tracking-widest transition-all duration-75 ${
          pressedKey === 'ENTER'
            ? 'bg-emerald-400 text-slate-900 scale-95 shadow-[0_0_30px_rgba(52,211,153,0.6)]'
            : 'bg-cyan-500/80 text-white border border-cyan-300/50 shadow-[0_4px_20px_rgba(6,182,212,0.3)] backdrop-blur-md'
        }`}>
          EXECUTE
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// СЦЕНЫ (без изменений)
// ============================================================================
const Act1_Intro = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t3 = setTimeout(() => onComplete(), 4800);
    return () => clearTimeout(t3);
  }, [onComplete]);
  return (
    <motion.div key="act1" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center">
      <div className="text-center px-6">
        <motion.h1 initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }} animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} className="text-3xl md:text-5xl font-serif text-slate-400 tracking-[0.2em] uppercase leading-relaxed">
          In a world
        </motion.h1>
        <motion.h2 initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1.05 }} transition={{ delay: 2.5, duration: 1.2, ease: 'circOut' }} className="text-2xl md:text-4xl font-serif text-white mt-8 font-black tracking-tight leading-tight" style={{ letterSpacing: '0.04em' }}>
          WHERE <span className="text-cyan-400">INTELLIGENCE</span> IS <span className="text-red-500">POWER</span>
        </motion.h2>
      </div>
    </motion.div>
  );
};

const Act2_Factions = ({ onComplete }: { onComplete: () => void }) => {
  const[index, setIndex] = useState(0);
  const factions =[ /* твой большой массив */ 
    { name: "ЛОГИКА", color: "text-emerald-400", bg: "bg-emerald-950", sub: "SYS_01: BASE_OPS" },
    { name: "АРИФМЕТИКА", color: "text-teal-400", bg: "bg-teal-950", sub: "SYS_02: PRIMITIVES" },
    { name: "АЛГЕБРА", color: "text-blue-400", bg: "bg-blue-950", sub: "SYS_03: VARIABLES" },
    { name: "ПЛАНИМЕТРИЯ", color: "text-indigo-400", bg: "bg-indigo-950", sub: "SYS_04: 2D_SPACE" },
    { name: "СТЕРЕОМЕТРИЯ", color: "text-violet-400", bg: "bg-violet-950", sub: "SYS_05: 3D_SPACE" },
    { name: "ТРИГОНОМЕТРИЯ", color: "text-purple-400", bg: "bg-purple-950", sub: "SYS_06: WAVES" },
    { name: "КОМБИНАТОРИКА", color: "text-fuchsia-400", bg: "bg-fuchsia-950", sub: "SYS_07: CHAOS" },
    { name: "ВЕРОЯТНОСТЬ", color: "text-pink-400", bg: "bg-pink-950", sub: "SYS_08: CHANCE" },
    { name: "СТАТИСТИКА", color: "text-rose-400", bg: "bg-rose-950", sub: "SYS_09: TRENDS" },
    { name: "МАТ. АНАЛИЗ", color: "text-red-500", bg: "bg-red-950", sub: "SYS_10: LIMITS" },
    { name: "ТЕОРИЯ ЧИСЕЛ", color: "text-orange-500", bg: "bg-orange-950", sub: "SYS_11: PRIMES" },
    { name: "ЛИНЕЙНАЯ АЛГЕБРА", color: "text-amber-500", bg: "bg-amber-950", sub: "SYS_12: MATRICES" },
    { name: "ТЕОРИЯ ГРАФОВ", color: "text-yellow-400", bg: "bg-yellow-950", sub: "SYS_13: NODES" },
    { name: "ДИФФУРЫ", color: "text-lime-400", bg: "bg-lime-950", sub: "SYS_14: FLOW" },
    { name: "ТОПОЛОГИЯ", color: "text-green-400", bg: "bg-green-950", sub: "SYS_15: MANIFOLDS" },
    { name: "КРИПТОГРАФИЯ", color: "text-emerald-300", bg: "bg-emerald-900", sub: "SYS_16: CIPHERS" },
    { name: "ТЕОРИЯ ИГР", color: "text-teal-300", bg: "bg-teal-900", sub: "SYS_17: MINMAX" },
    { name: "АЛГОРИТМЫ", color: "text-cyan-300", bg: "bg-cyan-900", sub: "SYS_18: EXECUTION" },
    { name: "НЕЙРОСЕТИ", color: "text-blue-300", bg: "bg-blue-900", sub: "SYS_19: LEARNING" },
    { name: "СИСТЕМА", color: "text-slate-900", bg: "bg-white", sub: "CRITICAL OVERLOAD", isFinal: true }
  ];
  const delays =[400, 350, 300, 250, 200, 160, 130, 100, 80, 70,60, 50, 45, 40, 35, 30, 30, 30, 30];
  useEffect(() => {
    let cancelled = false;
    const tick = (i: number) => {
      if (cancelled) return;
      if (i >= factions.length - 1) {
        setIndex(factions.length - 1);
        setTimeout(() => { if (!cancelled) onComplete(); }, 150);
        return;
      }
      const delay = delays[i] || 30;
      setTimeout(() => {
        setIndex(i + 1);
        tick(i + 1);
      }, delay);
    };
    tick(0);
    return () => { cancelled = true; };
  }, [onComplete]);
  const current = factions[index];
  const animDuration = (delays[index] || 30) / 1000;
  return (
    <motion.div key="act2" className={`absolute inset-0 flex flex-col items-center justify-center ${current.bg}`}>
      {!current.isFinal && <TacticalHUD />}
      {!current.isFinal && <SubtleMathRain density={12} />}
      {!current.isFinal && (
        <div className="absolute top-16 w-full px-8 flex justify-between text-slate-500 font-mono text-[10px] md:text-xs">
          <span>{current.sub}</span>
          <span>LOAD: {Math.round(((index + 1) / factions.length) * 100)}%</span>
        </div>
      )}
      <div className="relative z-10 text-center w-full px-4">
        {current.isFinal ? (
          <h2 className="text-6xl md:text-[9rem] font-black uppercase tracking-tighter text-slate-900">
            {current.name}
          </h2>
        ) : (
          <motion.h2
            key={index}
            initial={{ scale: 1.3, filter: 'blur(8px)', opacity: 0.5 }}
            animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
            transition={{ duration: animDuration, ease: 'easeOut' }}
            className={`text-5xl md:text-[7rem] font-black uppercase tracking-tight ${current.color}`}
          >
            {current.name}
          </motion.h2>
        )}
      </div>
    </motion.div>
  );
};

const Act3_WarArena = ({ onComplete }: { onComplete: () => void }) => {
  const[battlePhase, setBattlePhase] = useState(0);
  const[combo, setCombo] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('00:04.50');
  const stoppedRef = useRef(false);

  useEffect(() => {
    const triggerHit = (newCombo: number, phase: number) => {
      setCombo(newCombo);
      setBattlePhase(phase);
    };
    const t1 = setTimeout(() => setBattlePhase(1), 500);
    const t2 = setTimeout(() => { triggerHit(1, 2); setPressedKey('2'); }, 1200);
    const t3 = setTimeout(() => setPressedKey(null), 1350);
    const t4 = setTimeout(() => { triggerHit(2, 3); setPressedKey('ENTER'); }, 1900);
    const t5 = setTimeout(() => { setPressedKey(null); setBattlePhase(4); }, 2050);
    const t6 = setTimeout(() => { setBattlePhase(5); stoppedRef.current = true; }, 2200);
    const t7 = setTimeout(() => onComplete(), 3600);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(t5); clearTimeout(t6); clearTimeout(t7);
    };
  }, [onComplete]);

  useEffect(() => {
    let rafId: number;
    const startMs = Date.now();
    const startValue = 4500;
    const updateTimer = () => {
      if (stoppedRef.current) return;
      const elapsed = Date.now() - startMs;
      const current = Math.max(0, startValue - elapsed);
      const secs = Math.floor(current / 1000);
      const ms = Math.floor((current % 1000) / 10);
      setTimeLeft(`00:0${secs}.${ms.toString().padStart(2, '0')}`);
      if (current > 0) rafId = requestAnimationFrame(updateTimer);
    };
    rafId = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(rafId);
  },[]);

  return (
    <motion.div key="act3" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 60, -40, 0], y:[0, -60, 50, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[20%] w-80 h-80 bg-cyan-600/30 rounded-full blur-[90px]" />
        <motion.div animate={{ x:[0, -50, 70, 0], y: [0, 70, -40, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-red-600/20 rounded-full blur-[100px]" />
      </div>
      <motion.div className="relative w-[380px] max-w-[92vw] h-[720px] max-h-[90vh] bg-slate-900/30 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col z-20" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="bg-white/5 border-b border-white/10 pt-10 pb-4 px-6 flex justify-between items-center relative z-20">
          <div className="flex flex-col">
            <span className="text-cyan-300 font-bold uppercase tracking-widest text-[10px] mb-1 drop-shadow-md">YOU</span>
            <span className="text-3xl font-black text-white drop-shadow-md">{battlePhase >= 5 ? 16 : 15}</span>
          </div>
          <div className={`text-xl font-mono font-black flex items-center gap-2 transition-colors duration-300 ${battlePhase >= 5 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`}>
            <Timer className="w-4 h-4 opacity-80" />
            {timeLeft}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-400 font-bold uppercase tracking-widest text-[10px] mb-1 drop-shadow-md">BOSS</span>
            <span className="text-3xl font-black text-white drop-shadow-md">{battlePhase >= 1 ? 14 : 13}</span>
          </div>
        </div>
        <div className="flex h-1 bg-black/50 w-full relative z-20">
          <motion.div className="bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" animate={{ width: battlePhase >= 5 ? "100%" : "90%" }} transition={{ duration: 0.3 }} />
          <motion.div className="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] ml-auto" animate={{ width: battlePhase >= 1 ? "100%" : "90%" }} transition={{ duration: 0.3 }} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20">
          <div className="bg-white/5 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] w-full p-8 rounded-2xl text-center mb-6 backdrop-blur-md">
            <div className="text-3xl md:text-4xl font-medium text-white drop-shadow-lg">
              <Latex>{"$$\\int_0^{\\pi} \\sin^2(x) dx$$"}</Latex>
            </div>
          </div>
          <div className={`w-full h-16 border rounded-xl flex items-center justify-center text-4xl font-mono font-bold transition-all duration-300 ${battlePhase >= 4 ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3),inset_0_1px_2px_rgba(255,255,255,0.2)]' : 'bg-black/20 border-white/10 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]'}`}>
            {battlePhase >= 3 ? <span>2.0</span> : battlePhase === 2 ? <span>2</span> : <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }}>_</motion.span>}
          </div>
        </div>
        <ArenaKeypad pressedKey={pressedKey} combo={combo} />
        <AnimatePresence>
          {battlePhase >= 5 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15, stiffness: 200 }} className="flex flex-col items-center">
                <div className="bg-emerald-500/20 p-6 rounded-full border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)] mb-6">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,1)]" />
                </div>
                <motion.div initial={{ letterSpacing: "0em" }} animate={{ letterSpacing: "0.25em" }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-3xl font-black text-emerald-400 uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                  EXECUTED
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const Act4_PremiumFinale = ({ onAction, onClose }: { onAction: () => void; onClose: () => void }) => {
  return (
    <motion.div key="act4" className="absolute inset-0 bg-[#010308] flex flex-col items-center justify-center z-[200] overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ duration: 3, ease: "easeOut" }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-blue-900/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-40 flex flex-col items-center justify-center w-full px-4">
        <motion.div initial={{ opacity: 0, filter: "blur(10px)", letterSpacing: "0.2em" }} animate={{ opacity: [0, 1, 1, 0], filter:["blur(10px)", "blur(0px)", "blur(0px)", "blur(10px)"], letterSpacing: "0.4em" }} transition={{ duration: 2.8, times:[0, 0.2, 0.8, 1], ease: "easeInOut" }} className="absolute text-sm md:text-lg text-slate-300 font-medium uppercase">
          The smartest survive
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ delay: 3, duration: 1.5, ease: "easeOut" }} className="flex flex-col items-center mt-12 w-full">
          <h1 className="text-6xl md:text-[8rem] font-black text-white uppercase tracking-tighter leading-none w-full text-center drop-shadow-2xl">
            MATHLAB
          </h1>
          <div className="flex items-center gap-4 mt-6">
             <div className="h-[2px] w-8 md:w-16 bg-cyan-600" />
             <p className="text-xl md:text-3xl font-bold text-cyan-400 uppercase tracking-[0.4em]">
               PvP
             </p>
             <div className="h-[2px] w-8 md:w-16 bg-cyan-600" />
          </div>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4, duration: 0.8 }}
            whileHover={{ scale: 1.02, backgroundColor: "#f8fafc" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { onClose(); onAction(); }}
            className="mt-16 px-10 py-4 bg-white text-black font-bold text-sm md:text-base uppercase tracking-widest flex items-center gap-3 transition-colors rounded-lg shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
          >
            <Swords className="w-5 h-5" /> Enter Arena
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================================
export function WarTrailer({ onClose, onAction }: Props) {
  const[phase, setPhase] = useState<number>(1);
  const gotoPhase = (p: number) => setPhase(p);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans select-none epic-color-grade">
      <WarStyles />
      
      <div className="film-grain-overlay" />
      <div className="war-vignette" />
      <div className="tactical-scanlines" />

      <div className="absolute top-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 13.2, ease: 'linear' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {phase === 1 && <Act1_Intro onComplete={() => gotoPhase(2)} />}
        {phase === 2 && <Act2_Factions onComplete={() => gotoPhase(3)} />}
        {phase === 3 && <Act3_WarArena onComplete={() => gotoPhase(4)} />}
        {phase === 4 && <Act4_PremiumFinale onAction={onAction} onClose={onClose} />}
      </AnimatePresence>
    </div>
  );
}