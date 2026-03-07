import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, Swords, Timer, CheckCircle2
} from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = { onClose: () => void; onAction: () => void };

// ============================================================================
// СТИЛИ + НЕПРИМЕТНЫЙ ДОЖДЬ (ТОЛЬКО ДЛЯ ACT 2)
// ============================================================================
const WarStyles = () => (
  <style>{`
    .war-vignette { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, transparent 15%, rgba(0,0,0,0.98) 100%); z-index: 100; pointer-events: none; }
    .tactical-scanlines { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(255,0,0,0.15) 50%); background-size: 100% 4px; z-index: 99; opacity: 0.7; }
    .camera-shake { animation: shake 0.35s cubic-bezier(.36,.07,.19,.97) both infinite; }
    @keyframes shake { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-3px,3px)} 50%{transform:translate(3px,-3px)} 75%{transform:translate(-2px,2px)} }
  `}</style>
);

// НЕПРИМЕТНЫЙ ДОЖДЬ ИЗ ФОРМУЛ (только Act 2)
const SubtleMathRain = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
    {[
      "\\int e^{2x} dx", "e^{i\\pi}+1=0", "\\nabla \\times E = -\\partial B/\\partial t",
      "\\sum 1/n^2 = \\pi^2/6", "A = U \\Sigma V^T", "x = -b \\pm \\sqrt{b^2-4ac}"
    ].map((eq, i) => (
      <motion.div
        key={i}
        initial={{ y: -150, x: Math.random() * 100 + "vw" }}
        animate={{ y: "120vh" }}
        transition={{ duration: 4 + Math.random() * 5, repeat: Infinity, delay: i * 0.3, ease: "linear" }}
        className="absolute text-cyan-400 font-bold text-2xl md:text-4xl"
      >
        <Latex>{`$${eq}$`}</Latex>
      </motion.div>
    ))}
  </div>
);

// Тактический HUD
const TacticalHUD = () => (
  <div className="absolute inset-0 pointer-events-none z-[90] text-white/70 font-mono text-xs uppercase tracking-widest">
    <div className="absolute top-6 left-6 border border-red-600/70 w-20 h-20" />
    <div className="absolute top-6 right-6 border border-red-600/70 w-20 h-20" />
    <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-10" />
  </div>
);

// ============================================================================
// СЦЕНЫ
// ============================================================================
const Act1_Intro = () => (
  <motion.div key="act1" exit={{ opacity: 0 }} className="absolute inset-0 bg-black flex items-center justify-center">
    <TacticalHUD />
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center px-6"
    >
      <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">
        IN A WORLD<br />WHERE <span className="text-red-600">MATH</span><br />IS <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">WAR</span>
      </h1>
    </motion.div>
  </motion.div>
);

const Act2_Factions = () => {
  const [index, setIndex] = useState(0);
  const factions = [
    { name: "ЛОГИКА", color: "text-emerald-500" },
    { name: "АЛГЕБРА", color: "text-blue-500" },
    { name: "МАТ. АНАЛИЗ", color: "text-cyan-500" },
    { name: "ГЕОМЕТРИЯ", color: "text-pink-500" },
    { name: "КОМБИНАТОРИКА", color: "text-amber-500" },
    { name: "ТРИГОНОМЕТРИЯ", color: "text-red-500" },
    { name: "СИСТЕМА", color: "text-white" }
  ];

  useEffect(() => {
    const int = setInterval(() => setIndex(i => (i + 1) % factions.length), 180);
    return () => clearInterval(int);
  }, []);

  const cur = factions[index];

  return (
    <motion.div key="act2" className={`absolute inset-0 flex items-center justify-center bg-black overflow-hidden`}>
      <TacticalHUD />
      <SubtleMathRain />
      <motion.h2
        key={index}
        initial={{ scale: 1.8, filter: "blur(15px)" }}
        animate={{ scale: 1, filter: "blur(0)" }}
        className={`text-[6.5rem] md:text-[9rem] font-black uppercase tracking-[-0.05em] ${cur.color} drop-shadow-[0_0_50px_currentColor]`}
      >
        {cur.name}
      </motion.h2>
    </motion.div>
  );
};

// === АКТ 3: АРЕНА — ТОЧНО КАК В ПЕРВОЙ КИНЕМАТИКЕ (мобильный UI) ===
const Act3_WarArena = () => {
  const [battlePhase, setBattlePhase] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setBattlePhase(1), 800);
    const t2 = setTimeout(() => { setBattlePhase(2); setPressedKey('4'); }, 2200);
    const t3 = setTimeout(() => setPressedKey(null), 2350);
    const t4 = setTimeout(() => { setBattlePhase(3); setPressedKey('ENTER'); }, 3000);
    const t5 = setTimeout(() => { setPressedKey(null); setBattlePhase(4); }, 3150);
    const t6 = setTimeout(() => setBattlePhase(5), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, []);

  return (
    <motion.div key="act3" exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">
      <TacticalHUD />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-[340px] max-w-[95vw] h-[680px] bg-slate-950 rounded-[3rem] border-[12px] border-red-900 shadow-[0_0_100px_rgba(185,28,28,0.6)] overflow-hidden flex flex-col"
      >
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-50" />

        {/* Хедер */}
        <div className="bg-red-950 border-b border-red-800 pt-12 pb-4 px-4 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-red-400 font-bold uppercase text-[10px]">YOU</span>
            <span className="text-3xl font-black text-white">19</span>
          </div>
          <div className="text-2xl font-mono font-black text-red-400 flex items-center gap-1">
            <Timer className="w-5 h-5" /> 00:0{battlePhase >= 5 ? '0' : (battlePhase >= 2 ? '1' : '3')}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-red-400 font-bold uppercase text-[10px]">ENEMY</span>
            <span className="text-3xl font-black text-white">18</span>
          </div>
        </div>

        {/* Задача */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="bg-slate-900 border-2 border-red-600 w-full p-8 rounded-3xl text-center mb-8">
            <div className="text-5xl font-black text-white"><Latex>{"$\\int e^{2x} dx$"}</Latex></div>
          </div>

          {/* Поле ввода */}
          <div className="w-full h-16 bg-slate-900 border border-red-500 rounded-xl flex items-center justify-center text-5xl font-mono text-red-400">
            {battlePhase >= 2 && <span>0.5e^(2x)</span>}
          </div>
        </div>

        {/* Клавиатура */}
        <div className="bg-slate-900 border-t border-slate-800 p-4">
          <div className="grid grid-cols-4 gap-3 mb-3">
            {['7','8','9','÷','4','5','6','×','1','2','3','−','±','0','.','+'].map(k => (
              <div key={k} className={`h-12 rounded-2xl flex items-center justify-center font-bold text-2xl ${pressedKey === k ? 'bg-red-500 text-black scale-95' : 'bg-slate-800 text-white'}`}>
                {k}
              </div>
            ))}
          </div>
          <div className={`h-12 rounded-2xl flex items-center justify-center font-black text-2xl ${pressedKey === 'ENTER' ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'}`}>
            ENTER
          </div>
        </div>

        {/* ПОБЕДА */}
        <AnimatePresence>
          {battlePhase >= 5 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-4" />
              <div className="text-6xl font-black text-emerald-400">MISSION COMPLETE</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const Act4_Blackout = () => (
  <motion.div key="act4" className="absolute inset-0 bg-black flex items-center justify-center">
    <motion.h1
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-6xl md:text-8xl font-black text-white tracking-widest"
    >
      THE SMARTEST<br />SURVIVE.
    </motion.h1>
  </motion.div>
);

const Act5_Outro = ({ onAction, onClose }: { onAction: () => void; onClose: () => void }) => (
  <motion.div key="act5" className="absolute inset-0 bg-black flex flex-col items-center justify-center">
    <div className="absolute inset-0 bg-[radial-gradient(circle,#dc262680_20%,transparent)]" />
    <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="mb-10">
      <div className="w-40 h-40 rounded-full border-8 border-red-600 shadow-[0_0_100px_#dc2626] overflow-hidden">
        <img src="/meerkat-logo.png" className="w-full h-full object-contain" alt="Logo" />
      </div>
    </motion.div>
    <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-12">MATHLAB <span className="text-red-600">PVP</span></h1>
    
    <motion.button
      whileHover={{ scale: 1.08, boxShadow: "0 0 80px #dc2626" }}
      whileTap={{ scale: 0.95 }}
      onClick={() => { onClose(); onAction(); }}
      className="px-16 py-7 bg-red-600 text-white font-black text-3xl uppercase tracking-widest rounded-2xl flex items-center gap-6"
    >
      <Swords className="w-10 h-10" /> ВСТУПИТЬ В БОЙ
    </motion.button>
  </motion.div>
);

// ============================================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================================================
export function WarTrailer({ onClose, onAction }: Props) {
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    const timeline = [
      { p: 1, t: 0 },
      { p: 2, t: 2800 },
      { p: 3, t: 6200 },
      { p: 4, t: 10500 },
      { p: 5, t: 13800 }
    ];
    const timeouts = timeline.map(s => setTimeout(() => setPhase(s.p), s.t));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none">
      <WarStyles />
      <div className="war-vignette" />
      <div className="tactical-scanlines" />

      <div className="absolute top-0 h-1 bg-red-950 w-full z-[10000]">
        <motion.div className="h-full bg-red-600" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 16, ease: "linear" }} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 1 && <Act1_Intro />}
        {phase === 2 && <Act2_Factions />}
        {phase === 3 && <Act3_WarArena />}
        {phase === 4 && <Act4_Blackout />}
        {phase === 5 && <Act5_Outro onAction={onAction} onClose={onClose} />}
      </AnimatePresence>
    </div>
  );
}