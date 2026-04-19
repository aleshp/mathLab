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
  id: string; question: string; question_kz?: string; answer: string;
  type: string; hint?: string; hint_kz?: string; image_url?: string;
};

type ReactorProps = {
  module: Module;
  onBack: () => void;
  onRequestAuth?: () => void;
  forcedProblemIds?: string[] | null;
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
  const [earnedCoins, setEarnedCoins] = useState<number | null>(null);
  
  // === СИСТЕМА ДОСТИЖЕНИЙ ===
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
            const { data: solved } = await supabase.from('experiments').select('problem_id').eq('user_id', user.id).eq('correct', true);
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

  // ФУНКЦИЯ ВЫДАЧИ АЧИВОК (С ЛОГАМИ ДЛЯ ТЕБЯ)
  async function claimAchievement(name: string) {
    if (!user) return;
    console.log(`[Achievement] Checking: ${name}`);
    
    // 1. Ищем ID по имени
    const { data: ach } = await supabase.from('achievements').select('id').eq('name', name).maybeSingle();
    
    if (!ach) {
      console.error(`[Achievement] Not found in DB: ${name}`);
      return;
    }

    // 2. Стучимся в базу
    const { data: success, error } = await supabase.rpc('claim_achievement', { target_ach_id: ach.id });
    
    if (error) console.error("[Achievement] RPC Error:", error.message);

    if (success) {
      console.log(`[Achievement] GRANTED: ${name}`);
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.7 }, colors: ['#fbbf24', '#f59e0b', '#ffffff'] });
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
        user_id: user.id, module_id: module.id, problem_id: currentProblem.id,
        problem_type: currentProblem.type, correct: isCorrect, time_spent: timeSpent,
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

          // ПОПЫТКА ВЫДАТЬ "ПЕРВЫЙ ШАГ" (База сама проверит, первая ли это задача)
          await claimAchievement('Первый шаг');
        }

        // ПОПЫТКА ВЫДАТЬ ЗА СТРИК
        if (newStreak === 10) {
          await claimAchievement('Безошибочный эксперимент');
        }

        // Daily Quests
        if (!forcedProblemIds) {
          const today = new Date().toISOString().split('T')[0];
          const { data: dq } = await supabase.from('daily_quests').select('*').eq('user_id', user.id).maybeSingle();
          if (!dq || dq.quest_date !== today) {
            await supabase.from('daily_quests').upsert({ user_id: user.id, quest_date: today, pve_solved: 1 });
          } else {
            await supabase.from('daily_quests').update({ pve_solved: (dq.pve_solved || 0) + 1 }).eq('user_id', user.id);
          }
        }
        setTimeout(() => refreshProfile(), 500);
      } else {
        setStreak(0);
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

  const handleKeypadCommand = (cmd: string, arg?: string) => {
    if (!mfRef.current) return;
    if (cmd === 'insert') mfRef.current.executeCommand(['insert', arg]);
    else if (cmd === 'perform') mfRef.current.executeCommand([arg]);
    mfRef.current.focus({ preventScroll: true });
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader className="animate-spin text-cyan-400 w-10 h-10" /></div>;

  return (
    <div className="w-full h-full overflow-y-auto pb-20 custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 font-bold px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Назад
          </button>
          <div className="flex items-center gap-3">
            {streak >= 2 && <div className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 border border-orange-400 rounded-full text-white text-xs font-black animate-bounce shadow-lg shadow-orange-900/40">🔥 {streak} В РЯД</div>}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg shadow-orange-900/20"><Zap className="w-5 h-5 text-white" /></div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{forcedProblemIds ? 'Работа над ошибками' : 'Реактор'}</h1>
          </div>
          <p className="text-cyan-300/60 font-mono text-xs uppercase tracking-widest pl-1">Модуль: {i18n.language === 'kk' && module.name_kz ? module.name_kz : module.name}</p>
        </div>

        {currentProblem ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-5 md:p-10 mb-6 relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />
            
            <div className="mb-8 relative z-10">
              {currentProblem.image_url && <img src={currentProblem.image_url} alt="Problem" className="max-h-64 rounded-2xl border border-cyan-500/30 mx-auto mb-8 bg-slate-900/50 p-2" />}
              <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed text-center"><Latex>{i18n.language === 'kk' && currentProblem.question_kz ? currentProblem.question_kz : currentProblem.question}</Latex></h2>
            </div>

            {result === null ? (
              <div className="space-y-6 relative z-10">
                <MathInput value={userAnswer} onChange={setUserAnswer} onSubmit={() => handleSubmit()} mfRef={mfRef} />
                <MathKeypad onCommand={handleKeypadCommand} onDelete={() => mfRef.current?.executeCommand(['deleteBackward'])} onClear={() => { mfRef.current?.setValue(''); setUserAnswer(''); }} onSubmit={() => handleSubmit()} />
                
                <div className="flex justify-between items-center gap-4">
                   <div className="flex gap-2">
                      <button onClick={() => { mfRef.current?.executeCommand(['moveToPreviousChar']); mfRef.current?.focus(); }} className="p-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl transition-colors active:scale-90"><ChevronLeft/></button>
                      <button onClick={() => { mfRef.current?.executeCommand(['moveToNextChar']); mfRef.current?.focus(); }} className="p-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl transition-colors active:scale-90"><ChevronRight/></button>
                   </div>
                   <div className="flex gap-2">
                      {user && <button onClick={() => setShowChat(true)} className="px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center gap-2 font-black hover:bg-amber-500/20 transition-all active:scale-95 shadow-lg shadow-amber-900/20">Чат</button>}
                      {!showHint && currentProblem.hint && <button onClick={() => setShowHint(true)} className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-black rounded-2xl transition-all active:scale-95 shadow-lg">?</button>}
                   </div>
                </div>
                {showHint && <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex gap-4 text-blue-200 text-sm leading-relaxed animate-in slide-in-from-top-2"><AlertCircle className="w-5 h-5 shrink-0 text-blue-400"/><Latex>{currentProblem.hint}</Latex></div>}
              </div>
            ) : (
              <div className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 animate-in zoom-in duration-300 ${result === 'correct' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                <div className={`p-4 rounded-full ${result === 'correct' ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                  {result === 'correct' ? <CheckCircle2 className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-black uppercase tracking-widest ${result === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>{result === 'correct' ? 'Абсолютно верно!' : 'Ошибка в расчетах'}</div>
                  {result === 'correct' && user && (
                    <div className="flex justify-center gap-3 mt-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400 font-black uppercase"><Zap className="w-3.5 h-3.5 fill-current"/> +{profile?.is_premium ? 20 : 10} SXP</div>
                      {earnedCoins !== null && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 font-black uppercase animate-pulse"><Coins className="w-3.5 h-3.5 fill-current"/> +{earnedCoins} MC</div>
                      )}
                    </div>
                  )}
                  {result === 'incorrect' && <div className="text-slate-300 text-sm mt-3 font-medium">Верный ответ: <span className="text-white font-mono font-bold bg-slate-700 px-3 py-1 rounded-lg ml-1 shadow-inner"><Latex>{`$${currentProblem.answer}$`}</Latex></span></div>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2rem] animate-in fade-in"><Zap className="w-12 h-12 mx-auto mb-4 text-slate-700" /><p className="text-slate-400 font-bold uppercase tracking-widest">Модуль завершен</p></div>
        )}
      </div>
      {showChat && currentProblem && <CompanionChat onClose={() => setShowChat(false)} problemContext={currentProblem.question} />}
    </div>
  );
}