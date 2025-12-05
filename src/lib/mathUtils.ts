import { evaluate } from 'mathjs';

export function checkAnswer(userAnswer: string, dbAnswer: string): boolean {
  if (!userAnswer) return false;

  // 1. Базовая очистка (убираем пробелы, меняем запятые на точки)
  const cleanUser = userAnswer.toLowerCase().trim().replace(/,/g, '.');
  const cleanDb = dbAnswer.toLowerCase().trim().replace(/,/g, '.');

  // Если строки идентичны — сразу да
  if (cleanUser === cleanDb) return true;

  try {
    // 2. Проверка на МНОЖЕСТВО ответов (например: "2; -3" или "x1=2; x2=-3")
    // Разделитель может быть ; или пробел (если чисел несколько)
    if (cleanDb.includes(';') || cleanDb.includes(' ')) {
      // Разбиваем на массивы чисел
      const extractNumbers = (str: string) => {
        // Регулярка ищет числа (включая отрицательные и дроби)
        const matches = str.match(/-?\d+(\.\d+)?/g);
        return matches ? matches.map(n => parseFloat(n)).sort((a, b) => a - b) : [];
      };

      const userNums = extractNumbers(cleanUser);
      const dbNums = extractNumbers(cleanDb);

      // Сравниваем отсортированные массивы
      if (userNums.length > 0 && userNums.length === dbNums.length) {
        return userNums.every((val, index) => Math.abs(val - dbNums[index]) < 0.001);
      }
    }

    // 3. Математическое вычисление (MathJS)
    // Это обработает "1/4" vs "0.25", "2^3" vs "8", "sqrt(4)" vs "2"
    const userValue = evaluate(cleanUser);
    const dbValue = evaluate(cleanDb);

    // Сравниваем числа с погрешностью (epsilon), чтобы 0.33333... было равно 1/3
    if (typeof userValue === 'number' && typeof dbValue === 'number') {
      return Math.abs(userValue - dbValue) < 0.001; 
    }

  } catch (e) {
    // Если mathjs не смог посчитать (например, там текст "x > 5"), 
    // возвращаемся к простому сравнению строк
    return cleanUser === cleanDb;
  }

  return false;
}