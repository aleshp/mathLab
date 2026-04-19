import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Latex from 'react-latex-next';
import { checkAnswer } from '../lib/mathUtils';
import confetti from 'canvas-confetti';
import 'katex/dist/katex.min.css';
import {
  ArrowLeft, CheckCircle2, XCircle, Zap, Loader,
  MessageSquare, AlertCircle, Lock, ChevronLeft, ChevronRight, Coins
} from 'lucide-react';
import { CompanionChat } from './CompanionChat';
import { MathInput } from './MathInput';
import { MathKeypad } from './MathKeypad';

type Problem = {
  id: string;
  question: string;
  question_kz?: string;
  answer: string;
  type: string;
  hint?: string;
  hint_kz?: string;
  image_url?: string;
};

type ReactorProps = {
  module: Module;
  onBack: () => void;
  onRequestAuth?: () => void;
  forcedProblemIds?: string[] | null;
};

type AchToast = {
  name: string;
  coins: number;
};

function AchievementToast({ name, coins, onDone }: AchToast & { onDone: () => void }) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOut(true);
      setTimeout(onDone, 400);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 360,
    }}>
      <style>{`
        @keyframes ach-in {
          from { transform: translateY(-120%) scale(0.95); opacity: 0; filter: blur(8px); }
          to   { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes ach-out {
          from { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
          to   { transform: translateY(-120%) scale(0.95); opacity: 0; filter: blur(8px); }
        }
        @keyframes ach-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ach-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(6,182,212,0.25)',
        borderRadius: 20,
        padding: '18px 20px 14px',
        overflow: 'hidden',
        position: 'relative',
        animation: out
          ? 'ach-out 0.4s ease-in forwards'
          : 'ach-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120,
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#22d3ee', fontWeight: 700, marginBottom: 4,
        }}>
          Достижение разблокировано
        </div>
        <div style={{
          fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 8,
          background: 'linear-gradient(90deg, #fff 0%, #94a3b8 50%, #fff 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'ach-shimmer 2.5s linear infinite',
        }}>
          {name}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 8, padding: '3px 10px',
          fontSize: 12, fontWeight: 800, color: '#fbbf24',
        }}>
          <span style={{ width: 8, height: 8, background: '#fbbf24', borderRadius: '50%', display: 'inline-block' }} />
          +{coins} MathCoins
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
          animation: 'ach-bar 3s linear forwards',
        }} />
      </div>
    </div>
  );
}

export function Reactor({ module, onBack, onRequestAuth, forcedProblemIds }: ReactorProps) {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const mfRef = useRef<any>(null);

  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState<number | null>(null);
  const [achToast, setAchToast] = useState<AchToast | null>(null);

  const [streak, setStreak] = useState(0);
  const [alreadySolvedIds, setAlreadySolvedIds] = useState<Set<string>>(new Set());

  const GUEST_LIMIT = 3;
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    async function fetchProblems() {
      setLoading(true);
      try {
        let query = supabase.from('problems').select('*');
        if (forcedProblemIds && forcedProblemIds.length > 0) {
          query = query.in('id', forcedProblemIds);
        } else {
          query = query.eq('module_id', module.id);
        }

        const { data } = await query;
        if (data && data.length > 0) {
          const shuffled = data.sort(() => 0.5 - Math.random());
          setProblems(shuffled);
          setCurrentProblem(shuffled[0]);

          if (user) {
            const { data: solved } = await supabase
              .from('experiments')
              .select('problem_id')
              .eq('user_id', user.id)
              .eq('correct', true);
            if (solved) {
              setAlreadySolvedIds(new Set(solved.map((e: any) => e.problem_id)));
            }
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, [module.id, forcedProblemIds, user?.id]);

  function loadNextProblem() {
    if (!user && problemsSolved >= GUEST_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setEarnedCoins(null);
    let nextProblems = [...problems];
    if (forcedProblemIds && result === 'correct' && currentProblem) {
      nextProblems = problems.filter(p => p.id !== currentProblem.id);
      setProblems(nextProblems);
    }

    if (nextProblems.length === 0) {
      setCurrentProblem(null);
      return;
    }

    const randomProblem = nextProblems[Math.floor(Math.random() * nextProblems.length)];
    setCurrentProblem(randomProblem);
    setResult(null);
    setShowHint(false);
    setStartTime(Date.now());
    setUserAnswer('');

    if (mfRef.current) {
      mfRef.current.setValue('');
      setTimeout(() => mfRef.current?.focus({ preventScroll: true }), 50);
    }
  }

  async function claimAchievement(name: string) {
    if (!user) return;

    const { data: ach } = await supabase
      .from('achievements')
      .select('id, name, reward_coins')
      .eq('name', name)
      .maybeSingle();

    if (!ach) {
      console.error(`[Achievement] Not found: ${name}`);
      return;
    }

    const { data: success, error } = await supabase.rpc('claim_achievement', {
      target_ach_id: ach.id,
    });

    if (error) {
      console.error('[Achievement] RPC Error:', error.message);
      return;
    }

    if (success) {
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#fbbf24', '#f59e0b', '#ffffff'],
      });
      setAchToast({ name: ach.name, coins: ach.reward_coins ?? 0 });
      await refreshProfile();
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!currentProblem) return;

    const isCorrect = checkAnswer(userAnswer, currentProblem.answer);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setResult(isCorrect ? 'correct' : 'incorrect');
    setProblemsSolved(prev => prev + 1);

    if (user) {
      await supabase.from('experiments').insert({
        user_id: user.id,
        module_id: module.id,
        problem_id: currentProblem.id,
        problem_type: currentProblem.type,
        correct: isCorrect,
        time_spent: timeSpent,
      });

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);

        const isFirstSolveOfThis = !alreadySolvedIds.has(currentProblem.id);

        if (isFirstSolveOfThis) {
          const coinsToGive = profile?.is_premium ? 10 : 5;
          await supabase.rpc('grant_coins', { amount: coinsToGive });
          setEarnedCoins(coinsToGive);
          setAlreadySolvedIds(prev => new Set([...prev, currentProblem.id]));
          await claimAchievement('Первый шаг');
        }

        if (newStreak === 10) {
          await claimAchievement('Безошибочный эксперимент');
        }

        if (!forcedProblemIds) {
          const today = new Date().toISOString().split('T')[0];
          const { data: dq } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          if (!dq || dq.quest_date !== today) {
            await supabase.from('daily_quests').upsert({
              user_id: user.id,
              quest_date: today,
              pve_solved: 1,
            });
          } else {
            await supabase
              .from('daily_quests')
              .update({ pve_solved: (dq.pve_solved || 0) + 1 })
              .eq('user_id', user.id);
          }
        }

        setTimeout(() => refreshProfile(), 500);
      } else {
        setStreak(0);
        if (!forcedProblemIds) {
          await supabase.from('user_errors').insert({
            user_id: user.id,
            problem_id: currentProblem.id,
            module_id: module.id,
            user_answer: userAnswer,
            correct_answer: currentProblem.answer,
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    setTimeout(() => loadNextProblem(), 2000);
  }

  const handleKeypadCommand = (cmd: string, arg?: string) => {
    if (!mfRef.current) return;
    if (cmd === 'insert') mfRef.current.executeCommand(['insert', arg]);
    else if (cmd === 'perform') mfRef.current.executeCommand([arg]);
    mfRef.current.focus({ preventScroll: true });
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader className="animate-spin text-cyan-400 w-10 h-10" />
    </div>
  );

  if (showPaywall) return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-in zoom-in duration-300">
      <div className="bg-slate-800 border border-amber-500/30 p-8 rounded-3xl max-w-md shadow-2xl">
        <Lock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-3">{t('reactor.demo_finished_title')}</h2>
        <p className="text-slate-400 mb-8">{t('reactor.demo_finished_desc')}</p>
        <button
          onClick={onRequestAuth}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl"
        >
          {t('reactor.create_account')}
        </button>
        <button onClick={onBack} className="mt-4 text-slate-500 hover:text-white text-sm">
          {t('reactor.return')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto pb-20 custom-scrollbar">

      {achToast && (
        <AchievementToast
          name={achToast.name}
          coins={achToast.coins}
          onDone={() => setAchToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-8">

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-400 font-bold px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('reactor.back')}</span>
          </button>

          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <div className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 border border-orange-400 rounded-full text-white text-xs font-black animate-bounce shadow-lg shadow-orange-900/40">
                🔥 {streak} В РЯД
              </div>
            )}
            {!user && (
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-mono font-bold">
                {t('reactor.demo_limit')}: {problemsSolved}/{GUEST_LIMIT}
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg shadow-orange-900/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {forcedProblemIds ? t('reactor.error_work') : t('reactor.title')}
            </h1>
          </div>
          <p className="text-cyan-300/60 font-mono text-xs uppercase tracking-widest pl-1">
            {t('reactor.module')}: {i18n.language === 'kk' && module.name_kz ? module.name_kz : module.name}
          </p>
        </div>

        {currentProblem ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-5 md:p-10 mb-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />

            <div className="mb-8 relative z-10">
              {currentProblem.image_url && (
                <img
                  src={currentProblem.image_url}
                  alt="Problem"
                  className="max-h-64 rounded-2xl border border-cyan-500/30 mx-auto mb-8 bg-slate-900/50 p-2"
                />
              )}
              <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed text-center">
                <Latex>{i18n.language === 'kk' && currentProblem.question_kz ? currentProblem.question_kz : currentProblem.question}</Latex>
              </h2>
            </div>

            {result === null ? (
              <div className="space-y-6 relative z-10">
                <MathInput
                  value={userAnswer}
                  onChange={setUserAnswer}
                  onSubmit={() => handleSubmit()}
                  mfRef={mfRef}
                />
                <MathKeypad
                  onCommand={handleKeypadCommand}
                  onDelete={() => mfRef.current?.executeCommand(['deleteBackward'])}
                  onClear={() => { mfRef.current?.setValue(''); setUserAnswer(''); }}
                  onSubmit={() => handleSubmit()}
                />

                <div className="flex justify-between items-center gap-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => { mfRef.current?.executeCommand(['moveToPreviousChar']); mfRef.current?.focus(); }}
                      className="p-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl transition-colors active:scale-90"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={() => { mfRef.current?.executeCommand(['moveToNextChar']); mfRef.current?.focus(); }}
                      className="p-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl transition-colors active:scale-90"
                    >
                      <ChevronRight />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {user && (
                      <button
                        onClick={() => setShowChat(true)}
                        className="px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center gap-2 font-black hover:bg-amber-500/20 transition-all active:scale-95 shadow-lg shadow-amber-900/20"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden sm:inline">{t('reactor.suricat')}</span>
                      </button>
                    )}
                    {!showHint && currentProblem.hint && (
                      <button
                        onClick={() => setShowHint(true)}
                        className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-black rounded-2xl transition-all active:scale-95 shadow-lg"
                      >
                        ?
                      </button>
                    )}
                  </div>
                </div>

                {showHint && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex gap-4 text-blue-200 text-sm leading-relaxed animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0 text-blue-400" />
                    <Latex>{i18n.language === 'kk' && currentProblem.hint_kz ? currentProblem.hint_kz : currentProblem.hint!}</Latex>
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 animate-in zoom-in duration-300 ${
                result === 'correct'
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-red-500/10 border-red-500/50'
              }`}>
                <div className={`p-4 rounded-full ${
                  result === 'correct'
                    ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                }`}>
                  {result === 'correct'
                    ? <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    : <XCircle className="w-10 h-10 text-red-400" />}
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-black uppercase tracking-widest ${
                    result === 'correct' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {result === 'correct' ? t('reactor.correct') : t('reactor.incorrect')}
                  </div>
                  {result === 'correct' && user && (
                    <div className="flex justify-center gap-3 mt-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400 font-black uppercase">
                        <Zap className="w-3.5 h-3.5 fill-current" /> +{profile?.is_premium ? 20 : 10} SXP
                      </div>
                      {earnedCoins !== null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 font-black uppercase animate-pulse">
                          <Coins className="w-3.5 h-3.5 fill-current" /> +{earnedCoins} MC
                        </div>
                      )}
                    </div>
                  )}
                  {result === 'incorrect' && (
                    <div className="text-slate-300 text-sm mt-3 font-medium">
                      {t('reactor.correct_answer')}{' '}
                      <span className="text-white font-mono font-bold bg-slate-700 px-3 py-1 rounded-lg ml-1 shadow-inner">
                        <Latex>{`$${currentProblem.answer}$`}</Latex>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2rem] animate-in fade-in">
            <Zap className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">{t('reactor.module_finished')}</p>
          </div>
        )}
      </div>

      {showChat && currentProblem && (
        <CompanionChat onClose={() => setShowChat(false)} problemContext={currentProblem.question} />
      )}
    </div>
  );
}