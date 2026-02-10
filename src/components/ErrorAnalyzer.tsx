import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Latex from 'react-latex-next';
import { 
  AlertTriangle, 
  Brain, 
  CheckCircle, 
  ChevronRight, 
  Loader, 
  RefreshCcw, 
  Trash2, 
  XCircle 
} from 'lucide-react';

// Типы данных
type ErrorRecord = {
  id: string;
  user_answer: string;
  correct_answer: string;
  created_at: string;
  problem: {
    id: string;
    question: string;
    hint: string | null;
  };
  module: {
    id: string;
    name: string;
  };
};

type GroupedErrors = {
  [moduleName: string]: ErrorRecord[];
};

export function ErrorAnalyzer({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (user) loadErrors();
  }, [user]);

  async function loadErrors() {
    setLoading(true);
    const { data } = await supabase
      .from('user_errors')
      .select(`
        id, user_answer, correct_answer, created_at,
        problem:problems (id, question, hint),
        module:modules (id, name)
      `)
      .eq('user_id', user!.id)
      .gt('expires_at', new Date().toISOString()) // Только свежие (48ч)
      .order('created_at', { ascending: false });

    if (data) {
      // @ts-ignore: Supabase types mapping helper
      setErrors(data);
    }
    setLoading(false);
  }

  // Группировка ошибок по модулям
  const groupedErrors: GroupedErrors = errors.reduce((acc, err) => {
    const modName = err.module.name;
    if (!acc[modName]) acc[modName] = [];
    acc[modName].push(err);
    return acc;
  }, {} as GroupedErrors);

  // Очистка (удаление ошибки, если пользователь "осознал")
  const dismissError = async (id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
    await supabase.from('user_errors').delete().eq('id', id);
  };

  // Эвристический анализ (заглушка под AI)
  const getAdvice = (userAns: string, correctAns: string) => {
    if (!userAns) return "Пустой ответ. Попробуйте решить, не пропуская.";
    // Проверка на знаки
    if (userAns.replace('-', '') === correctAns.replace('-', '')) {
      return "Ошибка в знаке! Будьте внимательнее с минусами.";
    }
    // Проверка на десятичные
    if (userAns.includes(',') && correctAns.includes('.')) {
      return "Используйте точку вместо запятой.";
    }
    return "Пересмотрите теорию этого модуля.";
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-slate-900">
      <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-full bg-slate-900 p-4 md:p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180" /> Назад
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-500" />
          Нейро-Клиника
        </h1>
      </div>

      {errors.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-3xl">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Системы в норме!</h2>
          <p className="text-slate-400">За последние 48 часов ошибок не обнаружено.</p>
          <p className="text-slate-500 text-sm mt-2">Идите в PvP и покажите им!</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Сводка (Dashboard) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-purple-500/30 p-6 rounded-2xl">
              <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-2">Критические зоны</h3>
              <div className="space-y-3">
                {Object.entries(groupedErrors)
                  .sort(([,a], [,b]) => b.length - a.length) // Сортируем: где больше ошибок - выше
                  .map(([modName, modErrors]) => (
                  <div key={modName} className="flex justify-between items-center">
                    <span className="text-white font-medium">{modName}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${Math.min((modErrors.length / errors.length) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-red-400 font-mono font-bold">{modErrors.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-500/30 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
              <div className="text-4xl font-black text-white mb-1">{errors.length}</div>
              <div className="text-purple-300 text-sm mb-4">Активных ошибок</div>
              <button 
                onClick={() => alert("Здесь будет запуск режима 'Работа над ошибками' (Redemption)")}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-purple-900/50"
              >
                <RefreshCcw className="w-5 h-5" />
                Исправить всё (+{errors.length * 5} монет)
              </button>
            </div>
          </div>

          {/* Детальный список */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white px-1">Журнал инцидентов</h2>
            {errors.map((err) => (
              <div key={err.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 relative group hover:border-slate-600 transition-colors">
                
                {/* Header карточки */}
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-slate-900 px-3 py-1 rounded-lg text-xs text-slate-400 font-mono border border-slate-700">
                    {err.module.name}
                  </div>
                  <button 
                    onClick={() => dismissError(err.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                    title="Удалить из списка"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Задача */}
                <div className="mb-4 text-lg text-white font-medium">
                  <Latex>{err.problem.question}</Latex>
                </div>

                {/* Ответы */}
                <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 mb-4">
                  <div>
                    <div className="text-xs text-red-400/70 uppercase mb-1">Ваш ответ</div>
                    <div className="text-red-400 font-mono line-through decoration-red-500/50">
                      <Latex>{`$${err.user_answer || "Пусто"}$`}</Latex>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-emerald-400/70 uppercase mb-1">Верно</div>
                    <div className="text-emerald-400 font-mono">
                      <Latex>{`$${err.correct_answer}$`}</Latex>
                    </div>
                  </div>
                </div>

                {/* Совет (AI placeholder) */}
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                  <div className="text-sm text-slate-300">
                    <span className="text-amber-500 font-bold mr-2">Анализ:</span>
                    {getAdvice(err.user_answer, err.correct_answer)}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}