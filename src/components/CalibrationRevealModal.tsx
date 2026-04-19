import React, { useEffect, useState, useRef } from 'react';
import { PvPRank, getDivisionRoman } from '../lib/PvPRankSystem';
import { X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  finalMMR: number;
  finalRank: PvPRank;
  onClose: () => void;
}

type Phase = 'analyzing' | 'rolling' | 'veiled' | 'lifting' | 'unveiled';

export function CalibrationRevealModal({ finalMMR, finalRank, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [mmrDisplay, setMmrDisplay] = useState(500);
  const [veilProgress, setVeilProgress] = useState(1); // 1=fully hidden, 0=fully revealed
  const animRef = useRef<number>();

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 50);

    // Phase 1: analyzing (2.2s)
    const t1 = setTimeout(() => {
      setPhase('rolling');

      // MMR slot-machine roll with jitter
      const rollDuration = 2400;
      const startTime = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - startTime) / rollDuration, 1);
        const eased = p < 0.75 ? (p / 0.75) * 0.65 : 0.65 + ((p - 0.75) / 0.25) * 0.35;
        const jitter = p < 0.88 ? Math.floor(Math.random() * 60 - 30) : 0;
        setMmrDisplay(Math.round(500 + (finalMMR - 500) * eased + jitter));
        if (p < 1) animRef.current = requestAnimationFrame(tick);
        else setMmrDisplay(finalMMR);
      };
      animRef.current = requestAnimationFrame(tick);
    }, 2200);

    // Phase 2: rolling → veiled (2.2 + 2.6s)
    const t2 = setTimeout(() => setPhase('veiled'), 4800);

    // Phase 3: veiled → lifting (+ 1.4s suspense)
    const t3 = setTimeout(() => {
      setPhase('lifting');
      // Animate veil lifting over 1s
      const startTime = performance.now();
      const lift = (now: number) => {
        const p = Math.min((now - startTime) / 950, 1);
        // Ease in-out
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        setVeilProgress(1 - eased);
        if (p < 1) animRef.current = requestAnimationFrame(lift);
        else {
          setVeilProgress(0);
          setPhase('unveiled');
          // Confetti burst
          setTimeout(() => {
            confetti({ particleCount: 180, spread: 130, origin: { y: 0.5 }, colors: [finalRank.gradientFrom, finalRank.gradientTo, '#fff', '#fbbf24'] });
            confetti({ particleCount: 70, spread: 50, origin: { y: 0.5, x: 0.1 }, colors: ['#fff', finalRank.gradientFrom] });
            confetti({ particleCount: 70, spread: 50, origin: { y: 0.5, x: 0.9 }, colors: ['#fff', finalRank.gradientTo] });
          }, 80);
        }
      };
      animRef.current = requestAnimationFrame(lift);
    }, 6200);

    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleClose = () => {
    if (phase !== 'unveiled') return; // Don't allow early close
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed inset-0 z-[250] flex items-center justify-center p-4 transition-all duration-600 ${visible ? 'bg-black/95 backdrop-blur-2xl' : 'bg-black/0'}`}>

      {/* Unveiled ambient */}
      {(phase === 'unveiled' || phase === 'lifting') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] animate-pulse"
            style={{ opacity: 1 - veilProgress * 0.8, background: `radial-gradient(circle, ${finalRank.gradientFrom}30 0%, ${finalRank.gradientTo}20 50%, transparent 100%)` }}
          />
        </div>
      )}

      <div className={`relative max-w-sm w-full z-10 transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>

        {/* ── PHASE: ANALYZING ── */}
        {phase === 'analyzing' && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-7">
            <div>
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-cyan-500/30 flex items-center justify-center mb-5">
                <div className="w-10 h-10 rounded-full border-[3px] border-t-cyan-400 border-r-cyan-400/50 border-b-transparent border-l-transparent animate-spin" />
              </div>
              <h2 className="text-white font-black text-2xl uppercase tracking-widest">Calibration</h2>
              <p className="text-slate-500 text-sm mt-1">Анализируем ваши результаты...</p>
            </div>

            <div className="space-y-2.5 text-left">
              {['Скорость решений', 'Точность ответов', 'Сложность задач', 'Стабильность'].map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-slate-600 text-[10px] uppercase font-bold w-32 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, #06b6d4, #22d3ee)`,
                        animation: `expand-bar ${1.0 + i * 0.25}s ease-out ${i * 0.15}s forwards`,
                        width: 0
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-cyan-600/40 text-xs font-mono animate-pulse tracking-widest">ОБРАБОТКА ДАННЫХ...</div>
          </div>
        )}

        {/* ── PHASE: ROLLING ── */}
        {phase === 'rolling' && (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-6">
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-bold mb-3">Ваш рейтинг</p>
              <div
                className="text-8xl font-black text-white font-mono tabular-nums leading-none"
                style={{ textShadow: '0 0 40px rgba(255,255,255,0.08)' }}
              >
                {mmrDisplay}
              </div>
              <div className="text-slate-700 text-sm font-mono mt-2 tracking-widest">MP</div>
            </div>

            {/* Slot machine visual */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-10 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="w-full rounded-full"
                    style={{
                      height: `${30 + Math.random() * 70}%`,
                      background: `linear-gradient(180deg, #06b6d4, #0e7490)`,
                      animation: `slot-tick ${0.25 + Math.random() * 0.35}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.07}s`
                    }}
                  />
                </div>
              ))}
            </div>

            <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Определяем лигу...</p>
          </div>
        )}

        {/* ── PHASE: VEILED / LIFTING / UNVEILED ── */}
        {(phase === 'veiled' || phase === 'lifting' || phase === 'unveiled') && (
          <div className="relative">
            {/* The actual rank card — always rendered */}
            <div
              className="relative bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border"
              style={{ borderColor: `${finalRank.gradientFrom}45` }}
            >
              <div className="relative h-[2px] overflow-hidden">
                <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent, ${finalRank.gradientFrom}, ${finalRank.gradientTo}, ${finalRank.gradientFrom}, transparent)` }} />
              </div>
              <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none opacity-10"
                style={{ background: `linear-gradient(180deg, ${finalRank.gradientFrom}, transparent)` }} />

              {phase === 'unveiled' && (
                <button onClick={handleClose} className="absolute top-3 right-3 z-20 p-1.5 bg-slate-800/70 hover:bg-slate-700 rounded-full border border-slate-700/60 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}

              <div className="relative p-7 text-center space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ borderColor: `${finalRank.gradientFrom}40`, color: finalRank.gradientFrom, backgroundColor: `${finalRank.gradientFrom}10` }}>
                  <Sparkles className="w-3 h-3" /> Ваш ранг определён
                </div>

                <div className="relative flex justify-center">
                  <div className="absolute inset-0 m-auto w-36 h-36 rounded-full border-2 animate-ping opacity-15" style={{ borderColor: finalRank.gradientFrom }} />
                  <div
                    className="relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${finalRank.gradientFrom}, ${finalRank.gradientTo})`,
                      boxShadow: `0 0 60px ${finalRank.gradientFrom}80, 0 0 120px ${finalRank.gradientFrom}25`,
                      animation: phase === 'unveiled' ? 'rank-float 3s ease-in-out infinite' : 'none'
                    }}>
                    {finalRank.icon}
                  </div>
                </div>

                <div>
                  <div className={`text-4xl font-black uppercase tracking-wider drop-shadow-lg ${finalRank.color}`}>
                    {finalRank.tier === 'master' || finalRank.tier === 'grandmaster' ? finalRank.fullName : finalRank.tier.toUpperCase()}
                  </div>
                  {finalRank.division > 0 && <div className={`text-2xl font-bold mt-0.5 opacity-75 ${finalRank.color}`}>{getDivisionRoman(finalRank.division)}</div>}
                  <p className="text-slate-500 text-xs italic mt-2">"{finalRank.description}"</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Стартовый рейтинг</div>
                  <div className="text-4xl font-black text-white font-mono">{finalMMR} <span className="text-lg text-slate-500">MP</span></div>
                </div>

                {phase === 'unveiled' && (
                  <button onClick={handleClose}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${finalRank.gradientFrom}, ${finalRank.gradientTo})` }}>
                    Принять вызов
                  </button>
                )}
              </div>

              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${finalRank.gradientTo}, ${finalRank.gradientFrom}, transparent)` }} />
            </div>

            {/* VEIL OVERLAY */}
            {veilProgress > 0 && (
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-20"
                style={{ opacity: veilProgress }}
              >
                {/* Base fog */}
                <div className="absolute inset-0 bg-slate-950" />

                {/* Animated fog wisps */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 50%, #0f172a 0%, #020617 100%)' }} />
                  <div className="absolute w-full h-full animate-fog-1" style={{ background: 'radial-gradient(ellipse 80% 40% at 30% 60%, #1e293b50 0%, transparent 70%)' }} />
                  <div className="absolute w-full h-full animate-fog-2" style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 40%, #1e293b40 0%, transparent 70%)' }} />
                </div>

                {/* Mystery question mark */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-2 border-slate-700/50 flex items-center justify-center animate-pulse">
                      <div className="text-6xl font-black text-slate-700 select-none">?</div>
                    </div>
                    {/* Shimmer on the question mark */}
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div className="absolute inset-0 opacity-20 animate-shimmer-slow"
                        style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' }} />
                    </div>
                  </div>
                  <div className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse">Раскрываем...</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes expand-bar { from{width:0%} to{width:100%} }
        @keyframes slot-tick { from{transform:translateY(0)} to{transform:translateY(-60%)} }
        @keyframes rank-float { 0%,100%{transform:translateY(0)rotate(-1.5deg)}50%{transform:translateY(-10px)rotate(1.5deg)} }
        @keyframes fog-1 { 0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-5%,3%)scale(1.05)} }
        @keyframes fog-2 { 0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(4%,-4%)scale(0.97)} }
        .animate-fog-1{animation:fog-1 6s ease-in-out infinite}
        .animate-fog-2{animation:fog-2 8s ease-in-out infinite}
        @keyframes shimmer-slow {
          0%{transform:translateX(-100%)translateY(-100%)}
          100%{transform:translateX(200%)translateY(200%)}
        }
        .animate-shimmer-slow{animation:shimmer-slow 3s ease-in-out infinite}
      `}</style>
    </div>
  );
}