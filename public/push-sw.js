// Этот скрипт импортируется PWA-плагином и работает в фоне
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/meerkat/avatar.png',
      badge: '/meerkat/avatar.png',
      vibrate:[200, 100, 200, 100, 200], // Двойная вибрация
      data: { url: data.url || '/' },
      requireInteraction: true // Пуш не исчезнет сам, пока юзер не смахнет
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Что делать при клике на пуш (открываем приложение)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});