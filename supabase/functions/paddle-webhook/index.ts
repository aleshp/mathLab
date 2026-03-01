import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Секретные ключи из настроек Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const eventType = body.event_type;
    
    console.log(`Received Paddle event: ${eventType}`);

    // === 1. ПОДПИСКА ОПЛАЧЕНА ИЛИ ПРОДЛЕНА ===
    if (eventType === 'transaction.completed' || eventType === 'subscription.activated' || eventType === 'subscription.updated') {
      const customData = body.data.custom_data || body.data.customData;
      const userId = customData?.userId;
      const tier = customData?.tier;

      if (userId) {
        let updateData = {};
        if (tier === 'teacher') {
          updateData = { role: 'teacher', is_premium: true }; 
        } else if (tier === 'premium') {
          updateData = { is_premium: true };
        }

        await supabase.from('profiles').update(updateData).eq('id', userId);
        
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Подписка активна!',
          message: `Ваш статус ${tier === 'teacher' ? 'Учитель' : 'Premium'} успешно активирован/продлен.`,
          type: 'success'
        });
      }
    }

    // === 2. ПОДПИСКА ИСТЕКЛА, ОТМЕНЕНА ИЛИ НЕ ПРОШЛА ОПЛАТА ===
    if (eventType === 'subscription.canceled' || eventType === 'subscription.expired' || eventType === 'subscription.past_due') {
      const customData = body.data.custom_data || body.data.customData;
      const userId = customData?.userId;

      if (userId) {
        // Забираем премиум и откатываем роль учителя до обычного студента
        const updateData = { 
          is_premium: false,
          role: 'student' // Если он был учителем, он снова становится учеником (но его заявка approved сохраняется)
        };

        await supabase.from('profiles').update(updateData).eq('id', userId);
        
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Подписка остановлена',
          message: 'Срок действия вашей подписки истек, либо платеж не прошел. Базовый доступ сохранен.',
          type: 'warning'
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
})