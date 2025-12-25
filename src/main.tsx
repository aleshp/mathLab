import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// === ВАЖНОЕ ИСПРАВЛЕНИЕ ДЛЯ MATHQUILL ===
// 1. Импортируем jQuery
import $ from 'jquery';

// 2. Делаем его глобальным (MathQuill ищет его именно так)
// @ts-ignore
window.jQuery = $;
// @ts-ignore
window.$ = $;
// @ts-ignore
window.global = window; // Страховка для первой ошибки
// ========================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)