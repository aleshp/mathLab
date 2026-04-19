import { useState, useEffect } from 'react';
import { X, Users, Copy, Check, Loader2, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const PVP_MODULE_ID = '00000000-0000-0000-0000-000000000099';

type Props = {
  onClose: () => void;
  onDuelReady: (duelId: string) => void;
};

export function FriendlyDuelModal({ onClose, onDuelReady }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const[copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // === СОЗДАНИЕ МАТЧА (Берем задачи как в PVP) ===
  const handleCreate = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    setMode('create');

    try {
      // 1. Быстро получаем задачи из PvP-модуля (как в рейтинговом матче)
      const { data: allProbs, error: probsError } = await supabase
        .from('problems')
        .select('id')
        .eq('module_id', PVP_MODULE_ID);

      if (probsError) throw probsError;

      // 2. Перемешиваем и берем 10 случайных
      const shuffled = (allProbs ??[])
        .sort(() => 0.5 - Math.random())
        .slice(0, 10)
        .map((p: any) => p.id);

      if (shuffled.length === 0) {
        throw new Error('В базе нет задач для PvP!');
      }

      // 3. Создаем дуэль
      const { data, error: rpcError } = await supabase.rpc('create_friendly_duel', {
        creator_uuid: user.id,
        prob_ids: shuffled, // Передаем готовые задачи!
      });

      if (rpcError) throw rpcError;

      const duelId = data.id;
      setInviteCode(data.invite_code);

      // 4. Ждем, когда друг введет код
      const channel = supabase.channel(`wait-friendly-${duelId}`)
        .on(
          'postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` }, 
          (payload) => {
            if (payload.new.status === 'active') {
              supabase.removeChannel(channel);
              onDuelReady(duelId); // Запускаем матч
            }
          }
        )
        .subscribe();

    } catch (err: any) {
      console.error('Ошибка создания:', err);
      setError(err.message || 'Ошибка создания матча');
      setMode('select');
    } finally {
      setIsLoading(false);
    }
  };

  // === ПОДКЛЮЧЕНИЕ К МАТЧУ ===
  const handleJoin = async () => {
    if (!user || joinCode.length < 6) return;
    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('join_friendly_duel', {
        joiner_uuid: user.id,
        code: joinCode.toUpperCase(),
      });

      if (rpcError) throw rpcError;
      if (data?.error) throw new Error(data.error);

      // Успешно подключились — стартуем
      onDuelReady(data.id);
    } catch (err: any) {
      console.error('Ошибка подключения:', err);
      setError(err.message || 'Неверный код или матч уже начался');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
          <Users className="w-8 h-8 text-emerald-400" />
        </div>

        <h2 className="text-2xl font-black text-white uppercase italic mb-1">Дружеский матч</h2>
        <p className="text-slate-400 text-sm mb-6">Сыграйте с другом без потери рейтинга</p>

        {error && (
          <div className="text-red-400 bg-red-400/10 border border-red-500/20 p-3 rounded-xl text-sm mb-4 font-bold">
            {error}
          </div>
        )}

        {/* Выбор действия */}
        {mode === 'select' && (
           <div className="flex flex-col gap-3">
             <button 
                onClick={handleCreate} 
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
              >
               <Play className="w-5 h-5 fill-current" />
               Создать игру
             </button>
             <button 
                onClick={() => setMode('join')} 
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all border border-slate-700 active:scale-95 uppercase tracking-wide"
              >
               Войти по коду
             </button>
           </div>
        )}

        {/* Экран ожидания друга */}
        {mode === 'create' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
                <div className="text-emerald-400 font-bold animate-pulse">Подготовка задач...</div>
              </div>
            ) : (
              <div className="py-2">
                <div className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Код приглашения</div>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
                  <div className="flex-1 text-4xl font-black text-emerald-400 tracking-[0.2em] font-mono select-all">
                    {inviteCode}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="p-4 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>
                
                <div className="mt-8 flex flex-col items-center gap-3">
                   <div className="relative">
                     <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                     <Loader2 className="w-6 h-6 text-emerald-500 animate-spin relative z-10" />
                   </div>
                   <span className="text-slate-400 text-sm font-medium">Ожидание соперника...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Экран ввода кода */}
        {mode === 'join' && (
          <div className="space-y-4">
             <input
               type="text"
               maxLength={6}
               placeholder="ВВЕДИТЕ КОД"
               value={joinCode}
               onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
               className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-5 text-center text-3xl font-black text-white uppercase tracking-[0.2em] focus:border-emerald-500 focus:outline-none transition-colors"
             />
             <button
               onClick={handleJoin}
               disabled={joinCode.length < 6 || isLoading}
               className="w-full py-4 bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide"
             >
               {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Подключиться'}
             </button>
             <button 
                onClick={() => setMode('select')} 
                className="text-slate-500 text-sm mt-2 hover:text-white"
              >
                Назад
              </button>
          </div>
        )}
      </div>
    </div>
  );
}
