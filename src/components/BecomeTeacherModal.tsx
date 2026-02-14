import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, UploadCloud, FileText, CheckCircle, ShieldCheck, Loader, Mail } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export function BecomeTeacherModal({ onClose }: Props) {
  const { user, refreshProfile } = useAuth();
  
  // Состояния
  const [file, setFile] = useState<File | null>(null);
  const [contactEmail, setContactEmail] = useState(user?.email || '');
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
    if (!file || !user || !agreed || !contactEmail) return;

    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Загружаем файл в Storage
      // Имя файла: user_id/timestamp_filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Создаем запись в таблице teacher_requests
      const { error: dbError } = await supabase.from('teacher_requests').insert({
        user_id: user.id,
        document_url: storageData.path, // Путь к файлу
        contact_email: contactEmail,
        status: 'pending'
      });

      if (dbError) throw dbError;

      setStatus('success');
      refreshProfile(); // Обновляем профиль (хотя статус пока не изменился)

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
        <div className="bg-slate-800 border border-emerald-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Заявка принята!</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Мы проверим ваши документы в течение 24 часов и отправим ответ на почту: <br/>
            <span className="text-cyan-400 font-mono font-bold">{contactEmail}</span>
          </p>
          <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20">
            Отлично
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
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">Аккаунт Учителя</h2>
              <p className="text-xs text-slate-500 mt-1">Верификация</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Инфо блок */}
          <div className="mb-6 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl text-sm text-cyan-200">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-cyan-400">
              <FileText className="w-4 h-4"/> Возможности учителя:
            </h4>
            <ul className="list-disc pl-5 space-y-1 opacity-80 text-xs md:text-sm">
              <li>Создание закрытых турниров для класса</li>
              <li>Доступ к Генератору задач</li>
              <li>Специальный бейдж в профиле</li>
              <li>Аналитика успеваемости учеников</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Поле Email */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
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
              <p className="text-[10px] text-slate-500 mt-1">На этот адрес придет результат проверки.</p>
            </div>

            {/* 2. Загрузка файла */}
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Документ (Диплом / Справка)
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-600 group-hover:border-cyan-400 group-hover:bg-slate-800'}`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-emerald-400 animate-in zoom-in" />
                      <span className="text-emerald-400 font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs text-slate-500">Нажмите, чтобы заменить</span>
                    </div>
                  ) : (
                    <div className="text-slate-500 group-hover:text-cyan-400 transition-colors flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Нажмите для загрузки файла</span>
                      <span className="text-xs opacity-70 mt-1">PDF, JPG, PNG (до 5 МБ)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Чекбокс */}
            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 accent-cyan-500 cursor-pointer"
              />
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-snug">
                Я подтверждаю подлинность документов. Я понимаю, что предоставление ложных данных приведет к блокировке аккаунта.
              </span>
            </label>

            {status === 'error' && (
              <div className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={!file || !agreed || !contactEmail || loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin w-5 h-5" />
                  Отправка...
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