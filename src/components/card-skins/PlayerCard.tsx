import { Trophy, Target, Zap } from 'lucide-react';
import ElectricBorder from './ElectricBorder';

export type CardSkin = 'default' | 'electric';

type PlayerCardProps = {
  isOpponent: boolean;
  name: string;
  mmr: number;
  rank: any; // PvPRank type
  winRate: number;
  skin?: CardSkin;
  stage: 'enter' | 'idle' | 'exit'; // Для анимации
};

export function PlayerCard({ isOpponent, name, mmr, rank, winRate, skin = 'default', stage }: PlayerCardProps) {
  
  // 1. Контент карточки (Аватар, Статы)
  const CardContent = (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-between p-6 rounded-[24px] relative overflow-hidden">
      
      {/* Фон внутри карточки */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-b ${isOpponent ? 'from-red-900 to-slate-900' : 'from-cyan-900 to-slate-900'}`} />

      {/* Бейдж */}
      <div className={`relative z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        isOpponent ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'
      }`}>
        {isOpponent ? 'OPPONENT' : 'YOU'}
      </div>

      {/* Аватар */}
      <div className="relative z-10">
        <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center bg-slate-800 shadow-xl ${isOpponent ? 'border-red-500/50' : 'border-cyan-500/50'}`}>
          <img src="/meerkat/avatar.png" className={`w-[80%] h-[80%] object-contain ${isOpponent ? 'grayscale sepia contrast-125' : ''}`} />
        </div>
        {/* Иконка ранга */}
        <div className="absolute -bottom-2 -right-2 text-3xl filter drop-shadow-lg transform rotate-12">
          {rank.icon}
        </div>
      </div>

      {/* Инфо */}
      <div className="relative z-10 text-center w-full">
        <h2 className="text-xl font-black text-white truncate px-2 mb-1">{name}</h2>
        <div className={`text-xs font-bold uppercase ${rank.color}`}>{rank.fullName}</div>
      </div>

      {/* Статы */}
      <div className="relative z-10 grid grid-cols-2 gap-2 w-full mt-4">
          <div className="bg-black/40 rounded-lg p-2 text-center border border-white/5">
            <div className={`text-[10px] font-bold uppercase mb-0.5 flex items-center justify-center gap-1 ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`}>
               <Trophy className="w-3 h-3" /> Rating
            </div>
            <div className="text-lg font-mono font-black text-white">{mmr}</div>
          </div>
          <div className="bg-black/40 rounded-lg p-2 text-center border border-white/5">
            <div className={`text-[10px] font-bold uppercase mb-0.5 flex items-center justify-center gap-1 ${isOpponent ? 'text-red-400' : 'text-cyan-400'}`}>
               <Target className="w-3 h-3" /> Winrate
            </div>
            <div className="text-lg font-mono font-black text-white">{winRate.toFixed(0)}%</div>
          </div>
      </div>

    </div>
  );

  // 2. Логика анимации (полет)
  const containerClasses = `
    w-64 h-96 relative transition-all duration-700 ease-out transform
    ${isOpponent 
      ? (stage === 'enter' ? 'translate-x-[150%] rotate-12' : stage === 'exit' ? 'translate-x-[150%] rotate-12 opacity-0' : 'translate-x-0 rotate-3') 
      : (stage === 'enter' ? '-translate-x-[150%] -rotate-12' : stage === 'exit' ? '-translate-x-[150%] -rotate-12 opacity-0' : 'translate-x-0 -rotate-3')
    }
  `;

  // 3. Выбор обертки (Скина)
  if (skin === 'electric') {
    return (
      <div className={containerClasses}>
        <ElectricBorder color={isOpponent ? '#ef4444' : '#06b6d4'} speed={2} chaos={0.15}>
          {CardContent}
        </ElectricBorder>
      </div>
    );
  }

  // Default Skin
  return (
    <div className={containerClasses}>
      <div className={`w-full h-full rounded-[24px] p-[2px] bg-slate-700`}>
          {CardContent}
      </div>
    </div>
  );
}