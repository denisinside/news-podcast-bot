# News Podcast Bot

Цей проєкт організований за принципами **чистої архітектури** (Clean Architecture) з розділенням на рівні:
- `application` (бізнес-логіка та сервіси),
- `infrastructure` (доступ до зовнішніх систем),
- `presentation` (контролери та UI),
- `models` (базові сутності домену),
- `config` (доступ до змінних середовища),
- `context` (контекст бота),
- `workers` (фонові задачі),
- `types` (типи TypeScript).

---

## 🏗️ Структура проєкту

### **Точки входу**
- **`index.ts`** - головний файл запуску бота з ініціалізацією всіх сервісів
- **`NewsPodcastBot.ts`** - основний клас бота з підключенням до Telegram API
- **`worker.ts`** - точка входу для фонових воркерів (поки не реалізовано)

---

### **📁 application/**
Бізнес-логіка та сервіси:

#### **`interfaces/`** - інтерфейси сервісів:
- `IAdminService.ts` - адміністративні операції
- `INewsFinderService.ts` - пошук та обробка новин
- `INotificationService.ts` - відправка повідомлень
- `IPodcastService.ts` - генерація подкастів
- `ISubscriptionService.ts` - управління підписками
- `IUserService.ts` - робота з користувачами
- `IUserSettingsService.ts` - налаштування користувачів
- `IMessageTemplateService.ts` - шаблони повідомлень
- `ISchedulingService.ts` - планування завдань

#### **`services/`** - реалізації сервісів:
- `AdminService.ts` - адміністративні функції
- `AdvertisementService.ts` - управління рекламою
- `MessageTemplateService.ts` - шаблони повідомлень
- `NewsFinderService.ts` - пошук та парсинг новин
- `NotificationService.ts` - відправка повідомлень користувачам
- `PodcastService.ts` - генерація аудіо подкастів
- `SchedulingService.ts` - планування завдань
- `SubscriptionService.ts` - управління підписками
- `UserService.ts` - робота з користувачами
- `UserSettingsService.ts` - налаштування користувачів

---

### **📁 infrastructure/**
Реалізації інтерфейсів для взаємодії із зовнішнім світом:

#### **`clients/`** - клієнти для зовнішніх API:
- `GeminiClient.ts` - інтеграція з Google Gemini AI для генерації тексту та аудіо
- `FileStorageClient.ts` - робота з файловим сховищем
- `IGeminiClient.ts`, `IFileStorageClient.ts`, `ITextToSpeechClient.ts` - інтерфейси

#### **`repositories/`** - реалізації доступу до бази даних:
- `UserRepository.ts` - користувачі
- `TopicRepository.ts` - теми новин
- `ArticleRepository.ts` - статті
- `SubscriptionRepository.ts` - підписки
- `PodcastRepository.ts` - подкасти
- `AdvertisementRepository.ts` - реклама
- Відповідні інтерфейси (`I*Repository.ts`)

#### **`strategies/`** - стратегії отримання новин:
- `RssSource.ts` - парсинг RSS джерел
- `INewsSourceStrategy.ts` - інтерфейс стратегії

#### **`managers/`** - менеджери для складних операцій:
- `QueueManager.ts` - управління чергами завдань

#### **`middleware/`** - middleware для Telegram бота:
- `AdminMiddleware.ts` - перевірка прав адміністратора

---

### **📁 presentation/**
Відповідає за представлення та взаємодію з користувачем:

#### **`telegram/`** - інтеграція з Telegram Bot API:
- `TelegramBot.ts` - основний клас бота
- `TelegramController.ts` - контролер для обробки команд
- `TelegramUI.ts` - UI компоненти

#### **`telegram/scenes/`** - сцени для різних режимів роботи:
- `StartScene.ts` - головне меню
- `SubscribeScene.ts` - підписка на теми
- `UnsubscribeScene.ts` - відписка від тем
- `MySubscriptionsScene.ts` - перегляд підписок
- `SettingsScene.ts` - налаштування користувача
- `AdminMenuScene.ts` - адміністративне меню
- `AdminTopicsScene.ts` - управління темами
- `AdminStatisticsScene.ts` - статистика
- `AdminUsersScene.ts` - управління користувачами
- `AdminBroadcastScene.ts` - розсилка повідомлень
- `AdminAdvertisementScene.ts` - управління рекламою

#### **`telegram/commands/`** - команди бота:
- `ICommand.ts` - інтерфейс команди

---

### **📁 models/**
Сутності домену:
- `User.ts` - користувач
- `Topic.ts` - тема новин
- `Article.ts` - стаття
- `Subscription.ts` - підписка
- `Podcast.ts` - подкаст
- `UserSettings.ts` - налаштування користувача
- `Advertisement.ts` - реклама

---

### **📁 workers/**
Фонові задачі (background jobs):
- `BaseQueueWorker.ts` - базовий клас для воркерів
- `NewsQueueWorker.ts` - обробник новин
- `PodcastQueueWorker.ts` - обробник подкастів
- `NewsParserQueueWorker.ts` - парсинг новин
- `ScheduledAdvertisementProcessor.ts` - обробка запланованої реклами

---

### **📁 config/**
Конфігурація та підключення до зовнішніх сервісів:
- `ConfigService.ts` - доступ до змінних середовища
- `QueueService.ts` - робота з чергами (BullMQ + Redis)
- `MongoDbService.ts` - підключення до MongoDB
- `telegram.ts` - конфігурація Telegram

---

### **📁 types/**
Типи TypeScript для спільного використання:
- `queue.ts` - типи для черг
- `telegram.ts` - типи для Telegram-інтеграції

---

### **📁 utils/**
Хелпери та утиліти:
- `logger.ts` - логування
- `validation.ts` - валідація
- `helpers.ts` - допоміжні функції

---

### **📁 migrations/**
Міграції для бази даних:
- `add-user-roles.ts` - додавання ролей користувачів
- `remove-telegram-id-index.ts` - видалення індексу

---

## 🔄 Як працює логіка

1. **Presentation** приймає запити від користувачів через Telegram
2. Викликає **Application services**, які містять бізнес-правила
3. Сервіси взаємодіють через **Infrastructure** (репозиторії, клієнти API)
4. **Models** описують сутності, з якими працюють сервіси
5. **Workers** виконують довгі або періодичні задачі у бекграунді

---

## 🤖 Особливості Telegram інтеграції

### **Команди**
Кожна команда окремим класом, підключається через контролер.

### **Сцени**
Наприклад, `StartScene` або `SubscribeScene`, де користувач обирає теми через inline-кнопки.
Кожна сцена окремим класом, підключається через контролер.

### **Сесії MongoDB**
Зберігають стан користувача між кроками сценарію, замість локальних сесій.

### **Адміністративна панель**
Повноцінна адміністративна панель з:
- Управління темами новин
- Статистика користувачів
- Розсилка повідомлень
- Управління рекламою

---

## 🚀 Основні функції

### **Для користувачів:**
- Підписка на теми новин
- Отримання персоналізованих новин
- Генерація аудіо подкастів
- Налаштування частоти отримання новин
- Управління підписками

### **Для адміністраторів:**
- Додавання/видалення тем новин
- Перегляд статистики користувачів
- Розсилка повідомлень
- Управління рекламою
- Моніторинг роботи системи

### **Технічні особливості:**
- Асинхронна обробка завдань через BullMQ
- Інтеграція з Google Gemini AI для генерації контенту
- Автоматичний парсинг RSS джерел
- Система черг для обробки подкастів
- MongoDB для зберігання даних
- Redis для черг завдань

---

## 🛠️ Технологічний стек

- **TypeScript** - основна мова програмування
- **Node.js** - runtime середовище
- **Telegraf** - Telegram Bot API
- **MongoDB** - база даних
- **Redis** - черги завдань
- **BullMQ** - система черг
- **Google Gemini AI** - генерація контенту
- **FFmpeg** - обробка аудіо