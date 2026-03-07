// src/components/WarTrailer.tsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Timer, Crosshair, Target } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

// Правильный асинхронный импорт твоего WebGL-плагина
const PixelBlast = lazy(() => import('./PixelBlast'));

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// СТИЛИ (КЛИН-БРУТАЛИЗМ, НИКАКИХ ГЛИТЧЕЙ)
// ============================================================================
const WarStyles = () => (
  <style>{`
    .war-vignette { 
      position: absolute; inset: 0; 
      background: radial-gradient(circle at 50% 50%, transparent 10%, rgba(2,6,23,0.98) 100%); 
      z-index: 100; pointer-events: none; 
    }
    .tactical-scanlines {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%);
      background-size: 100% 4px; z-index: 99; opacity: 0.3; pointer-events: none;
    }
  `}</style>
);

const SubtleMathRain = ({ density = 6 }: { density?: number }) => {
  const equations =[
    "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
    "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
    "A = U \\Sigma V^T",
    "\\phi = \\frac{1+\\sqrt{5}}{2}"
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      {Array.from({ length: density }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: "-10vh", x: `${10 + (i * 15)}vw`, opacity: 0 }}
          animate={{ y: "110vh", opacity:[0, 1, 0] }}
          transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: i * 0.6, ease: 'linear' }}
          className="absolute text-slate-500 font-mono text-xl mix-blend-plus-lighter"
        >
          <Latex>{`$${equations[i % equations.length]}$`}</Latex>
        </motion.div>
      ))}
    </div>
  );
};

const TacticalHUD = () => (
  <div className="absolute inset-0 pointer-events-none z-[90] opacity-30 text-white font-mono text-[10px] uppercase">
    <div className="absolute top-12 left-12 w-8 h-8 border-t border-l border-white/50" />
    <div className="absolute top-12 right-12 w-8 h-8 border-t border-r border-white/50" />
    <div className="absolute bottom-12 left-12 w-8 h-8 border-b border-l border-white/50" />
    <div className="absolute bottom-12 right-12 w-8 h-8 border-b border-r border-white/50" />
    <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-6 tracking-widest">
      <span className="flex items-center gap-2 text-red-500">
        <Crosshair className="w-3 h-3 animate-spin-slow" /> LIVE
      </span>
      <span className="text-slate-400">HQ_LINK: SECURE</span>
    </div>
  </div>
);

// ============================================================================
// СЦЕНЫ
// ============================================================================

// ACT 1: Оригинальный английский копирайтинг
const Act1_Intro = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => { const t = setTimeout(onComplete, 2600); return () => clearTimeout(t); },[]);
  return (
    <motion.div key="act1" exit={{ opacity: 0, scale: 1.05 }} className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center">
      <div className="text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, filter: 'blur(8px)', y: 10 }} 
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} 
          transition={{ duration: 1, ease: 'easeOut' }} 
          className="text-3xl md:text-5xl font-serif text-slate-400 tracking-[0.3em] uppercase mb-6"
        >
          In a world
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
        >
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight leading-tight">
            WHERE <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">INTELLIGENCE</span> <br/>
            IS <span className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">POWER</span>
          </h2>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ACT 2: Дисциплины с тактическим вайбом
const Act2_Factions = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);
  const factions =[
    { name: "ALGEBRA", sub: "SYS_01: VARIABLE_WARFARE", color: "text-blue-400" },
    { name: "GEOMETRY", sub: "SYS_02: SPATIAL_TACTICS", color: "text-pink-400" },
    { name: "CALCULUS", sub: "SYS_03: LIMIT_BREAK", color: "text-cyan-400" },
    { name: "LOGIC", sub: "SYS_04: BASE_OPERATIONS", color: "text-emerald-400" },
    { name: "PROBABILITY", sub: "SYS_05: CHAOS_THEORY", color: "text-amber-400" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => {
        if (prev >= factions.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return prev;
        }
        return prev + 1;
      });
    }, 350); 
    return () => clearInterval(interval);
  }, []);

  const current = factions[index];

  return (
    <motion.div key="act2" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center">
      <TacticalHUD />
      <SubtleMathRain />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03),_transparent_70%)]" />
      <div className="relative z-10 text-center w-full px-4">
        <motion.div key={index} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }}>
          <div className="text-slate-500 font-mono text-xs md:text-sm tracking-[0.4em] mb-4 uppercase">{current.sub}</div>
          <h2 className={`text-6xl md:text-[8rem] font-black uppercase tracking-tighter ${current.color} drop-shadow-[0_0_30px_currentColor]`}>
            {current.name}
          </h2>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ACT 3: 3D-Арена (Математика исправлена, KaTeX настроен)
const Act3_WarArena = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Ввод цифры "2", затем ENTER
    const t1 = setTimeout(() => { setInput('2'); setPhase(1); }, 700);
    const t2 = setTimeout(() => { setPhase(2); }, 1300); // ENTER
    const t3 = setTimeout(() => { setPhase(3); }, 1600); // RESOLVED FLASH
    const t4 = setTimeout(() => onComplete(), 3400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  },[]);

  return (
    <motion.div key="act3" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden" style={{ perspective: 1200 }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.1),_transparent_70%)] pointer-events-none" />

      {/* Контейнер с 3D-поворотом (эмуляция наклона устройства) */}
      <motion.div 
        initial={{ rotateX: 10, scale: 0.9, opacity: 0, y: 30 }} 
        animate={phase === 3 ? { scale: 1.05, opacity: 0 } : { rotateX: 0, scale: 1, opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-[380px] max-w-[92vw] h-[720px] bg-[#050B14] rounded-[2.5rem] border border-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col z-20 overflow-hidden"
      >
        {/* Хедер */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex flex-col">
            <span className="text-cyan-500 font-bold text-[10px] tracking-widest uppercase">YOU</span>
            <span className="text-3xl font-black text-white">15</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
            <Timer className="w-4 h-4 text-red-500" />
            <span className="text-lg font-mono font-bold text-red-400">00:03</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase">BOSS</span>
            <span className="text-3xl font-black text-white">14</span>
          </div>
        </div>

        {/* Задача */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="w-full bg-black/50 border border-slate-800 p-8 rounded-3xl text-center shadow-2xl mb-8 relative">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-3xl" />
            {/* ИСПРАВЛЕННЫЙ ИНТЕГРАЛ И КОРРЕКТНЫЙ ОДИНАРНЫЙ $ */}
            <div className="text-4xl md:text-5xl font-medium text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              <Latex>{"$\\int_{0}^{\\pi} \\sin(x) \\, dx$"}</Latex>
            </div>
          </div>

          {/* Инпут */}
          <div className={`w-full h-20 rounded-2xl flex items-center justify-center text-5xl font-mono font-bold transition-all duration-200 ${phase >= 2 ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border border-slate-700 text-white shadow-inner'}`}>
            {input || <span className="animate-pulse opacity-30">_</span>}
          </div>
        </div>

        {/* Клавиатура */}
        <div className="bg-[#020610] p-4 pb-8 border-t border-white/5">
           <div className="grid grid-cols-4 gap-2 mb-2">
             {['7','8','9','/','4','5','6','*','1','2','3','-'].map(k => (
               <div key={k} className={`h-14 rounded-xl flex items-center justify-center font-bold text-xl transition-colors ${input === k ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-300 border border-white/5 hover:bg-slate-800'}`}>
                 {k}
               </div>
             ))}
           </div>
           <div className="flex gap-2">
             <div className="h-14 flex-[1.5] bg-white/5 border border-white/5 rounded-xl flex items-center justify-center font-bold text-slate-500">.</div>
             <div className={`h-14 flex-[3.5] rounded-xl flex items-center justify-center font-black text-xl tracking-widest transition-all ${phase >= 2 ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white text-black'}`}>
               ENTER
             </div>
           </div>
        </div>
      </motion.div>

      {/* Экран победы */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
              <Target className="w-24 h-24 text-red-500 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" />
              <h2 className="text-5xl md:text-7xl font-black text-red-500 tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] text-center">
                TARGET<br/>NEUTRALIZED
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ACT 4: ФИНАЛ (Используем твой PixelBlast через Suspense!)
const Act4_PremiumFinale = ({ onAction }: { onAction: () => void }) => {
  return (
    <motion.div key="act4" className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[200] overflow-hidden">
      
      {/* Кинематографичный Letterbox */}
      <motion.div initial={{ height: 0 }} animate={{ height: "12vh" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute top-0 left-0 w-full bg-[#020617] z-50 border-b border-white/5" />
      <motion.div initial={{ height: 0 }} animate={{ height: "12vh" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute bottom-0 left-0 w-full bg-[#020617] z-50 border-t border-white/5" />

      {/* ФОН WEBGL */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1, duration: 2 }} className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-black" />}>
          <PixelBlast variant="diamond" color="#ef4444" pixelSize={4} patternScale={3} speed={0.4} liquid={true} liquidStrength={0.15} />
        </Suspense>
      </motion.div>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_10%,_#000000_90%)] z-10 pointer-events-none" />

      <div className="relative z-40 flex flex-col items-center justify-center w-full px-4">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity:[0, 1, 1, 0], letterSpacing: "0.5em" }}
          transition={{ duration: 2.5, times:[0, 0.2, 0.8, 1] }}
          className="absolute text-sm md:text-lg text-slate-300 font-mono uppercase"
        >
          The smartest survive.
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 2.5, duration: 1.5, ease: "easeOut" }} 
          className="flex flex-col items-center mt-8"
        >
          <h1 className="text-6xl md:text-[9rem] font-black text-white uppercase tracking-tighter leading-none drop-shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            MATHLAB
          </h1>
          
          <div className="flex items-center gap-6 mt-4 md:mt-6 mb-12">
             <div className="h-[2px] w-12 md:w-24 bg-gradient-to-r from-transparent to-red-500" />
             <p className="text-xl md:text-3xl font-black text-red-500 uppercase tracking-[0.4em]">
               PVP LEAGUE
             </p>
             <div className="h-[2px] w-12 md:w-24 bg-gradient-to-l from-transparent to-red-500" />
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.2, duration: 0.8 }}
            whileHover={{ scale: 1.05, backgroundColor: "#ffffff", color: "#000000" }} whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="px-10 py-4 border border-white/30 text-white font-bold text-sm md:text-base uppercase tracking-widest flex items-center gap-3 transition-colors duration-300 backdrop-blur-sm bg-black/20"
          >
            <Trophy className="w-5 h-5" /> ENTER ARENA
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN WRAPPER
// ============================================================================
export function WarTrailer({ onClose, onAction }: Props) {
  const [phase, setPhase] = useState<number>(1);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans select-none">
      <WarStyles />
      <div className="war-vignette" />
      <div className="tactical-scanlines" />

      {/* Индикатор прогресса */}
      <div className="absolute bottom-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-red-600"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 11.5, ease: 'linear' }}
        />
      </div>

      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-[10001] font-mono text-xs tracking-widest uppercase transition-colors">
        [ SKIP ]
      </button>

      <AnimatePresence mode="wait">
        {phase === 1 && <Act1_Intro onComplete={() => setPhase(2)} />}
        {phase === 2 && <Act2_Factions onComplete={() => setPhase(3)} />}
        {phase === 3 && <Act3_WarArena onComplete={() => setPhase(4)} />}
        {phase === 4 && <Act4_PremiumFinale onAction={() => { onClose(); onAction(); }} />}
      </AnimatePresence>
    </div>
  );
}