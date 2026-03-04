import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Latex from 'react-latex-next';
import { Loader, Trophy, XCircle, Timer, Flag, AlertTriangle, WifiOff, CheckCircle2, XOctagon } from 'lucide-react';
import { MathKeypad } from './MathKeypad';
import { MathInput } from './MathInput';
import { checkAnswer } from '../lib/mathUtils';
import { RealtimeChannel } from '@supabase/supabase-js';

type Props = {
  duelId: string;
  onFinished: () => void;
};

export function TournamentPlay({ duelId, onFinished }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string>('Соперник');

  const [problems, setProblems] = useState<any[]>([]);
  const [currentProbIndex, setCurrentProbIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [oppProgress, setOppProgress] = useState(0);

  const [userAnswer, setUserAnswer] = useState('');
  const mfRef = useRef<any>(null);

  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [matchStatus, setMatchStatus] = useState<'active' | 'finished'>('active');
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const isP1Ref = useRef(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);
  // Stable ref — prevents useEffect re-running when parent re-renders
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const handleKeypadCommand = (cmd: string, arg?: string) => {
    if (!mfRef.current) return;
    const scrollY = window.scrollY;
    if (cmd === 'insert') mfRef.current.executeCommand(['insert', arg]);
    else if (cmd === 'perform') mfRef.current.executeCommand([arg]);
    if (document.activeElement !== mfRef.current) mfRef.current.focus({ preventScroll: true });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const handleKeypadDelete = () => {
    if (!mfRef.current) return;
    const scrollY = window.scrollY;
    mfRef.current.executeCommand(['deleteBackward']);
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const handleKeypadClear = () => {
    if (!mfRef.current) return;
    const scrollY = window.scrollY;
    mfRef.current.setValue('');
    setUserAnswer('');
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  };

  const applyFinish = useCallback((wId: string, p1Score: number, p2Score: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const isP1 = isP1Ref.current;
    setWinnerId(wId);
    setMyScore(isP1 ? p1Score : p2Score);
    setOppScore(isP1 ? p2Score : p1Score);
    setFeedback(null);
    setMatchStatus('finished');
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    async function initMatch() {
      if (!user) return;

      // Retry: дуэль могла быть только что создана и ещё не видна
      let duel: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await supabase
          .from('duels')
          .select('*')
          .eq('id', duelId)
          .single();
        if (data) { duel = data; break; }
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
      }

      if (!duel) {
        setLoadError('Не удалось загрузить матч. Попробуй обновить страницу.');
        setLoading(false);
        return;
      }

      // Reconnect: матч уже завершён
      if (duel.status === 'finished') {
        applyFinish(duel.winner_id, duel.player1_score, duel.player2_score);
        setLoading(false);
        return;
      }

      const isP1 = duel.player1_id === user.id;
      isP1Ref.current = isP1;
      const oppId = isP1 ? duel.player2_id : duel.player1_id;

      if (!duel.problem_ids || duel.problem_ids.length === 0) {
        setLoadError('В матче нет задач. Обратись к учителю — возможно не добавлены задачи в турнирный модуль.');
        setLoading(false);
        return;
      }
      await loadProblems(duel.problem_ids);

      if (oppId) {
        const { data: oppProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', oppId)
          .single();
        if (oppProfile) setOpponentName(oppProfile.username);
      } else {
        setOpponentName(t('tournaments.waiting_player'));
      }

      setCurrentProbIndex(isP1 ? duel.player1_progress : duel.player2_progress);
      setMyScore(isP1 ? duel.player1_score : duel.player2_score);
      setOppScore(isP1 ? duel.player2_score : duel.player1_score);
      setOppProgress(isP1 ? duel.player2_progress : duel.player1_progress);
      setLoading(false);

      channel = supabase
        .channel(`t-duel-${duel.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duel.id}` },
          (payload) => {
            const d = payload.new as any;
            const p1 = isP1Ref.current;
            setOppScore(p1 ? d.player2_score : d.player1_score);
            setOppProgress(p1 ? d.player2_progress : d.player1_progress);
            if (d.status === 'finished' && d.winner_id) {
              applyFinish(d.winner_id, d.player1_score, d.player2_score);
            }
          }
        )
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const oppLeft = (leftPresences as any[]).find(p => p.user_id !== user.id);
          if (oppLeft) {
            disconnectTimerRef.current = setTimeout(async () => {
              setOpponentDisconnected(true);
              await supabase.rpc('claim_timeout_win', {
                duel_uuid: duelId,
                claimant_uuid: user.id,
              });
            }, 120_000);
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          const oppBack = (newPresences as any[]).find(p => p.user_id !== user.id);
          if (oppBack && disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
            setOpponentDisconnected(false);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel!.track({ user_id: user.id });
          }
        });
    }

    initMatch();

    return () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [duelId, user, applyFinish]); // onFinished убран — используем ref выше

  const submitResult = useCallback(async (isCorrect: boolean) => {
    if (!user || !duelId || matchStatus === 'finished') return;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    const newScore = isCorrect ? myScore + 1 : myScore;
    setMyScore(newScore);

    try {
      await supabase.rpc('submit_pvp_move', {
        duel_uuid: duelId,
        player_uuid: user.id,
        is_correct: isCorrect,
        problem_idx: currentProbIndex,
      });
    } catch (err) {
      console.error('Ошибка при отправке ответа:', err);
    }

    setTimeout(() => {
      if (finishedRef.current) return;
      setFeedback(null);
      setCurrentProbIndex(prev => prev + 1);
      setUserAnswer('');
      if (mfRef.current) {
        mfRef.current.setValue('');
        setTimeout(() => {
          if (mfRef.current) mfRef.current.focus({ preventScroll: true });
        }, 50);
      }
    }, 900);
  }, [duelId, user, myScore, currentProbIndex, matchStatus]);

  const handleTimeout = useCallback(() => {
    if (feedback || matchStatus === 'finished') return;
    submitResult(false);
  }, [feedback, matchStatus, submitResult]);

  useEffect(() => {
    let timer: any;
    if (matchStatus === 'active' && !feedback && currentProbIndex < problems.length) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { handleTimeout(); return 60; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [matchStatus, feedback, currentProbIndex, problems.length, handleTimeout]);

  useEffect(() => { setTimeLeft(60); }, [currentProbIndex]);

  useEffect(() => {
    if (!loading && mfRef.current && matchStatus === 'active') {
      setTimeout(() => {
        if (mfRef.current) mfRef.current.focus({ preventScroll: true });
      }, 50);
    }
  }, [loading, matchStatus]);

  // АВТО-ВОЗВРАТ В ЛОББИ ЧЕРЕЗ 5 СЕКУНД ПОСЛЕ ФИНИША
  useEffect(() => {
    if (matchStatus === 'finished') {
      const timer = setTimeout(() => {
        onFinishedRef.current(); // Выкидывает обратно в сетку
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [matchStatus]);

  const handleAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (feedback || matchStatus === 'finished' || !userAnswer || userAnswer.trim() === '') return;
    const currentProb = problems[currentProbIndex];
    const isCorrect = checkAnswer(userAnswer, currentProb.answer);
    submitResult(isCorrect);
  };

  const confirmSurrender = async () => {
    setShowSurrenderModal(false);
    if (duelId && user) {
      await supabase.rpc('surrender_duel', { duel_uuid: duelId, surrendering_uuid: user.id });
    }
  };

  async function loadProblems(ids: string[]) {
    if (!ids || ids.length === 0) return;
    const { data } = await supabase.from('problems').select('*').in('id', ids);
    const sorted = ids.map(id => data?.find((p: any) => p.id === id)).filter(Boolean);
    setProblems(sorted);
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-full items-center justify-center flex-col gap-3">
      <Loader className="animate-spin text-cyan-400 w-10 h-10" />
      <p className="text-slate-400 text-sm animate-pulse">Загрузка матча...</p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────
  if (loadError) return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-sm">
        <XOctagon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-white font-bold mb-2">Ошибка загрузки матча</p>
        <p className="text-slate-400 text-sm mb-6">{loadError}</p>
        <button
          onClick={() => onFinishedRef.current()}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold"
        >
          Назад к турниру
        </button>
      </div>
    </div>
  );

  // ── Finished ─────────────────────────────────────────────────
  if (matchStatus === 'finished') {
    const isWinner = winnerId === user!.id;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-12 bg-slate-800 rounded-3xl border-2 border-slate-600 shadow-2xl max-w-lg w-full animate-in zoom-in duration-300">
          {isWinner ? (
            <>
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h1 className="text-4xl font-black text-yellow-400 mb-4">{t('pvp.win')}</h1>
              {opponentDisconnected
                ? <p className="text-emerald-300 mb-8">{t('pvp.opponent_resigned')}</p>
                : <p className="text-slate-300 mb-8">{t('pvp.pass_round')}</p>
              }
            </>
          ) : (
            <>
              <XCircle className="w-24 h-24 text-red-500 mx-auto mb-6" />
              <h1 className="text-4xl font-black text-red-500 mb-4">{t('pvp.loss')}</h1>
              <p className="text-slate-300 mb-8">{t('pvp.good_game')}</p>
            </>
          )}
          <div className="text-4xl font-mono font-bold text-white mb-8">
            {myScore} : {oppScore}
          </div>
          <button
            onClick={() => onFinishedRef.current()}
            className="w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
          >
            {t('tournaments.bracket_title')} (Авто-выход через 5с...)
          </button>
        </div>
      </div>
    );
  }

  const currentProb = problems[currentProbIndex];
  const questionText = i18n.language === 'kk' && currentProb?.question_kz
    ? currentProb.question_kz
    : currentProb?.question;

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900 overflow-hidden">

      {showSurrenderModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t('pvp.surrender_title')}</h3>
              <p className="text-slate-400 text-sm">{t('pvp.surrender_text')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowSurrenderModal(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold">
                {t('pvp.cancel')}
              </button>
              <button onClick={confirmSurrender}
                className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold">
                {t('pvp.btn_surrender')}
              </button>
            </div>
          </div>
        </div>
      )}

      {opponentDisconnected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-bounce z-50 shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs">{t('pvp.opponent_lost')}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 shadow-lg z-10">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700">
          <button onClick={() => setShowSurrenderModal(true)}
            className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
            <Flag className="w-4 h-4" />
          </button>
          <div className="text-right">
            <div className="text-cyan-400 text-[10px] font-bold uppercase">{t('pvp.you')}</div>
            <div className="text-xl font-black text-white leading-none">{myScore}</div>
          </div>
          <div className="flex flex-col items-center px-3">
            <div className={`flex items-center gap-1 font-mono font-bold text-lg ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              <Timer className="w-3.5 h-3.5" /> {timeLeft}
            </div>
          </div>
          <div className="text-left">
            <div className="text-red-400 text-[10px] font-bold truncate max-w-[70px] uppercase">{opponentName}</div>
            <div className="text-xl font-black text-white leading-none">{oppScore}</div>
          </div>
        </div>
        <div className="space-y-1 px-3 py-2 bg-slate-900">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${(currentProbIndex / (problems.length || 10)) * 100}%` }} />
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${(oppProgress / (problems.length || 10)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Problem */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-900 overflow-y-auto">
        {currentProb ? (
          <div className="w-full max-w-lg">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 shadow-xl text-center min-h-[150px] flex flex-col items-center justify-center">
              <div className="text-2xl md:text-3xl font-bold text-white leading-relaxed tracking-wide">
                <Latex>{questionText}</Latex>
              </div>
              <div className="mt-4 text-xs text-slate-500 font-mono uppercase tracking-widest">
                {t('pvp.solve_hint')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white text-sm animate-pulse flex items-center gap-2">
            <Loader className="w-5 h-5 mx-auto mb-1 animate-spin" />
            {t('pvp.loading_task')}
          </div>
        )}
      </div>

      {/* Input / Feedback */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 shadow-2xl z-20 pb-safe">
        {feedback ? (
          // Показываем "Верно/Неверно" — НЕ "Победа/Поражение"
          <div className={`p-8 flex items-center justify-center animate-in zoom-in duration-200 min-h-[320px] ${
            feedback === 'correct' ? 'bg-emerald-900/20' : 'bg-red-900/20'
          }`}>
            <div className="text-center">
              {feedback === 'correct'
                ? <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                : <XOctagon className="w-16 h-16 text-red-400 mx-auto mb-3" />
              }
              <div className={`text-2xl font-black ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback === 'correct' ? 'Верно!' : 'Неверно'}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2">
            <div className="mb-2 px-1">
              <MathInput
                value={userAnswer}
                onChange={setUserAnswer}
                onSubmit={() => handleAnswer()}
                mfRef={mfRef}
              />
            </div>
            <MathKeypad
              onCommand={handleKeypadCommand}
              onDelete={handleKeypadDelete}
              onClear={handleKeypadClear}
              onSubmit={() => handleAnswer()}
            />
          </div>
        )}
      </div>
    </div>
  );
}