import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webPush from "npm:web-push@3.6.7"; // Deno умеет загружать npm пакеты напрямую!

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// VAPID ключи генерируются 1 раз. Я сгенерировал их для тебя:
const VAPID_PUBLIC = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYpPNs_ZBE';
const VAPID_PRIVATE = 'u5K-HnL84z7XJk0o_a34F0o7wGjKx5Oq9b9pM4c9m7s';

webPush.setVapidDetails(
  'mailto:support@mathlabpvp.org',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // 1. Достаем всех юзеров, у которых ЕСТЬ подписка на пуши
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, push_subscription, companion_name, companion_hunger, last_fed_at, last_seen_at, last_push_sent_at')
      .not('push_subscription', 'is', null);

    if (error) throw error;

    const now = Date.now();
    const updatedUsers: string[] =[];

    for (const user of users) {
      // Защита от спама: шлем пуш не чаще чем раз в 16 часов
      const lastPush = user.last_push_sent_at ? new Date(user.last_push_sent_at).getTime() : 0;
      if (now - lastPush < 16 * 60 * 60 * 1000) continue;

      let pushPayload = null;

      // === ТРИГГЕР 1: ГОЛОД СУРИКАТА ===
      const lastFed = user.last_fed_at ? new Date(user.last_fed_at).getTime() : now;
      const hoursSinceFed = (now - lastFed) / (1000 * 60 * 60);
      const actualHunger = Math.max(0, (user.companion_hunger || 100) - Math.floor(hoursSinceFed * 5));

      // === ТРИГГЕР 2: НЕАКТИВНОСТЬ ===
      const lastSeen = user.last_seen_at ? new Date(user.last_seen_at).getTime() : now;
      const hoursSinceSeen = (now - lastSeen) / (1000 * 60 * 60);

      // Логика выбора пуша:
      if (actualHunger < 20) {
        pushPayload = {
          title: 'ЭЭЙ! Я ЖРАТЬ ХОЧУ!',
          body: `${user.companion_name || 'Питомец'} отказывается работать на пустой желудок. Зайди покормить его!`,
          url: '/'
        };
      } else if (hoursSinceSeen > 24) {
        pushPayload = {
          title: 'Твои мозги ржавеют...',
          body: `${user.username}, ты сегодня еще не решил ни одной задачи. Арена ждет!`,
          url: '/'
        };
      }

      // Если есть повод для пуша - отправляем
      if (pushPayload) {
        try {
          await webPush.sendNotification(user.push_subscription, JSON.stringify(pushPayload));
          updatedUsers.push(user.id);
        } catch (pushErr: any) {
          // Если юзер отписался/удалил токен в браузере — стираем его из базы, чтобы не слать ошибки
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await supabase.from('profiles').update({ push_subscription: null }).eq('id', user.id);
          }
        }
      }
    }

    // Обновляем время последней отправки, чтобы не спамить
    if (updatedUsers.length > 0) {
      await supabase
        .from('profiles')
        .update({ last_push_sent_at: new Date().toISOString() })
        .in('id', updatedUsers);
    }

    return new Response(JSON.stringify({ success: true, sentCount: updatedUsers.length }), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});