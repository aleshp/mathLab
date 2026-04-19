import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Latex from 'react-latex-next';
import { checkAnswer } from '../lib/mathUtils';
import 'katex/dist/katex.min.css';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Zap,
  Loader,
  MessageSquare,
  AlertCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
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

  // SXP = опыт суриката, начисляется триггером handle_new_experiment в БД
  // Здесь только анимация — реальное значение берём из профиля (is_premium)
  // ID задач, которые пользователь уже решил верно хотя бы раз
  // Нужно чтобы не давать XP/SXP повторно и не показывать бейдж
  const [alreadySolvedIds, setAlreadySolvedIds] = useState<Set<string>>(new Set());

  const GUEST_LIMIT = 3;
  const [showPaywall, setShowPaywall] = useState(false);

  // ── Загрузка задач + уже решённых ────────────────────────
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

          // Загружаем уже правильно решённые задачи этого пользователя
          if (user) {
            const problemIds = shuffled.map((p: any) => p.id);
            const { data: solved } = await supabase
              .from('experiments')
              .select('problem_id')
              .eq('user_id', user.id)
              .eq('correct', true)
              .in('problem_id', problemIds);
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

  // ── Следующая задача ──────────────────────────────────────
  function loadNextProblem() {
    if (!user && problemsSolved >= GUEST_LIMIT) {
      setShowPaywall(true);
      return;
    }

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
      setTimeout(() => {
        if (mfRef.current) mfRef.current.focus({ preventScroll: true });
      }, 50);
    }
  }

  // ── Управление курсором (стрелки) ────────────────────────
  const moveCursor = (direction: 'backward' | 'forward') => {
    if (!mfRef.current) return;
    const cmd = direction === 'backward' ? 'moveToPreviousChar' : 'moveToNextChar';
    mfRef.current.executeCommand(cmd);
    mfRef.current.focus({ preventScroll: true });
  };

  const handleKeypadCommand = (cmd: string, arg?: string) => {
    if (!mfRef.current) return;
    const scrollY = window.scrollY;
    if (cmd === 'insert') mfRef.current.executeCommand(['insert', arg]);
    else if (cmd === 'perform') mfRef.current.executeCommand([arg]);
    if (document.activeElement !== mfRef.current) {
      mfRef.current.focus({ preventScroll: true });
    }
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

  // ── Проверка ответа ───────────────────────────────────────
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!currentProblem) return;

    const isCorrect = checkAnswer(userAnswer, currentProblem.answer);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setResult(isCorrect ? 'correct' : 'incorrect');
    setProblemsSolved(prev => prev + 1);
    if (isCorrect) setCorrectCount(prev => prev + 1);

    // Первое верное решение этой задачи — только тогда даём XP/SXP
    const isFirstSolve = user && isCorrect && !alreadySolvedIds.has(currentProblem.id);

    // === Только для авторизованных пользователей ===
    if (user) {
      // Записываем эксперимент — триггер handle_new_experiment автоматически:
      // 1. начислит companion_xp (+10 или +20 для premium) — только первый раз
      // 2. обновит companion_level при накоплении
      // 3. увеличит total_experiments — только первый раз
      await supabase.from('experiments').insert({
        user_id: user.id,
        module_id: module.id,
        problem_id: currentProblem.id,
        problem_type: currentProblem.type,
        correct: isCorrect,
        time_spent: timeSpent,
      });

      if (!isCorrect && !forcedProblemIds) {
        await supabase.from('user_errors').insert({
          user_id: user.id,
          problem_id: currentProblem.id,
          module_id: module.id,
          user_answer: userAnswer,
          correct_answer: currentProblem.answer,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        }).then(() => {});
      }
      
      if (isCorrect) {
        // Добавляем в локальный Set чтобы не дать бейдж повторно в этой же сессии
        setAlreadySolvedIds(prev => new Set([...prev, currentProblem.id]));

        // Если это работа над ошибками — удаляем задачу из ошибок
        if (forcedProblemIds) {
          await supabase
            .from('user_errors')
            .delete()
            .eq('user_id', user.id)
            .eq('problem_id', currentProblem.id);
        }

        // Прогресс по модулю обновляем только при первом решении
        if (!forcedProblemIds && isFirstSolve) {
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('module_id', module.id)
            .maybeSingle();

          const newExperiments = (progressData?.experiments_completed ?? 0) + 1;
          const newPercentage = Math.min(newExperiments * 10, 100);

          if (progressData) {
            await supabase
              .from('user_progress')
              .update({ experiments_completed: newExperiments, completion_percentage: newPercentage })
              .eq('id', progressData.id);
          } else {
            await supabase.from('user_progress').insert({
              user_id: user.id,
              module_id: module.id,
              experiments_completed: 1,
              completion_percentage: 10,
            });
          }
        }

        // Обновляем профиль в UI через 500мс (триггер уже успел отработать)
        if (isFirstSolve) setTimeout(() => refreshProfile(), 500);
      }
    }
    // ↑ конец if (user)

    // Переходим к следующей задаче через 2 сек — для ВСЕХ (и гостей тоже)
    setTimeout(() => loadNextProblem(), 2000);
  }

  // ── Данные для рендера ────────────────────────────────────
  const modName = i18n.language === 'kk' && module.name_kz ? module.name_kz : module.name;
  const questionText = currentProblem
    ? (i18n.language === 'kk' && currentProblem.question_kz
        ? currentProblem.question_kz
        : currentProblem.question)
    : '';
  const hintText = currentProblem
    ? (i18n.language === 'kk' && currentProblem.hint_kz
        ? currentProblem.hint_kz
        : currentProblem.hint)
    : '';

  // ── Loading ───────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader className="animate-spin text-cyan-400 w-10 h-10" />
    </div>
  );

  // ── Paywall (гость исчерпал лимит) ───────────────────────
  if (showPaywall) {
    return (
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
  }

  // ── Основной рендер ───────────────────────────────────────
  return (
    <div className="w-full h-full overflow-y-auto pb-20 custom-scrollbar">
      <div className="max-w-4xl mx-auto p-4 md:p-8">

        {/* Шапка */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors group px-3 py-2 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">{t('reactor.back')}</span>
          </button>
          {!user && (
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold font-mono">
              {t('reactor.demo_limit')}: {problemsSolved}/{GUEST_LIMIT}
            </div>
          )}
        </div>

        {/* Заголовок модуля */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg animate-pulse">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {forcedProblemIds ? t('reactor.error_work') : t('reactor.title')}
            </h1>
          </div>
          <p className="text-cyan-300/60 font-mono text-xs md:text-sm uppercase tracking-wider pl-1">
            {t('reactor.module')}: {modName}
          </p>
        </div>

        {currentProblem ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-4 md:p-8 mb-6 relative overflow-hidden shadow-2xl">

            {/* ── Блок вопроса ────────────────────────────────── */}
            <div className="mb-8 relative z-10">
              {currentProblem.image_url && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={currentProblem.image_url}
                    alt="Problem"
                    className="max-h-48 md:max-h-64 rounded-lg border border-cyan-500/30 shadow-lg bg-white/5"
                  />
                </div>
              )}
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 leading-relaxed">
                <Latex>{questionText}</Latex>
              </h2>
            </div>

            {/* ── Зона решения или результата ─────────────────── */}
            {result === null ? (
              <div className="relative z-10">
                <div className="mb-4">
                  <MathInput
                    value={userAnswer}
                    onChange={setUserAnswer}
                    onSubmit={() => handleSubmit()}
                    mfRef={mfRef}
                  />
                </div>

                <MathKeypad
                  onCommand={handleKeypadCommand}
                  onDelete={handleKeypadDelete}
                  onClear={handleKeypadClear}
                  onSubmit={() => handleSubmit()}
                />

                {/* Нижняя панель: стрелки слева, чат/подсказка справа */}
                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveCursor('backward')}
                      className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors active:scale-95 shadow-lg"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => moveCursor('forward')}
                      className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors active:scale-95 shadow-lg"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    {user && (
                      <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-colors active:scale-95"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden sm:inline text-sm font-bold">{t('reactor.suricat')}</span>
                      </button>
                    )}
                    {!showHint && currentProblem.hint && (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold rounded-xl transition-colors active:scale-95 shadow-lg"
                      >
                        ?
                      </button>
                    )}
                  </div>
                </div>

                {showHint && hintText && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-blue-300/90 text-sm leading-relaxed">
                      <Latex>{hintText}</Latex>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Результат ─────────────────────────────────── */
              <div
                className={`p-6 rounded-2xl border-2 flex items-center gap-4 animate-in zoom-in duration-300 ${
                  result === 'correct'
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : 'bg-red-500/10 border-red-500/50'
                }`}
              >
                <div
                  className={`p-3 rounded-full shrink-0 ${
                    result === 'correct' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}
                >
                  {result === 'correct' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>

                <div>
                  <div
                    className={`text-xl font-bold ${
                      result === 'correct' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {result === 'correct' ? t('reactor.correct') : t('reactor.incorrect')}
                  </div>

                  {/* Награда SXP суриката — анимация (реальное начисление в триггере БД) */}
                  {result === 'correct' && user && (
                    <div className="flex flex-col gap-2 mt-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold font-mono w-fit ${
                          profile?.is_premium
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}
                      >
                        <Zap
                          className={`w-3.5 h-3.5 fill-current ${
                            profile?.is_premium ? 'text-amber-400 animate-pulse' : ''
                          }`}
                        />
                        +{profile?.is_premium ? 20 : 10} SXP
                        {profile?.is_premium && (
                          <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-black text-[9px] rounded font-black uppercase tracking-wider">
                            PREMIUM ×2
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {result === 'incorrect' && (
                    <div className="text-slate-300 text-sm mt-1">
                      {t('reactor.correct_answer')}{' '}
                      <span className="font-mono font-bold text-white bg-slate-700 px-2 py-0.5 rounded">
                        <Latex>{`$${currentProblem.answer}$`}</Latex>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Все задачи пройдены */
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
            <div className="inline-block p-4 bg-slate-800 rounded-full mb-4">
              <Zap className="w-10 h-10 text-slate-600" />
            </div>
            <p>{t('reactor.module_finished')}</p>
          </div>
        )}
      </div>

      {showChat && currentProblem && (
        <CompanionChat onClose={() => setShowChat(false)} problemContext={questionText} />
      )}
    </div>
  );
}