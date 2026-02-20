// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Словари (можно будет потом разбить на отдельные JSON файлы, если разрастется)
const resources = {
  ru: {
    translation: {
      "menu": {
        "archive": "Архив Знаний",
        "leaderboard": "Рейтинг",
        "profile": "Личное Дело"
      },
      "auth": {
        "login": "Войти",
        "demo": "Попробовать Демо"
      },
      "pvp": {
        "title": "PVP АРЕНА",
        "subtitle": "Битва умов в реальном времени",
        "find_match": "НАЙТИ СОПЕРНИКА",
        "back": "Вернуться в лабораторию",
        "status": "Ваш статус",
        "calibration": "Калибровка"
      }
    }
  },
  kk: {
    translation: {
      "menu": {
        "archive": "Білім мұрағаты",
        "leaderboard": "Рейтинг",
        "profile": "Жеке іс"
      },
      "auth": {
        "login": "Кіру",
        "demo": "Демо нұсқасын көру"
      },
      "pvp": {
        "title": "PVP АРЕНА",
        "subtitle": "Нақты уақыттағы ақыл-ой шайқасы",
        "find_match": "ҚАРСЫЛАСТЫ ТАБУ",
        "back": "Зертханаға оралу",
        "status": "Сіздің мәртебеңіз",
        "calibration": "Калибрлеу"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('app_lang') || 'ru', // Берем из памяти или ставим RU
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;