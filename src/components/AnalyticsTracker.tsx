import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function AnalyticsTracker() {
  const { user, profile } = useAuth();

  // 1. Логируем сессию — только при маунте / смене юзера
  useEffect(() => {
    if (!user) return;

    const trackSession = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);

      const lastLog = sessionStorage.getItem('last_analytics_log');
      const now = Date.now();

      if (!lastLog || now - parseInt(lastLog) > 30 * 60 * 1000) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'session_start',
          metadata: { ua: navigator.userAgent },
        });
        sessionStorage.setItem('last_analytics_log', now.toString());
      }
    };

    trackSession();
  }, [user]); // <-- только user, без profile

  // 2. Presence — только когда есть стабильные данные профиля
  useEffect(() => {
    if (!user || !profile) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: user.id,
          username: profile.username || 'User',
          role: profile.role || 'student',
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.username]); // <-- только стабильные поля, без всего объекта

  return null;
}