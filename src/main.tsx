import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// === ОТКЛЮЧЕНИЕ ВСТРОЕННОЙ КЛАВИАТУРЫ MATHLIVE ===
import { mathVirtualKeyboard } from 'mathlive';
// Запрещаем ей появляться вообще
mathVirtualKeyboard.enabled = false;
// =================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)