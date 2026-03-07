// src/components/WarTrailer.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// СТИЛИ (ДОБАВЛЕНА АГРЕССИЯ И ЭПИЧНОСТЬ)
// ============================================================================
const WarStyles = () => (
  <style>{`
    .war-vignette { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, transparent 18%, rgba(0,0,0,0.98) 100%); z-index: 100; pointer-events: none; }
    .tactical-scanlines { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.14) 50%); background-size: 100% 4px; z-index: 99; opacity: 0.45; }
    .strobe-flash { animation: strobe 0.06s steps(1) infinite; }
    @keyframes strobe { 0% { opacity: 1 } 50% { opacity: 0.18 } 100% { opacity: 1 } }
    
    /* Хроматическая аберрация для заголовка */
    .chromatic-text {
      text-shadow: 
        -4px 0 0 rgba(255, 0, 50, 0.8), 
        4px 0 0 rgba(0, 200, 255, 0.8);
      mix-blend-mode: screen;
    }

    /* Эффект разрубания (Slash) */
    .slash-line {
      position: absolute;
      background: white;
      box-shadow: 0 0 30px 5px rgba(255,255,255,1);
      transform: rotate(-35deg);
      z-index: 200;
      opacity: 0;
    }

    /* Тряска камеры при ударе */
    @keyframes impact-shake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      20% { transform: translate(-10px, 8px) rotate(-1deg); }
      40% { transform: translate(10px, -8px) rotate(1deg); }
      60% { transform: translate(-6px, -4px) rotate(-0.5deg); }
      80% { transform: translate(6px, 4px) rotate(0.5deg); }
    }
    .shake-active { animation: impact-shake 0.25s cubic-bezier(.36,.07,.19,.97) both; }
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-14 z-0">
      {Array.from({ length: density }).map((_, i) => {
        const eq = equations[i % equations.length];
        return (
          <motion.div
            key={i}
            initial={{ y: -120, x: Math.random() * 100 + "vw", opacity: 0 }}
            animate={{ y: "115vh", opacity: [0, 1, 0] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: i * 0.45, ease: 'linear' }}
            className="absolute text-amber-200 font-medium text-lg md:text-2xl drop-shadow-[0_0_10px_rgba(245,158,11,0.18)]"
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
  <div className="absolute inset-0 pointer-events-none z-[90] opacity-30 text-white font-mono text-[10px] uppercase">
    <div className="absolute top-8 left-8 border-t-2 border-l-2 border-red-500 w-16 h-16" />
    <div className="absolute top-8 right-8 border-t-2 border-r-2 border-red-500 w-16 h-16" />
    <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-red-500 w-16 h-16" />
    <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-red-500 w-16 h-16" />
    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4">
      <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> TARGET LOCKED</span>
      <span>SYS_OVERRIDE: ENGAGED</span>
    </div>
  </div>
);

// ============================================================================
// СЦЕНЫ
// ============================================================================

const Act1_Intro = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t3 = setTimeout(() => onComplete(), 2400);
    return () => clearTimeout(t3);
  }, [onComplete]);

  return (
    <motion.div key="act1" exit={{ opacity: 0 }} className="absolute inset-0 bg-black flex flex-col items-center justify-center">
      <div className="text-center px-6">
        <motion.h1
          initial={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="text-4xl md:text-6xl font-serif text-slate-300 tracking-[0.2em] uppercase leading-relaxed"
        >
          In a world
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1.02 }}
          transition={{ delay: 0.75, duration: 0.55, ease: 'circOut' }}
          className="text-2xl md:text-5xl font-serif text-white mt-6 font-black tracking-tight leading-tight"
          style={{ letterSpacing: '0.04em' }}
        >
          WHERE <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">INTELLIGENCE</span> IS <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">POWER</span>
        </motion.h2>
      </div>
    </motion.div>
  );
};

const Act2_Factions = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);

  const factions =[
    { name: "ЛОГИКА", color: "text-emerald-400", bg: "bg-emerald-950", sub: "SYS_01: BASE_OPERATIONS" },
    { name: "АЛГЕБРА", color: "text-blue-400", bg: "bg-blue-950", sub: "SYS_02: VARIABLE_WARFARE" },
    { name: "МАТ. АНАЛИЗ", color: "text-cyan-400", bg: "bg-cyan-950", sub: "SYS_03: LIMIT_BREAK" },
    { name: "ГЕОМЕТРИЯ", color: "text-pink-400", bg: "bg-pink-950", sub: "SYS_04: SPATIAL_TACTICS" },
    { name: "ТРИГОНОМЕТРИЯ", color: "text-red-400", bg: "bg-red-950", sub: "SYS_06: WAVE_ASSAULT" },
    { name: "СТАТИСТИКА", color: "text-violet-400", bg: "bg-violet-950", sub: "SYS_07: PROB_STRIKE" },
    { name: "КРИПТОГРАФИЯ", color: "text-lime-400", bg: "bg-lime-950", sub: "SYS_09: CIPHER_WAR" },
    { name: "ТОПОГРАФИЯ", color: "text-rose-300", bg: "bg-rose-900", sub: "SYS_11: MAP_DOMINION" },
    { name: "ТЕОРИЯ ЧИСЕЛ", color: "text-yellow-300", bg: "bg-yellow-950", sub: "SYS_12: PRIME_STRIKE" },
    { name: "МАШИННОЕ ОБУЧЕНИЕ", color: "text-fuchsia-300", bg: "bg-fuchsia-900", sub: "SYS_16: MODEL_ASSAULT" },
    { name: "СИСТЕМА", color: "text-white", bg: "bg-white", sub: "ALL SYSTEMS CRITICAL", strobe: true }
  ];

  const startDelay = 120;

  useEffect(() => {
    let cancelled = false;
    const tick = (i: number) => {
      if (cancelled) return;
      if (i >= factions.length - 1) {
        setIndex(factions.length - 1);
        setTimeout(() => { if (!cancelled) onComplete(); }, 260);
        return;
      }
      const delay = Math.max(28, Math.round(startDelay - i * 8));
      setTimeout(() => {
        setIndex(prev => Math.min(prev + 1, factions.length - 1));
        tick(i + 1);
      }, delay);
    };
    tick(0);
    return () => { cancelled = true; };
  }, [onComplete]);

  const current = factions[index];
  const delayForAnim = Math.max(0.04, Math.min(0.22, (Math.max(28, startDelay - index * 8) / 1000) * 0.9));

  return (
    <motion.div key="act2" className={`absolute inset-0 flex flex-col items-center justify-center ${current.strobe ? 'strobe-flash' : current.bg}`}>
      <TacticalHUD />
      <SubtleMathRain density={10} />
      <div className="relative z-10 text-center w-full px-4">
        <motion.h2
          key={index}
          initial={{ scale: 1.7, filter: 'blur(12px)', opacity: 0 }}
          animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
          transition={{ duration: delayForAnim, ease: 'linear' }}
          className={`text-5xl md:text-[8rem] font-black uppercase tracking-tight ${current.color} drop-shadow-[0_0_40px_currentColor]`}
        >
          {current.name}
        </motion.h2>
      </div>
    </motion.div>
  );
};

// Act3: ИСПРАВЛЕННЫЙ БАТТЛ
const Act3_WarArena = ({ onComplete }: { onComplete: () => void }) => {
  const[battlePhase, setBattlePhase] = useState(0);
  const [combo, setCombo] = useState(0);
  const[shake, setShake] = useState(false);

  const triggerHit = (newCombo: number, phase: number) => {
    setCombo(newCombo);
    setBattlePhase(phase);
    setShake(true);
    setTimeout(() => setShake(false), 250);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setBattlePhase(1), 400);
    const t2 = setTimeout(() => triggerHit(1, 2), 1000); // Hit 1 (ввод "2")
    const t3 = setTimeout(() => triggerHit(2, 3), 1600); // Hit 2 (ввод ".0")
    const t4 = setTimeout(() => triggerHit(3, 4), 1800); // Ввод ENTER
    const t5 = setTimeout(() => setBattlePhase(5), 2000); // ЭКЗЕКУЦИЯ (Слэш)
    const t6 = setTimeout(() => onComplete(), 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, [onComplete]);

  return (
    <motion.div key="act3" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">
      
      {/* Кровавая виньетка */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(153,27,27,0.3)_100%)] pointer-events-none" />

      <div className={`relative w-[400px] max-w-[95vw] h-[750px] bg-slate-950 rounded-[2rem] border-[4px] border-slate-800 shadow-[0_0_150px_rgba(220,38,38,0.2)] overflow-hidden flex flex-col z-20 ${shake ? 'shake-active' : ''}`}>
        
        {/* Гигантский фоновый счетчик комбо */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <motion.div 
            key={combo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: combo > 0 ? 0.15 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-[18rem] font-black text-red-500 italic"
          >
            {combo}
          </motion.div>
        </div>

        {/* Хедер боя */}
        <div className="bg-gradient-to-b from-black to-slate-950 border-b border-red-900/50 pt-10 pb-4 px-6 flex justify-between items-center shadow-2xl relative z-20">
          <div className="flex flex-col">
            <span className="text-cyan-500 font-black uppercase tracking-widest text-[10px] mb-1">YOU</span>
            <span className="text-4xl font-black text-white">{battlePhase >= 5 ? 16 : 15}</span>
          </div>
          <div className="text-3xl font-mono font-black text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,1)]">
            00:03
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-500 font-black uppercase tracking-widest text-[10px] mb-1">BOSS</span>
            <span className="text-4xl font-black text-white">14</span>
          </div>
        </div>

        {/* Задача */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-20">
          
          {/* Скилл */}
          {battlePhase >= 2 && battlePhase < 5 && (
             <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="absolute top-1/3 left-0 h-[2px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] z-50" />
          )}

          <motion.div 
            animate={shake ? { filter:["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] } : {}}
            className="bg-black/80 border border-red-500/30 w-full p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(220,38,38,0.2)] mb-8"
          >
            <div className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              <Latex>{"\\int_0^{\\pi} sin^2(x) dx"}</Latex>
            </div>
            {battlePhase >= 2 && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-xs font-mono text-red-400 uppercase tracking-widest font-bold">
                 CRITICAL HIT DETECTED
               </motion.div>
            )}
          </motion.div>

          {/* Инпут */}
          <div className={`w-full h-24 border-2 rounded-xl flex items-center justify-center text-6xl font-mono font-black transition-colors ${battlePhase >= 4 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-slate-900 border-slate-700 text-white'}`}>
            {battlePhase >= 3 ? <span>2.0</span> : battlePhase === 2 ? <span>2</span> : <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.3 }}>_</motion.span>}
          </div>
        </div>

        {/* Агрессивная клавиатура */}
        <div className="bg-black border-t-2 border-slate-800 p-4 relative z-20 pb-8">
           <div className="grid grid-cols-4 gap-3 mb-3">
             {['7','8','9','/','4','5','6','*','1','2','3','-'].map(k => (
               <div key={k} className={`h-14 rounded-xl flex items-center justify-center font-black text-2xl border-b-4 ${k === '2' && battlePhase === 2 ? 'bg-red-600 border-red-800 text-white' : k === '0' && battlePhase === 3 ? 'bg-red-600 border-red-800 text-white' : 'bg-slate-800 border-slate-900 text-slate-300'}`}>
                 {k}
               </div>
             ))}
           </div>
           <div className="flex gap-3">
             <div className="h-16 flex-[1.5] bg-slate-800 border-b-4 border-slate-900 rounded-xl flex items-center justify-center font-black text-slate-500">.</div>
             <div className={`h-16 flex-[3.5] rounded-xl flex items-center justify-center font-black text-2xl border-b-4 transition-colors ${battlePhase >= 4 ? 'bg-emerald-500 border-emerald-700 text-black shadow-[0_0_30px_rgba(16,185,129,0.8)]' : 'bg-cyan-600 border-cyan-800 text-white'}`}>
               EXECUTE
             </div>
           </div>
        </div>

        {/* ФАТАЛИТИ ЭФФЕКТ (SLASH) */}
        <AnimatePresence>
          {battlePhase >= 5 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            >
              {/* Жесткая черно-белая вспышка */}
              <div className="absolute inset-0 bg-white animate-[strobe_0.1s_steps(1)_3]" />
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              
              {/* Линии разреза */}
              <motion.div 
                initial={{ height: 0, opacity: 1 }} 
                animate={{ height: "150%", opacity: 0 }} 
                transition={{ duration: 0.4, ease: "easeOut" }} 
                className="slash-line w-4 left-1/2 top-[-25%]" 
              />
              <motion.div 
                initial={{ height: 0, opacity: 1 }} 
                animate={{ height: "150%", opacity: 0 }} 
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }} 
                className="slash-line w-2 left-1/3 top-[-25%]" 
                style={{ transform: 'rotate(-40deg)' }}
              />

              <motion.h2 
                initial={{ scale: 2, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="text-6xl font-black text-red-500 italic uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(239,68,68,1)] z-10"
                style={{ transform: "skewX(-10deg)" }}
              >
                OBLITERATED
              </motion.h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Act4: ПРЕМИАЛЬНЫЙ ЭПИЧНЫЙ ФИНАЛ
const Act4_PremiumFinale = ({ onAction, onClose }: { onAction: () => void; onClose: () => void }) => {
  return (
    <motion.div key="act4" className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[200] overflow-hidden">
      
      {/* Cinematic Letterbox (черные полосы) */}
      <motion.div initial={{ height: 0 }} animate={{ height: "12vh" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute top-0 left-0 w-full bg-black z-50" />
      <motion.div initial={{ height: 0 }} animate={{ height: "12vh" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute bottom-0 left-0 w-full bg-black z-50" />

      {/* Медленный кроваво-синий градиент на фоне */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.2 }} 
        animate={{ opacity: 0.4, scale: 1 }} 
        transition={{ duration: 4, ease: "easeOut" }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#4c1d95_0%,_#7f1d1d_50%,_#000000_100%)] pointer-events-none" 
      />

      <div className="relative z-40 flex flex-col items-center justify-center w-full px-4">
        
        {/* Слоган, который моргает и исчезает */}
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          animate={{ opacity: [0, 1, 1, 0], letterSpacing: "0.5em" }}
          transition={{ duration: 2.5, times:[0, 0.2, 0.8, 1] }}
          className="absolute text-sm md:text-xl text-white font-mono uppercase tracking-widest"
        >
          The smartest survive.
        </motion.div>

        {/* Главный блок выезжает после слогана */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 2.2, duration: 1.5, ease: "easeOut" }} 
          className="flex flex-col items-center mt-12 w-full"
        >
          
          {/* Ударная волна при появлении */}
          <motion.div 
            initial={{ width: 0, height: 0, opacity: 1 }} 
            animate={{ width: "200vw", height: "200vw", opacity: 0 }} 
            transition={{ delay: 2.2, duration: 1.5, ease: "easeOut" }} 
            className="absolute rounded-full border-[10px] border-cyan-500 pointer-events-none"
          />

          <h1 className="text-6xl md:text-[10rem] font-black text-white uppercase chromatic-text tracking-tighter leading-none w-full text-center">
            MATHLAB
          </h1>
          
          <div className="flex items-center gap-6 mt-4 md:mt-8">
             <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent to-red-500" />
             <p className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 uppercase tracking-[0.3em]">
               PVP
             </p>
             <div className="h-px w-16 md:w-32 bg-gradient-to-l from-transparent to-red-500" />
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.5, duration: 0.8 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(239,68,68,0.8)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { onClose(); onAction(); }}
            className="mt-16 px-12 py-5 bg-white text-black font-black text-xl md:text-2xl uppercase tracking-widest flex items-center gap-3 transition-all"
            style={{ clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }} // Киберпанк срез
          >
            <Trophy className="w-6 h-6" /> ENTER ARENA
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
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans select-none">
      <WarStyles />
      <div className="war-vignette" />
      <div className="tactical-scanlines" />

      {/* Полоска прогресса видео */}
      <div className="absolute top-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-red-600"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 11, ease: 'linear' }}
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