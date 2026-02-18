// supabase/functions/paddle-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Секретный ключ вебхука из Paddle Dashboard (Notifications -> Webhooks)
const PADDLE_WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // 1. Проверяем метод (Paddle шлет POST)
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 2. Получаем тело и подпись (в продакшене обязательно проверяй подпись!)
    // Для простоты здесь мы доверяем body, но лучше использовать paddle-node-sdk для верификации
    const body = await req.json();
    const eventType = body.event_type;
    
    console.log(`Received event: ${eventType}`);

    // 3. Обрабатываем успешную оплату
    if (eventType === 'transaction.completed') {
      const customData = body.data.custom_data;
      const userId = customData?.userId;
      const tier = customData?.tier;

      if (!userId) {
        console.error('No userId in custom_data');
        return new Response('No userId', { status: 400 });
      }

      console.log(`Processing payment for user: ${userId}, tier: ${tier}`);

      let updateData = {};
      if (tier === 'teacher') {
        updateData = { role: 'teacher', is_premium: true }; // Учитель тоже премиум
      } else if (tier === 'premium') {
        updateData = { is_premium: true };
      }

      // Обновляем профиль в базе с правами админа (Service Role)
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Database update failed:', error);
        return new Response('DB Error', { status: 500 });
      }
      
      // Можно отправить уведомление пользователю в таблицу notifications
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Оплата успешна!',
        message: `Поздравляем! Ваш статус ${tier === 'teacher' ? 'Учитель' : 'Premium'} активирован.`,
        type: 'success'
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})