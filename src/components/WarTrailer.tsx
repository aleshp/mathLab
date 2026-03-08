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
// СТИЛИ (без виньетки)
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
    <div className="bg-black/30 backdrop-blur-2xl border-t border-white/10 p-2 pb-3 relative z-20">
      <div className="flex justify-between items-center px-2 py-1 mb-1 border-b border-white/5">
        <div className="text-slate-400 font-bold text-xs tracking-widest">COMBO <span className="font-mono text-white">{combo ?? 0}</span></div>
        <div className="text-cyan-400 font-bold text-xs tracking-widest">ENTER</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mb-1.5">
        {rows.flat().map(k => {
          const isPressed = pressedKey === k;
          return (
            <div key={k} className={`h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-75 ${
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
      <div className="flex gap-1.5">
        <div className="h-10 flex- bg-white/5 border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] rounded-xl flex items-center justify-center text-sm font-bold text-slate-400">abc</div>
        <div className={`h-10 flex-[3.5] rounded-xl flex items-center justify-center font-bold tracking-widest transition-all duration-75 ${
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
// СЦЕНЫ
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
  const factions =[ 
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

// ─── Шаги решения (каждый ЗАМЕНЯЕТ предыдущий) ───────────────────────────────
const SOLVE_STEPS = [
  { label: "понижаем степень",    eq: "$$\\int_0^{\\pi} \\frac{1 - \\cos 2x}{2}\\, dx$$" },
  { label: "разбиваем",           eq: "$$\\frac{1}{2}\\int_0^{\\pi} dx\\; -\\; \\frac{1}{2}\\int_0^{\\pi}\\!\\cos 2x\\, dx$$" },
  { label: "интегрируем",         eq: "$$\\left[\\frac{x}{2} - \\frac{\\sin 2x}{4}\\right]_0^{\\pi}$$" },
  { label: "ответ",               eq: "$$\\frac{\\pi}{2}$$", isAnswer: true },
];

// ─── Акт 3: телефон → уравнение вырывается → решение ─────────────────────────
const Act3_WarArena = ({ onComplete }: { onComplete: () => void }) => {
  // phase: 'phone' | 'free' | 'solve'
  const [phase, setPhase] = useState<'phone' | 'free' | 'solve'>('phone');
  const [solveStep, setSolveStep] = useState(-1); // -1 = оригинал, 0..3 = шаги
  const [timeLeft, setTimeLeft] = useState('00:04.50');
  const timerStopRef = useRef(false);

  // таймер
  useEffect(() => {
    let rafId: number;
    const startMs = Date.now();
    const update = () => {
      if (timerStopRef.current) return;
      const elapsed = Date.now() - startMs;
      const cur = Math.max(0, 4500 - elapsed);
      const secs = Math.floor(cur / 1000);
      const ms = Math.floor((cur % 1000) / 10);
      setTimeLeft(`00:0${secs}.${ms.toString().padStart(2, '0')}`);
      if (cur > 0) rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // оркестровка
  useEffect(() => {
    // 2.8s — телефон замирает, chrome исчезает, уравнение остаётся
    const t1 = setTimeout(() => { timerStopRef.current = true; setPhase('free'); }, 2800);
    // 4.2s — начинаем решение (уравнение уже "свободно")
    const t2 = setTimeout(() => { setPhase('solve'); setSolveStep(0); }, 4200);
    // шаги с интервалом 1.6s
    const t3 = setTimeout(() => setSolveStep(1), 5800);
    const t4 = setTimeout(() => setSolveStep(2), 7400);
    const t5 = setTimeout(() => setSolveStep(3), 9000);
    // финал
    const t6 = setTimeout(() => onComplete(), 11800);
    return () => { [t1,t2,t3,t4,t5,t6].forEach(clearTimeout); };
  }, [onComplete]);

  const chromeFaded = phase !== 'phone';
  const isSolving   = phase === 'solve';
  const isAnswer    = solveStep === 3;

  return (
    <motion.div key="act3" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">

      {/* ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x:[0,60,-40,0], y:[0,-60,50,0] }} transition={{ duration:8, repeat:Infinity, ease:"easeInOut" }}
          className="absolute top-[20%] left-[20%] w-80 h-80 bg-cyan-600/25 rounded-full blur-[90px]" />
        <motion.div animate={{ x:[0,-50,70,0], y:[0,70,-40,0] }} transition={{ duration:10, repeat:Infinity, ease:"easeInOut" }}
          className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-red-600/15 rounded-full blur-[100px]" />
        {/* свечение вокруг ответа */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[80px] pointer-events-none"
          animate={{ opacity: isAnswer ? 0.18 : 0, scale: isAnswer ? 1.1 : 0.8 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,1) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── PHONE CHROME (исчезает) ── */}
      <motion.div
        className="absolute w-[320px] max-w-[88vw] flex flex-col pointer-events-none z-10"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        animate={{ opacity: chromeFaded ? 0 : 1, scale: chromeFaded ? 0.94 : 1 }}
        transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* телефонная рамка — фон и бордер */}
        <div className="absolute inset-0 rounded-[2rem] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.9)]" />
        {/* header */}
        <div className="relative bg-white/5 border-b border-white/10 pt-10 pb-4 px-6 flex justify-between items-center rounded-t-[2rem]">
          <div className="flex flex-col">
            <span className="text-cyan-300 font-bold uppercase tracking-widest text-[10px] mb-1">YOU</span>
            <span className="text-3xl font-black text-white">15</span>
          </div>
          <div className="text-lg font-mono font-black flex items-center gap-2 text-red-400">
            <Timer className="w-4 h-4 opacity-80" />
            {timeLeft}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-400 font-bold uppercase tracking-widest text-[10px] mb-1">BOSS</span>
            <span className="text-3xl font-black text-white">14</span>
          </div>
        </div>
        {/* hp bars */}
        <div className="relative flex h-1 bg-black/50 w-full">
          <div className="bg-cyan-400 w-[90%] shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          <div className="bg-red-500 w-[90%] ml-auto shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
        </div>
        {/* пустое место под уравнение (реальное уравнение рендерится отдельно) */}
        <div className="relative h-[140px]" />
        {/* answer box */}
        <div className="relative mx-6 mb-4 h-14 border border-white/10 rounded-xl bg-black/20 flex items-center justify-center">
          <motion.span className="text-white/40 text-3xl font-mono" animate={{ opacity:[1,0] }} transition={{ repeat:Infinity, duration:0.5 }}>_</motion.span>
        </div>
        {/* keypad */}
        <div className="relative rounded-b-[2rem] overflow-hidden">
          <ArenaKeypad pressedKey={null} combo={0} />
        </div>
      </motion.div>

      {/* ── УРАВНЕНИЕ — живёт отдельно, остаётся на месте ── */}
      <motion.div
        className="relative z-30 w-full max-w-[340px] flex flex-col items-center px-4"
        initial={{ y: 0 }}
        animate={
          phase === 'phone' ? { y: 20 } :
          phase === 'free'  ? { y: 0, scale: 1.08 } :
          { y: 0, scale: 1 }
        }
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* метка шага — появляется только при решении */}
        <motion.div
          className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 h-4"
          animate={{ opacity: isSolving && solveStep >= 0 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={solveStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {solveStep >= 0 ? (isAnswer ? '✦ ответ' : SOLVE_STEPS[solveStep]?.label) : ''}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* само уравнение — плавно перетекает */}
        <motion.div
          className="w-full rounded-2xl text-center px-6 py-7 border"
          animate={{
            backgroundColor: isAnswer ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
            borderColor:     isAnswer ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
            boxShadow:       isAnswer
              ? '0 0 60px rgba(16,185,129,0.2), inset 0 1px 1px rgba(255,255,255,0.1)'
              : '0 0 0px rgba(0,0,0,0)',
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={solveStep}
              initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
              exit={{   opacity: 0, y: -22, filter: 'blur(8px)' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className={isAnswer ? 'text-emerald-300' : 'text-white'}
            >
              {solveStep < 0
                ? <div className="text-2xl"><Latex>{"$$\\int_0^{\\pi} \\sin^2(x)\\, dx$$"}</Latex></div>
                : isAnswer
                  ? <div className="text-5xl font-light"><Latex>{SOLVE_STEPS[solveStep].eq}</Latex></div>
                  : <div className="text-xl"><Latex>{SOLVE_STEPS[solveStep].eq}</Latex></div>
              }
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* SOLVED badge */}
        <AnimatePresence>
          {isAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,1)]" />
              <motion.span
                initial={{ letterSpacing: '0.05em' }}
                animate={{ letterSpacing: '0.4em' }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-sm font-black text-emerald-400 uppercase drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]"
              >
                Solved
              </motion.span>
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
      <div className="tactical-scanlines" />

      <div className="absolute top-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 26, ease: 'linear' }}
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