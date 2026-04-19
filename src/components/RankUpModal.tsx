import React, { useEffect, useState } from 'react';
import { PvPRank, getDivisionRoman } from '../lib/PvPRankSystem';
import { Trophy, Sparkles, TrendingUp, X, Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface Props {
  newRank: PvPRank;
  oldMMR: number;
  newMMR: number;
  onClose: () => void;
}

export function RankUpModal({ newRank, oldMMR, newMMR, onClose }: Props) {
  const [show, setShow] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<{ left: string; top: string; delay: string; duration: string }[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // client-only particles positions to avoid SSR hydration mismatch
    const arr =[...Array(30)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${3 + Math.random() * 2}s`
    }));
    setParticles(arr);

    const timer = setTimeout(() => setShow(true), 100);
    const particlesTimer = setTimeout(() => setShowParticles(true), 300);
    
    // Мы намеренно убрали автозакрытие (autoClose), 
    // чтобы у юзера было время нажать кнопку "Поделиться"

    return () => {
      clearTimeout(timer);
      clearTimeout(particlesTimer);
    };
  },[]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const mmrGain = newMMR - oldMMR;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${
        show ? 'bg-black/90 backdrop-blur-md' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-float-up opacity-0"
              style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration }}
            />
          ))}
        </div>
      )}

      <div
        className={`relative max-w-lg w-full transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 blur-3xl opacity-50 animate-pulse" style={{ background: `linear-gradient(135deg, ${newRank.gradientFrom}, ${newRank.gradientTo})` }} />

        <div className="relative bg-slate-900 border-2 rounded-3xl overflow-hidden shadow-2xl" style={{ borderColor: newRank.gradientFrom }}>

          <button onClick={handleClose} className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-600 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="absolute top-0 left-0 right-0 h-64 opacity-30" style={{ background: `linear-gradient(180deg, ${newRank.gradientFrom}, transparent)` }} />

          <div className="relative p-8 text-center space-y-6">
            <div className="space-y-2">
              <Sparkles className="w-8 h-8 text-yellow-400 mx-auto animate-bounce" />
              <h2 className="text-3xl font-black text-white uppercase tracking-wider animate-pulse">Повышение ранга!</h2>
              <p className="text-slate-400 text-sm">Вы достигли нового уровня мастерства</p>
            </div>

            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-full flex items-center justify-center animate-bounce-slow" style={{ background: `linear-gradient(135deg, ${newRank.gradientFrom}, ${newRank.gradientTo})`, boxShadow: `0 0 60px ${newRank.gradientFrom}80` }}>
                <span className="text-6xl filter drop-shadow-lg">{newRank.icon}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className={`text-5xl font-black uppercase tracking-wider ${newRank.color} drop-shadow-lg`}>
                {newRank.tier === 'master' || newRank.tier === 'grandmaster' ? newRank.fullName : newRank.tier.toUpperCase()}
              </div>
              {newRank.division > 0 && (<div className={`text-3xl font-bold ${newRank.color}`}>{getDivisionRoman(newRank.division)}</div>)}
              <p className="text-slate-400 text-sm italic mt-2">"{newRank.description}"</p>
            </div>

            {/* Статистика вынесена в свою сетку */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-xs uppercase">Новый MMR</span>
                </div>
                <div className="text-2xl font-black text-white">{newMMR}</div>
              </div>

              <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400 text-xs uppercase">Прирост</span>
                </div>
                <div className="text-2xl font-black text-emerald-400">+{mmrGain}</div>
              </div>
            </div>

            {/* Новые кнопки вынесены отдельно и отображаются корректно */}
            <div className="grid grid-cols-1 gap-3 mt-4">
              <button 
                onClick={() => setShowShareModal(true)} 
                className="w-full py-4 rounded-xl font-bold text-slate-900 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2" 
                style={{ background: `linear-gradient(135deg, ${newRank.gradientFrom}, ${newRank.gradientTo})` }}
              >
                <Share2 className="w-5 h-5" /> ПОХВАСТАТЬСЯ РАНГОМ
              </button>
              <button 
                onClick={handleClose} 
                className="w-full py-3 rounded-xl font-bold text-slate-400 hover:text-white bg-slate-800 transition-all active:scale-95 border border-slate-700"
              >
                Продолжить
              </button>
            </div>

          </div>
        </div>
      </div>

      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
      
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
        @keyframes bounce-slow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float-up { animation: float-up 5s ease-out forwards; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}