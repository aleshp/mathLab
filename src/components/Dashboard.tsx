import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Achievement } from '../lib/supabase';
import {
  User, LogOut, Trophy, Target, TrendingUp, Award, Zap, Clock, CheckCircle2, XCircle, X, Mail, ShieldCheck, GraduationCap, CreditCard, Loader
} from 'lucide-react';
import { BecomeTeacherModal } from './BecomeTeacherModal';

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
  const { profile, signOut, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [recentExperiments, setRecentExperiments] = useState<RecentExperiment[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  
  const [teacherRequestStatus, setTeacherRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [loadingRequest, setLoadingRequest] = useState(false);

  useEffect(() => {
    loadAchievements();
    loadRecentExperiments();
    checkTeacherRequest();
    
    // === ДОБАВЛЯЕМ REALTIME ПОДПИСКУ НА СТАТУС ===
    if (!profile) return;
    
    const channel = supabase
      .channel('teacher-status-changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'teacher_requests', 
          filter: `user_id=eq.${profile.id}` 
        },
        (payload) => {
          console.log('Status updated real-time:', payload.new.status);
          setTeacherRequestStatus(payload.new.status);
          refreshProfile(); // На случай если роль тоже изменилась
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

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

  async function checkTeacherRequest() {
    if (!profile) return;
    setLoadingRequest(true);
    
    const { data } = await supabase
      .from('teacher_requests')
      .select('status')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setTeacherRequestStatus(data.status as any);
    } else {
      setTeacherRequestStatus('none');
    }
    setLoadingRequest(false);
  }

  const handleTeacherPayment = () => {
    alert("Переход к оплате тарифа Teacher ($9)... (Paddle Integration)");
    // Здесь будет вызов Paddle
  };

  async function handleSignOut() {
    onClose();
    await signOut();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const TeacherStatusSection = () => {
    // Если роль уже teacher - кнопка вообще не нужна
    if (profile?.role === 'teacher') {
      return (
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Верифицирован</span>
        </div>
      );
    }

    if (loadingRequest) return <Loader className="w-5 h-5 animate-spin text-slate-500" />;

    if (teacherRequestStatus === 'pending') {
      return (
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 font-bold animate-pulse">
          <Clock className="w-4 h-4" />
          <span>На проверке</span>
        </div>
      );
    }

    if (teacherRequestStatus === 'approved') {
      return (
        <button
          onClick={handleTeacherPayment}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 rounded-lg transition-colors shadow-lg shadow-emerald-900/20 font-bold"
        >
          <CreditCard className="w-4 h-4" />
          <span>Оплатить Teacher</span>
        </button>
      );
    }

    if (!profile?.is_admin) {
      return (
        <button
          onClick={() => setShowTeacherModal(true)}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg transition-colors font-bold"
        >
          <GraduationCap className="w-4 h-4" />
          <span>Я учитель</span>
        </button>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[70] overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter">Журнал</h1>
              
              {profile?.is_premium && profile.role !== 'teacher' && (
                <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center gap-1.5 shadow-lg">
                  <Zap className="w-3 h-3 text-white fill-current" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Premium</span>
                </div>
              )}
              
              {profile?.role === 'teacher' && (
                <div className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center gap-1.5 shadow-lg">
                  <GraduationCap className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Mentor</span>
                </div>
              )}
            </div>

            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-3">
            <TeacherStatusSection />

            <button
              onClick={onClose}
              className="hidden md:block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-bold"
            >
              Закрыть
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-bold"
            >
              <LogOut className="w-4 h-4" />
              Выход
            </button>
          </div>
          
          {/* МОБИЛЬНАЯ ВЕРСИЯ КНОПОК */}
          <div className="md:hidden space-y-2">
            {profile?.role !== 'teacher' && !profile?.is_admin && teacherRequestStatus === 'none' && (
              <button
                onClick={() => setShowTeacherModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              >
                <GraduationCap className="w-5 h-5 text-amber-400" /> Стать учителем
              </button>
            )}
            {teacherRequestStatus === 'pending' && (
               <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-bold animate-pulse">
                  <Clock className="w-5 h-5" /> Заявка на проверке
               </div>
            )}
            {teacherRequestStatus === 'approved' && profile?.role !== 'teacher' && (
               <button
                onClick={handleTeacherPayment}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-900/40"
              >
                <CreditCard className="w-5 h-5" /> ОПЛАТИТЬ TEACHER ($9)
              </button>
            )}
             {profile?.role === 'teacher' && (
               <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold">
                  <ShieldCheck className="w-5 h-5" /> СТАТУС ПОДТВЕРЖДЕН
               </div>
            )}
          </div>
        </div>

        {profile && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className={`backdrop-blur-sm border rounded-2xl p-6 relative overflow-hidden transition-all ${
                profile.is_premium 
                  ? 'bg-slate-800/80 border-amber-500/40' 
                  : profile.role === 'teacher'
                    ? 'bg-slate-800/80 border-cyan-500/40'
                    : 'bg-slate-800/50 border-slate-700'
              }`}>
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className={`p-2 rounded-xl ${profile.is_premium ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-xs uppercase font-black tracking-tighter opacity-50">
                    {profile.role === 'teacher' ? 'Ментор' : profile.is_premium ? 'Premium' : 'Standard'}
                  </div>
                </div>
                <div className="text-xl font-black text-white truncate relative z-10">{profile.username}</div>
                
                {profile.companion_name && (
                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-4">
                     <div className="w-16 h-16 bg-black/20 rounded-2xl p-2">
                        <img src="/meerkat/avatar.png" alt="Pet" className="w-full h-full object-contain" />
                     </div>
                     <div>
                       <div className="text-[10px] text-slate-500 uppercase font-bold">Спутник</div>
                       <div className="text-white font-bold">{profile.companion_name}</div>
                     </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="text-xs uppercase font-black tracking-tighter opacity-50 text-purple-300">Ранг</div>
                </div>
                <div className="text-2xl font-black text-white">LVL {profile.clearance_level}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-xs uppercase font-black tracking-tighter opacity-50 text-emerald-300">Эксперименты</div>
                </div>
                <div className="text-2xl font-black text-white">{profile.total_experiments}</div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-xs uppercase font-black tracking-tighter opacity-50 text-blue-300">Точность</div>
                </div>
                <div className="text-2xl font-black text-white">{profile.success_rate.toFixed(0)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Достижения</h2>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {achievements.length > 0 ? (
                    achievements.map((item, index) => (
                      <div key={index} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${rarityColors[item.achievement.rarity]} shadow-lg`}>
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate">{item.achievement.name}</h3>
                          <p className="text-slate-400 text-xs truncate">{item.achievement.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600 text-sm">Нет наград</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">История активности</h2>
                </div>
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4">
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                    {recentExperiments.length > 0 ? (
                      recentExperiments.map((exp, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            {exp.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                            <div>
                              <div className="text-white text-xs font-bold">{typeTranslations[exp.problem_type] || exp.problem_type}</div>
                              <div className="text-[10px] text-slate-500">{exp.time_spent}с • {formatDate(exp.attempted_at)}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-600 text-sm italic">Журнал пуст</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-center">
              <a href="mailto:support@mathlabpvp.org" className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-all text-xs font-bold uppercase tracking-widest">
                <Mail className="w-4 h-4" /> Служба поддержки
              </a>
            </div>
          </div>
        )}
        
        {showTeacherModal && <BecomeTeacherModal onClose={() => {
            setShowTeacherModal(false);
            checkTeacherRequest(); 
        }} />}
      </div>
    </div>
  );
}