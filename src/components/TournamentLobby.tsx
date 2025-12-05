import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Crown, Loader, Swords, Shield } from 'lucide-react';

type LobbyProps = {
  tournamentId: string;
  onBattleStart: () => void; // Функция переключения на PvP
};

export function TournamentLobby({ tournamentId, onBattleStart }: LobbyProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [tournamentCode, setTournamentCode] = useState<string>('');
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    // 1. Загружаем инфу о турнире
    async function loadInfo() {
      const { data } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
      if (data) {
        setTournamentCode(data.code);
        if (data.status === 'active') onBattleStart(); // Если уже идет - кидаем в бой
      }
      
      // Загружаем участников
      fetchParticipants();
    }
    loadInfo();

    // 2. Подписка на изменения ТУРНИРА (Старт)
    const tourSub = supabase
      .channel(`tour-status-${tournamentId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` }, 
      (payload) => {
        if (payload.new.status === 'active') {
          onBattleStart(); // УЧИТЕЛЬ НАЖАЛ СТАРТ -> ПЕРЕХОДИМ В PVP
        }
      })
      .subscribe();

    // 3. Подписка на УЧАСТНИКОВ (Кто зашел)
    const partSub = supabase
      .channel(`tour-parts-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${tournamentId}` }, 
      () => { fetchParticipants(); })
      .subscribe();

    return () => {
      supabase.removeChannel(tourSub);
      supabase.removeChannel(partSub);
    };
  }, [tournamentId]);

  async function fetchParticipants() {
    const { data } = await supabase
      .from('tournament_participants')
      .select('*, profiles(username, mmr, clearance_level)')
      .eq('tournament_id', tournamentId);
    
    if (data) setParticipants(data);
  }

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="w-full max-w-5xl bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Фоновые эффекты */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-pulse" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-black text-white uppercase italic">Турнирное Лобби</h1>
            </div>
            <p className="text-slate-400 text-sm">Код доступа: <span className="text-cyan-400 font-mono font-bold text-lg ml-2">{tournamentCode}</span></p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800 px-6 py-3 rounded-full border border-slate-700">
            <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-white font-medium animate-pulse">Ожидание организатора...</span>
          </div>
        </div>

        {/* СЕТКА УЧАСТНИКОВ */}
        <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold">Список участников ({participants.length})</h3>
            <Users className="w-5 h-5 text-slate-500" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.map((p) => {
              const isMe = p.user_id === user?.id;
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isMe ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-slate-900 border-slate-700'} animate-in zoom-in duration-300`}>
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white font-bold text-sm border border-slate-600">
                    {p.profiles.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className={`font-bold truncate ${isMe ? 'text-cyan-400' : 'text-slate-200'}`}>
                      {isMe ? 'Вы' : p.profiles.username}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {p.profiles.mmr} MP
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Пустые слоты для красоты */}
            {Array.from({ length: Math.max(0, 8 - participants.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="border-2 border-dashed border-slate-800 rounded-xl h-16 flex items-center justify-center">
                <span className="text-slate-700 text-xs">Слот свободен</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-slate-500 text-xs">
          Приготовьтесь. Когда учитель начнет турнир, вы автоматически перейдете к задачам.
        </div>
      </div>
    </div>
  );
}