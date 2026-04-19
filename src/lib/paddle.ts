// src/lib/paddle.ts
import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;

export async function getPaddleInstance() {
  if (paddleInstance) return paddleInstance;

  paddleInstance = await initializePaddle({
    environment: 'production', // Поменяй на 'production' когда будешь готов
    token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
    eventCallback: (data) => {
      // Можно логировать события, например закрытие чекаута
      console.log(data);
    }
  });

  return paddleInstance;
}