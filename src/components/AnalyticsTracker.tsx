import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function AnalyticsTracker() {
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. Логируем вход (раз в 30 мин)
    const trackSession = async () => {
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);

      const lastLog = sessionStorage.getItem('last_analytics_log');
      const now = Date.now();
      
      if (!lastLog || now - parseInt(lastLog) > 30 * 60 * 1000) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'session_start',
          metadata: { ua: navigator.userAgent }
        });
        sessionStorage.setItem('last_analytics_log', now.toString());
      }
    };
    trackSession();

    // 2. REALTIME ONLINE (Presence)
    // Мы сообщаем серверу: "Я онлайн, меня зовут так-то"
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      // Здесь клиенту не обязательно что-то делать, 
      // данные нужны админу
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const userStatus = {
          id: user.id,
          username: profile?.username || 'User',
          role: profile?.role || 'student',
          online_at: new Date().toISOString(),
        };
        await channel.track(userStatus);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return null;
}