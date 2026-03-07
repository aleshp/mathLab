import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Target, ShieldAlert, Zap, Skull, 
  Terminal, Activity, ChevronRight, Swords
} from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// 1. ТАКТИЧЕСКИЕ СТИЛИ (CALL OF DUTY VIBE)
// ============================================================================
const WarStyles = () => (
  <style>{`
    .war-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, transparent 10%, rgba(0, 0, 0, 0.95) 100%);
      pointer-events: none;
      z-index: 100;
    }
    .tactical-scanlines {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%);
      background-size: 100% 4px;
      pointer-events: none;
      z-index: 99;
      opacity: 0.6;
    }
    .night-vision-glow {
      box-shadow: inset 0 0 100px rgba(16, 185, 129, 0.1);
    }
    .camera-shake {
      animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both infinite;
    }
    @keyframes shake {
      0% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(-2px, 2px) rotate(-1deg); }
      50% { transform: translate(2px, -1px) rotate(1deg); }
      75% { transform: translate(-1px, -2px) rotate(0deg); }
      100% { transform: translate(0, 0) rotate(0deg); }
    }
    .strobe-flash {
      animation: strobe 0.1s infinite;
    }
    @keyframes strobe {
      0%, 100% { opacity: 1; filter: invert(0); }
      50% { opacity: 0.8; filter: invert(1); }
    }
    ::-webkit-scrollbar { display: none; }
  `}</style>
);

// Декоративный тактический UI (рамки камеры)
const TacticalHUD = () => (
  <div className="absolute inset-0 pointer-events-none z-[90] opacity-30 text-white font-mono text-[10px] uppercase">
    <div className="absolute top-8 left-8 border-t-2 border-l-2 border-white w-16 h-16" />
    <div className="absolute top-8 right-8 border-t-2 border-r-2 border-white w-16 h-16" />
    <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-white w-16 h-16" />
    <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-white w-16 h-16" />
    
    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4">
      <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> REC</span>
      <span>HQ-LINK: SECURE</span>
      <span>1080P/60FPS</span>
    </div>

    <div className="absolute bottom-10 left-12 flex flex-col gap-1">
      <span>SYS.OP: COMBAT_MODE</span>
      <span>LAT: 45.129 N / LON: 71.321 E</span>
    </div>

    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
      <Crosshair className="w-48 h-48 stroke-[0.5]" />
    </div>
  </div>
);

// ============================================================================
// 2. СЦЕНЫ
// ============================================================================

// --- АКТ 1: ВСТУПЛЕНИЕ ---
const Act1_Intro = () => (
  <motion.div key="act1" exit={{ opacity: 0 }} className="absolute inset-0 bg-black flex flex-col items-center justify-center">
    <TacticalHUD />
    <motion.div 
      initial={{ scale: 1.1, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ duration: 2.5, ease: "easeOut" }}
      className="text-center px-4"
    >
      <h1 className="text-3xl md:text-5xl font-serif text-slate-300 tracking-[0.2em] uppercase leading-relaxed shadow-black drop-shadow-2xl">
        In a world where <br/>
        <span className="text-white font-black">intelligence</span> is <span className="text-red-600 font-black">power</span>
      </h1>
    </motion.div>
  </motion.div>
);

// --- АКТ 2: БЫСТРЫЕ ФРАКЦИИ (МЕЛЬКАНИЕ) ---
const Act2_Factions = () => {
  const [index, setIndex] = useState(0);
  const factions =[
    { name: "ЛОГИКА", color: "text-emerald-500", bg: "bg-emerald-950", sub: "SYS_01: BASE_OPERATIONS" },
    { name: "АЛГЕБРА", color: "text-blue-500", bg: "bg-blue-950", sub: "SYS_02: VARIABLE_WARFARE" },
    { name: "МАТ. АНАЛИЗ", color: "text-cyan-500", bg: "bg-cyan-950", sub: "SYS_03: LIMIT_BREAK" },
    { name: "ГЕОМЕТРИЯ", color: "text-pink-500", bg: "bg-pink-950", sub: "SYS_04: SPATIAL_TACTICS" },
    { name: "КОМБИНАТОРИКА", color: "text-amber-500", bg: "bg-amber-950", sub: "SYS_05: CHAOS_THEORY" },
    { name: "ТРИГОНОМЕТРИЯ", color: "text-red-500", bg: "bg-red-950", sub: "SYS_06: WAVE_ASSAULT" },
    { name: "СИСТЕМА", color: "text-white", bg: "bg-white", sub: "ALL SYSTEMS CRITICAL", strobe: true }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => Math.min(prev + 1, factions.length - 1));
    }, 180); // Оооочень быстрое мелькание (180мс на кадр)
    return () => clearInterval(interval);
  }, [factions.length]);

  const current = factions[index];

  return (
    <motion.div key="act2" className={`absolute inset-0 flex flex-col items-center justify-center ${current.strobe ? 'strobe-flash' : current.bg}`}>
      <TacticalHUD />
      <div className="absolute inset-0 bg-black opacity-80" />
      
      <div className="relative z-10 text-center w-full">
        <div className="flex justify-between px-10 md:px-32 absolute top-10 w-full text-slate-500 font-mono text-xs md:text-sm">
          <span>{current.sub}</span>
          <span>[ FILE {index + 1}/7 ]</span>
        </div>

        <motion.h2 
          key={index}
          initial={{ scale: 1.5, filter: "blur(10px)" }}
          animate={{ scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.1 }}
          className={`text-6xl md:text-[8rem] font-black uppercase tracking-tighter ${current.color} drop-shadow-[0_0_30px_currentColor]`}
        >
          {current.name}
        </motion.h2>

        <div className="mt-8 flex justify-center gap-2">
          {factions.map((_, i) => (
            <div key={i} className={`h-2 w-16 ${i <= index ? current.color.replace('text', 'bg') : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- АКТ 3: АРЕНА (БОЕВОЙ ИНТЕРФЕЙС ИЗ ПРОШЛОГО ТРЕЙЛЕРА, НО ЖЕСТЧЕ) ---
const Act3_WarArena = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);  // Враг атакует
    const t2 = setTimeout(() => setPhase(2), 1500); // Экран трясется
    const t3 = setTimeout(() => setPhase(3), 2500); // Контратака
    const t4 = setTimeout(() => setPhase(4), 3500); // Критический удар
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  },[]);

  return (
    <motion.div key="act3" exit={{ opacity: 0, scale: 2 }} className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.1)_0%,_#000_100%)]" />
      <TacticalHUD />

      <div className={`relative w-full max-w-5xl h-[80vh] flex flex-col z-20 ${phase === 2 ? 'camera-shake' : ''}`}>
        
        {/* Боевой Хедер */}
        <div className="flex justify-between items-end px-4 border-b-2 border-slate-800 pb-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center text-cyan-400 font-bold">YOU</div>
            <div>
              <div className="text-cyan-500 font-mono text-xs uppercase tracking-widest mb-1">Squad Alpha</div>
              <div className="text-5xl font-black text-white">{phase >= 4 ? 20 : 19}</div>
            </div>
          </div>

          <div className="text-center mb-2">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2 animate-pulse" />
            <div className="text-red-500 font-mono font-bold text-xl">THREAT IMMINENT</div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-red-500 font-mono text-xs uppercase tracking-widest mb-1">Hostile Target</div>
              <div className="text-5xl font-black text-white">{phase >= 1 ? 19 : 18}</div>
            </div>
            <div className="w-16 h-16 bg-red-950 border-2 border-red-500 flex items-center justify-center text-red-500"><Skull className="w-8 h-8" /></div>
          </div>
        </div>

        {/* Зона поражения (Задача) */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-black/80 border-l-4 border-r-4 border-red-600 px-12 py-8 min-w-[500px] text-center relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-3 py-1 font-bold tracking-widest">DECRYPT TARGET</div>
            <div className="text-6xl md:text-8xl font-black text-white mb-4">
              <Latex>{"$\\int e^{2x} dx$"}</Latex>
            </div>
          </motion.div>

          {/* Имитация ввода */}
          {phase >= 3 && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="mt-12 text-5xl font-mono font-black text-cyan-400 bg-cyan-950/50 border border-cyan-500 px-10 py-4 rounded-lg"
            >
              0.5e^(2x)
            </motion.div>
          )}

          {/* FATAL HIT OVERLAY */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: [1.5, 1] }} 
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <div className="text-[10rem] font-black text-red-600 italic tracking-tighter drop-shadow-[0_0_100px_rgba(220,38,38,1)] transform -rotate-12">
                  FATAL!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
};

// --- АКТ 4: ЗАТМЕНИЕ (THE SMARTEST SURVIVE) ---
const Act4_Blackout = () => (
  <motion.div key="act4" className="absolute inset-0 bg-black flex items-center justify-center z-[200]">
    <motion.h1 
      initial={{ opacity: 0, filter: "blur(10px)" }} 
      animate={{ opacity: 1, filter: "blur(0px)" }} 
      transition={{ duration: 1.5, delay: 0.5 }}
      className="text-4xl md:text-6xl font-serif italic text-white tracking-widest"
    >
      The smartest survive.
    </motion.h1>
  </motion.div>
);

// --- АКТ 5: ЛОГОТИП И CTA ---
const Act5_Outro = ({ onAction }: { onAction: () => void }) => (
  <motion.div key="act5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[200]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.15),_transparent_70%)] pointer-events-none" />
    <div className="trailer-scanlines" />

    <div className="flex flex-col items-center text-center relative z-20">
      
      {/* Логотип */}
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-red-600 p-2 shadow-[0_0_80px_rgba(220,38,38,0.6)] bg-slate-900 overflow-hidden mb-6">
          <img src="/meerkat-logo.png" className="w-full h-full object-contain filter grayscale contrast-125" alt="Logo" />
        </div>
      </motion.div>

      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-10">
        MATHLAB <span className="text-red-600">PVP</span>
      </motion.h1>

      <motion.button 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 1.2 }}
        whileHover={{ scale: 1.05, boxShadow: "0px 0px 40px rgba(220,38,38,0.8)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onAction}
        className="px-10 py-5 bg-red-600 text-white font-black text-xl md:text-3xl uppercase tracking-widest rounded-xl flex items-center gap-4 transition-all"
      >
        <Swords className="w-8 h-8" />
        ВСТУПИТЬ В БОЙ
      </motion.button>
    </div>
  </motion.div>
);

// ============================================================================
// 3. ОРКЕСТРАТОР "MATH IS WAR"
// ============================================================================
export function WarTrailer({ onClose, onAction }: Props) {
  const[phase, setPhase] = useState(1);

  // Жесткий милитари-тайминг (Общая длина: ~16 секунд)
  useEffect(() => {
    const timeline =[
      { p: 1, t: 0 },       // 0s: Интро (In a world...)
      { p: 2, t: 3000 },    // 3s: Фракции (Мелькание)
      { p: 3, t: 5500 },    // 5.5s: Арена (Бой)
      { p: 4, t: 10000 },   // 10s: Блэкаут (The smartest survive)
      { p: 5, t: 13000 },   // 13s: Логотип и Кнопка
    ];

    const timeouts = timeline.map(s => setTimeout(() => setPhase(s.p), s.t));
    return () => timeouts.forEach(clearTimeout);
  },[]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans select-none">
      <WarStyles />
      <div className="war-vignette" />
      <div className="tactical-scanlines" />

      {/* Прогресс-бар сверху (как полоса загрузки данных) */}
      <div className="absolute top-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div 
          className="h-full bg-red-600" 
          initial={{ width: "0%" }} 
          animate={{ width: "100%" }} 
          transition={{ duration: 16, ease: "linear" }} 
        />
      </div>

      {/* Рендер Сцен */}
      <AnimatePresence mode="wait">
        {phase === 1 && <Act1_Intro />}
        {phase === 2 && <Act2_Factions />}
        {phase === 3 && <Act3_WarArena />}
        {phase === 4 && <Act4_Blackout />}
        {phase === 5 && <Act5_Outro onAction={() => { onClose(); onAction(); }} />}
      </AnimatePresence>
    </div>
  );
}