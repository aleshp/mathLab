import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Trophy, Swords, ArrowUp, Brain, Play, ChevronRight,
  Activity, Binary, Timer, CheckCircle2
} from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = {
  onClose: () => void;
  onAction: () => void;
};

// ============================================================================
// 1. ГЛОБАЛЬНЫЕ СТИЛИ И ЭФФЕКТЫ
// ============================================================================
const GlobalTrailerStyles = () => (
  <style>{`
    .trailer-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, transparent 10%, rgba(2, 6, 23, 1) 100%);
      pointer-events: none;
      z-index: 100;
    }
    .trailer-scanlines {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.15));
      background-size: 100% 4px;
      pointer-events: none;
      z-index: 99;
      opacity: 0.4;
    }
    .glitch-text-heavy {
      animation: glitch-anim 0.2s cubic-bezier(.25, .46, .45, .94) both infinite;
    }
    @keyframes glitch-anim {
      0% { transform: translate(0) }
      20% { transform: translate(-4px, 4px) color: red; }
      40% { transform: translate(-4px, -4px) color: cyan; }
      60% { transform: translate(4px, 4px) }
      80% { transform: translate(4px, -4px) }
      100% { transform: translate(0) }
    }
    .glass-panel {
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    /* Идеальный разрез для VS экрана с зазором 4px по центру для лазерного свечения */
    .clip-vs-left { clip-path: polygon(0 0, calc(55% - 2px) 0, calc(45% - 2px) 100%, 0 100%); }
    .clip-vs-right { clip-path: polygon(calc(55% + 2px) 0, 100% 0, 100% 100%, calc(45% + 2px) 100%); }
   
    ::-webkit-scrollbar { display: none; }
  `}</style>
);

const MathRain = () => {
  const equations =[
    "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
    "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
    "e^{i\\pi} + 1 = 0",
    "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
    "\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}",
    "A = U \\Sigma V^T",
    "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
    "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      {equations.map((eq, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, x: Math.random() * 100 + "vw", opacity: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 0] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: i * 0.8, ease: "linear" }}
          className="absolute text-cyan-400 font-bold text-xl md:text-4xl"
        >
          <Latex>{`$${eq}$`}</Latex>
        </motion.div>
      ))}
    </div>
  );
};

// Призрачный курсор (Только для Акта 3)
const GhostCursor = ({ x, y, clicking }: { x: number | string; y: number | string; clicking?: boolean }) => (
  <motion.div
    animate={{ x, y, scale: clicking ? 0.8 : 1 }}
    transition={{ type: "spring", damping: 20, stiffness: 100, mass: 50 }}
    className="absolute z-[200] pointer-events-none"
    style={{ left: 0, top: 0 }}
  >
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
      <path d="M5.5 3.21V20.8L11.4 15.6H18.5L5.5 3.21Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
    {clicking && (
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 0.4 }}
        className="absolute top-0 left-0 w-8 h-8 border-4 border-cyan-400 rounded-full"
      />
    )}
  </motion.div>
);

// ============================================================================
// 2. МОКИ РЕАЛЬНОГО UI (С ИДЕАЛЬНОЙ ВЕРСТКОЙ)
// ============================================================================
const MockSectorCard = ({ title, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", stiffness: 100 }}
    className="w-[85vw] max-w-[18rem] md:w-72 glass-panel p-6 md:p-8 rounded-[2rem] border-2 border-slate-700/50 flex flex-col hover:border-cyan-500/50 transition-colors shadow-2xl relative overflow-hidden shrink-0"
  >
    <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/20 blur-3xl`} />
    <div className={`relative p-3 md:p-4 rounded-2xl w-fit mb-4 md:mb-6 bg-${color}-500/20 text-${color}-400 border border-${color}-500/30 shadow-inner`}>
      <Icon className="w-6 h-6 md:w-10 md:h-10" />
    </div>
    <h3 className="relative text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">{title}</h3>
    <div className="relative mt-auto pt-4 md:pt-6 border-t border-white/10 flex justify-between items-center">
      <span className={`text-${color}-400 text-xs md:text-sm font-bold font-mono uppercase tracking-widest`}>● Доступно</span>
      <ChevronRight className={`w-4 h-4 md:w-5 md:h-5 text-${color}-400`} />
    </div>
  </motion.div>
);

const MockPlayerCard = ({ isOpponent, name, rank, mmr }: any) => {
  const c = isOpponent ? '#ef4444' : '#22d3ee';
  const clip = 'polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% 100%, 0% 100%, 0% 18px)';
  return (
    <div className="relative w-[260px] md:w-[320px] min-h-[360px] md:min-h-[420px] flex flex-col" style={{ clipPath: clip, background: '#050d14', boxShadow: `0 0 60px ${c}40` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clip, border: `2px solid ${c}` }} />
      <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
      <div className="flex flex-col items-center px-6 pt-8 md:pt-10 pb-8 gap-5 relative z-10">
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${isOpponent ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'}`}>
          {isOpponent ? 'GRANDMASTER' : 'CHALLENGER'}
        </span>
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-slate-900 border-4 flex items-center justify-center shadow-2xl" style={{ borderColor: c }}>
          <img src={isOpponent ? "/meerkat-evil.png" : "/meerkat-hero.png"} className={`w-20 h-20 md:w-24 md:h-24 object-contain ${isOpponent ? 'transform -scale-x-100' : ''}`} alt="Avatar" />
        </div>
        <div className="text-center w-full">
          <h2 className="text-2xl md:text-3xl font-black text-white truncate drop-shadow-md">{name}</h2>
          <p className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] mt-1 ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`}>{rank}</p>
        </div>
        <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}60, transparent)` }} />
        <div className="text-center w-full bg-black/40 rounded-xl p-3 border border-white/5">
          <div className="text-[9px] md:text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-widest">Match Points</div>
          <div className="text-3xl md:text-4xl font-black text-white font-mono">{mmr}</div>
        </div>
      </div>
    </div>
  );
};

const MockKeypad = ({ pressedKey }: { pressedKey: string | null }) => {
  const rows = [['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],['1', '2', '3', '−'],
    ['±', '0', '.', '+']
  ];
  return (
    <div className="bg-slate-900 border-t border-slate-800 p-2 pb-4 relative z-20">
      <div className="flex justify-between items-center px-2 py-2 mb-2 border-b border-slate-800/50">
        <div className="text-slate-400 font-bold text-sm">123</div>
        <div className="text-cyan-500 font-bold text-sm">ENTER</div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {rows.flat().map(k => {
          const isPressed = pressedKey === k;
          return (
            <div key={k} className={`h-10 md:h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-75 ${
              isPressed ? 'bg-cyan-400 text-slate-900 scale-90 shadow-[0_0_30px_rgba(34,211,238,0.8)]' :
              ['÷','×','−','+'].includes(k) ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'bg-slate-800 text-white border border-slate-700'
            }`}>
              {k}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <div className="h-10 md:h-12 flex-[1.5] bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-sm font-bold text-slate-400">abc</div>
        <div className={`h-10 md:h-12 flex-[3.5] rounded-xl flex items-center justify-center font-bold transition-all duration-75 ${
          pressedKey === 'ENTER' ? 'bg-emerald-400 text-slate-900 scale-95 shadow-[0_0_40px_rgba(52,211,153,1)]' : 'bg-cyan-600 text-white'
        }`}>
          ENTER
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. ГЛАВНЫЙ КОНТРОЛЛЕР ТРЕЙЛЕРА
// ============================================================================
export function CinematicTrailer({ onClose, onAction }: Props) {
  const [phase, setPhase] = useState(1);
  // ХУКИ АНИМАЦИИ ВЕРХНЕГО УРОВНЯ
  const xpCount = useMotionValue(0);
  const xpWidth = useTransform(xpCount,[0, 100],["0%", "100%"]);
  const xpText = useTransform(xpCount, v => `${Math.round(v)}/100`);
 
  const mmrCount = useMotionValue(1240);
  const mmrRounded = useTransform(mmrCount, Math.round);
  // СТЕЙТЫ ВЕРХНЕГО УРОВНЯ ДЛЯ ВНУТРЕННИХ АНИМАЦИЙ
  const [battlePhase, setBattlePhase] = useState(0);
  const [pressedKey, setPressedKey] = useState<string|null>(null);
  const [levelUp, setLevelUp] = useState(false);
  const [mapCursor, setMapCursor] = useState({ x: '50vw', y: '80vh', clicking: false });
  // ОРКЕСТРАТОР СЦЕН
  useEffect(() => {
    const timeline =[
      { p: 1, t: 0 }, // Акт 1: Скука
      { p: 2, t: 4000 }, // Акт 2: Разрушение (Угроза)
      { p: 3, t: 8000 }, // Акт 3: Карта
      { p: 4, t: 12000 }, // Акт 4: Питомец
      { p: 5, t: 16000 }, // Акт 5: VS Экран
      { p: 6, t: 19500 }, // Акт 6: Геймплей (Мобильный UI)
      { p: 7, t: 25000 }, // Акт 7: Триумф (Glassmorphism)
      { p: 8, t: 29000 }, // Акт 8: CTA
    ];
    const timeouts = timeline.map(s => setTimeout(() => setPhase(s.p), s.t));
    return () => timeouts.forEach(clearTimeout);
  },[]);

  // ВНУТРЕННИЕ АНИМАЦИИ В ЗАВИСИМОСТИ ОТ СЦЕНЫ
  useEffect(() => {
    let t1: any, t2: any, t3: any, t4: any, t5: any, t6: any;
    if (phase === 3) {
      t1 = setTimeout(() => setMapCursor({ x: '50vw', y: '50vh', clicking: false }), 500);
      t2 = setTimeout(() => setMapCursor({ x: '50vw', y: '50vh', clicking: true }), 1500);
    }
    else if (phase === 4) {
      t1 = setTimeout(() => animate(xpCount, 100, { duration: 1.2, ease: "easeOut" }), 500);
      t2 = setTimeout(() => setLevelUp(true), 1700);
    }
    else if (phase === 6) {
      t1 = setTimeout(() => setBattlePhase(1), 1000);
      t2 = setTimeout(() => { setBattlePhase(2); setPressedKey('4'); }, 2500);
      t3 = setTimeout(() => setPressedKey(null), 2650);
      t4 = setTimeout(() => { setBattlePhase(3); setPressedKey('ENTER'); }, 3200);
      t5 = setTimeout(() => { setPressedKey(null); setBattlePhase(4); }, 3350);
      t6 = setTimeout(() => setBattlePhase(5), 3500);
    }
    else if (phase === 7) {
      t1 = setTimeout(() => animate(mmrCount, 1400, { duration: 2.5, ease: "easeOut" }), 600);
    }
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, [phase, xpCount, mmrCount]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden font-sans select-none">
      <GlobalTrailerStyles />
      <div className="trailer-scanlines" />
     
      {/* Прогресс-бар снизу (длительность 29 сек) */}
      <div className="absolute bottom-0 left-0 h-1.5 bg-slate-900 w-full z-[10000]">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 29, ease: "linear" }}
        />
      </div>

      {/*
        РЕНДЕР СЦЕН
        Строгая привязка через key
      */}
      <AnimatePresence mode="wait">
       
        {/* === АКТ 1: СКУКА === */}
        {phase === 1 && (
          <motion.div key="act1" exit={{ opacity: 0 }} className="absolute inset-0 bg-[#e2e8f0] flex flex-col items-center justify-center px-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2NiZDVlMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="z-10 text-center">
              <div className="text-slate-500 font-serif text-3xl md:text-6xl italic mb-8 md:mb-10">
                <Latex>{"$\\int_{0}^{2\\pi} \\sin^2(x) dx = \\pi$"}</Latex>
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-slate-800 tracking-tight uppercase">
                Математика — это скучно?
              </h1>
              <p className="text-lg md:text-2xl text-slate-500 mt-4 md:mt-6 font-medium">Бесконечные формулы. Никакой мотивации.</p>
            </motion.div>
          </motion.div>
        )}

        {/* === АКТ 2: РАЗРУШЕНИЕ === */}
        {phase === 2 && (
          <motion.div key="act2" exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }} className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center px-4">
            <MathRain />
            <div className="trailer-vignette" />
            <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6 }} className="z-20">
              <Brain className="w-24 h-24 md:w-32 md:h-32 text-red-500 mb-6 md:mb-8 drop-shadow-[0_0_50px_rgba(239,68,68,0.8)]" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-3xl md:text-7xl font-black text-white uppercase tracking-widest mb-4 md:mb-6 z-20 text-center">
              Забудь учебники
            </motion.h2>
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-4xl md:text-8xl font-black text-red-500 uppercase tracking-widest glitch-text-heavy drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] z-20 text-center">
              АДАПТИРУЙСЯ!
            </motion.h2>
          </motion.div>
        )}

        {/* === АКТ 3: КАРТА (С курсором!) — АДАПТИВНОСТЬ ДЛЯ МОБИЛОК (только здесь flex-col на <md) === */}
        {phase === 3 && (
          <motion.div key="act3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -50 }} className="absolute inset-0 bg-slate-950 flex flex-col items-center pt-20 md:pt-32 overflow-hidden">
            <div className="trailer-vignette" />
            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-7xl font-black text-white z-20 mb-10 md:mb-16 text-center drop-shadow-2xl">
              ИССЛЕДУЙ <span className="text-emerald-400">СЕКТОРА</span>
            </motion.h2>
            {/* Адаптивный контейнер: на мобильных — столбец (чтобы не вылезало за экран), на md+ — точно как было раньше (row + justify-center) */}
            <div className="flex flex-col md:flex-row items-center md:items-stretch overflow-visible md:justify-center gap-4 md:gap-8 relative z-10 w-full px-4 md:px-0">
              <MockSectorCard title="Логика" icon={Brain} color="emerald" delay={0.2} />
              <MockSectorCard title="Алгебра" icon={Binary} color="blue" delay={0.4} />
              <div className="hidden lg:block">
                <MockSectorCard title="Мат. Анализ" icon={Activity} color="cyan" delay={0.6} />
              </div>
            </div>
            {/* Тот самый возвращенный курсор для этой сцены */}
            <GhostCursor x={mapCursor.x} y={mapCursor.y} clicking={mapCursor.clicking} />
          </motion.div>
        )}

        {/* === АКТ 4: ПИТОМЕЦ === */}
        {phase === 4 && (
          <motion.div key="act4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center px-4">
            <div className="trailer-vignette" />
            <div className="relative z-20 text-center mb-8 md:mb-12">
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter">
                ПРОКАЧИВАЙ <span className="text-amber-400">НАПАРНИКА</span>
              </h2>
            </div>
            <div className="relative w-[90vw] md:w-[400px] bg-slate-900 border-2 border-amber-500/40 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 flex flex-col items-center shadow-[0_0_100px_rgba(245,158,11,0.2)] z-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.2),transparent_70%)] pointer-events-none rounded-[2rem] md:rounded-[3rem]" />
              <motion.div
                animate={levelUp ? { scale:[1, 1.2, 1], rotate: [0, 10, -10, 0] } : { y:[0, -15, 0] }}
                transition={{ duration: levelUp ? 0.5 : 3, repeat: levelUp ? 0 : Infinity }}
                className="relative w-40 h-40 md:w-56 md:h-56 mb-6 md:mb-8"
              >
                <img src={levelUp ? "/meerkat/happy.png" : "/meerkat/idle.png"} className="w-full h-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)]" alt="Pet" />
                <AnimatePresence>
                  {levelUp && (
                    <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: -40 }} className="absolute top-0 right-0 bg-amber-500 text-black font-black px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-lg md:text-xl rotate-12 shadow-xl">
                      LEVEL UP!
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="w-full bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-700">
                <div className="flex justify-between text-xs md:text-sm font-bold text-amber-400 mb-2 md:mb-3 uppercase tracking-widest">
                  <span>Опыт (SXP)</span>
                  <motion.span>{xpText}</motion.span>
                </div>
                <div className="h-3 md:h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <motion.div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: xpWidth }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* === АКТ 5: VS ЭКРАН (ИСПРАВЛЕНО ДЛЯ МОБИЛОК) === */}
        {phase === 5 && (
          <motion.div 
            key="act5" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }} 
            transition={{ duration: 0.6 }} 
            className="absolute inset-0 flex bg-white overflow-hidden"
          >
            {/* Фоны с clip-path — без изменений */}
            <div className="absolute inset-0 z-0 bg-white shadow-[0_0_100px_rgba(255,255,255,1)]">
              <motion.div 
                initial={{x: "-100%"}} 
                animate={{x: 0}} 
                transition={{type: "spring", bounce: 0.2}} 
                className="absolute inset-0 bg-gradient-to-br from-cyan-950 to-slate-950 clip-vs-left border-r-8 border-cyan-500" 
              />
              <motion.div 
                initial={{x: "100%"}} 
                animate={{x: 0}} 
                transition={{type: "spring", bounce: 0.2, delay: 0.1}} 
                className="absolute inset-0 bg-gradient-to-bl from-red-950 to-slate-950 clip-vs-right border-l-8 border-red-500" 
              />
            </div>
           
            {/* === ИСПРАВЛЕННЫЙ КОНТЕЙНЕР КАРТОЧЕК === */}
            <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-8 md:gap-0 px-4 md:px-2 sm:px-10 lg:px-32 py-10 scale-[0.85] sm:scale-[0.9] md:scale-90 lg:scale-100">
              <motion.div 
                initial={{x: -100, opacity: 0}} 
                animate={{x: 0, opacity: 1}} 
                transition={{delay: 0.3}}
              >
                <MockPlayerCard isOpponent={false} name="YOU" rank="Platinum II" mmr={1240} />
              </motion.div>
        
              <motion.div 
                initial={{x: 100, opacity: 0}} 
                animate={{x: 0, opacity: 1}} 
                transition={{delay: 0.4}}
              >
                <MockPlayerCard isOpponent={true} name="BOSS" rank="Grandmaster" mmr={2800} />
              </motion.div>
            </div>
        
            {/* Логотип VS (работает и на мобилках, и на десктопе) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring", bounce: 0.6 }}>
                <div className="w-24 h-24 md:w-48 md:h-48 bg-slate-950 rounded-full border-[3px] md:border-4 border-white flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.8)]">
                  <span className="text-5xl md:text-[6rem] font-black italic text-white drop-shadow-lg">VS</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* === АКТ 6: ГЕЙМПЛЕЙ (МОБИЛЬНЫЙ МОКАП БЕЗ КУРСОРА) === */}
        {phase === 6 && (
          <motion.div key="act6" exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 bg-[#020617] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1),_transparent_60%)]" />
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}
              className="relative w-[340px] max-w-[95vw] h-[680px] max-h-[85vh] bg-slate-950 rounded-[3rem] border-[10px] border-slate-800 shadow-[0_0_100px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col z-20"
            >
              {/* Челка (Dynamic Island) */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-50 shadow-inner" />
              {/* Хедер матча */}
              <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-4 flex justify-between items-center shadow-lg relative z-20">
                <div className="flex flex-col">
                  <span className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">YOU</span>
                  <span className="text-3xl font-black text-white">{battlePhase >= 5 ? 15 : 14}</span>
                </div>
                <motion.div animate={battlePhase >= 1 && battlePhase < 5 ? { color:["#fff", "#ef4444", "#fff"], scale:[1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 0.4 }} className="text-2xl font-mono font-black text-white flex items-center gap-1">
                  <Timer className="w-5 h-5" /> 00:0{battlePhase >= 5 ? '0' : (battlePhase >= 2 ? '1' : '3')}
                </motion.div>
                <div className="flex flex-col text-right">
                  <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">BOSS</span>
                  <span className="text-3xl font-black text-white">{battlePhase >= 1 ? 14 : 13}</span>
                </div>
              </div>
              {/* Прогресс-бары */}
              <div className="flex h-1.5 bg-slate-900 w-full relative z-20">
                <motion.div className="bg-cyan-500" animate={{ width: battlePhase >= 5 ? "100%" : "90%" }} transition={{ duration: 0.3 }} />
                <motion.div className="bg-red-500 ml-auto" animate={{ width: battlePhase >= 1 ? "100%" : "90%" }} transition={{ duration: 0.3 }} />
              </div>
              {/* Фон (Краснеет при угрозе) */}
              <AnimatePresence>
                {battlePhase >= 1 && battlePhase < 5 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-900/20 z-10 pointer-events-none" />
                )}
              </AnimatePresence>
              {/* Центральная зона с задачей */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-20">
                <motion.div animate={battlePhase >= 1 && battlePhase < 4 ? { x:[-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.4 }} className="bg-slate-800/90 border-2 border-slate-700 w-full p-8 rounded-3xl text-center shadow-xl mb-6">
                  <div className="text-4xl font-black text-white"><Latex>{"$\\sqrt{16} = ?$"}</Latex></div>
                </motion.div>
                {/* Поле ввода */}
                <div className="w-full h-16 bg-slate-900 border border-cyan-500/50 rounded-xl flex items-center justify-center text-4xl font-mono font-bold text-cyan-400">
                  {battlePhase >= 2 && <span>4</span>}
                  {battlePhase < 5 && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>_</motion.span>}
                </div>
              </div>
              {/* Клавиатура (Самостоятельная анимация тапов) */}
              <MockKeypad pressedKey={pressedKey} />
              {/* Оверлей Победы */}
              <AnimatePresence>
                {battlePhase >= 5 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-32 h-32 text-emerald-400 mb-6 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
                    <h2 className="text-5xl font-black text-emerald-400 italic">ВЕРНО!</h2>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}

        {/* === АКТ 7: ТРИУМФ (GLASSMORPHISM) === */}
        {phase === 7 && (
          <motion.div key="act7" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -100 }} className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden px-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.3),_transparent_70%)] pointer-events-none" />
           
            <motion.div
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", bounce: 0.4 }}
              className="relative z-20 flex flex-col items-center p-8 md:p-20 rounded-[2rem] md:rounded-[3rem] bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] overflow-hidden w-full max-w-2xl"
            >
              {/* Блики и свечение */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
              <div className="absolute top-0 left-1/4 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-60 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/30 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/30 blur-[80px] rounded-full pointer-events-none" />
             
              <Trophy className="relative z-10 w-24 h-24 md:w-48 md:h-48 text-blue-400 drop-shadow-[0_0_50px_rgba(96,165,250,0.8)] mb-6 md:mb-8" />
             
              <h2 className="relative z-10 text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-300 uppercase tracking-widest mb-2 drop-shadow-xl text-center">
                АЛМАЗ IV
              </h2>
              <p className="relative z-10 text-lg md:text-xl text-blue-300 font-mono uppercase tracking-widest mb-8 md:mb-10 text-center">Ранг повышен!</p>
              <div className="relative z-10 flex items-center justify-center gap-4 md:gap-6 bg-black/50 border border-white/10 px-8 py-4 md:px-12 md:py-5 rounded-full shadow-inner backdrop-blur-md">
                 <ArrowUp className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 animate-bounce" />
                 <motion.div className="text-5xl md:text-6xl font-mono font-black text-white">{mmrRounded}</motion.div>
                 <span className="text-2xl md:text-3xl font-bold text-blue-400">MP</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* === АКТ 8: CTA (ФИНАЛ С НОВЫМ ЛОГОТИПОМ) === */}
        {phase === 8 && (
          <motion.div key="act8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center px-4 z-[500]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15),_transparent_70%)] pointer-events-none" />
            <div className="trailer-vignette" />
            <motion.div initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 1, type: "spring" }} className="relative z-20 text-center max-w-4xl">
             
              {/* Заменили суриката на ЛОГОТИП! */}
              <div className="flex justify-center mb-8 md:mb-10">
                 <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-[4px] md:border-[6px] border-cyan-500 p-1 md:p-2 shadow-[0_0_80px_rgba(6,182,212,0.6)] bg-slate-900 overflow-hidden">
                   <img src="/meerkat-logo.png" className="w-full h-full object-contain" alt="MathLab Logo" />
                 </div>
              </div>
             
              <h1 className="text-4xl md:text-[8rem] font-black text-white leading-[1.1] md:leading-none tracking-tighter mb-4 md:mb-8 uppercase drop-shadow-2xl">
                АРЕНА <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400">ЖДЕТ ТЕБЯ</span>
              </h1>
             
              <p className="text-lg md:text-3xl text-slate-400 mb-8 md:mb-12 font-medium leading-relaxed max-w-2xl mx-auto px-4">
                Создай аккаунт, тренируй компаньона и докажи, что ты лучший в математическом PVP.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 60px rgba(6,182,212,0.8)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onAction}
                className="group relative inline-flex items-center justify-center gap-3 md:gap-5 px-8 py-5 md:px-16 md:py-8 bg-white text-slate-950 font-black text-xl md:text-4xl uppercase tracking-widest rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                <Swords className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-12 transition-transform duration-500" />
                <span>ВОРВАТЬСЯ В ИГРУ</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
