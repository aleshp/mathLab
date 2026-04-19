import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, UploadCloud, FileText, CheckCircle, ShieldCheck, 
  Loader, Mail, User, School, Briefcase, XCircle 
} from 'lucide-react';

type Props = {
  onClose: () => void;
};

export function BecomeTeacherModal({ onClose }: Props) {
  const { user, refreshProfile } = useAuth();
  
  // Состояния полей
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [school, setSchool] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Проверка размера (макс 5МБ)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой. Максимум 5 МБ.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !agreed || !contactEmail || !fullName || !position || !school) return;

    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Загружаем файл в Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Создаем запись в таблице teacher_requests с НОВЫМИ ПОЛЯМИ
      const { error: dbError } = await supabase.from('teacher_requests').insert({
        user_id: user.id,
        full_name: fullName,
        position: position,
        school: school,
        document_url: storageData.path, // Путь к файлу
        contact_email: contactEmail,
        status: 'pending'
      });

      if (dbError) throw dbError;

      setStatus('success');
      await refreshProfile(); // Обновляем профиль

    } catch (error: any) {
      console.error('Error submitting teacher request:', error);
      setStatus('error');
      setErrorMsg(error.message || 'Не удалось отправить заявку.');
    } finally {
      setLoading(false);
    }
  };

  // Экран успеха
  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in duration-300">
        <div className="bg-slate-800 border border-emerald-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />

          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Заявка принята!</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Мы проверим ваши документы в течение 24 часов. <br/>
            Результат проверки придет на почту: <br/>
            <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded mt-1 inline-block">{contactEmail}</span>
          </p>
          <button 
            onClick={onClose} 
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
          >
            Отлично, жду!
          </button>
        </div>
      </div>
    );
  }

  // Экран формы
  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">Аккаунт Учителя</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">Верификация</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Инфо блок */}
          <div className="mb-8 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl text-sm text-cyan-100/90 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText className="w-24 h-24 text-cyan-400" />
            </div>
            <h4 className="font-bold mb-3 flex items-center gap-2 text-cyan-400 relative z-10">
              <FileText className="w-4 h-4"/> Возможности учителя:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm relative z-10">
              <li>Создание закрытых турниров для класса</li>
              <li>Доступ к Генератору задач (Printable)</li>
              <li>Специальный бейдж <span className="text-cyan-400 font-bold">Teacher</span> в профиле</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ФИО */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                ФИО полностью
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Должность */}
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                  Должность
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Учитель математики"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Школа */}
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                  Школа / ВУЗ
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <School className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="№178 Лицей"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Email для связи
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="teacher@school.kz"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 ml-1">
                На этот адрес придет результат проверки.
              </p>
            </div>

            {/* Загрузка файла */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Документ (Диплом / Справка)
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-600 group-hover:border-cyan-400 group-hover:bg-slate-800'}`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2 animate-in zoom-in">
                      <div className="p-2 bg-emerald-500/20 rounded-full">
                         <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold text-sm truncate max-w-[200px] block">{file.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Готов к загрузке</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 group-hover:text-cyan-400 transition-colors flex flex-col items-center">
                      <div className="p-3 bg-slate-800 rounded-full mb-3 group-hover:bg-cyan-500/10 transition-colors">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <span className="text-sm font-medium">Нажмите для загрузки файла</span>
                      <span className="text-xs opacity-60 mt-1">PDF, JPG, PNG (до 5 МБ)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Чекбокс */}
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 accent-cyan-500 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-snug">
                  Я подтверждаю подлинность документов. Я понимаю, что предоставление ложных данных приведет к вечной блокировке аккаунта.
                </span>
              </label>
            </div>

            {/* Ошибки */}
            {status === 'error' && (
              <div className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Кнопка */}
            <button 
              type="submit" 
              disabled={!file || !agreed || !contactEmail || !fullName || !position || !school || loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  <span>Отправка данных...</span>
                </>
              ) : (
                'ОТПРАВИТЬ ЗАЯВКУ'
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}