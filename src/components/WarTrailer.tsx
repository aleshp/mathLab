import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Timer, CheckCircle2, Trophy
} from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// СТИЛИ
// ============================================================================
const WarStyles = () => (
  <style>{`
        .tactical-scanlines { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.14) 50%); background-size: 100% 4px; z-index: 99; opacity: 0.45; }
    @keyframes subtle-shake { 0% { transform: translateY(0) } 25% { transform: translateY(-4px) } 50% { transform: translateY(2px) } 75% { transform: translateY(-2px) } 100% { transform: translateY(0) } }
    .strobe-flash { animation: strobe 0.06s steps(1) infinite; }
    @keyframes strobe { 0% { opacity: 1 } 50% { opacity: 0.18 } 100% { opacity: 1 } }
    .premium-logo { border-radius: 9999px; box-shadow: 0 30px 90px rgba(0,0,0,0.75), inset 0 2px 8px rgba(255,255,255,0.02); }
  `}</style>
);

// Лёгкий математический дождь
const SubtleMathRain = ({ density = 8 }: { density?: number }) => {
  const equations = [
    "\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}",
    "\lim_{x \to 0} \frac{\sin x}{x} = 1",
    "e^{i\pi} + 1 = 0",
    "\nabla \times \mathbf{E} = -\frac{\partial \mathbf{B}}{\partial t}",
    "\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}",
    "A = U \Sigma V^T",
    "f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}",
    "x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}",
    "\phi = \frac{1+\sqrt{5}}{2}",
    "\lim_{n \to \infty} (1+1/n)^n = e"
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

// HUD
const TacticalHUD = () => (
  <div className="absolute inset-0 pointer-events-none z-[90] opacity-24 text-white font-mono text-[10px] uppercase">
    <div className="absolute top-8 left-8 border-t-2 border-l-2 border-white w-16 h-16" />
    <div className="absolute top-8 right-8 border-t-2 border-r-2 border-white w-16 h-16" />
    <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-white w-16 h-16" />
    <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-white w-16 h-16" />
    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-4">
      <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> REC</span>
      <span>HQ-LINK: SECURE</span>
      <span>4K/60FPS</span>
    </div>
  </div>
);

// Модифицированная клавиатура (для арены)
const ArenaKeypad = ({ pressedKey, combo }: { pressedKey: string | null; combo?: number }) => {
  const rows = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','−'],['±','0','.','+']];
  return (
    <div className="bg-gradient-to-t from-black/40 to-transparent border-t border-slate-800 p-3 pb-4 relative z-20">
      <div className="flex justify-between items-center px-2 py-2 mb-2 border-b border-slate-800/40">
        <div className="text-slate-400 font-bold text-sm">COMBO <span className="font-mono">{combo ?? 0}</span></div>
        <div className="text-cyan-500 font-bold text-sm">ENTER</div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-2">
        {rows.flat().map(k => {
          const isPressed = pressedKey === k;
          return (
            <div key={k} className={`h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-75 ${
              isPressed ? 'bg-amber-300 text-slate-900 scale-95 shadow-[0_0_30px_rgba(245,158,11,0.85)]' :
              ['÷','×','−','+'].includes(k) ? 'bg-slate-800 text-amber-300 border border-slate-700' : 'bg-slate-800 text-white border border-slate-700'
            }`}>
              {k}
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <div className="h-10 md:h-12 flex-[1.5] bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-sm font-bold text-slate-400">abc</div>
        <div className={`h-12 flex-[3.5] rounded-xl flex items-center justify-center font-bold transition-all duration-75 bg-gradient-to-r from-emerald-400/90 to-cyan-500 text-slate-900`}>ENTER</div>
      </div>
    </div>
  );
};

// ============================================================================
// СЦЕНЫ
// ============================================================================

// Act1: split reveal and slightly smaller second line
const Act1_Intro = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t1 = setTimeout(() => {}, 700);
    const t2 = setTimeout(() => {}, 1500);
    const t3 = setTimeout(() => onComplete(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
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
          WHERE <span style={{ color: '#00d4ff' }}>INTELLIGENCE</span> IS <span style={{ color: '#ff4d4d' }}>POWER</span>
        </motion.h2>
      </div>
    </motion.div>
  );
};

// Act2: expanded faction list, faster acceleration, calls onComplete when finished
const Act2_Factions = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);

  const factions = [
    { name: "ЛОГИКА", color: "text-emerald-400", bg: "bg-emerald-950", sub: "SYS_01: BASE_OPERATIONS" },
    { name: "АЛГЕБРА", color: "text-blue-400", bg: "bg-blue-950", sub: "SYS_02: VARIABLE_WARFARE" },
    { name: "МАТ. АНАЛИЗ", color: "text-cyan-400", bg: "bg-cyan-950", sub: "SYS_03: LIMIT_BREAK" },
    { name: "ГЕОМЕТРИЯ", color: "text-pink-400", bg: "bg-pink-950", sub: "SYS_04: SPATIAL_TACTICS" },
    { name: "КОМБИНАТОРИКА", color: "text-amber-400", bg: "bg-amber-950", sub: "SYS_05: CHAOS_THEORY" },
    { name: "ТРИГОНОМЕТРИЯ", color: "text-red-400", bg: "bg-red-950", sub: "SYS_06: WAVE_ASSAULT" },
    { name: "СТАТИСТИКА", color: "text-violet-400", bg: "bg-violet-950", sub: "SYS_07: PROB_STRIKE" },
    { name: "КОМПЬЮТЕРКА", color: "text-sky-400", bg: "bg-sky-950", sub: "SYS_08: ALGO_ASSAULT" },
    { name: "КРИПТОГРАФИЯ", color: "text-lime-400", bg: "bg-lime-950", sub: "SYS_09: CIPHER_WAR" },
    { name: "ДИФФУРЫ", color: "text-amber-300", bg: "bg-amber-900", sub: "SYS_10: FLOW_CONTROL" },
    { name: "ТОПОГРАФИЯ", color: "text-rose-300", bg: "bg-rose-900", sub: "SYS_11: MAP_DOMINION" },
    { name: "ТЕОРИЯ ЧИСЕЛ", color: "text-yellow-300", bg: "bg-yellow-950", sub: "SYS_12: PRIME_STRIKE" },
    { name: "ОПТИМИЗАЦИЯ", color: "text-emerald-300", bg: "bg-emerald-900", sub: "SYS_13: MINMAX" },
    { name: "ГРАФЫ", color: "text-cyan-200", bg: "bg-cyan-900", sub: "SYS_14: NODE_CONTROL" },
    { name: "ИНФОРМАТИКА", color: "text-indigo-300", bg: "bg-indigo-900", sub: "SYS_15: CODE_STRIKE" },
    { name: "МАШИННОЕ ОБУЧЕНИЕ", color: "text-fuchsia-300", bg: "bg-fuchsia-900", sub: "SYS_16: MODEL_ASSAULT" },
    { name: "ИНФОРМАЦИОННАЯ ТЕОРИЯ", color: "text-lime-300", bg: "bg-lime-900", sub: "SYS_17: ENTROPY_WAVE" },
    { name: "ТОПОЛОГИЯ", color: "text-rose-200", bg: "bg-rose-800", sub: "SYS_18: HOLE_DOMINION" },
    { name: "СИСТЕМА", color: "text-white", bg: "bg-white", sub: "ALL SYSTEMS CRITICAL", strobe: true }
  ];

  const startDelay = 120; // меньше — быстрее

  useEffect(() => {
    let cancelled = false;

    const tick = (i: number) => {
      if (cancelled) return;
      if (i >= factions.length - 1) {
        setIndex(factions.length - 1);
        setTimeout(() => {
          if (!cancelled) onComplete();
        }, 260);
        return;
      }

      const delay = Math.max(28, Math.round(startDelay - i * 7));

      setTimeout(() => {
        setIndex(prev => Math.min(prev + 1, factions.length - 1));
        tick(i + 1);
      }, delay);
    };

    tick(0);
    return () => { cancelled = true; };
  }, [onComplete]);

  const current = factions[index];
  const delayForAnim = Math.max(0.04, Math.min(0.22, (Math.max(28, startDelay - index * 7) / 1000) * 0.9));

  return (
    <motion.div key="act2" className={`absolute inset-0 flex flex-col items-center justify-center ${current.strobe ? 'strobe-flash' : current.bg}`}>
      <TacticalHUD />
      <SubtleMathRain density={10} />
      <div className="relative z-10 text-center w-full px-4">
        <div className="flex justify-between px-6 md:px-32 absolute top-10 w-full text-slate-400 font-mono text-xs md:text-sm">
          <span>{current.sub}</span>
          <span>[ FILE {index + 1}/{factions.length} ]</span>
        </div>

        <motion.h2
          key={index}
          initial={{ scale: 1.7, filter: 'blur(12px)', opacity: 0 }}
          animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
          transition={{ duration: delayForAnim, ease: 'linear' }}
          className={`text-5xl md:text-[7rem] font-black uppercase tracking-tight ${current.color} drop-shadow-[0_0_30px_currentColor]`}
          style={{ textTransform: 'uppercase' }}
        >
          {current.name}
        </motion.h2>
      </div>
    </motion.div>
  );
};

// Act3: исправленная и стабильная арена — без постоянного дрожания, с чистыми opacity и более премиальным расположением
const Act3_WarArena = ({ onComplete }: { onComplete: () => void }) => {
  const [battlePhase, setBattlePhase] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [matchTimer, setMatchTimer] = useState(4);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    // плавная хореография: build -> input -> skill -> finisher -> complete
    const t1 = setTimeout(() => setBattlePhase(1), 600);
    const t2 = setTimeout(() => { setBattlePhase(2); setPressedKey('3'); setCombo(1); }, 1200);
    const t3 = setTimeout(() => setPressedKey(null), 1350);
    const t4 = setTimeout(() => { setBattlePhase(3); setPressedKey('ENTER'); setCombo(2); }, 1900);
    const t5 = setTimeout(() => { setPressedKey(null); setBattlePhase(4); setCombo(3); }, 2050);
    const t6 = setTimeout(() => { setBattlePhase(5); setCombo(4); }, 2200);
    const t7 = setTimeout(() => { setTimeout(() => onComplete(), 420); }, 2800);

    const countdown = setInterval(() => setMatchTimer(p => Math.max(p - 1, 0)), 1000);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); clearTimeout(t7);
      clearInterval(countdown);
    };
  }, [onComplete]);

  // subtle impact movement when input happens
  const impactAnim = battlePhase >= 2 ? { y: [0, -6, 2, 0] } : { y: 0 };

  return (
    <motion.div key="act3" exit={{ opacity: 0 }} className="absolute inset-0 bg-gradient-to-b from-[#061014] to-[#00060b] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02),_transparent_60%)] pointer-events-none" />

      {/* arena rings - very subtle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[110vh] h-[110vh] rounded-full border border-white/6 opacity-20" />
        <div className="w-[70vh] h-[70vh] rounded-full border border-white/12 opacity-12" />
      </div>

      <motion.div animate={impactAnim} transition={{ duration: 0.45 }} className="relative w-[380px] max-w-[92vw] h-[720px] bg-slate-950 rounded-[2rem] border-[8px] border-slate-800 shadow-[0_40px_120px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-20" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
        <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-4 flex justify-between items-center shadow-lg relative z-20">
          <div className="flex flex-col">
            <span className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">YOU</span>
            <span className="text-3xl font-black text-white">{battlePhase >= 5 ? 16 : 15}</span>
          </div>
          <div className="text-2xl font-mono font-black text-white flex items-center gap-2">
            <Timer className="w-5 h-5" /> 00:0{matchTimer}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">BOSS</span>
            <span className="text-3xl font-black text-white">{battlePhase >= 1 ? 14 : 13}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-20">
          <motion.div animate={battlePhase >= 2 ? { scale: [1, 1.02, 1] } : {}} transition={{ duration: 0.35 }} className="bg-gradient-to-b from-slate-800/90 to-black/60 border-2 border-slate-700 w-full p-6 rounded-3xl text-center shadow-xl mb-6">
            <div className="text-3xl md:text-4xl font-extrabold text-white"><Latex>{"\int_0^{\pi} sin^2(x) dx = ?"}</Latex></div>
            <div className="mt-3 text-sm text-slate-400">Use skill: <span className="text-amber-300 font-bold">Approximate</span></div>
          </motion.div>

          <div className="w-full h-20 bg-gradient-to-r from-slate-900 to-slate-800 border border-cyan-500/30 rounded-xl flex items-center justify-center text-4xl md:text-5xl font-mono font-extrabold text-cyan-300">
            {battlePhase >= 2 ? <span>2.0</span> : <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.45 }}>_</motion.span>}
          </div>

          <div className="absolute top-6 left-6 text-xs text-slate-400">SKILL: LINEAR_APPROX</div>
          <div className="absolute top-6 right-6 text-xs text-slate-400">ENERGY: <span className="font-mono">78%</span></div>
        </div>

        <ArenaKeypad pressedKey={pressedKey} combo={combo} />

        <AnimatePresence>
          {battlePhase >= 5 && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-emerald-950/88 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-28 h-28 text-emerald-400 mb-6 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
              <h2 className="text-4xl md:text-5xl font-black text-emerald-400 italic">CORRECT</h2>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// Act4: премиальный финал — мощный, минималистичный, как у дорогих брендов
const Act4_PremiumFinale = ({ onAction, onClose }: { onAction: () => void; onClose: () => void }) => (
  <motion.div key="act4" className="absolute inset-0 bg-black flex items-center justify-center z-[200]">
    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm pointer-events-none" />

    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }} className="relative z-40 flex flex-col items-center justify-center gap-6 px-8">
      <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-slate-400 tracking-widest uppercase">The smartest survive.</motion.h3>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.9 }} className="flex flex-col items-center gap-6">
        <div className="w-44 h-44 md:w-56 md:h-56 bg-black premium-logo flex items-center justify-center border border-white/6">
          <img src="/meerkat-logo.png" alt="logo" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
        </div>

        <h1 className="text-6xl md:text-8xl font-serif text-white tracking-tight leading-none">MATHLAB</h1>
        <p className="text-2xl text-slate-300 uppercase tracking-wider">PVP</p>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { onClose(); onAction(); }}
          className="mt-4 px-8 py-3 border border-white/12 text-white font-medium text-lg uppercase rounded-full flex items-center gap-3"
        >
          <Trophy className="w-5 h-5" /> ENTER ARENA
        </motion.button>
      </motion.div>
    </motion.div>
  </motion.div>
);

// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================================
export function WarTrailer({ onClose, onAction }: Props) {
  const [phase, setPhase] = useState<number>(1);

  const gotoPhase = (p: number) => setPhase(p);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans select-none">
      <WarStyles />
      <div className="tactical-scanlines" />

      <div className="absolute top-0 left-0 h-1 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
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
