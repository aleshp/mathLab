// src/lib/legalContent.tsx
import React from 'react';

export const PrivacyContent = () => (
  <>
    <p className="opacity-70 text-xs mb-4">Последнее обновление: {new Date().toLocaleDateString()}</p>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">1. Введение</h3>
      <p>Мы уважаем вашу конфиденциальность. Настоящая Политика описывает, как проект <strong>MathLab PvP</strong> (далее "Сервис") собирает и использует ваши данные.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">2. Какие данные мы собираем</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Аккаунт:</strong> Email, имя пользователя (никнейм), зашифрованный пароль.</li>
        <li><strong>Игровой прогресс:</strong> Статистика решений задач, рейтинг (MP), уровень, достижения.</li>
        <li><strong>Технические данные:</strong> IP-адрес, тип устройства (для защиты от накрутки).</li>
        <li><strong>Профессиональные данные (для учителей):</strong> Копии дипломов или сертификатов для подтверждения квалификации. Эти данные хранятся в зашифрованном виде и доступны только администрации.</li>
      </ul>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">3. Как мы используем данные</h3>
      <p>Мы используем ваши данные исключительно для:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Обеспечения работы игры (PvP, турниры).</li>
        <li>Формирования рейтинговых таблиц (Leaderboards).</li>
        <li>Связи с вами в случае технических проблем.</li>
      </ul>
      <p className="mt-2 text-cyan-400">Мы НЕ передаем ваши данные третьим лицам и НЕ используем их для рекламы.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">4. Cookies и LocalStorage</h3>
      <p>Мы используем локальное хранилище браузера для сохранения вашей сессии входа. Это необходимо для работы сайта.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">5. Контакты</h3>
      <p>По вопросам данных пишите на: <a href="mailto:support@mathlabpvp.org" className="text-cyan-400 hover:underline">support@mathlabpvp.org</a></p>
    </section>
  </>
);

export const TermsContent = () => (
  <>
    <p className="opacity-70 text-xs mb-4">Последнее обновление: {new Date().toLocaleDateString()}</p>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">1. Общие положения</h3>
      <p>Используя сервис <strong>MathLab PvP</strong>, вы соглашаетесь с данными условиями. Сервис предоставляется "как есть" в образовательных и развлекательных целях.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">2. Правила поведения (Кодекс Чести)</h3>
      <p>Пользователям запрещено:</p>
      <ul className="list-disc pl-5 space-y-1 text-red-300">
        <li>Использовать читы, скрипты или ботов для решения задач.</li>
        <li>Оскорблять других участников в турнирах.</li>
        <li>Регистрировать мульти-аккаунты для накрутки рейтинга.</li>
      </ul>
      <p className="mt-2">Администрация оставляет за собой право обнулить рейтинг или заблокировать аккаунт за нарушение правил.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">3. Интеллектуальная собственность</h3>
      <p>Все материалы (задачи, дизайн, персонаж-сурикат, код) являются собственностью MathLab PvP. Копирование без разрешения запрещено.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">4. Отказ от ответственности</h3>
      <p>Мы стремимся к точности материалов, но не гарантируем отсутствие ошибок в задачах. Сервис не является официальным государственным экзаменатором ЕНТ.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">5. Связь</h3>
      <p>Техническая поддержка: <a href="mailto:support@mathlabpvp.org" className="text-amber-400 hover:underline">support@mathlabpvp.org</a></p>
    </section>
  </>
);

export const RefundContent = () => (
  <>
    <p className="opacity-70 text-xs mb-4">Последнее обновление: {new Date().toLocaleDateString()}</p>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">1. Общие положения</h3>
      <p><strong>MathLab PvP</strong> предоставляет образовательный контент и сервис соревнования. Услуга условно бесплатна, однако некоторые функции могут требовать оплату премиум-подписки.</p>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">2. Возврат средств за премиум-подписку</h3>
      <p>Если вы приобрели премиум-подписку и не удовлетворены услугой, вы можете запросить возврат в течение <strong>14 дней</strong> с момента покупки.</p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>Возврат возможен только при условии, что подписка не использовалась активно (менее 5 боев).</li>
        <li>Возврат обрабатывается в течение 5-10 рабочих дней.</li>
        <li>Для начала процесса возврата отправьте запрос на <a href="mailto:support@mathlabpvp.org" className="text-emerald-400 hover:underline">support@mathlabpvp.org</a></li>
      </ul>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">3. Исключения</h3>
      <p>Возврат <strong>невозможен</strong> в следующих случаях:</p>
      <ul className="list-disc pl-5 space-y-1 text-red-300">
        <li>Прошло более 14 дней с момента покупки.</li>
        <li>Подписка активно использовалась (более 5 боев, посещение турниров).</li>
        <li>Причина: технические проблемы с устройством пользователя.</li>
        <li>Нарушение правил поведения (см. Условия использования).</li>
      </ul>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">4. Процесс возврата</h3>
      <ol className="list-decimal pl-5 space-y-2">
        <li>Отправьте email на <a href="mailto:support@mathlabpvp.org" className="text-emerald-400 hover:underline">support@mathlabpvp.org</a> с указанием причины возврата.</li>
        <li>Указать email и ID вашего аккаунта в сервисе.</li>
        <li>Ожидать подтверждение от администрации (2-3 рабочих дня).</li>
        <li>После одобрения возврат средств будет обработан способом, выбранным при первоначальной оплате.</li>
      </ol>
    </section>
    <section className="mb-6">
      <h3 className="text-white font-bold text-lg mb-2">5. Связь</h3>
      <p>По вопросам возврата пишите на: <a href="mailto:support@mathlabpvp.org" className="text-emerald-400 hover:underline">support@mathlabpvp.org</a></p>
    </section>
  </>
);