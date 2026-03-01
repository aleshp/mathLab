import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function AnalyticsTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const trackSession = async () => {
      // 1. Обновляем "Был в сети"
      await supabase.from('profiles').update({ 
        last_seen_at: new Date().toISOString() 
      }).eq('id', user.id);

      // 2. Логируем вход (сессию)
      // Проверяем, не логировали ли мы это уже в последние 30 минут (чтобы не спамить базу)
      const lastLog = sessionStorage.getItem('last_analytics_log');
      const now = Date.now();
      
      if (!lastLog || now - parseInt(lastLog) > 30 * 60 * 1000) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'session_start',
          metadata: { 
            ua: navigator.userAgent,
            lang: navigator.language 
          }
        });
        sessionStorage.setItem('last_analytics_log', now.toString());
      }
    };

    trackSession();
  }, [user]);

  return null; // Этот компонент ничего не рисует
}