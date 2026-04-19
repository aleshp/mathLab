import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('PADDLE_WEBHOOK_SECRET')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Функция для верификации подписи Paddle
async function verifySignature(signature: string, body: string, secret: string) {
  const parts = signature.split(';');
  const tsPart = parts.find(p => p.startsWith('ts='));
  const h1Part = parts.find(p => p.startsWith('h1='));

  if (!tsPart || !h1Part) return false;

  const timestamp = tsPart.split('=')[1];
  const h1 = h1Part.split('=')[1];
  const signedPayload = `${timestamp}:${body}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const expectedHash = hmac.digest('hex');

  return expectedHash === h1;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('paddle-signature') || '';
    const rawBody = await req.text(); // Важно получить сырое тело для проверки подписи

    // --- ПРОВЕРКА ПОДЛИННОСТИ ---
    const isValid = await verifySignature(signature, rawBody, WEBHOOK_SECRET);
    
    if (!isValid) {
      console.error("Invalid signature detected!");
      return new Response('Invalid signature', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventType = body.event_type;
    console.log(`Verified Paddle event: ${eventType}`);

    // Логика обработки (остается прежней)
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
          message: `Ваш статус ${tier === 'teacher' ? 'Учитель' : 'Premium'} успешно активирован.`,
          type: 'success'
        });
      }
    }

    if (eventType === 'subscription.canceled' || eventType === 'subscription.expired') {
      const customData = body.data.custom_data || body.data.customData;
      const userId = customData?.userId;

      if (userId) {
        await supabase.from('profiles').update({ is_premium: false, role: 'student' }).eq('id', userId);
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