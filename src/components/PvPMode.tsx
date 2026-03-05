import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VsScreen } from './VsScreen';
import Latex from 'react-latex-next';
import {
  Zap,
  Loader,
  Trophy,
  XCircle,
  Play,
  Timer,
  WifiOff,
  ArrowLeft,
  Flag,
  AlertTriangle,
  Target,
  Info,
  Users // <-- Добавлена иконка Users
} from 'lucide-react';
import { getPvPRank, getPvPShortRank } from '../lib/gameLogic';
import { MathKeypad } from './MathKeypad';
import { MathInput } from './MathInput';
import { checkAnswer } from '../lib/mathUtils';
import { useBotOpponent, getDeterministicBotName } from '../hooks/useBotOpponent';
import { recordCalibrationMatch } from '../lib/CalibrationSystem';
import { PvPRank } from '../lib/PvPRankSystem';
import { RankUpModal } from './RankUpModal';
import { RankLegendModal } from './RankLegendModal';

const BOT_UUID = 'c00d4ad6-1ed1-4195-b596-ac6960f3830a';
const PVP_MODULE_ID = '00000000-0000-0000-0000-000000000099';
const BASE_MMR = 700;

type DuelState = 'lobby' | 'searching' | 'vs_screen' | 'battle' | 'finished';

type Props = {
  onBack: () => void;
  initialDuelId?: string | null;
};

export function PvPMode({ onBack, initialDuelId }: Props) {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();

  // === State ===
  const [status, setStatus] = useState<DuelState>(initialDuelId ? 'searching' : 'lobby');
  const [duelId, setDuelId] = useState<string | null>(initialDuelId || null);

  // Opponent Data
  const[opponentName, setOpponentName] = useState<string>('???');
  const [opponentMMR, setOpponentMMR] = useState<number>(1000);
  const [isBotMatch, setIsBotMatch] = useState(false);
  const [botName, setBotName] = useState<string>('Bot');
  
  // Флаг дружеского матча (Патч 2)
  const[isFriendlyMatch, setIsFriendlyMatch] = useState(false);

  // Game Data
  const [problems, setProblems] = useState<any[]>([]);
  const [currentProbIndex, setCurrentProbIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [oppProgress, setOppProgress] = useState(0);

  // Input
  const [userAnswer, setUserAnswer] = useState('');
  const mfRef = useRef<any>(null);

  // Results & UI
  const [winner, setWinner] = useState<'me' | 'opponent' | 'draw' | null>(null);
  const [mmrChange, setMmrChange] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  // Modals / Statuses
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const[showRankLegend, setShowRankLegend] = useState(false);

  // Search timer
  const [searchElapsed, setSearchElapsed] = useState(0);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rank Reveal (Calibration finish)
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealOldMMR, setRevealOldMMR] = useState<number | null>(null);
  const [revealNewMMR, setRevealNewMMR] = useState<number | null>(null);
  const [revealRank, setRevealRank] = useState<PvPRank | null>(null);

  const isAdmin = profile?.role === 'admin';
  const myMMR = profile?.mmr ?? BASE_MMR;

  // === Bot Setup ===
  const botOpponent = useBotOpponent({
    isEnabled: isBotMatch && status === 'battle',
    duelId: duelId,
    playerMMR: myMMR,
    maxQuestions: problems.length || 10,
    initialScore: isBotMatch ? oppScore : 0,
    initialProgress: isBotMatch ? oppProgress : 0,
    onProgressUpdate: async (score, progress) => {
      if (status === 'finished') return;

      setOppScore(score);
      setOppProgress(progress);

      if (duelId) {
        await supabase.from('duels').update({ player2_score: score, player2_progress: progress }).eq('id', duelId);
      }
      if (progress >= (problems.length || 10)) {
        handleBotWin(score);
      }
    }
  });

  useEffect(() => {
    if (botOpponent?.botName) setBotName(botOpponent.botName);
    else if (duelId) setBotName(getDeterministicBotName(duelId));
  }, [botOpponent, duelId]);

  const handleBotWin = async (finalBotScore: number) => {
    if (status === 'finished') return;

    if (duelId) {
      await supabase.from('duels').update({
        status: 'finished',
        player2_score: finalBotScore,
        player2_progress: problems.length
      }).eq('id', duelId);

      await supabase.rpc('finish_duel', {
        duel_uuid: duelId,
        finisher_uuid: BOT_UUID
      });
    }

    if (myScore > finalBotScore) {
      endGame('me', 25);
    } else if (myScore < finalBotScore) {
      endGame('opponent', -25);
    } else {
      endGame('draw', 0);
    }
  };

  // === Admin: Force Win ===
  const handleAdminForceWin = async () => {
    if (!duelId || !user) return;

    const myUpdateData = await getMyUpdateData(problems.length, problems.length);
    await supabase.from('duels').update(myUpdateData).eq('id', duelId);
    await supabase.from('duels').update({ status: 'finished' }).eq('id', duelId);
    await supabase.rpc('finish_duel', { duel_uuid: duelId, finisher_uuid: user.id });

    // Принудительное начисление админу
    const newMMR = (profile?.mmr ?? BASE_MMR) + 25;
    await supabase.from('profiles').update({ mmr: newMMR }).eq('id', user.id);

    endGame(isBotMatch ? 'me' : user.id, 25);
  };

  // === Initial Load / Reconnect ===
  useEffect(() => {
    if (initialDuelId && status === 'searching') {
      reconnectToDuel(initialDuelId);
    }
  },[]);

  async function reconnectToDuel(id: string) {
    const { data: duel } = await supabase.from('duels').select('*').eq('id', id).single();
    if (!duel || duel.status === 'finished') {
      setStatus('finished');
      if (duel) endGame(duel.winner_id, duel.elo_change);
      return;
    }

    // Патч 2: Устанавливаем флаг, если матч дружеский
    setIsFriendlyMatch(!!duel.is_friendly);

    const isP1 = duel.player1_id === user?.id;
    const oppId = isP1 ? duel.player2_id : duel.player1_id;

    if (duel.player2_id === BOT_UUID) {
      setIsBotMatch(true);
      setOpponentName(getDeterministicBotName(id));
      setOppScore(duel.player2_score);
      setOppProgress(duel.player2_progress);
    } else {
      if (oppId) await fetchOpponentData(oppId);
      setOppScore(isP1 ? duel.player2_score : duel.player1_score);
      setOppProgress(isP1 ? duel.player2_progress : duel.player1_progress);
      startBattleSubscription(id, isP1 ? 'player1' : 'player2');
    }

    await loadProblems(duel.problem_ids);
    setMyScore(isP1 ? duel.player1_score : duel.player2_score);
    setCurrentProbIndex(isP1 ? duel.player1_progress : duel.player2_progress);

    setStatus('battle');
  }

  // === Matchmaking ===
  async function findMatch() {
    setStatus('searching');
    setIsBotMatch(false);
    setIsFriendlyMatch(false); // Обычный поиск — это рейтинговый матч
    setSearchElapsed(0);
    
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    searchIntervalRef.current = setInterval(() => {
      setSearchElapsed(prev => prev + 1);
    }, 1000);

    const range = 100; // Уменьшенный диапазон по запросу
    const { data: waitingDuel } = await supabase
      .from('duels')
      .select('*')
      .eq('status', 'waiting')
      .is('tournament_id', null)
      .neq('player1_id', user!.id)
      .gte('player1_mmr', myMMR - range)
      .lte('player1_mmr', myMMR + range)
      .limit(1)
      .maybeSingle();

    if (waitingDuel) {
      setDuelId(waitingDuel.id);
      await loadProblems(waitingDuel.problem_ids);
      await fetchOpponentData(waitingDuel.player1_id);
      await supabase.from('duels').update({
        player2_id: user!.id, player2_mmr: myMMR, status: 'active', player2_last_seen: new Date().toISOString()
      }).eq('id', waitingDuel.id);

      startBattleSubscription(waitingDuel.id, 'player2');
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      setStatus('vs_screen');
      return;
    }

    const { data: allProbs } = await supabase.from('problems').select('id').eq('module_id', PVP_MODULE_ID);
    const shuffled = (allProbs ??[]).sort(() => 0.5 - Math.random()).slice(0, 10).map((p: any) => p.id);

    const { data: newDuel } = await supabase.from('duels').insert({
      player1_id: user!.id, player1_mmr: myMMR, status: 'waiting',
      last_seen: new Date().toISOString(), player1_last_seen: new Date().toISOString(),
      problem_ids: shuffled
    }).select().single();

    if (!newDuel) return;
    setDuelId(newDuel.id);
    await loadProblems(shuffled);

    const channel = supabase.channel(`duel-${newDuel.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${newDuel.id}` },
        (payload) => {
          const newData = payload.new;
          if (newData.status === 'active' && newData.player2_id && newData.player2_id !== BOT_UUID) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            fetchOpponentData(newData.player2_id).then(() => {
              if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
              setStatus('vs_screen');
            });
          }
        })
      .subscribe();

    searchTimeoutRef.current = setTimeout(async () => {
      supabase.removeChannel(channel);
      const fakeBotMMR = myMMR + Math.floor(Math.random() * 100 - 50);
      const resolvedBotName = getDeterministicBotName(newDuel.id);
      setOpponentMMR(fakeBotMMR);
      setOpponentName(resolvedBotName);
      setBotName(resolvedBotName);
      await supabase.from('duels').update({
        status: 'active', player2_id: BOT_UUID, player2_mmr: fakeBotMMR
      }).eq('id', newDuel.id);
      setIsBotMatch(true);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      setStatus('vs_screen');
    }, 7000);
  }

  function startBattleSubscription(id: string, myRole: 'player1' | 'player2') {
    if (isBotMatch) return;
    supabase.channel(`duel-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${id}` },
        (payload) => {
          const newData = payload.new;
          if (myRole === 'player1') {
            setOppScore(newData.player2_score);
            setOppProgress(newData.player2_progress);
          } else {
            setOppScore(newData.player1_score);
            setOppProgress(newData.player1_progress);
          }
          if (newData.status === 'finished') {
            endGame(newData.winner_id, newData.elo_change);
          }
        })
      .subscribe();
  }

  // === Game Logic ===
  async function submitResult(isCorrect: boolean) {
    setFeedback(isCorrect ? 'correct' : 'wrong');
    const newScore = isCorrect ? myScore + 1 : myScore;
    setMyScore(newScore);
    const newProgress = currentProbIndex + 1;

    if (!isCorrect && user && problems[currentProbIndex]) {
      supabase.from('user_errors').insert({
        user_id: user.id, problem_id: problems[currentProbIndex].id, module_id: PVP_MODULE_ID,
        user_answer: userAnswer, correct_answer: problems[currentProbIndex].answer
      }).then(() => {});
    }

    if (duelId) {
      const updateData = isBotMatch
        ? { player1_score: newScore, player1_progress: newProgress, player1_last_seen: new Date().toISOString() }
        : (await getMyUpdateData(newScore, newProgress));

      await supabase.from('duels').update(updateData).eq('id', duelId);

      if (newProgress >= problems.length) {
        await supabase.from('duels').update({ status: 'finished' }).eq('id', duelId);
        await supabase.rpc('finish_duel', { duel_uuid: duelId, finisher_uuid: user!.id });

        if (isBotMatch) {
          if (newScore > oppScore) endGame('me', 25);
          else if (newScore < oppScore) endGame('opponent', -25);
          else endGame('draw', 0);
        }
      }
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentProbIndex(newProgress);
      setUserAnswer('');
      if (mfRef.current) mfRef.current.setValue('');
    }, 1000);
  }

  async function getMyUpdateData(score: number, progress: number) {
    const { data } = await supabase.from('duels').select('player1_id').eq('id', duelId!).single();
    const isP1 = data?.player1_id === user?.id;
    return isP1
      ? { player1_score: score, player1_progress: progress, player1_last_seen: new Date().toISOString() }
      : { player2_score: score, player2_progress: progress, player2_last_seen: new Date().toISOString() };
  }

  const handleAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!duelId || feedback || !userAnswer.trim()) return;
    const isCorrect = checkAnswer(userAnswer, problems[currentProbIndex].answer);
    submitResult(isCorrect);
  };

  const handleTimeout = () => submitResult(false);

  // Timer: Исправленный таймер, который не вызывает лишних рендеров
  useEffect(() => {
    let timer: any;
    if (status === 'battle' && !feedback && currentProbIndex < problems.length) {
      timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, feedback, currentProbIndex, problems.length]);

  // Обработка 0 таймера
  useEffect(() => {
    if (timeLeft === 0 && !feedback && status === 'battle') {
      handleTimeout();
    }
  }, [timeLeft, feedback, status]);

  useEffect(() => setTimeLeft(60), [currentProbIndex]);

  const keypadProps = {
    onCommand: (cmd: string, arg?: string) => {
      if (cmd === 'insert') mfRef.current?.executeCommand(['insert', arg]);
      else mfRef.current?.executeCommand([arg]);
      mfRef.current?.focus();
    },
    onDelete: () => mfRef.current?.executeCommand(['deleteBackward']),
    onClear: () => { mfRef.current?.setValue(''); setUserAnswer(''); },
    onSubmit: () => handleAnswer()
  };

  // === End Game & Calibration Logic ===
  async function endGame(winnerId: string | null, eloChange: number = 0) {
    if (status === 'finished') return;
    setStatus('finished');

    let isWin = false;
    if (winnerId === 'draw') {
      setWinner('draw');
    } else {
      isWin = isBotMatch ? winnerId === 'me' : winnerId === user!.id;
      setWinner(isWin ? 'me' : 'opponent');
    }

    // Расчет изменения MMR на клиенте для ботов
    const change = winnerId === 'draw' ? 0 : isBotMatch ? (isWin ? 25 : -25) : Math.abs(eloChange) * (isWin ? 1 : -1);
    setMmrChange(Math.abs(change));
    
    // Сохраняем старый MMR для показа анимации
    setRevealOldMMR(profile?.mmr ?? BASE_MMR);

    // ВАЖНО: Если это БОТ и НЕ дружеский матч — обновляем MMR клиента вручную
    if (isBotMatch && user && winnerId !== 'draw' && !isFriendlyMatch) {
      const currentMMR = profile?.mmr ?? BASE_MMR;
      const newMMR = Math.max(0, currentMMR + change);
      await supabase.from('profiles').update({ mmr: newMMR }).eq('id', user.id);
    }

    // Logic for calibration (защищено от дружеских матчей)
    if (user && !profile?.has_calibrated && winnerId !== 'draw' && !isFriendlyMatch) {
      try {
        const result = await recordCalibrationMatch(user.id, isWin, opponentMMR);
        if (result && !result.isCalibrating) {
          const finalMMR = result.provisionalMMR;
          setRevealNewMMR(finalMMR);
          setRevealRank(getPvPRank(finalMMR));
          setShowRevealModal(true);
        }
      } catch (e) { console.error(e); }
    }

    await refreshProfile();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
  }

  const confirmSurrender = async () => {
    setShowSurrenderModal(false);
    if (duelId && user) {
      await supabase.from('duels').update({ status: 'finished' }).eq('id', duelId);
      await supabase.rpc('surrender_duel', { duel_uuid: duelId, surrendering_uuid: user.id });
      if (isBotMatch) endGame('opponent', -25);
    }
  };

  const handleExitToMenu = async () => {
    if (duelId) {
      await supabase.from('duels').update({ status: 'finished' }).eq('id', duelId);
    }
    onBack();
  };

  async function loadProblems(ids: string[]) {
    if (!ids?.length) return;
    const { data } = await supabase.from('problems').select('*').in('id', ids);
    setProblems(ids.map(id => data?.find((p: any) => p.id === id)).filter(Boolean));
  }

  async function fetchOpponentData(uid: string) {
    const { data } = await supabase.from('profiles').select('username, mmr').eq('id', uid).single();
    if (data) {
      setOpponentName(data.username);
      setOpponentMMR(data.mmr || 1000);
    }
  }

  // --- RENDERING ---

  // 1. Lobby
  if (status === 'lobby') {
    const isUnranked = !!(profile && !profile.has_calibrated);
    const calibPlayed = profile?.calibration_matches_played ?? 0;

    return (
      <>
        {showRevealModal && revealRank && revealNewMMR !== null && revealOldMMR !== null && (
          <RankUpModal newRank={revealRank} oldMMR={revealOldMMR} newMMR={revealNewMMR} onClose={() => setShowRevealModal(false)} />
        )}

        {showRankLegend && <RankLegendModal onClose={() => setShowRankLegend(false)} />}

        <div className="flex items-center justify-center h-full animate-in fade-in duration-300">
          <div className="text-center space-y-8 max-w-md w-full p-8 bg-slate-800/50 rounded-2xl border border-red-500/30 shadow-2xl relative">

            <button
              onClick={() => setShowRankLegend(true)}
              className="absolute top-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all border border-white/5"
              title="Инфо о рангах"
            >
              <Info className="w-5 h-5" />
            </button>

            <div className="mx-auto w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Zap className="w-12 h-12 text-red-500" />
            </div>

            <div>
              <h1 className="text-4xl font-black text-white italic uppercase mb-2">{t('pvp.title')}</h1>
              <p className="text-red-300/60">{t('pvp.subtitle')}</p>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">{t('pvp.status')}</div>
              <div className="text-2xl font-bold text-white">
                {isUnranked ? (
                  <span className="text-yellow-400 flex items-center justify-center gap-2">
                    <Target className="w-5 h-5" /> {t('pvp.calibration')}: {calibPlayed}/5
                  </span>
                ) : (
                  <>
                    {profile?.mmr} MP <span className="text-sm text-slate-500">({getPvPShortRank(profile?.mmr || 1000)})</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={findMatch}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold text-white text-xl hover:scale-[1.02] transition-transform shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              {t('pvp.btn_find')}
            </button>

            <button onClick={onBack} className="text-slate-500 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto">
              <ArrowLeft className="w-4 h-4" /> {t('pvp.btn_back')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // 2. Searching
  if (status === 'searching') {
    const BOT_TIMER = 7;
    const progress = Math.min((searchElapsed / BOT_TIMER) * 100, 100);
    const remaining = Math.max(BOT_TIMER - searchElapsed, 0);
    const dots = '.'.repeat((searchElapsed % 3) + 1).padEnd(3, '\u00a0');

    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e293b_0%,_#020617_100%)]" />

        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-2 rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
            <div className="absolute inset-4 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.6s' }} />
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
              <Zap className="w-7 h-7 text-red-500 fill-current" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">
              {initialDuelId ? 'Реконнект' : `Поиск${dots}`}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {myMMR} MP · {getPvPShortRank(myMMR)}
            </p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
              <span className="text-slate-500">Время поиска</span>
              <span className={remaining <= 2 ? 'text-amber-400' : 'text-slate-500'}>
                {remaining > 0 ? `соперник через ${remaining}с` : 'подбираем соперника...'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${progress}%`,
                  background: progress > 80
                    ? 'linear-gradient(90deg,#7f1d1d,#ef4444)'
                    : 'linear-gradient(90deg,#1e3a5f,#3b82f6)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-700 font-mono">
              <span>0с</span>
              <span className="text-slate-600">{searchElapsed}с прошло</span>
              <span>7с</span>
            </div>
          </div>

          <div className="w-full space-y-1.5">
            {[
              { done: searchElapsed >= 1, text: 'Подключение к серверу' },
              { done: searchElapsed >= 2, text: 'Поиск соперника в рейтинге ±100 MP' },
              { done: searchElapsed >= 5, active: searchElapsed < 7, text: searchElapsed >= 7 ? 'Соперник не найден' : 'Ожидание игроков онлайн' },
              { done: searchElapsed >= 7, text: 'Подбираем соперника' },
            ].map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                step.done ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  step.done ? 'bg-emerald-500' : 'bg-slate-700'
                }`} />
                {step.text}
              </div>
            ))}
          </div>

          <button
            onClick={async () => {
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
              setSearchElapsed(0);
              if (duelId && !initialDuelId) await supabase.from('duels').delete().eq('id', duelId);
              setDuelId(null);
              setStatus('lobby');
            }}
            className="px-8 py-2.5 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all text-sm font-bold uppercase tracking-wider"
          >
            Отмена
          </button>

        </div>
      </div>
    );
  }

  // 3. VS Screen
  if (status === 'vs_screen') {
    return (
      <VsScreen
        player={profile!}
        opponentName={opponentName}
        opponentMMR={opponentMMR}
        onComplete={() => setStatus('battle')}
      />
    );
  }

  // 4. Battle
  if (status === 'battle') {
    const currentProb = problems[currentProbIndex];

    const questionText = i18n.language === 'kk' && currentProb?.question_kz
      ? currentProb.question_kz
      : currentProb?.question;

    return (
      <div className="flex flex-col h-[100dvh] bg-slate-900 overflow-hidden">

        {showSurrenderModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white mb-1">{t('pvp.surrender_title')}</h3>
                <p className="text-slate-400 text-sm">{t('pvp.surrender_text')}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowSurrenderModal(false)} className="px-4 py-3 bg-slate-800 rounded-xl text-white">{t('pvp.cancel')}</button>
                <button onClick={confirmSurrender} className="px-4 py-3 bg-red-600 rounded-xl text-white font-bold">{t('pvp.btn_surrender')}</button>
              </div>
            </div>
          </div>
        )}

        {opponentDisconnected && !isBotMatch && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-bounce z-50">
            <WifiOff className="w-4 h-4" /> <span className="text-xs">{t('pvp.opponent_lost')}</span>
          </div>
        )}

        <div className="flex-shrink-0 bg-slate-900 border-b border-slate-800 shadow-lg z-10">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700">

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSurrenderModal(true)}
                className="p-1.5 text-red-500/50 hover:text-red-500 rounded-lg"
              >
                <Flag className="w-4 h-4" />
              </button>

              {isAdmin && (
                <button
                  onClick={handleAdminForceWin}
                  className="p-1.5 text-yellow-400/60 hover:text-yellow-400 rounded-lg border border-yellow-500/20 hover:border-yellow-400/60 transition-all text-xs font-black"
                  title="Admin: Force Win"
                >
                  👑
                </button>
              )}
            </div>

            <div className="text-right flex items-center gap-2">
              <div>
                <div className="text-cyan-400 text-[10px] font-bold uppercase flex items-center gap-1 justify-end">
                  {isFriendlyMatch && <Users className="w-3 h-3 text-emerald-400" />}
                  {t('pvp.you')}
                </div>
                <div className="text-xl font-black text-white leading-none">{myScore}</div>
              </div>
            </div>

            <div className="flex flex-col items-center px-3">
              <div className={`flex items-center gap-1 font-mono font-bold text-lg ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                <Timer className="w-3.5 h-3.5" /> {timeLeft}
              </div>
            </div>

            <div className="text-left">
              <div className="text-red-400 text-[10px] font-bold truncate max-w-[70px] uppercase">
                {isBotMatch ? botName : opponentName}
              </div>
              <div className="text-xl font-black text-white leading-none">{oppScore}</div>
            </div>
          </div>

          <div className="space-y-1 px-3 py-2 bg-slate-900">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${(currentProbIndex / (problems.length || 10)) * 100}%` }} />
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${(oppProgress / (problems.length || 10)) * 100}%` }} />
            </div>
          </div>
        </div>

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
              <Loader className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-lg font-bold">{t('pvp.loading_task')}</span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 shadow-2xl z-20 pb-safe">
          {feedback ? (
            <div className={`p-8 flex flex-col items-center justify-center h-[320px] animate-in zoom-in duration-200 ${feedback === 'correct' ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
              <div className={`text-4xl font-black mb-2 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback === 'correct' ? t('pvp.win') : t('pvp.loss')}
              </div>
            </div>
          ) : (
            <div className="p-2">
              <div className="mb-2 px-1">
                <MathInput
                  value={userAnswer}
                  onChange={setUserAnswer}
                  onSubmit={handleAnswer}
                  mfRef={mfRef}
                />
              </div>
              <MathKeypad {...keypadProps} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Finished
  if (status === 'finished') {
    const isWin = winner === 'me';
    const isDraw = winner === 'draw';
    const isCalibrating = profile?.is_calibrating;

    return (
      <>
        {showRevealModal && revealRank && revealNewMMR !== null && revealOldMMR !== null && (
          <RankUpModal newRank={revealRank} oldMMR={revealOldMMR} newMMR={revealNewMMR} onClose={() => setShowRevealModal(false)} />
        )}

        <div className="flex items-center justify-center h-full p-4 animate-in zoom-in duration-300">
          <div className="text-center p-8 md:p-12 bg-slate-800 rounded-3xl border-2 border-slate-600 shadow-2xl max-w-lg w-full">
            
            {/* Патч 2: Бейдж дружеского матча */}
            {isFriendlyMatch && (
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold shadow-sm">
                <Users className="w-4 h-4" />
                Дружеский матч · Рейтинг не меняется
              </div>
            )}

            {isWin ? (
              <>
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
                <h1 className="text-4xl font-black text-yellow-400 mb-2">{t('pvp.win')}</h1>
                {opponentDisconnected && !isBotMatch ? (
                  <p className="text-emerald-300 mb-6 text-sm">{t('pvp.opponent_resigned')}</p>
                ) : isCalibrating && !isFriendlyMatch ? (
                  <p className="text-slate-300 font-mono mb-6">{t('pvp.calib_recorded')}</p>
                ) : isFriendlyMatch ? (
                  <p className="text-emerald-400 font-bold text-lg mb-6">Отличная игра!</p>
                ) : (
                  <p className="text-emerald-400 font-bold text-lg mb-6 animate-pulse">+ {mmrChange} MP</p>
                )}
              </>
            ) : isDraw ? (
              <>
                <Flag className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                <h1 className="text-4xl font-black text-slate-300 mb-2">{t('pvp.draw')}</h1>
                {isFriendlyMatch ? (
                  <p className="text-slate-500 mb-6">Хорошая тренировка</p>
                ) : (
                  <p className="text-slate-500 mb-6">0 MP</p>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h1 className="text-4xl font-black text-red-500 mb-2">{t('pvp.loss')}</h1>
                {isCalibrating && !isFriendlyMatch ? (
                  <p className="text-slate-400 mb-6">{t('pvp.result_recorded')}</p>
                ) : isFriendlyMatch ? (
                  <p className="text-slate-400 mb-6">Повезет в следующий раз</p>
                ) : (
                  <p className="text-slate-400 mb-6">- {mmrChange} MP</p>
                )}
              </>
            )}

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
              <div className="text-xs text-slate-500 mb-1 uppercase tracking-widest">{t('pvp.match_score')}</div>
              <div className="flex items-center justify-center gap-4 text-3xl font-mono font-bold">
                <span className={isWin ? 'text-yellow-400' : 'text-slate-500'}>{myScore}</span>
                <span className="text-slate-600">:</span>
                <span className={!isWin && !isDraw ? 'text-yellow-400' : 'text-slate-500'}>{oppScore}</span>
              </div>
            </div>

            <button onClick={handleExitToMenu} className="w-full px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors">
              {t('pvp.btn_menu')}
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
