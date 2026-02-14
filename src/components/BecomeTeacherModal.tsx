import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  X, UploadCloud, FileText, CheckCircle, ShieldCheck, 
  Loader, Mail, User, School, Briefcase, AlertTriangle 
} from 'lucide-react';

type Props = {
  onClose: () => void;
};

export function BecomeTeacherModal({ onClose }: Props) {
  const { user, refreshProfile } = useAuth();
  
  // Поля формы
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
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой. Максимум 5 МБ.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user || !agreed || !fullName || !position || !school) return;

    setLoading(true);
    setErrorMsg('');
    
    try {
      // 1. Загружаем файл в Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Создаем запись с новыми полями
      const { error: dbError } = await supabase.from('teacher_requests').insert({
        user_id: user.id,
        full_name: fullName,
        position: position,
        school: school,
        document_url: storageData.path,
        contact_email: contactEmail,
        status: 'pending'
      });

      if (dbError) throw dbError;

      setStatus('success');
      await refreshProfile();

    } catch (error: any) {
      console.error('Error:', error);
      setStatus('error');
      setErrorMsg(error.message || 'Не удалось отправить заявку.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-[250] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in duration-300">
        <div className="bg-slate-800 border border-emerald-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Заявка отправлена!</h2>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Уважаемый(ая) <strong>{fullName}</strong>, мы проверим документы в течение 24 часов. <br/>
            Ответ придет на: <span className="text-cyan-400 font-mono font-bold">{contactEmail}</span>
          </p>
          <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20">
            Понятно
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">Аккаунт Учителя</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Верификация данных</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-6 p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl text-sm text-cyan-200">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-cyan-400">
              <FileText className="w-4 h-4"/> Возможности учителя:
            </h4>
            <ul className="list-disc pl-5 space-y-1 opacity-80 text-xs md:text-sm">
              <li>Создание закрытых турниров для своих классов</li>
              <li>Доступ к Генератору задач для распечатки</li>
              <li>Специальный статус "Mentor" в профиле</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ФИО */}
            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">ФИО полностью</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Макаров Александр Петрович"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Должность */}
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Должность</label>
                <div className="relative group">
                  <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text" 
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    placeholder="Учитель математики"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                    required 
                  />
                </div>
              </div>
              {/* Школа */}
              <div>
                <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Школа / ВУЗ</label>
                <div className="relative group">
                  <School className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input 
                    type="text" 
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    placeholder="НИШ ФМН г. Алматы"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Email для связи</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="email" 
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  required 
                />
              </div>
            </div>

            {/* Загрузка файла */}
            <div>
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Документ (Диплом / Справка)</label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 group-hover:border-cyan-500 group-hover:bg-slate-800'}`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-emerald-400 animate-in zoom-in" />
                      <span className="text-emerald-400 font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500 group-hover:text-cyan-400 transition-colors flex flex-col items-center">
                      <UploadCloud className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Нажмите для загрузки файла</span>
                      <span className="text-[10px] opacity-60 mt-1 uppercase">PDF, JPG, PNG (до 5 МБ)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed uppercase font-bold tracking-tight">
                  Я подтверждаю подлинность документов. Понимаю, что предоставление ложных данных приведет к вечной блокировке аккаунта.
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={!file || !agreed || !fullName || !position || !school || loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <Loader className="animate-spin w-5 h-5" /> : 'ОТПРАВИТЬ ЗАЯВКУ'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}