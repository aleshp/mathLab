import filter from 'leo-profanity';

// Загружаем оба словаря сразу
filter.loadDictionary('en');
filter.addDictionary('ru', filter.getDictionary('ru')); // встроенный русский

// Добавляем свои слова которых нет в словаре
filter.add([
  // Leetspeak обходы которые библиотека не ловит
  'f4ck', 'sh1t', 'a55', 'b1tch',
  // Зарезервированные ники
  'admin', 'moderator', 'support', 'system', 'root',
  // Дополнительный русский мат (словоформы)
  'залупа', 'залупин', 'шлюха', 'шлюшка', 'пидорас',
]);

// Нормализация перед проверкой: убираем leetspeak замены
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[_\-.]/g, ''); // f_u_c_k → fuck
}

export function containsBadWord(username: string): boolean {
  // Проверяем и оригинал и нормализованную версию
  return filter.check(username) || filter.check(normalize(username));
}