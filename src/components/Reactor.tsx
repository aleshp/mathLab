// src/components/Reactor.tsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Latex from 'react-latex-next';
import { checkAnswer } from '../lib/mathUtils';
import confetti from 'canvas-confetti'; // <-- Не забудь импорт
import 'katex/dist/katex.min.css';
import {
  ArrowLeft, CheckCircle2, XCircle, Zap, Loader,
  MessageSquare, AlertCircle, Lock, ChevronLeft, ChevronRight, Coins
} from 'lucide-react';
import { CompanionChat } from './CompanionChat';
import { MathInput } from './MathInput';
import { MathKeypad } from './MathKeypad';

type Problem = {
  id: string; question: string; question_kz?: string; answer: string;
  type: string; hint?: string; hint_kz?: string; image_url?: string;
};

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
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState<number | null>(null);
  
  // === СОСТОЯНИЕ ДЛЯ ДОСТИЖЕНИЙ ===
  const [streak, setStreak] = useState(0);
  const [alreadySolvedIds, setAlreadySolvedIds] = useState<Set<string>>(new Set());

  const GUEST_LIMIT = 3;
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    async function fetchProblems() {
      setLoading(true);
      try {
        let query = supabase.from('problems').select('*');
        if (forcedProblemIds && forcedProblemIds.length > 0) query = query.in('id', forcedProblemIds);
        else query = query.eq('module_id', module.id);
        
        const { data } = await query;
        if (data && data.length > 0) {
          const shuffled = data.sort(() => 0.5 - Math.random());
          setProblems(shuffled);
          setCurrentProblem(shuffled[0]);

          if (user) {
            const problemIds = shuffled.map((p: any) => p.id);
            const { data: solved } = await supabase.from('experiments').select('problem_id').eq('user_id', user.id).eq('correct', true).in('problem_id', problemIds);
            if (solved) setAlreadySolvedIds(new Set(solved.map((e: any) => e.problem_id)));
          }
        }
      } finally { setLoading(false); }
    }
    fetchProblems();
  }, [module.id, forcedProblemIds, user?.id]);

  function loadNextProblem() {
    if (!user && problemsSolved >= GUEST_LIMIT) { setShowPaywall(true); return; }
    setEarnedCoins(null);
    let nextProblems = [...problems];
    if (forcedProblemIds && result === 'correct' && currentProblem) {
      nextProblems = problems.filter(p => p.id !== currentProblem.id);
      setProblems(nextProblems);
    }
    if (nextProblems.length === 0) { setCurrentProblem(null); return; }
    const randomProblem = nextProblems[Math.floor(Math.random() * nextProblems.length)];
    setCurrentProblem(randomProblem);
    setResult(null); setShowHint(false); setStartTime(Date.now()); setUserAnswer('');
    if (mfRef.current) { mfRef.current.setValue(''); setTimeout(() => mfRef.current?.focus({ preventScroll: true }), 50); }
  }

  async function checkAndGrantAchievement(name: string) {
    if (!user) return;
    const { data: ach } = await supabase.from('achievements').select('id').eq('name', name).maybeSingle();
    if (ach) {
      const { data: claimed } = await supabase.rpc('claim_achievement', { target_ach_id: ach.id });
      if (claimed) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#facc15', '#fbbf24', '#ffffff'] });
      }
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
        user_id: user.id, module_id: module.id, problem_id: currentProblem.id,
        problem_type: currentProblem.type, correct: isCorrect, time_spent: timeSpent,
      });

      if (isCorrect) {
        setCorrectCount(prev => prev + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        const isFirstSolve = !alreadySolvedIds.has(currentProblem.id);
        setAlreadySolvedIds(prev => new Set([...prev, currentProblem.id]));

        // === ЛОГИКА НАГРАД ===
        if (isFirstSolve) {
          const coinsToGive = profile?.is_premium ? 10 : 5;
          await supabase.rpc('grant_coins', { amount: coinsToGive });
          setEarnedCoins(coinsToGive);
          
          // Проверка ачивки "Первый шаг"
          if (profile?.total_experiments === 0) await checkAndGrantAchievement('Первый шаг');
        }

        // Проверка ачивки за стрик
        if (newStreak === 10) await checkAndGrantAchievement('Безошибочный эксперимент');

        // Квесты (Daily)
        if (!forcedProblemIds) {
          const today = new Date().toISOString().split('T')[0];
          const { data: dq } = await supabase.from('daily_quests').select('*').eq('user_id', user.id).maybeSingle();
          if (!dq || dq.quest_date !== today) {
            await supabase.from('daily_quests').upsert({ user_id: user.id, quest_date: today, pve_solved: 1 });
          } else {
            await supabase.from('daily_quests').update({ pve_solved: dq.pve_solved + 1 }).eq('user_id', user.id);
          }
        }
        setTimeout(() => refreshProfile(), 500);
      } else {
        setStreak(0); // Сброс стрика
        if (!forcedProblemIds) {
           await supabase.from('user_errors').insert({
            user_id: user.id, problem_id: currentProblem.id, module_id: module.id,
            user_answer: userAnswer, correct_answer: currentProblem.answer,
            expires_at: new Date(Date.now() + 48*60*60*1000).toISOString()
          });
        }
      }
    }
    setTimeout(() => loadNextProblem(), 2000);
  }

  // ... (команды клавиатуры и moveCursor остаются такими же)

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
    mfRef.current.executeCommand(['deleteBackward']);
  };

  const handleKeypadClear = () => {
    if (!mfRef.current) return;
    mfRef.current.setValue('');
    setUserAnswer('');
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader className="animate-spin text-cyan-400 w-10 h-10" /></div>;

  if (showPaywall) return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="bg-slate-800 border border-amber-500/30 p-8 rounded-3xl max-w-md shadow-2xl">
        <Lock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-3">{t('reactor.demo_finished_title')}</h2>
        <p className="text-slate-400 mb-8">{t('reactor.demo_finished_desc')}</p>
        <button onClick={onRequestAuth} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl">{t('reactor.create_account')}</button>
        <button onClick={onBack} className="mt-4 text-slate-500 hover:text-white text-sm">{t('reactor.return')}</button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto pb-20 custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 font-bold px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" /> {t('reactor.back')}
          </button>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-orange-400 text-xs font-black animate-bounce">
                🔥 СТРИК: {streak}
              </div>
            )}
            {!user && <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-mono">{t('reactor.demo_limit')}: {problemsSolved}/{GUEST_LIMIT}</div>}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg"><Zap className="w-5 h-5 text-white" /></div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{forcedProblemIds ? t('reactor.error_work') : t('reactor.title')}</h1>
          </div>
          <p className="text-cyan-300/60 font-mono text-xs uppercase tracking-wider">{t('reactor.module')}: {modName}</p>
        </div>

        {currentProblem ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-4 md:p-8 mb-6 relative shadow-2xl">
            <div className="mb-8">
              {currentProblem.image_url && <img src={currentProblem.image_url} alt="Problem" className="max-h-64 rounded-lg border border-cyan-500/30 mx-auto mb-6" />}
              <h2 className="text-xl md:text-2xl font-semibold text-white leading-relaxed"><Latex>{i18n.language === 'kk' && currentProblem.question_kz ? currentProblem.question_kz : currentProblem.question}</Latex></h2>
            </div>

            {result === null ? (
              <div className="space-y-4">
                <MathInput value={userAnswer} onChange={setUserAnswer} onSubmit={() => handleSubmit()} mfRef={mfRef} />
                <MathKeypad onCommand={handleKeypadCommand} onDelete={handleKeypadDelete} onClear={handleKeypadClear} onSubmit={() => handleSubmit()} />
                <div className="flex justify-between items-center">
                   <div className="flex gap-2">
                      <button onClick={() => moveCursor('backward')} className="p-3 bg-slate-700 text-slate-300 rounded-xl"><ChevronLeft/></button>
                      <button onClick={() => moveCursor('forward')} className="p-3 bg-slate-700 text-slate-300 rounded-xl"><ChevronRight/></button>
                   </div>
                   <div className="flex gap-2">
                      {user && <button onClick={() => setShowChat(true)} className="px-4 py-3 bg-amber-500/10 text-amber-400 rounded-xl flex items-center gap-2 font-bold"><MessageSquare className="w-5 h-5"/>{t('reactor.suricat')}</button>}
                      {!showHint && currentProblem.hint && <button onClick={() => setShowHint(true)} className="px-5 py-3 bg-slate-700 text-cyan-400 font-bold rounded-xl">?</button>}
                   </div>
                </div>
                {showHint && <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3 text-blue-300 text-sm"><AlertCircle className="w-5 h-5 shrink-0"/><Latex>{i18n.language === 'kk' && currentProblem.hint_kz ? currentProblem.hint_kz : currentProblem.hint}</Latex></div>}
              </div>
            ) : (
              <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 animate-in zoom-in ${result === 'correct' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                <div className={`p-3 rounded-full ${result === 'correct' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>{result === 'correct' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <XCircle className="w-8 h-8 text-red-400" />}</div>
                <div>
                  <div className={`text-xl font-bold ${result === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{result === 'correct' ? t('reactor.correct') : t('reactor.incorrect')}</div>
                  {result === 'correct' && user && (
                    <div className="flex gap-2 mt-3">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] text-blue-400 font-bold">
                        <Zap className="w-3 h-3 fill-current"/> +{profile?.is_premium ? 20 : 10} SXP
                      </div>
                      {earnedCoins !== null && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 font-bold">
                          <Coins className="w-3 h-3 fill-current"/> +{earnedCoins} MC
                        </div>
                      )}
                    </div>
                  )}
                  {result === 'incorrect' && <div className="text-slate-400 text-sm mt-1">{t('reactor.correct_answer')} <span className="text-white font-mono font-bold bg-slate-700 px-2 py-0.5 rounded"><Latex>{`$${currentProblem.answer}$`}</Latex></span></div>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl"><Zap className="w-10 h-10 mx-auto mb-4 opacity-20" /><p>{t('reactor.module_finished')}</p></div>
        )}
      </div>
      {showChat && currentProblem && <CompanionChat onClose={() => setShowChat(false)} problemContext={currentProblem.question} />}
    </div>
  );
}