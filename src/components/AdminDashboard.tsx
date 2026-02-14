import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, Users, Megaphone, Search, Shield, GraduationCap, 
  User as UserIcon, Send, CheckCircle, ChevronDown, 
  FileText, Check, XCircle, Download, Loader, Mail,
  School, Briefcase, AlertTriangle
} from 'lucide-react';

type Props = {
  onClose: () => void;
};

// Полный тип заявки со всеми полями из базы
type TeacherRequest = {
  id: string;
  user_id: string;
  full_name: string; // ФИО
  position: string;  // Должность
  school: string;    // Школа
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
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'broadcast'>('users');
  
  // === СОСТОЯНИЯ ДАННЫХ ===
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // === СОСТОЯНИЯ ДЛЯ МОДАЛКИ (Одобрение/Отказ) ===
  const [selectedReq, setSelectedReq] = useState<TeacherRequest | null>(null); // Какую заявку обрабатываем
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null); // Что делаем
  const [feedbackMessage, setFeedbackMessage] = useState(''); // Текст сообщения
  const [processing, setProcessing] = useState(false); // Крутилка загрузки

  // === СОСТОЯНИЯ ДЛЯ РАССЫЛКИ ===
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [sending, setSending] = useState(false);

  // Загрузка данных при переключении вкладок
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  // --- ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ ---
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

  // --- ЗАГРУЗКА ЗАЯВОК ---
  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teacher_requests')
      .select(`
        *,
        user:profiles(username, email)
      `)
      .eq('status', 'pending') // Грузим только новые
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      // @ts-ignore
      setRequests(data as TeacherRequest[]);
    }
    setLoading(false);
  }

  // --- СМЕНА РОЛИ В ТАБЛИЦЕ ЮЗЕРОВ ---
  async function updateUserRole(userId: string, newRole: string) {
    if (!confirm('Вы уверены, что хотите изменить роль пользователя?')) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (!error) {
      // Обновляем локальный стейт, чтобы не перезагружать
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert('Ошибка обновления роли: ' + error.message);
    }
  }

  // --- ОТКРЫТИЕ МОДАЛКИ (ШАГ 1) ---
  const openActionModal = (req: TeacherRequest, type: 'approve' | 'reject') => {
    setSelectedReq(req);
    setActionType(type);
    
    // Генерируем шаблон текста
    if (type === 'approve') {
      setFeedbackMessage(
        `Здравствуйте, ${req.full_name}!\n\n` +
        `Ваша заявка на статус учителя (Школа: ${req.school}) была рассмотрена и ОДОБРЕНА.\n` +
        `Теперь вам доступен функционал "Ментора": создание турниров и аналитика.\n\n` +
        `С уважением, Администрация MathLab PvP.`
      );
    } else {
      setFeedbackMessage(
        `Здравствуйте, ${req.full_name}.\n\n` +
        `Мы рассмотрели вашу заявку, но вынуждены её ОТКЛОНИТЬ.\n` +
        `Возможные причины: нечитаемый документ или несоответствие данных.\n\n` +
        `Пожалуйста, подайте заявку повторно, проверив прикрепленные файлы.`
      );
    }
  };

  // --- ПОДТВЕРЖДЕНИЕ ДЕЙСТВИЯ (ШАГ 2) ---
  const confirmAction = async () => {
    if (!selectedReq || !actionType) return;
    
    setProcessing(true);
    try {
      // 1. Обновляем статус заявки
      const { error: reqError } = await supabase
        .from('teacher_requests')
        .update({ status: actionType === 'approve' ? 'approved' : 'rejected' })
        .eq('id', selectedReq.id);

      if (reqError) throw reqError;

      // 2. Если одобрено — меняем роль в profiles
      if (actionType === 'approve') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'teacher' })
          .eq('id', selectedReq.user_id);
        
        if (roleError) throw roleError;
      }

      // 3. Отправляем уведомление (с тем текстом, который в textarea)
      await supabase.from('notifications').insert({
        user_id: selectedReq.user_id,
        title: actionType === 'approve' ? '🎉 Заявка одобрена!' : '❌ Заявка отклонена',
        message: feedbackMessage,
        type: actionType === 'approve' ? 'success' : 'error'
      });

      // 4. Убираем из списка локально
      setRequests(prev => prev.filter(r => r.id !== selectedReq.id));
      
      // Закрываем модалку
      setSelectedReq(null);
      setActionType(null);
      alert('Действие выполнено успешно!');

    } catch (e: any) {
      console.error(e);
      alert('Ошибка: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  // --- СКАЧИВАНИЕ ДОКУМЕНТА ---
  async function downloadDocument(path: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 60); // Ссылка живет 60 сек
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Ошибка получения файла: ' + (error?.message || 'Unknown error'));
    }
  }

  // --- РАССЫЛКА ---
  async function sendBroadcast() {
    if (!msgTitle || !msgBody) return;
    if (targetType === 'specific' && !targetUserId) return;

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
      
      alert('Рассылка успешно отправлена!');
      setMsgTitle('');
      setMsgBody('');
    } catch (e: any) {
      alert('Ошибка отправки: ' + e.message);
    } finally {
      setSending(false);
    }
  }

  const filteredUsers = allUsers.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.id?.includes(search)
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 z-[100] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
      
      {/* === ВЕРХНЯЯ ПАНЕЛЬ === */}
      <div className="p-4 md:p-6 border-b border-cyan-500/20 flex justify-between items-center bg-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white">Админ-центр</h2>
            <p className="text-slate-400 text-[10px] md:text-xs uppercase tracking-widest hidden sm:block">Управление платформой</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* === БОКОВОЕ МЕНЮ === */}
        <div className="w-full md:w-64 bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-700 p-2 md:p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-all font-bold text-sm md:text-base whitespace-nowrap ${activeTab === 'users' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
          >
            <Users className="w-4 h-4 md:w-5 md:h-5" /> Пользователи
          </button>
          
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-all font-bold text-sm md:text-base whitespace-nowrap ${activeTab === 'requests' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
          >
            <GraduationCap className="w-4 h-4 md:w-5 md:h-5" /> Заявки ({requests.length})
          </button>

          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl transition-all font-bold text-sm md:text-base whitespace-nowrap ${activeTab === 'broadcast' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
          >
            <Megaphone className="w-4 h-4 md:w-5 md:h-5" /> Рассылка
          </button>
        </div>

        {/* === ОСНОВНОЙ КОНТЕНТ === */}
        <div className="flex-1 bg-slate-900 p-4 md:p-8 overflow-y-auto">
          
          {/* 1. ПОЛЬЗОВАТЕЛИ */}
          {activeTab === 'users' && (
            <div className="max-w-5xl mx-auto">
              <div className="flex gap-4 mb-4 md:mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Поиск по имени или ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hidden md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-4">Пользователь</th>
                      <th className="p-4">Роль</th>
                      <th className="p-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{u.username}</div>
                          <div className="text-xs text-slate-500 font-mono">{u.id}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                            u.role === 'teacher' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {u.role || 'student'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select 
                            className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-cyan-500 cursor-pointer"
                            value={u.role || 'student'}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                          >
                            <option value="student">Ученик</option>
                            <option value="teacher">Учитель</option>
                            <option value="admin">Админ</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Мобильный список */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map(u => (
                  <div key={u.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-white">{u.username}</span>
                      <span className="text-xs font-mono text-slate-500">{u.id.slice(0, 8)}...</span>
                    </div>
                    <select 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                      value={u.role || 'student'}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                    >
                      <option value="student">Ученик</option>
                      <option value="teacher">Учитель</option>
                      <option value="admin">Админ</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. ЗАЯВКИ (ОБНОВЛЕННЫЙ ИНТЕРФЕЙС) */}
          {activeTab === 'requests' && (
            <div className="max-w-4xl mx-auto">
              {loading ? (
                <div className="text-center py-10 text-slate-500"><Loader className="w-8 h-8 animate-spin mx-auto"/></div>
              ) : requests.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  Новых заявок нет
                </div>
              ) : (
                <div className="grid gap-6">
                  {requests.map(req => (
                    <div key={req.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                      
                      {/* Шапка карточки */}
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-700 pb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 shrink-0">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-white">{req.full_name}</h3>
                            <div className="text-sm text-slate-400 flex items-center gap-2">
                              <UserIcon className="w-3 h-3" />
                              <span className="text-cyan-400">@{req.user?.username}</span>
                              <span className="text-slate-600">•</span>
                              <span className="font-mono text-xs">{new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300">{req.contact_email}</span>
                        </div>
                      </div>

                      {/* Инфо о работе */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <School className="w-3 h-3" /> Учебное заведение
                          </div>
                          <div className="text-white font-medium truncate" title={req.school}>{req.school}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Должность
                          </div>
                          <div className="text-white font-medium truncate" title={req.position}>{req.position}</div>
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="flex flex-col md:flex-row gap-3 pt-2">
                        <button 
                          onClick={() => downloadDocument(req.document_url)}
                          className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-cyan-400 border border-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4" /> Документ
                        </button>
                        
                        <div className="flex gap-2 flex-[2]">
                           <button 
                             onClick={() => openActionModal(req, 'reject')}
                             className="flex-1 py-3 bg-slate-700 hover:bg-red-900/30 text-slate-300 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-xl font-bold transition-colors"
                           >
                             Отклонить
                           </button>
                           <button 
                             onClick={() => openActionModal(req, 'approve')}
                             className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                           >
                             <Check className="w-5 h-5" /> Одобрить
                           </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. РАССЫЛКА */}
          {activeTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Megaphone className="w-6 h-6 text-cyan-400" /> Отправить уведомление
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm font-bold mb-2">Получатели</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['all', 'teachers', 'students', 'specific'].map(type => (
                        <button
                          key={type}
                          onClick={() => setTargetType(type)}
                          className={`py-2 px-3 rounded-lg text-xs md:text-sm font-bold border transition-all capitalize ${
                            targetType === type 
                              ? 'bg-cyan-600 border-cyan-500 text-white' 
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {type === 'all' ? 'Все' : type === 'specific' ? 'По ID' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetType === 'specific' && (
                    <input 
                      type="text" 
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      placeholder="Вставьте UUID пользователя..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white font-mono text-sm"
                    />
                  )}

                  <input 
                    type="text" 
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="Заголовок сообщения..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white font-bold"
                  />

                  <textarea 
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Текст уведомления..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white h-32 resize-none leading-relaxed"
                  />

                  <button 
                    onClick={sendBroadcast}
                    disabled={sending || !msgTitle || !msgBody}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    {sending ? 'Отправка...' : <><Send className="w-5 h-5" /> ОТПРАВИТЬ</>}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* === МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ДЕЙСТВИЯ === */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className={`w-full max-w-lg bg-slate-900 border rounded-2xl shadow-2xl p-6 relative ${actionType === 'approve' ? 'border-emerald-500/50' : 'border-red-500/50'}`}>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${actionType === 'approve' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {actionType === 'approve' ? <Check className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {actionType === 'approve' ? 'Подтверждение учителя' : 'Отклонение заявки'}
                </h3>
              </div>
              <button onClick={() => { setSelectedReq(null); setActionType(null); }} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-xs font-bold uppercase mb-2 ml-1">
                Сообщение для пользователя (можно редактировать)
              </label>
              <textarea 
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="w-full h-48 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-cyan-500 outline-none leading-relaxed resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setSelectedReq(null); setActionType(null); }} 
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmAction}
                disabled={processing}
                className={`py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                } shadow-lg`}
              >
                {processing ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {actionType === 'approve' ? 'ПОДТВЕРДИТЬ' : 'ОТКЛОНИТЬ'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}