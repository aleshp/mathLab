import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'kk' : 'ru';
    i18n.changeLanguage(newLang);
    localStorage.setItem('app_lang', newLang); // Запоминаем выбор
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all group"
      title="Изменить язык / Тілді өзгерту"
    >
      <Globe className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
      <span className="text-xs font-bold text-slate-300 uppercase">
        {i18n.language}
      </span>
    </button>
  );
}