import { useEffect, useState } from 'react';
import { Profile } from '../lib/supabase';
import { getPvPRank } from '../lib/gameLogic';
import { PlayerCard } from './card-skins/PlayerCard'; // Импорт из новой папки

type Props = {
  player: Profile;
  opponentName: string;
  opponentMMR: number;
  onComplete: () => void;
};

export function VsScreen({ player, opponentName, opponentMMR, onComplete }: Props) {
  const [stage, setStage] = useState<'enter' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    const idleTimer = setTimeout(() => setStage('idle'), 500);
    const exitTimer = setTimeout(() => setStage('exit'), 3500);
    const completeTimer = setTimeout(onComplete, 4000);

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Данные
  const pRank = getPvPRank(player.mmr || 1000);
  const oRank = getPvPRank(opponentMMR);
  const oWinRate = Math.min(90, Math.max(30, 50 + (opponentMMR - 1000) / 20 + Math.random() * 10));

  // Проверка на наличие скина (например, для Premium пользователей)
  // Пока хардкодим 'electric', в будущем можно брать из profile.equipped_card_skin
  const mySkin = player.is_premium ? 'electric' : 'default'; 

  return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#020617_100%)]" />
      <div className={`absolute inset-0 bg-red-500/10 mix-blend-overlay transition-opacity duration-300 ${stage === 'exit' ? 'opacity-0' : 'opacity-100'}`} />
      
      {/* VS Logo */}
      <div 
        className={`
          absolute z-30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-24 h-24 bg-white text-black font-black text-4xl italic
          flex items-center justify-center rounded-full border-4 border-slate-900 shadow-[0_0_50px_rgba(255,255,255,0.8)]
          transition-all duration-300
          ${stage === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
          ${stage === 'exit' ? 'scale-[10] opacity-0' : ''}
        `}
      >
        <span className="-ml-1">VS</span>
      </div>

      {/* Карточка Игрока */}
      <PlayerCard 
        isOpponent={false} 
        name={player.username} 
        mmr={player.mmr || 1000} 
        rank={pRank} 
        winRate={player.success_rate} 
        skin={mySkin}
        stage={stage}
      />

      {/* Карточка Соперника */}
      <PlayerCard 
        isOpponent={true} 
        name={opponentName} 
        mmr={opponentMMR} 
        rank={oRank} 
        winRate={oWinRate}
        skin="electric" // Боту дадим крутую карточку для красоты
        stage={stage}
      />

    </div>
  );
}