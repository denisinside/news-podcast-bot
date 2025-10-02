import { Markup } from "telegraf";

export class TelegramUI {
    static getMainMenu() {
        return Markup.inlineKeyboard([
            [Markup.button.callback("📰 Останні новини", "latest_news")],
            [Markup.button.callback("🎧 Слухати подкаст", "podcast")],
            [Markup.button.callback("⚙️ Налаштування", "settings")]
        ]);
    }

    static getSettingsMenu() {
        return Markup.inlineKeyboard([
            [Markup.button.callback("🔔 Підписки", "subscriptions")],
            [Markup.button.callback("⬅️ Назад", "back_to_main")]
        ]);
    }

    static renderWelcome(username?: string) {
        return `Привіт, ${username ?? "друже"}! 👋\nВибери дію з меню нижче:`;
    }

    static renderNewsItem(title: string, url: string) {
        return `📰 <b>${title}</b>\n🔗 ${url}`;
    }

    static renderPodcastInfo(title: string, duration: string) {
        return `🎧 Подкаст: <b>${title}</b>\n⏱️ Тривалість: ${duration}`;
    }
}
