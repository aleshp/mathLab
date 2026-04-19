import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, Users, Megaphone, Search, Shield, GraduationCap, 
  Send, Check, XCircle, Download, Loader, Mail, 
  School, Briefcase, User as UserIcon, FileText, Building2,
  BarChart3, Activity, PieChart, Calendar, TrendingUp
} from 'lucide-react';

type Props = {
  onClose: () => void;
};

type TeacherRequest = {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  school: string;
  document_url: string;
  contact_email: string;
  status: string;
  created_at: string;
  user?: {
    username: string;
    email?: string;
  };
};

export function AdminDashboard({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'b2b' | 'broadcast' | 'analytics'>('users');
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [b2bRequests, setB2BRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // CRM / Аналитика
  const [stats, setStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  // Состояния для МОДАЛКИ ОБРАБОТКИ ЗАЯВКИ
  const [selectedReq, setSelectedReq] = useState<TeacherRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  // Состояния для рассылки
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'b2b') fetchB2B();

    let channel: any;
    let presenceChannel: any;

    if (activeTab === 'analytics') {
      loadAnalytics();

      channel = supabase
        .channel('admin-analytics-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'analytics_events' },
          async (payload) => {
            const { data: userData } = await supabase
              .from('profiles')
              .select('username, role')
              .eq('id', payload.new.user_id)
              .single();
            if (userData?.username === 'Admin') return; // <-- сюда
            const newEvent = { ...payload.new, user: userData };
            setRecentEvents(prev => [newEvent, ...prev].slice(0, 20));
            setStats((prev: any) => ({ ...prev, dau: (prev?.dau || 0) + 1 }));
          }
        )
        .subscribe();

      // === ПОДПИСКА НА ОНЛАЙН (Presence) ===
      presenceChannel = supabase.channel('online-users')
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const users: any[] = [];
          for (const key in state) {
            if (state[key]?.[0]) users.push(state[key][0]);
          }
          setOnlineUsers(users);
        })
        .on('presence', { event: 'join' }, () => {
          const state = presenceChannel.presenceState();
          const users: any[] = [];
          for (const key in state) {
            if (state[key]?.[0]) users.push(state[key][0]);
          }
          setOnlineUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const state = presenceChannel.presenceState();
            const users: any[] = [];
            for (const key in state) {
              if (state[key]?.[0]) users.push(state[key][0]);
            }
            setOnlineUsers(users);
          }
        });
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [activeTab]);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); 
    if (data) setAllUsers(data);
    setLoading(false);
  }

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teacher_requests')
      .select(`*, user:profiles(username)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) console.error("Ошибка загрузки заявок:", error);
    if (data) setRequests(data as TeacherRequest[]);
    setLoading(false);
  }

  async function fetchB2B() {
    setLoading(true);
    const { data } = await supabase.from('b2b_requests').select('*').order('created_at', { ascending: false });
    if (data) setB2BRequests(data);
    setLoading(false);
  }

  async function loadAnalytics() {
    setLoading(true);
    const { data: metrics } = await supabase.rpc('get_crm_stats');
    if (metrics) setStats(metrics);

    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, created_at, user:profiles(username, role)')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (events) setRecentEvents(events.filter((e: any) => e.user?.username !== 'Admin'));
    setLoading(false);
  }

  async function updateB2BStatus(id: string, newStatus: string) {
    await supabase.from('b2b_requests').update({ status: newStatus }).eq('id', id);
    setB2BRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert('Ошибка обновления роли');
    }
  }

  const openActionModal = (req: TeacherRequest, type: 'approve' | 'reject') => {
    setSelectedReq(req);
    setActionType(type);
    if (type === 'approve') {
      setFeedbackMessage(
        `Здравствуйте, ${req.full_name}!\n\nВаши документы успешно прошли проверку. Статус верификации подтвержден.\n\nЧтобы активировать функции Учителя, перейдите в раздел "Тарифы" и оплатите подписку Teacher.`
      );
    } else {
      setFeedbackMessage(
        `Здравствуйте, ${req.full_name}.\n\nК сожалению, мы вынуждены отклонить вашу заявку. \nПричина: Документ не читаем или не соответствует требованиям.\n\nПожалуйста, подайте заявку повторно.`
      );
    }
  };

  const confirmAction = async () => {
    if (!selectedReq || !actionType) return;
    setProcessing(true);
    try {
      const { error: reqError } = await supabase
        .from('teacher_requests')
        .update({ status: actionType === 'approve' ? 'approved' : 'rejected' })
        .eq('id', selectedReq.id);

      if (reqError) throw reqError;

      await supabase.from('notifications').insert({
        user_id: selectedReq.user_id,
        title: actionType === 'approve' ? 'Документы проверены' : 'Заявка отклонена',
        message: feedbackMessage,
        type: actionType === 'approve' ? 'success' : 'error'
      });

      setRequests(prev => prev.filter(r => r.id !== selectedReq.id));
      setSelectedReq(null);
      setActionType(null);
      alert('Обработано успешно!');
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  async function downloadDocument(path: string) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    else alert('Не удалось получить файл');
  }

  async function sendBroadcast() {
    setSending(true);
    try {
      const { error } = await supabase.rpc('admin_send_broadcast', {
        target_type: targetType,
        target_id: targetType === 'specific' ? targetUserId : null,
        msg_title: msgTitle,
        msg_body: msgBody,
        msg_type: 'info'
      });
      if (error) throw error;
      alert('Рассылка отправлена!');
      setMsgTitle('');
      setMsgBody('');
    } catch (e) {
      alert('Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = allUsers.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || u.id?.includes(search)
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      
      {/* ШАПКА */}
      <div className="p-4 border-b border-cyan-500/20 flex justify-between items-center bg-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Админ-центр</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest">Управление платформой</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* НАВИГАЦИЯ */}
        <div className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'users' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
            <Users className="w-5 h-5" /> Пользователи
          </button>
          <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'requests' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
            <GraduationCap className="w-5 h-5" /> Заявки ({requests.length})
          </button>
          <button onClick={() => setActiveTab('b2b')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'b2b' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
            <Building2 className="w-5 h-5" /> B2B Лиды
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
            <BarChart3 className="w-5 h-5" /> CRM / Аналитика
          </button>
          <button onClick={() => setActiveTab('broadcast')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${activeTab === 'broadcast' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
            <Megaphone className="w-5 h-5" /> Рассылка
          </button>
        </div>

        {/* КОНТЕНТ */}
        <div className="flex-1 bg-slate-900 p-8 overflow-y-auto custom-scrollbar">
          
          {/* === USERS TAB === */}
          {activeTab === 'users' && (
            <div className="max-w-5xl mx-auto">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan-500 outline-none" />
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr><th className="p-4">Пользователь</th><th className="p-4">Роль</th><th className="p-4 text-right">Действия</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50">
                        <td className="p-4"><div className="font-bold text-white">{u.username}</div><div className="text-xs text-slate-500 font-mono">{u.id}</div></td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : u.role === 'teacher' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>{u.role || 'student'}</span></td>
                        <td className="p-4 text-right">
                          <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white" value={u.role || 'student'} onChange={(e) => updateUserRole(u.id, e.target.value)}>
                            <option value="student">Ученик</option><option value="teacher">Учитель</option><option value="admin">Админ</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === REQUESTS TAB === */}
          {activeTab === 'requests' && (
            <div className="max-w-4xl mx-auto">
              {loading ? <div className="text-center py-10"><Loader className="w-8 h-8 animate-spin mx-auto text-slate-500"/></div> : 
               requests.length === 0 ? <div className="text-center py-20 text-slate-500">Нет новых заявок</div> : (
                <div className="grid gap-6">
                  {requests.map(req => (
                    <div key={req.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
                      <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">{req.full_name}</div>
                            <div className="text-sm text-slate-400 flex items-center gap-2">
                               <span className="text-cyan-400">@{req.user?.username}</span>
                               <span>•</span>
                               <span>{new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-slate-500 uppercase font-bold mb-1">Контакты</div>
                           <div className="flex items-center gap-2 text-slate-300 text-sm justify-end">
                             <Mail className="w-3 h-3" /> {req.contact_email}
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                           <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold mb-1">
                             <School className="w-3 h-3" /> Школа / ВУЗ
                           </div>
                           <div className="text-white font-medium">{req.school}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                           <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold mb-1">
                             <Briefcase className="w-3 h-3" /> Должность
                           </div>
                           <div className="text-white font-medium">{req.position}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <button onClick={() => downloadDocument(req.document_url)} className="text-cyan-400 hover:text-cyan-300 text-sm font-bold flex items-center gap-2 hover:underline">
                          <FileText className="w-4 h-4" /> Смотреть документ
                        </button>
                        <div className="flex gap-2">
                           <button onClick={() => openActionModal(req, 'reject')} className="px-4 py-2 bg-slate-700 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-lg font-bold transition-colors">Отклонить</button>
                           <button onClick={() => openActionModal(req, 'approve')} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-900/20">Одобрить</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === B2B TAB === */}
          {activeTab === 'b2b' && (
            <div className="max-w-5xl mx-auto">
              {loading ? <div className="text-center py-10"><Loader className="w-8 h-8 animate-spin mx-auto text-slate-500"/></div> : 
               b2bRequests.length === 0 ? <div className="text-center py-20 text-slate-500">Нет новых B2B заявок</div> : (
                <div className="grid gap-4">
                  {b2bRequests.map(req => (
                    <div key={req.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                             req.status === 'new' ? 'bg-emerald-500/20 text-emerald-400' :
                             req.status === 'contacted' ? 'bg-amber-500/20 text-amber-400' :
                             'bg-slate-700 text-slate-400'
                           }`}>
                             {req.status === 'new' ? 'Новый' : req.status === 'contacted' ? 'В работе' : 'Закрыт'}
                           </span>
                           <span className="text-slate-500 text-xs">{new Date(req.created_at).toLocaleString()}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{req.organization}</h3>
                        <div className="text-sm text-slate-300 mb-2">Контакт: <span className="text-purple-400 font-medium">{req.contact_name}</span> • {req.contact_info}</div>
                        {req.comment && (
                           <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 text-sm text-slate-400 italic">
                             "{req.comment}"
                           </div>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col gap-2 min-w-[150px]">
                         <select 
                           value={req.status}
                           onChange={(e) => updateB2BStatus(req.id, e.target.value)}
                           className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                         >
                           <option value="new">🔴 Новый</option>
                           <option value="contacted">🟡 В работе</option>
                           <option value="completed">🟢 Сделка закрыта</option>
                           <option value="rejected">⚫️ Отказ</option>
                         </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === ANALYTICS TAB === */}
          {activeTab === 'analytics' && stats && (
            <div className="max-w-6xl mx-auto space-y-6">
              
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-400" />
                Оперативная сводка
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* КАРТОЧКА: REALTIME ONLINE */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <div className="w-16 h-16 bg-green-500 rounded-full blur-xl animate-pulse" />
                  </div>
                  <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    Сейчас онлайн
                  </div>
                  <div className="text-4xl font-black text-white">{onlineUsers.length}</div>
                  <div className="text-xs text-slate-500 mt-2 truncate">
                    {onlineUsers.slice(0, 3).map(u => u.username).join(', ')}
                    {onlineUsers.length > 3 && ` +${onlineUsers.length - 3}`}
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <div className="text-slate-400 text-xs font-bold uppercase mb-1">DAU (24ч)</div>
                  <div className="text-3xl font-black text-white">{stats.dau}</div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Активны сегодня
                  </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <div className="text-slate-400 text-xs font-bold uppercase mb-1">MAU (30д)</div>
                  <div className="text-3xl font-black text-white">{stats.mau}</div>
                  <div className="text-xs text-slate-500 mt-1">Активны за месяц</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <div className="text-slate-400 text-xs font-bold uppercase mb-1">Конверсия</div>
                  <div className="text-3xl font-black text-amber-400">{stats.conversion_rate}%</div>
                  <div className="text-xs text-slate-500 mt-1">Free → Premium</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                  <div className="text-slate-400 text-xs font-bold uppercase mb-1">Retention (D1)</div>
                  <div className="text-3xl font-black text-purple-400">{stats.retention_rate}%</div>
                  <div className="text-xs text-slate-500 mt-1">Вернулись на след. день</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Лента событий */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    Живая лента
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {recentEvents.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${ev.event_type === 'purchase' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                          <div>
                            <div className="text-sm font-bold text-white">
                              {ev.user?.username || 'Гость'}
                              <span className="text-slate-500 font-normal ml-2 text-xs">
                                {ev.user?.role === 'admin' ? '(Admin)' : ev.user?.role === 'teacher' ? '(Teacher)' : ''}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 capitalize">{ev.event_type.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          {new Date(ev.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Инфографика */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-pink-400" />
                    Состав аудитории
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Всего пользователей</span>
                        <span>{stats.total_users}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-3">
                        <div className="bg-slate-600 h-3 rounded-full" style={{width: '100%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="text-amber-400 font-bold">Premium & Teachers</span>
                        <span>{stats.premium_users}</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000" 
                          style={{width: `${(stats.premium_users / (stats.total_users || 1)) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-white">Совет CRM</div>
                        <p className="text-xs text-slate-400 mt-1">
                          У вас хороший показатель DAU/MAU ({Math.round((stats.dau / (stats.mau || 1)) * 100)}%). 
                          Это значит, что пользователи возвращаются часто.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === BROADCAST TAB === */}
          {activeTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
               <h3 className="text-xl font-bold text-white mb-6">Рассылка уведомлений</h3>
               <div className="space-y-4">
                 <div className="grid grid-cols-4 gap-2">
                    {['all', 'teachers', 'students', 'specific'].map(t => (
                      <button key={t} onClick={() => setTargetType(t)} className={`py-2 rounded-lg text-sm font-bold border ${targetType === t ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>{t}</button>
                    ))}
                 </div>
                 {targetType === 'specific' && <input type="text" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} placeholder="UUID пользователя" className="w-full bg-slate-900 border-slate-600 rounded-xl px-4 py-3 text-white"/>}
                 <input type="text" value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} placeholder="Заголовок" className="w-full bg-slate-900 border-slate-600 rounded-xl px-4 py-3 text-white font-bold"/>
                 <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Текст сообщения..." className="w-full bg-slate-900 border-slate-600 rounded-xl px-4 py-3 text-white h-32"/>
                 <button onClick={sendBroadcast} disabled={sending} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">{sending ? 'Отправка...' : 'Отправить'}</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* === МОДАЛКА ПОДТВЕРЖДЕНИЯ (УЧИТЕЛЯ) === */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${actionType === 'approve' ? 'text-emerald-400' : 'text-red-400'}`}>
                {actionType === 'approve' ? 'Подтверждение верификации' : 'Отклонение заявки'}
              </h3>
              <button onClick={() => { setSelectedReq(null); setActionType(null); }} className="text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
            </div>
            <div className="mb-4">
              <label className="block text-slate-400 text-sm font-bold mb-2">Сообщение пользователю</label>
              <textarea 
                value={feedbackMessage} 
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="w-full h-40 bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:border-cyan-500 outline-none leading-relaxed resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setSelectedReq(null); setActionType(null); }} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Отмена</button>
              <button 
                onClick={confirmAction} 
                disabled={processing}
                className={`px-6 py-2 rounded-xl text-white font-bold flex items-center gap-2 ${actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
              >
                {processing ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {actionType === 'approve' ? 'Верифицировать' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}