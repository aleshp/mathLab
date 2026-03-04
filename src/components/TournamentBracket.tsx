import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Swords, Crown, Shield, Loader, Zap } from 'lucide-react';

type BracketProps = {
  tournamentId: string;
  onEnterMatch: (duelId: string) => void;
  isTeacher?: boolean;
};

export function TournamentBracket({ tournamentId, onEnterMatch, isTeacher = false }: BracketProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [duels, setDuels] = useState<any[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState<any>(null);
  const [rounds, setRounds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const sub = supabase
      .channel(`bracket-${tournamentId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'duels', filter: `tournament_id=eq.${tournamentId}` },
        () => fetchData())
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
        () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  async function fetchData() {
    const { data: tData } = await supabase
      .from('tournaments').select('*').eq('id', tournamentId).single();
    setTournamentInfo(tData);

    const { data: dData } = await supabase
      .from('duels')
      .select(`*, p1:profiles!duels_player1_id_fkey(username), p2:profiles!duels_player2_id_fkey(username)`)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('created_at', { ascending: true });

    if (dData) {
      setDuels(dData);
      const uniqueRounds = Array.from(new Set(dData.map(d => d.round))).sort((a, b) => a - b);
      setRounds(uniqueRounds);
    }
    setLoading(false);
  }

  const myActiveDuel = duels.find(d =>
    d.status === 'active' &&
    (d.player1_id === user?.id || d.player2_id === user?.id)
  );

  // Последний раунд с завершённой дуэлью = финал
  const maxRound = rounds.length > 0 ? Math.max(...rounds) : 0;
  const finalDuel = maxRound > 0
    ? duels.filter(d => d.round === maxRound && d.winner_id).pop()
    : null;

  const championName = finalDuel
    ? (finalDuel.winner_id === finalDuel.player1_id
        ? finalDuel.p1?.username
        : finalDuel.p2?.username)
    : null;

  if (loading) return (
    <div className="flex justify-center p-10">
      <Loader className="animate-spin text-cyan-400 w-10 h-10" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">

      {/* Шапка */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-white uppercase tracking-widest">{t('tournaments.bracket_title')}</span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {t('tournaments.round')}{' '}
          <span className="text-white font-bold">{tournamentInfo?.current_round ?? 1}</span>
        </div>
      </div>

      {/* Кнопка входа в свой матч (для игрока) */}
      {!isTeacher && myActiveDuel && (
        <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/30 flex justify-between items-center animate-pulse shrink-0">
          <div className="text-emerald-400 font-bold text-sm md:text-base">
            {t('tournaments.match_ready')} {myActiveDuel.round}
          </div>
          <button
            onClick={() => onEnterMatch(myActiveDuel.id)}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all shadow-lg flex items-center gap-2"
          >
            <Swords className="w-4 h-4" />
            <span className="hidden md:inline">{t('tournaments.go_to_battle')}</span>
          </button>
        </div>
      )}

      {/* Сетка */}
      <div className="flex-1 overflow-auto p-6 flex gap-8">
        {rounds.length === 0 && (
          <div className="text-slate-500 m-auto text-sm">{t('tournaments.generating_bracket')}</div>
        )}

        {rounds.map((round) => (
          <div key={round} className="min-w-[220px] flex flex-col gap-3 shrink-0">
            {/* Заголовок раунда */}
            <div className="text-center text-cyan-500 font-bold font-mono text-xs uppercase mb-1 bg-cyan-900/20 py-1.5 rounded-lg tracking-widest">
              {t('tournaments.round')} {round}
            </div>

            {duels.filter(d => d.round === round).map((duel) => {
              const isMyDuel = duel.player1_id === user?.id || duel.player2_id === user?.id;
              const isBye = duel.player2_id === null;
              const finished = duel.status === 'finished';
              const name1 = duel.p1?.username || t('tournaments.waiting_player');
              const p1won = duel.winner_id === duel.player1_id;

              // ── BYE карточка ────────────────────────────
              if (isBye) {
                return (
                  <div key={duel.id}
                    className={`relative rounded-2xl p-1 ${isMyDuel ? 'ring-2 ring-emerald-500/50' : ''}`}>
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="font-bold text-emerald-300 text-sm truncate">{name1}</span>
                        {p1won && <Crown className="w-3 h-3 text-amber-400 ml-auto flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-emerald-500/70 font-mono uppercase tracking-wider">
                        Автопроход
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Обычная карточка матча ────────────────────
              const name2 = duel.p2?.username || t('tournaments.waiting_player');
              const p2won = duel.winner_id === duel.player2_id;

              return (
                <div key={duel.id}
                  className={`relative rounded-2xl p-[2px] transition-all duration-300 ${
                    isMyDuel && !finished
                      ? 'bg-gradient-to-br from-emerald-500/50 to-cyan-500/50 shadow-lg shadow-emerald-900/30'
                      : isMyDuel
                      ? 'bg-gradient-to-br from-amber-500/30 to-yellow-500/30'
                      : 'bg-slate-700/30'
                  }`}>
                  <div className={`rounded-[14px] overflow-hidden ${
                    isMyDuel ? 'bg-slate-800' : 'bg-slate-900/80'
                  }`}>

                    {/* Игрок 1 */}
                    <div className={`flex justify-between items-center px-3 py-2.5 ${
                      p1won ? 'bg-amber-500/10' : ''
                    }`}>
                      <span className={`font-bold text-sm truncate max-w-[130px] ${
                        p1won ? 'text-amber-300' : finished ? 'text-slate-500' : 'text-slate-200'
                      }`}>
                        {p1won && '👑 '}{name1}
                      </span>
                      <span className={`font-mono font-black text-base ml-2 flex-shrink-0 ${
                        p1won ? 'text-amber-300' : 'text-slate-400'
                      }`}>
                        {duel.player1_score ?? 0}
                      </span>
                    </div>

                    <div className="h-px bg-slate-700/60" />

                    {/* Игрок 2 */}
                    <div className={`flex justify-between items-center px-3 py-2.5 ${
                      p2won ? 'bg-amber-500/10' : ''
                    }`}>
                      <span className={`font-bold text-sm truncate max-w-[130px] ${
                        p2won ? 'text-amber-300' : finished ? 'text-slate-500' : 'text-slate-200'
                      }`}>
                        {p2won && '👑 '}{name2}
                      </span>
                      <span className={`font-mono font-black text-base ml-2 flex-shrink-0 ${
                        p2won ? 'text-amber-300' : 'text-slate-400'
                      }`}>
                        {duel.player2_score ?? 0}
                      </span>
                    </div>

                    {/* Статус пульсирующий */}
                    <div className="absolute -top-1.5 -right-1.5">
                      {!finished ? (
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                      ) : (
                        <div className="bg-slate-700 rounded-full p-0.5 border border-slate-600">
                          <Shield className="w-2.5 h-2.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Чемпион */}
        {tournamentInfo?.status === 'finished' && championName && (
          <div className="min-w-[180px] flex flex-col justify-center items-center animate-in zoom-in duration-500 border-l-2 border-dashed border-slate-700 pl-8 shrink-0">
            <Trophy className="w-14 h-14 text-yellow-400 mb-3 drop-shadow-lg animate-bounce" />
            <div className="text-yellow-400 font-black text-lg uppercase tracking-widest mb-2">
              {t('tournaments.winner')}
            </div>
            <div className="text-white font-bold text-base bg-slate-800 px-5 py-2 rounded-xl border border-yellow-500/40 text-center">
              {championName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}