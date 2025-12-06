import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Swords, User, Shield, Crown } from 'lucide-react';

type BracketProps = {
  tournamentId: string;
  onEnterMatch: (duelId: string) => void; // Функция входа в бой
  isTeacher?: boolean;
};

export function TournamentBracket({ tournamentId, onEnterMatch, isTeacher = false }: BracketProps) {
  const { user } = useAuth();
  const [duels, setDuels] = useState<any[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState<any>(null);
  const [rounds, setRounds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
    
    // Подписка на обновления дуэлей (чтобы видеть результаты в реалтайме)
    const sub = supabase
      .channel(`bracket-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duels', filter: `tournament_id=eq.${tournamentId}` }, 
      () => { fetchData(); })
      .subscribe();

    const tourSub = supabase
      .channel(`tour-update-${tournamentId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
      (payload) => { setTournamentInfo(payload.new); })
      .subscribe();

    return () => { 
      supabase.removeChannel(sub); 
      supabase.removeChannel(tourSub);
    };
  }, [tournamentId]);

  async function fetchData() {
    // 1. Турнир
    const { data: tData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
    setTournamentInfo(tData);

    // 2. Дуэли с именами игроков
    const { data: dData } = await supabase
      .from('duels')
      .select(`
        *,
        p1:profiles!duels_player1_id_fkey(username),
        p2:profiles!duels_player2_id_fkey(username),
        winner:profiles!duels_winner_id_fkey(username)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true }); // Сортируем по раундам

    if (dData) {
      setDuels(dData);
      // Вычисляем уникальные раунды [1, 2, 3...]
      const uniqueRounds = Array.from(new Set(dData.map(d => d.round))).sort((a, b) => a - b);
      setRounds(uniqueRounds);
    }
  }

  // Находим активную дуэль для текущего пользователя
  const myActiveDuel = duels.find(d => 
    d.status === 'active' && 
    (d.player1_id === user?.id || d.player2_id === user?.id)
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
      
      {/* Шапка Сетки */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-white uppercase tracking-widest">Турнирная Сетка</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          STATUS: <span className={tournamentInfo?.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}>
            {tournamentInfo?.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* КНОПКА ДЕЙСТВИЯ (Только для ученика, если его очередь) */}
      {!isTeacher && myActiveDuel && (
        <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/30 flex justify-between items-center animate-pulse">
          <div className="text-emerald-400 font-bold">Ваш матч готов!</div>
          <button 
            onClick={() => onEnterMatch(myActiveDuel.id)}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all shadow-lg flex items-center gap-2"
          >
            <Swords className="w-4 h-4" /> В БОЙ
          </button>
        </div>
      )}

      {/* ОТОБРАЖЕНИЕ РАУНДОВ */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-8">
        {rounds.map((round) => (
          <div key={round} className="min-w-[250px] flex flex-col gap-4">
            <div className="text-center text-slate-500 font-mono text-sm uppercase mb-2">
              Раунд {round}
            </div>
            
            {duels.filter(d => d.round === round).map((duel) => {
              const isMyDuel = duel.player1_id === user?.id || duel.player2_id === user?.id;
              
              return (
                <div 
                  key={duel.id} 
                  className={`relative p-3 rounded-xl border-2 flex flex-col gap-2 transition-all ${
                    isMyDuel ? 'border-cyan-500 bg-cyan-900/10' : 'border-slate-700 bg-slate-800'
                  } ${duel.status === 'active' ? 'shadow-[0_0_15px_rgba(6,182,212,0.1)]' : ''}`}
                >
                  {/* ИГРОК 1 */}
                  <div className={`flex justify-between items-center px-2 py-1 rounded ${duel.winner_id === duel.player1_id ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}>
                    <span className="font-bold truncate">{duel.p1?.username || '???'}</span>
                    {duel.winner_id === duel.player1_id && <Crown className="w-3 h-3" />}
                  </div>

                  <div className="h-px bg-slate-700 w-full" />

                  {/* ИГРОК 2 */}
                  <div className={`flex justify-between items-center px-2 py-1 rounded ${duel.winner_id === duel.player2_id ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}>
                    <span className="font-bold truncate">{duel.p2?.username || '???'}</span>
                    {duel.winner_id === duel.player2_id && <Crown className="w-3 h-3" />}
                  </div>

                  {/* СТАТУС МАТЧА */}
                  <div className="absolute -top-2 -right-2">
                    {duel.status === 'active' && <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                    {duel.status === 'finished' && <div className="bg-slate-700 rounded-full p-1"><Shield className="w-3 h-3 text-slate-400" /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* ФИНАЛ (Победитель) */}
        {tournamentInfo?.status === 'finished' && (
           <div className="min-w-[200px] flex flex-col justify-center items-center animate-in zoom-in duration-500">
              <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-lg" />
              <div className="text-yellow-400 font-black text-2xl uppercase">ЧЕМПИОН</div>
              <div className="text-white font-bold text-xl mt-2">
                {/* Берем победителя последнего матча */}
                {duels[duels.length - 1]?.winner?.username || 'Unknown'}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}