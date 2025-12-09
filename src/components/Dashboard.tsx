import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Achievement } from '../lib/supabase';
import {
  User,
  LogOut,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Cat // Используем Cat как заглушку для питомца, или просто эмодзи
} from 'lucide-react';

type DashboardProps = {
  onClose: () => void;
};

type UserAchievement = {
  achievement: Achievement;
  earned_at: string;
};

type RecentExperiment = {
  problem_type: string;
  correct: boolean;
  time_spent: number;
  attempted_at: string;
};

const rarityColors = {
  common: 'from-slate-400 to-slate-500',
  rare: 'from-blue-400 to-purple-500',
  legendary: 'from-amber-400 to-orange-500'
};

const typeTranslations: Record<string, string> = {
  input: 'Ввод значения',
  choice: 'Тестирование',
  arithmetic: 'Арифметика',
  equation: 'Уравнение',
  power: 'Степени',
  logarithm: 'Логарифмы',
  trigonometry: 'Тригонометрия',
  geometry: 'Геометрия'
};

export function Dashboard({ onClose }: DashboardProps) {
  const { profile, signOut } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [recentExperiments, setRecentExperiments] = useState<RecentExperiment[]>([]);

  useEffect(() => {
    loadAchievements();
    loadRecentExperiments();
  }, []);

  async function loadAchievements() {
    if (!profile) return;
    const { data } = await supabase
      .from('user_achievements')
      .select('earned_at, achievement:achievements(*)')
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false })
      .limit(6);

    if (data) {
      setAchievements(data.map(item => ({
        achievement: item.achievement as unknown as Achievement,
        earned_at: item.earned_at
      })));
    }
  }

  async function loadRecentExperiments() {
    if (!profile) return;
    const { data } = await supabase
      .from('experiments')
      .select('problem_type, correct, time_spent, attempted_at')
      .eq('user_id', profile.id)
      .order('attempted_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentExperiments(data);
    }
  }

  async function handleSignOut() {
    await signOut();
    onClose();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[70] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* ЗАГОЛОВОК */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Лабораторный Журнал</h1>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Закрыть
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>

        {profile && (
          <>
            {/* ГЛАВНАЯ СТАТИСТИКА */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* КАРТОЧКА ПРОФИЛЯ + СУРИКАТ */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-cyan-400/60 text-sm">Сотрудник</div>
                </div>
                <div className="text-xl font-bold text-white truncate relative z-10">{profile.username}</div>
                
                {/* БЛОК СУРИКАТА (ПОЯВЛЯЕТСЯ, ЕСЛИ ЕСТЬ ИМЯ) */}
                {profile.companion_name && (
                  <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-3 animate-in slide-in-from-left-4 fade-in duration-500">
                     <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-2xl border border-amber-500/50 shadow-lg shadow-amber-500/10">
                       🦦
                     </div>
                     <div>
                       <div className="text-[10px] text-amber-400/60 font-mono uppercase tracking-wider">Компаньон</div>
                       <div className="text-amber-100 font-bold text-sm">{profile.companion_name}</div>
                     </div>
                  </div>
                )}
              </div>

              {/* УРОВЕНЬ */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-purple-400/60 text-sm">Уровень допуска</div>
                </div>
                <div className="text-2xl font-bold text-white">LVL {profile.clearance_level}</div>
              </div>

              {/* ОПЫТ */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-emerald-400/60 text-sm">Экспериментов</div>
                </div>
                <div className="text-2xl font-bold text-white">{profile.total_experiments}</div>
              </div>

              {/* ТОЧНОСТЬ */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-blue-400/60 text-sm">Точность</div>
                </div>
                <div className="text-2xl font-bold text-white">{profile.success_rate.toFixed(0)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* ДОСТИЖЕНИЯ */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Достижения</h2>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {achievements.length > 0 ? (
                    achievements.map((item, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors"
                      >
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${rarityColors[item.achievement.rarity]} shadow-lg`}>
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{item.achievement.name}</h3>
                          </div>
                          <p className="text-cyan-300/60 text-sm">{item.achievement.description}</p>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {new Date(item.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-cyan-300/40 border-2 border-dashed border-slate-700 rounded-xl">
                      <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      Пока нет достижений. Решайте задачи, чтобы получить их!
                    </div>
                  )}
                </div>
              </div>

              {/* ИСТОРИЯ */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">Последние эксперименты</h2>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {recentExperiments.length > 0 ? (
                      recentExperiments.map((exp, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-900/40 hover:bg-slate-700/40 transition-colors border border-slate-700/50"
                        >
                          <div className="flex items-center gap-4">
                            {exp.correct ? (
                              <div className="bg-emerald-500/10 p-1.5 rounded-full">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                              </div>
                            ) : (
                              <div className="bg-red-500/10 p-1.5 rounded-full">
                                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                              </div>
                            )}
                            
                            <div>
                              <div className="text-white text-sm font-medium">
                                {typeTranslations[exp.problem_type] || exp.problem_type}
                              </div>
                              <div className="text-cyan-300/40 text-xs flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {exp.time_spent} сек.
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                             <div className="text-slate-400 text-xs font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700">
                               {formatDate(exp.attempted_at)}
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-cyan-300/40 text-sm">
                        Журнал пуст. Начните решать задачи!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}