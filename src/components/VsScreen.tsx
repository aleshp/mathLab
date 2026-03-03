import { useEffect, useState } from 'react';
import { Trophy, Target, Zap, Swords } from 'lucide-react';
import { Profile } from '../lib/supabase';
import { getPvPRank } from '../lib/gameLogic';

type Props = {
  player: Profile;
  opponentName: string;
  opponentMMR: number; // Если это бот, мы сгенерируем фейковые статы на основе MMR
  onComplete: () => void;
};

export function VsScreen({ player, opponentName, opponentMMR, onComplete }: Props) {
  const [stage, setStage] = useState<'enter' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    // 1. Анимация входа (сразу)
    // 2. Ждем 3 секунды
    const idleTimer = setTimeout(() => setStage('idle'), 500);
    const exitTimer = setTimeout(() => setStage('exit'), 3500);
    const completeTimer = setTimeout(onComplete, 4000); // 3.5s + 0.5s на анимацию выхода

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Данные игрока
  const pRank = getPvPRank(player.mmr || 1000);
  
  // Данные соперника (генерируем правдоподобные статы на основе MMR)
  const oRank = getPvPRank(opponentMMR);
  // Эмулируем винрейт соперника (для красоты)
  const oWinRate = Math.min(90, Math.max(30, 50 + (opponentMMR - 1000) / 20 + Math.random() * 10));

  const Card = ({ isOpponent, name, mmr, rank, winRate }: any) => (
    <div 
      className={`
        absolute top-0 bottom-0 w-[55%] flex flex-col justify-center items-center p-8
        transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isOpponent ? 'right-0 bg-slate-900/90 border-l-4 border-red-600' : 'left-0 bg-slate-900/90 border-r-4 border-cyan-500'}
        ${isOpponent 
          ? (stage === 'enter' ? 'translate-x-full' : stage === 'exit' ? 'translate-x-full opacity-0' : 'translate-x-0') 
          : (stage === 'enter' ? '-translate-x-full' : stage === 'exit' ? '-translate-x-full opacity-0' : 'translate-x-0')
        }
        ${isOpponent ? 'origin-right skew-x-[-5deg]' : 'origin-left skew-x-[-5deg]'}
      `}
    >
      <div className={`flex flex-col items-center ${isOpponent ? 'skew-x-[5deg]' : 'skew-x-[5deg]'}`}>
        
        {/* Аватар */}
        <div className="relative mb-6">
          <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full border-4 flex items-center justify-center overflow-hidden bg-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] ${isOpponent ? 'border-red-500' : 'border-cyan-500'}`}>
            <img src="/meerkat/avatar.png" className={`w-[80%] h-[80%] object-contain ${isOpponent ? 'grayscale sepia contrast-125 hue-rotate-[320deg]' : ''}`} />
          </div>
          <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-lg font-black text-sm uppercase tracking-wider text-black ${isOpponent ? 'bg-red-500' : 'bg-cyan-500'}`}>
            {isOpponent ? 'OPPONENT' : 'YOU'}
          </div>
        </div>

        {/* Имя */}
        <h2 className="text-2xl md:text-4xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-md">
          {name}
        </h2>
        
        {/* Ранг */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-3xl">{rank.icon}</span>
          <span className={`text-lg md:text-xl font-bold ${rank.color}`}>{rank.fullName}</span>
        </div>

        {/* Статы */}
        <div className="w-full max-w-xs space-y-4">
          
          {/* MMR */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase">
              <Trophy className={`w-4 h-4 ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`} />
              Рейтинг
            </div>
            <span className="text-white font-mono font-black text-xl">{mmr}</span>
          </div>

          {/* WinRate */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase">
              <Target className={`w-4 h-4 ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`} />
              Точность
            </div>
            <span className="text-white font-mono font-black text-xl">{winRate.toFixed(0)}%</span>
          </div>

          {/* Power */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
             <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase">
              <Zap className={`w-4 h-4 ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`} />
              Сила
            </div>
             {/* Фейковая полоска силы */}
             <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isOpponent ? 'bg-red-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${Math.min(100, mmr / 20)}%` }} 
                />
             </div>
          </div>

        </div>

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex items-center justify-center">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)]" />
      <div className={`absolute inset-0 bg-red-500/10 mix-blend-overlay transition-opacity duration-300 ${stage === 'exit' ? 'opacity-0' : 'opacity-100'}`} />

      {/* VS Logo */}
      <div 
        className={`
          absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-32 h-32 md:w-48 md:h-48 bg-white text-black font-black text-6xl md:text-8xl italic
          flex items-center justify-center rounded-full border-8 border-slate-900 shadow-[0_0_100px_rgba(255,255,255,0.5)]
          transition-all duration-500
          ${stage === 'enter' ? 'scale-0 opacity-0 rotate-180' : 'scale-100 opacity-100 rotate-0'}
          ${stage === 'exit' ? 'scale-[5] opacity-0' : ''}
        `}
      >
        <span className="relative -left-1">VS</span>
        <div className="absolute inset-0 border-4 border-white/50 rounded-full animate-ping" />
      </div>

      <Card 
        isOpponent={false} 
        name={player.username} 
        mmr={player.mmr || 1000} 
        rank={pRank} 
        winRate={player.success_rate} 
      />
      
      <Card 
        isOpponent={true} 
        name={opponentName} 
        mmr={opponentMMR} 
        rank={oRank} 
        winRate={oWinRate} 
      />
      
      {/* Молния посередине (Декорация) */}
      <div className={`absolute inset-y-0 left-1/2 w-1 bg-white shadow-[0_0_20px_#fff] z-10 transition-all duration-300 ${stage === 'exit' ? 'scale-y-0' : 'scale-y-100'}`} />
      
    </div>
  );
}