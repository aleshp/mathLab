import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Building2, User, Phone, Send, Loader, CheckCircle, Mail } from 'lucide-react';

export function B2BRequestModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    contact_name: '',
    organization: '',
    contact_info: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('b2b_requests').insert([form]);

    setLoading(false);
    if (!error) {
      setSuccess(true);
    } else {
      alert('Ошибка при отправке заявки. Попробуйте еще раз.');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-slate-800 border border-purple-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Заявка принята!</h2>
          <p className="text-slate-400 mb-8">
            Наш менеджер свяжется с вами в ближайшее время для обсуждения деталей.
          </p>
          <button onClick={onClose} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all">
            Отлично
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 border border-purple-500/30 w-full max-w-lg rounded-3xl shadow-2xl relative flex flex-col">
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">B2B Заявка</h2>
              <p className="text-xs text-slate-400">Для школ и учебных центров</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Название учебного центра / Школы</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input required type="text" value={form.organization} onChange={e => setForm({...form, organization: e.target.value})} placeholder="Например: NIS, 178 Лицей или Центр 'Умник'" className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Ваше имя</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input required type="text" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} placeholder="Как к вам обращаться?" className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Телефон / Email / Telegram</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input required type="text" value={form.contact_info} onChange={e => setForm({...form, contact_info: e.target.value})} placeholder="+7 (700) 000-00-00" className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Комментарий (необязательно)</label>
            <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} placeholder="Сколько учителей планируете подключить?" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-purple-500 outline-none h-24 resize-none" />
          </div>

          <button disabled={loading || !form.organization || !form.contact_name || !form.contact_info} type="submit" className="w-full py-4 mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
          
          {/* Фолбэк на случай если они все же хотят сами написать письмо */}
          <div className="pt-4 text-center">
            <a href="mailto:support@mathlabpvp.org" className="text-xs text-slate-500 hover:text-purple-400 flex items-center justify-center gap-1 transition-colors">
              <Mail className="w-3 h-3" /> Или напишите нам на support@mathlabpvp.org
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}