import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'react-qr-code';
import { TournamentBracket } from './TournamentBracket';
import {
  Users, Play, Trophy, X, Crown, Copy, Loader, RefreshCw,
  Trash2, AlertTriangle, Eye, ChevronRight, UserX, SkipForward, Swords,
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SpectatorModal } from './SpectatorModal';

// ── Модалка: принудительно выбрать победителя ────────────────
function ForceFinishModal({
  duel,
  onConfirm,
  onCancel,
}: {
  duel: any;
  onConfirm: (winnerId: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const p1 = duel.p1?.username || 'Игрок 1';
  const p2 = duel.p2?.username || 'Игрок 2';

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <SkipForward className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Скипнуть матч</h3>
            <p className="text-slate-400 text-xs">Выбери победителя вручную</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-3">
          Раунд {duel.round} · Счёт: {duel.player1_score} : {duel.player2_score}
        </div>

        <div className="space-y-2 mb-6">
          {[
            { id: duel.player1_id, name: p1, score: duel.player1_score },
            { id: duel.player2_id, name: p2, score: duel.player2_score },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                selected === p.id
                  ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                  : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2">
                {selected === p.id && <Crown className="w-4 h-4 text-amber-400" />}
                <span className="font-bold">{p.name}</span>
              </div>
              <span className="font-mono text-sm opacity-60">{p.score} очков</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm"
          >
            Отмена
          </button>
          <button
            disabled={!selected || loading}
            onClick={async () => {
              if (!selected) return;
              setLoading(true);
              await onConfirm(selected);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

export function TournamentAdmin({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string>('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeDuels, setActiveDuels] = useState<any[]>([]);
  const [status, setStatus] = useState('waiting');
  const [currentRound, setCurrentRound] = useState(1);
  const [allRoundFinished, setAllRoundFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [spectatingDuelId, setSpectatingDuelId] = useState<string | null>(null);
  const [forceFinishDuel, setForceFinishDuel] = useState<any | null>(null);

  // ── Кикнуть игрока ───────────────────────────────────────
  async function kickPlayer(userId: string, username: string) {
    if (!tournamentId) return;
    if (!confirm(`Удалить ${username} из турнира?`)) return;
    try {
      const { error } = await supabase.rpc("kick_tournament_player", {
        t_id: tournamentId,
        player_uuid: userId,
      });
      if (error) throw error;
      fetchParticipants(tournamentId);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось кикнуть игрока"));
    }
  }

  // ── Принудительно завершить матч ─────────────────────────
  async function handleForceFinish(winnerId: string) {
    if (!forceFinishDuel) return;
    try {
      const { error } = await supabase.rpc("force_finish_duel", {
        duel_uuid: forceFinishDuel.id,
        winner_uuid: winnerId,
      });
      if (error) throw error;
      setForceFinishDuel(null);
      if (tournamentId) fetchActiveDuels(tournamentId);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось скипнуть матч"));
      setForceFinishDuel(null);
    }
  }


  // ── Инициализация ────────────────────────────────────────
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function initTournament() {
      if (!user) return;

      const { data: existing } = await supabase
        .from('tournaments')
        .select('*')
        .eq('created_by', user.id)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        const t = existing[0];
        setTournamentId(t.id);
        setJoinCode(t.code);
        setStatus(t.status);
        setCurrentRound(t.current_round ?? 1);
        setAllRoundFinished(t.all_round_finished ?? false);
        fetchParticipants(t.id);
        if (t.status === 'active') fetchActiveDuels(t.id);

        channel = supabase.channel('admin-tournament-status')
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${t.id}` },
            (payload) => {
              const upd = payload.new as any;
              setStatus(upd.status);
              setCurrentRound(upd.current_round ?? 1);
              setAllRoundFinished(upd.all_round_finished ?? false);
            })
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${t.id}` },
            () => fetchParticipants(t.id))
          .subscribe();
        return;
      }

      // Чистим старые и создаём новый
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await supabase.from('tournaments').delete()
        .eq('created_by', user.id).eq('status', 'waiting').lt('created_at', oneHourAgo);
      await supabase.rpc('cleanup_stale_tournaments');

      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const { data, error } = await supabase
        .from('tournaments').insert({ created_by: user.id, code })
        .select().single();

      if (error) { alert('Не удалось создать турнир'); return; }

      if (data) {
        setTournamentId(data.id);
        setJoinCode(code);
        channel = supabase.channel('admin-tournament-status')
          .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${data.id}` },
            (payload) => {
              const upd = payload.new as any;
              setStatus(upd.status);
              setCurrentRound(upd.current_round ?? 1);
              setAllRoundFinished(upd.all_round_finished ?? false);
            })
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${data.id}` },
            () => fetchParticipants(data.id))
          .subscribe();
      }
    }

    initTournament();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user]);

  // Подписка на дуэли при активном турнире
  useEffect(() => {
    let ch: RealtimeChannel | null = null;
    if (tournamentId && status === 'active') {
      fetchActiveDuels(tournamentId);
      ch = supabase.channel(`admin-duels-${tournamentId}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'duels', filter: `tournament_id=eq.${tournamentId}` },
          () => fetchActiveDuels(tournamentId))
        .subscribe();
    }
    return () => { if (ch) supabase.removeChannel(ch); };
  }, [tournamentId, status]);

  async function fetchParticipants(tId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('tournament_participants')
      .select('*, profiles(username, mmr, clearance_level)')
      .eq('tournament_id', tId);
    if (data) setParticipants(data);
    setLoading(false);
  }

  async function fetchActiveDuels(tId?: string) {
    const id = tId || tournamentId;
    if (!id) return;
    const { data } = await supabase
      .from('duels')
      .select(`id, status, player1_score, player2_score, round,
        p1:profiles!duels_player1_id_fkey(username),
        p2:profiles!duels_player2_id_fkey(username)`)
      .eq('tournament_id', id)
      .eq('status', 'active')
      .order('round', { ascending: false });
    if (data) setActiveDuels(data);
  }

  // ── Старт ────────────────────────────────────────────────
  async function startTournament() {
    if (!tournamentId || participants.length < 2) {
      alert('Нужно минимум 2 участника!');
      return;
    }
    setStarting(true);
    try {
      const { error } = await supabase.rpc('start_tournament_engine', { t_id: tournamentId });
      if (error) throw error;
      setStatus('active');
      setAllRoundFinished(false);
    } catch (err: any) {
      console.error(err);
      alert('Ошибка: ' + (err.message || 'Не удалось запустить турнир'));
    } finally {
      setStarting(false);
    }
  }

  // ── Следующий раунд ──────────────────────────────────────
  async function advanceRound() {
    if (!tournamentId) return;
    setAdvancing(true);
    try {
      const { data, error } = await supabase.rpc('advance_tournament_round', { t_id: tournamentId });
      if (error) throw error;
      if (data?.status === 'tournament_finished') {
        setStatus('finished');
      }
      // Realtime сам обновит currentRound и allRoundFinished
    } catch (err: any) {
      console.error(err);
      alert('Ошибка: ' + (err.message || 'Не удалось перейти к следующему раунду'));
    } finally {
      setAdvancing(false);
    }
  }

  async function destroyTournament() {
    if (tournamentId) {
      await supabase.from('tournaments').delete().eq('id', tournamentId);
      onClose();
    }
  }

  const joinLink = `${window.location.origin}/?t=${joinCode}`;

  return (
    <>
      {spectatingDuelId && (
        <SpectatorModal duelId={spectatingDuelId} onClose={() => setSpectatingDuelId(null)} />
      )}

      {forceFinishDuel && (
        <ForceFinishModal
          duel={forceFinishDuel}
          onConfirm={handleForceFinish}
          onCancel={() => setForceFinishDuel(null)}
        />
      )}

      {showConfirmClose && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Закрыть лобби?</h3>
              <p className="text-slate-400 text-sm">
                Турнир ещё не начался. Комната будет уничтожена, участники отключены.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowConfirmClose(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold">
                Отмена
              </button>
              <button onClick={destroyTournament}
                className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300">

        {/* Шапка */}
        <div className="p-6 border-b border-cyan-500/20 flex justify-between items-center bg-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Панель Учителя</h2>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Управление турниром</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowConfirmClose(true)}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              title="Распустить турнир">
              <Trash2 className="w-5 h-5" />
            </button>
            <button onClick={() => status === 'active' || status === 'finished' ? onClose() : setShowConfirmClose(true)}
              className="p-2 hover:bg-slate-700 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* ── Левая колонка ── */}
          <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col bg-slate-800/50 overflow-y-auto shrink-0">

            {status === 'waiting' ? (
              <>
                {/* QR / Ссылка */}
                <div className="mb-6 bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs uppercase tracking-widest font-bold">Код входа</span>
                    <span className="text-4xl font-black text-cyan-300 font-mono tracking-widest">{joinCode}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl w-fit mx-auto mb-3">
                    <QRCode value={joinLink} size={120} />
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(joinLink)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-slate-300 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Копировать ссылку
                  </button>
                </div>

                {/* Кнопка старта */}
                <button
                  disabled={participants.length < 2 || starting}
                  onClick={startTournament}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg mb-3"
                >
                  {starting
                    ? <><Loader className="w-5 h-5 animate-spin" /> ЗАПУСК...</>
                    : <><Play className="w-5 h-5 fill-current" /> НАЧАТЬ БИТВУ</>
                  }
                </button>
                <p className="text-slate-500 text-xs text-center">
                  Минимум 2 участника для старта
                </p>
              </>
            ) : status === 'finished' ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <Trophy className="w-16 h-16 text-amber-400" />
                <h3 className="text-xl font-bold text-white">Турнир завершён!</h3>
                <button onClick={onClose} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold">
                  Закрыть
                </button>
              </div>
            ) : (
              // ── Активный турнир ──────────────────────────────
              <div className="flex flex-col gap-4 h-full">

                {/* Кнопка "Следующий раунд" */}
                {allRoundFinished && (
                  <button
                    onClick={advanceRound}
                    disabled={advancing}
                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-70 text-white font-black text-base rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan-900/50 animate-pulse"
                  >
                    {advancing
                      ? <><Loader className="w-5 h-5 animate-spin" /> Генерация...</>
                      : <><ChevronRight className="w-5 h-5" /> СЛЕДУЮЩИЙ РАУНД ({currentRound + 1})</>
                    }
                  </button>
                )}

                {!allRoundFinished && (
                  <div className="p-3 bg-slate-900/40 border border-slate-700 rounded-xl flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Раунд {currentRound} — матчи идут...
                  </div>
                )}

                {/* Активные матчи */}
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  ПРЯМОЙ ЭФИР ({activeDuels.length})
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {activeDuels.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">Нет активных матчей</p>
                  )}
                  {activeDuels.map((duel) => (
                    <div key={duel.id}
                      className="bg-slate-800 border border-slate-700 p-4 rounded-xl transition-all relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-2 font-mono">
                          <span className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 border border-slate-700">R{duel.round}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSpectatingDuelId(duel.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors text-xs"
                              title="Смотреть матч"
                            >
                              <Eye className="w-3 h-3" /> Watch
                            </button>
                            <button
                              onClick={() => setForceFinishDuel(duel)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-colors text-xs"
                              title="Скипнуть матч"
                            >
                              <SkipForward className="w-3 h-3" /> Скип
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-white truncate max-w-[80px]">{duel.p1?.username || '???'}</div>
                          <div className="text-sm font-mono font-black text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                            {duel.player1_score} : {duel.player2_score}
                          </div>
                          <div className="font-bold text-white truncate max-w-[80px] text-right">{duel.p2?.username || '???'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Правая колонка ── */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {status === 'active' || status === 'finished' ? (
              <div className="h-full min-h-[500px]">
                {tournamentId && (
                  <TournamentBracket
                    tournamentId={tournamentId}
                    onEnterMatch={() => {}}
                    isTeacher={true}
                  />
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                      <Users className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Участники</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => tournamentId && fetchParticipants(tournamentId)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-slate-300 font-mono text-sm">
                      {participants.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto">
                  {participants.map((p) => {
                    const username = p.profiles?.username || 'Неизвестный';
                    const mmr = p.profiles?.mmr || '???';
                    const lvl = p.profiles?.clearance_level ?? 0;
                    const letter = username[0]?.toUpperCase() || '?';

                    return (
                      <div key={p.id}
                        className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center gap-3 group hover:border-slate-600 transition-all">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                          {letter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">{username}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {mmr} MP · Ур.{lvl}
                          </div>
                        </div>
                        <button
                          onClick={() => kickPlayer(p.user_id, username)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title={`Кикнуть ${username}`}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}