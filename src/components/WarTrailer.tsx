import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Timer, Crosshair, Hexagon } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import PixelBlast from './PixelBlast'; // Подключаем твою WebGL пушку!

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// СТИЛИ (2026 AESTHETIC: КЛИН-БРУТАЛИЗМ И КИНО)
// ============================================================================
const WarStyles = () => (
  <style>{`
    .cinematic-vignette { 
      position: absolute; inset: 0; 
      background: radial-gradient(circle at 50% 50%, transparent 10%, rgba(2,6,23,0.95) 100%); 
      z-index: 100; pointer-events: none; 
    }
    .optical-flare {
      position: absolute; width: 150vw; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(239,68,68,0.8), rgba(255,255,255,1), rgba(239,68,68,0.8), transparent);
      filter: blur(2px); opacity: 0; transform: rotate(-15deg);
    }
    /* Плавный сдвиг камеры при ударе (без дикой тряски) */
    .recoil-active { animation: recoil 0.4s cubic-bezier(.17,.89,.32,1.28) forwards; }
    @keyframes recoil {
      0% { transform: scale(1); }
      20% { transform: scale(0.97) translateY(10px); }
      100% { transform: scale(1) translateY(0); }
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
          animate={{ y: "110vh", opacity: [0, 1, 0] }}
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
      <span className="text-slate-400">MATHLAB_CORE_V1</span>
    </div>
  </div>
);

// ============================================================================
// СЦЕНЫ
// ============================================================================

// ACT 1: Изящное вступление без дерганий
const Act1_Intro = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => { const t = setTimeout(onComplete, 2600); return () => clearTimeout(t); },[]);
  return (
    <motion.div key="act1" exit={{ opacity: 0, filter: 'blur(10px)' }} className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center">
      <div className="text-center">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: 'easeOut' }} className="text-2xl md:text-3xl font-medium text-slate-500 tracking-[0.3em] uppercase mb-4">
          Они думали, это просто цифры.
        </motion.h1>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight">
            Но здесь <span className="text-red-500">интеллект</span> <br/>
            становится <span className="text-cyan-400">оружием</span>.
          </h2>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ACT 2: Быстрое перечисление дисциплин
const Act2_Factions = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);
  const factions =[
    { name: "АЛГЕБРА", sub: "CLASS: ASSAULT" },
    { name: "ГЕОМЕТРИЯ", sub: "CLASS: TACTICAL" },
    { name: "МАТ. АНАЛИЗ", sub: "CLASS: HEAVY" },
    { name: "ЛОГИКА", sub: "CLASS: SNIPER" },
    { name: "ТЕОРИЯ ВЕРОЯТНОСТЕЙ", sub: "CLASS: CHAOS" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => {
        if (prev >= factions.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return prev;
        }
        return prev + 1;
      });
    }, 400); // Четкий ритм по 400мс
    return () => clearInterval(interval);
  },[]);

  const current = factions[index];

  return (
    <motion.div key="act2" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex flex-col items-center justify-center">
      <TacticalHUD />
      <SubtleMathRain />
      <div className="relative z-10 text-center w-full px-4 flex flex-col items-center justify-center">
        <motion.div key={index} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
          <div className="text-cyan-500 font-mono text-sm tracking-[0.5em] mb-4">{current.sub}</div>
          <h2 className="text-6xl md:text-[8rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl">
            {current.name}
          </h2>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ACT 3: ЧИСТЫЙ, КИБЕРСПОРТИВНЫЙ БАТТЛ
const Act3_WarArena = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);
  const [input, setInput] = useState('');
  const [recoil, setRecoil] = useState(false);

  const triggerInput = (char: string, nextPhase: number) => {
    setInput(prev => prev + char);
    setPhase(nextPhase);
    setRecoil(true);
    setTimeout(() => setRecoil(false), 50); // Микро-отдача
  };

  useEffect(() => {
    const t1 = setTimeout(() => triggerInput('2', 1), 800);
    const t2 = setTimeout(() => triggerInput('.', 2), 1200);
    const t3 = setTimeout(() => triggerInput('0', 3), 1400);
    const t4 = setTimeout(() => setPhase(4), 1800); // Ввод ENTER
    const t5 = setTimeout(() => setPhase(5), 2100); // Импакт
    const t6 = setTimeout(() => onComplete(), 3600); // Выход

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  },[]);

  return (
    <motion.div key="act3" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">
      {/* Мягкая подсветка фона */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.1),_transparent_70%)]" />

      {/* Экран телефона / планшета */}
      <motion.div 
        className={`relative w-[400px] max-w-[95vw] h-[750px] bg-[#050B14] rounded-[2.5rem] border border-slate-800 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-20 ${recoil ? 'scale-[0.98]' : 'scale-100'} transition-transform duration-75`}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Хедер матча (Таймер и счет) */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-cyan-400 font-bold text-[10px] tracking-widest uppercase">YOU</span>
            <span className="text-3xl font-black text-white">15</span>
          </div>
          <div className="flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20">
            <Timer className="w-4 h-4 text-red-500" />
            <span className="text-xl font-mono font-bold text-red-400">00:03</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-500 font-bold text-[10px] tracking-widest uppercase">BOSS</span>
            <span className="text-3xl font-black text-white">14</span>
          </div>
        </div>

        {/* Область задачи */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          {/* ЗАДАЧА С ИСПРАВЛЕННЫМ LATEX (В ДОЛЛАРАХ!) */}
          <div className="w-full bg-slate-900/80 border border-slate-800 p-8 rounded-3xl text-center shadow-2xl mb-8 relative overflow-hidden">
            {/* Блик на карточке */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="text-4xl md:text-5xl font-medium text-white drop-shadow-lg">
              <Latex>{"$$\\int_0^{\\pi} \\sin^2(x) \\, dx$$"}</Latex>
            </div>
          </div>

          {/* ПОЛЕ ВВОДА (Glassmorphism) */}
          <div className={`w-full h-20 rounded-2xl flex items-center justify-center text-5xl font-mono font-bold transition-all duration-300 ${phase >= 4 ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border border-slate-700 text-white shadow-inner'}`}>
            {input || <span className="animate-pulse opacity-30">_</span>}
          </div>
        </div>

        {/* Клавиатура - чистая, без лишнего мусора */}
        <div className="bg-[#020610] p-4 pb-8 border-t border-white/5">
           <div className="grid grid-cols-4 gap-2 mb-2">
             {['7','8','9','/','4','5','6','*','1','2','3','-'].map(k => (
               <div key={k} className={`h-14 rounded-xl flex items-center justify-center font-bold text-xl transition-colors ${input.includes(k) && phase < 4 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                 {k}
               </div>
             ))}
           </div>
           <div className="flex gap-2">
             <div className="h-14 flex-[1.5] bg-white/5 border border-white/5 rounded-xl flex items-center justify-center font-bold text-slate-500">.</div>
             <div className={`h-14 flex-[3.5] rounded-xl flex items-center justify-center font-black text-xl tracking-widest transition-all ${phase >= 4 ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white text-black hover:bg-slate-200'}`}>
               ENTER
             </div>
           </div>
        </div>

        {/* АНИМАЦИЯ ПОБЕДЫ (Точный выстрел) */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
            >
              {/* Оптический блик (Flares) */}
              <motion.div 
                initial={{ left: "-100%" }} animate={{ left: "200%" }} transition={{ duration: 0.6, ease: "easeInOut" }}
                className="optical-flare" 
              />
              
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", damping: 15 }}
                className="flex flex-col items-center"
              >
                <Hexagon className="w-24 h-24 text-emerald-400 mb-4" />
                <h2 className="text-4xl font-black text-white tracking-widest uppercase drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">
                  РЕШЕНО
                </h2>
                <div className="mt-2 text-emerald-400 font-mono text-sm tracking-widest">+25 MP</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// ACT 4: ДОРОГОЙ ФИНАЛ С PIXELBLAST
const Act4_PremiumFinale = ({ onAction }: { onAction: () => void }) => {
  return (
    <motion.div key="act4" className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[200] overflow-hidden">
      
      {/* КИНЕМАТОГРАФИЧНЫЕ ПОЛОСЫ */}
      <motion.div initial={{ height: 0 }} animate={{ height: "10vh" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute top-0 left-0 w-full bg-[#020617] z-50 border-b border-white/5" />
      <motion.div initial={{ height: 0 }} animate={{ height: "10vh" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute bottom-0 left-0 w-full bg-[#020617] z-50 border-t border-white/5" />

      {/* === WEBGL ФОН ИЗ ПРОЕКТА === */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 1.5, duration: 3 }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <PixelBlast 
          variant="diamond" 
          color="#ef4444" 
          pixelSize={4} 
          patternScale={3} 
          speed={0.6} 
          liquid={true} 
          liquidStrength={0.2}
        />
      </motion.div>
      
      {/* Затемнение по краям поверх WebGL */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_#000000_90%)] z-10 pointer-events-none" />

      <div className="relative z-40 flex flex-col items-center justify-center w-full px-4">
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 2.5, times:[0, 0.2, 0.8, 1] }}
          className="absolute text-sm md:text-base text-slate-400 font-mono uppercase tracking-[0.5em]"
        >
          Выживает умнейший.
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 2.5, duration: 1.5, ease: "easeOut" }} 
          className="flex flex-col items-center mt-12"
        >
          <h1 className="text-6xl md:text-[9rem] font-black text-white uppercase tracking-tighter leading-none drop-shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            MATHLAB
          </h1>
          
          <div className="flex items-center gap-6 mt-2 md:mt-6 mb-12">
             <div className="h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-red-500" />
             <p className="text-xl md:text-3xl font-black text-red-500 uppercase tracking-[0.4em]">
               PVP LEAGUE
             </p>
             <div className="h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-red-500" />
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.2, duration: 0.8 }}
            whileHover={{ scale: 1.05, backgroundColor: "#ffffff", color: "#000000" }}
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            className="px-10 py-4 bg-transparent border border-white text-white font-bold text-sm md:text-base uppercase tracking-widest flex items-center gap-3 transition-colors duration-300"
          >
            <Trophy className="w-5 h-5" /> ВОЙТИ НА АРЕНУ
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
      <div className="cinematic-vignette" />

      {/* Индикатор прогресса в самом низу */}
      <div className="absolute bottom-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-red-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 11.5, ease: 'linear' }}
        />
      </div>

      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-[10001] font-mono text-xs tracking-widest uppercase">
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