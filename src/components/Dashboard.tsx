import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Achievement } from '../lib/supabase';
import {
  User, LogOut, Trophy, Target, TrendingUp, Award, Zap, Clock, CheckCircle2, 
  XCircle, X, Mail, ShieldCheck, GraduationCap, CreditCard, Loader, Shield, 
  HelpCircle, ChevronDown, ChevronUp, ChevronLeft, FileText, ArrowRight
} from 'lucide-react';
import { BecomeTeacherModal } from './BecomeTeacherModal';

type DashboardProps = {
  onClose: () => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'refund') => void;
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

export function Dashboard({ onClose, onOpenLegal }: DashboardProps) {
  const { t } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  
  const [currentView, setCurrentView] = useState<'profile' | 'faq'>('profile');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [recentExperiments, setRecentExperiments] = useState<RecentExperiment[]>([]);
  
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherRequestStatus, setTeacherRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [loadingRequest, setLoadingRequest] = useState(false);

  useEffect(() => {
    loadAchievements();
    loadRecentExperiments();
    checkTeacherRequest();
    
    if (!profile) return;
    
    const channel = supabase
      .channel('teacher-status-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'teacher_requests', 
        filter: `user_id=eq.${profile.id}` 
      },
        (payload) => {
          setTeacherRequestStatus(payload.new.status);
          refreshProfile(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

    if (data) setRecentExperiments(data);
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
    
    if (data) setTeacherRequestStatus(data.status as any);
    else setTeacherRequestStatus('none');
    
    setLoadingRequest(false);
  }

  const handleTeacherPaymentRedirect = () => { window.location.href = "/pricing"; };
  
  async function handleSignOut() { 
    onClose(); 
    await signOut(); 
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getRoleDisplay = () => {
    if (!profile) return { label: t('dashboard.role_guest'), color: 'text-slate-400', icon: User, bg: 'bg-slate-700' };
    if (profile.role === 'admin') return { label: t('dashboard.role_admin'), color: 'text-red-400', icon: Shield, bg: 'bg-red-500/10 border-red-500/50' };
    if (profile.role === 'teacher') return { label: t('dashboard.role_mentor'), color: 'text-cyan-400', icon: GraduationCap, bg: 'bg-cyan-500/10 border-cyan-500/50' };
    if (profile.is_premium) return { label: t('dashboard.role_premium'), color: 'text-amber-400', icon: Zap, bg: 'bg-amber-500/10 border-amber-500/50' };
    return { label: t('dashboard.role_cadet'), color: 'text-slate-300', icon: User, bg: 'bg-slate-800 border-slate-700' };
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  // ОБНОВЛЕННЫЙ СПИСОК ВОПРОСОВ (10 шт)
  const faqList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-[70] overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300 flex flex-col min-h-screen">
        
        {/* === HEADER === */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-4">
            {currentView === 'faq' && (
              <button 
                onClick={() => setCurrentView('profile')} 
                className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              {currentView === 'profile' ? <User className="w-8 h-8 text-cyan-500" /> : <HelpCircle className="w-8 h-8 text-amber-400" />}
              {currentView === 'profile' ? t('dashboard.title') : t('faq.title')}
            </h1>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white border border-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="flex-1">
          {currentView === 'profile' && profile ? (
            <div className="space-y-6">
              
              {/* MAIN ID CARD */}
              <div className={`p-6 rounded-3xl border ${roleInfo.bg} relative overflow-hidden shadow-2xl`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
                  <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 border-2 ${roleInfo.color.replace('text', 'border')} bg-slate-900/50 shadow-lg`}>
                     <RoleIcon className={`w-12 h-12 ${roleInfo.color}`} />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border ${roleInfo.bg} ${roleInfo.color}`}>
                      {roleInfo.label}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-1">{profile.username}</h2>
                    <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">ID: {profile.id.split('-')[0]}</p>
                  
                    <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                      
                      {/* КНОПКА ВЫХОДА */}
                      <button onClick={handleSignOut} className="px-4 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition-all font-bold text-sm flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> {t('dashboard.logout')}
                      </button>

                      {/* КНОПКА FAQ */}
                      <button onClick={() => setCurrentView('faq')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-all font-bold text-sm flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" /> FAQ
                      </button>

                      {/* КНОПКА ТАРИФЫ (НОВАЯ) */}
                      <a href="/pricing" className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all font-bold text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> {t('pricing.title')}
                      </a>

                      {/* УЧИТЕЛЬСКИЕ КНОПКИ */}
                      {profile.role !== 'teacher' && profile.role !== 'admin' && (
                        <>
                          {teacherRequestStatus === 'none' && (
                            <button onClick={() => setShowTeacherModal(true)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg transition-colors font-bold text-sm flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" /> {t('dashboard.become_teacher')}
                            </button>
                          )}
                          {teacherRequestStatus === 'pending' && (
                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg font-bold text-sm flex items-center gap-2 animate-pulse cursor-wait">
                              <Clock className="w-4 h-4" /> {t('dashboard.teacher_pending')}
                            </div>
                          )}
                          {teacherRequestStatus === 'approved' && (
                            <button onClick={handleTeacherPaymentRedirect} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 animate-pulse">
                              <CreditCard className="w-4 h-4" /> {t('dashboard.activate_status')}
                            </button>
                          )}
                          {teacherRequestStatus === 'rejected' && (
                            <button onClick={() => setShowTeacherModal(true)} className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-500/30 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-900/40">
                              <XCircle className="w-4 h-4" /> {t('dashboard.rejected')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {profile.companion_name && (
                    <div className="hidden md:flex flex-col items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                      <img src="/meerkat/avatar.png" alt="Pet" className="w-16 h-16 object-contain mb-2" />
                      <div className="text-xs font-bold text-white">{profile.companion_name}</div>
                      <div className="text-[10px] text-slate-500 uppercase">LVL {profile.companion_level || 1}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* УРОВЕНЬ ИГРОКА (XP) */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Target className="w-6 h-6" /></div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Level (XP)</div>
                    <div className="text-2xl font-black text-white">{profile.clearance_level}</div>
                  </div>
                </div>

                {/* РЕШЕНО ЗАДАЧ */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Zap className="w-6 h-6" /></div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.solved')}</div>
                    <div className="text-2xl font-black text-white">{profile.total_experiments}</div>
                  </div>
                </div>

                {/* ТОЧНОСТЬ */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">{t('dashboard.accuracy')}</div>
                    <div className="text-2xl font-black text-white">{profile.success_rate.toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              {/* ACHIEVEMENTS & HISTORY */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* ACHIEVEMENTS */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">{t('dashboard.achievements')}</h2>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 min-h-[200px]">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {achievements.length > 0 ? (
                        achievements.map((item, index) => (
                          <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${rarityColors[item.achievement.rarity]} shadow-lg`}><Award className="w-5 h-5 text-white" /></div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-sm truncate">{item.achievement.name}</h3>
                              <p className="text-slate-400 text-[10px] truncate">{item.achievement.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (<div className="text-center py-12 text-slate-600 text-sm italic">{t('dashboard.no_awards')}</div>)}
                    </div>
                  </div>
                </div>

                {/* HISTORY */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">{t('dashboard.history')}</h2>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 min-h-[200px]">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {recentExperiments.length > 0 ? (
                        recentExperiments.map((exp, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700/50">
                            <div className="flex items-center gap-3">
                              {exp.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                              <div>
                                <div className="text-white text-sm font-bold">{typeTranslations[exp.problem_type] || exp.problem_type}</div>
                                <div className="text-[10px] text-slate-500">{exp.time_spent}с • {formatDate(exp.attempted_at)}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (<div className="text-center py-12 text-slate-600 text-sm italic">{t('dashboard.empty_log')}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentView === 'faq' ? (
            /* === FAQ VIEW === */
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqList.map((i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden transition-all hover:border-slate-600">
                  <button 
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-bold text-white text-lg">{t(`faq.q${i}`)}</span>
                    {expandedFaq === i ? <ChevronUp className="w-5 h-5 text-cyan-400" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="px-5 pb-5 pt-0 text-slate-400 leading-relaxed text-sm animate-in slide-in-from-top-2 fade-in duration-200">
                      {t(`faq.a${i}`)}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-700 text-center mt-8">
                <p className="text-slate-400 mb-4">{t('dashboard.support')}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a href="mailto:support@mathlabpvp.org" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-white font-bold transition-all">
                    <Mail className="w-4 h-4" /> support@mathlabpvp.org
                  </a>
                  <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 rounded-xl text-white font-bold transition-all shadow-lg shadow-orange-900/20">
                    <Zap className="w-4 h-4 fill-current" /> {t('pricing.buy_access')} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* === FOOTER С ЮР. ДОКАМИ === */}
        <div className="mt-12 pt-8 border-t border-slate-800 shrink-0">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <button onClick={() => onOpenLegal('terms')} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <FileText className="w-3 h-3" /> {t('legal_links.terms')}
            </button>
            <button onClick={() => onOpenLegal('privacy')} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <ShieldCheck className="w-3 h-3" /> {t('legal_links.privacy')}
            </button>
            <button onClick={() => onOpenLegal('refund')} className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <CreditCard className="w-3 h-3" /> {t('legal_links.refund')}
            </button>
          </div>
          <div className="text-center mt-4 text-[10px] text-slate-700 font-mono">
            MathLab PvP © 2026. All Systems Operational.
          </div>
        </div>

        {showTeacherModal && <BecomeTeacherModal onClose={() => { setShowTeacherModal(false); checkTeacherRequest(); }} />}
      </div>
    </div>
  );
}