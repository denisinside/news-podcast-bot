import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "../../../context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { IAdminService } from "../../../application/interfaces/IAdminService";
import { ISubscriptionService } from "../../../application/interfaces/ISubscriptionService";

export class StartScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "start";

    constructor(
        private readonly adminService?: IAdminService,
        private readonly subscriptionService?: ISubscriptionService
    ) {
        this.scene = new BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            console.log("=== StartScene ENTER called ===");
            console.log("User ID:", ctx.from?.id);
            console.log("Current scene:", ctx.scene?.session?.current);
            
            let subscriptionsText = "";
            
            // Get user subscriptions if services are available
            if (this.subscriptionService && this.adminService) {
                try {
                    const subscriptions = await this.subscriptionService.getUserSubscriptions(ctx.from!.id as any);
                    
                    if (subscriptions.length > 0) {
                        // Get all topics to match names
                        const allTopics = await this.adminService.getAllTopics();
                        const subscribedTopics = allTopics.filter(topic => 
                            subscriptions.some(sub => sub.topicId === topic.id)
                        );
                        
                        if (subscribedTopics.length > 0) {
                            subscriptionsText = "\n\n*📋 Ваші поточні підписки:*\n" +
                                subscribedTopics.map(topic => `• ${topic.name}`).join('\n');
                        }
                    } else {
                        subscriptionsText = "\n\n*📭 У вас поки немає активних підписок.*";
                    }
                } catch (error) {
                    console.log("Error getting subscriptions:", error);
                    subscriptionsText = "";
                }
            }
            
            await ctx.reply(
                "🎧 *Ласкаво просимо до News Podcast Bot!*\n\n" +
                "Я допоможу вам залишатися в курсі подій та отримувати персоналізовані новини у вигляді подкастів.\n\n" +
                "*🔍 Що я можу:*\n" +
                "• 📰 Збирати новини з різних джерел\n" +
                "• 🎙️ Генерувати подкасти з новин\n" +
                "• 📱 Надсилати оновлення в Telegram\n" +
                "• 🎯 Персоналізувати контент за вашими інтересами" +
                subscriptionsText + "\n\n" +
                "*🚀 Почніть з підписки на цікаві теми!*",
                { 
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("📝 Підписатися на теми", "subscribe")],
                        [Markup.button.callback("📋 Мої підписки", "my_subscriptions")],
                        [Markup.button.callback("❌ Відписатися", "unsubscribe")],
                        [Markup.button.callback("⚙️ Налаштування", "settings")],
                        [Markup.button.callback("ℹ️ Допомога", "help")]
                    ]).reply_markup
                }
            );
            console.log("StartScene message sent");
        });

        this.scene.action("subscribe", async (ctx) => {
            try {
                console.log("Subscribe button clicked in StartScene");
                await ctx.answerCbQuery();
                await ctx.scene.enter("subscribe");
            } catch (error) {
                console.log("Callback query error (subscribe):", error);
                // Try to enter scene anyway
                try {
                    await ctx.scene.enter("subscribe");
                } catch (sceneError) {
                    console.log("Scene enter error:", sceneError);
                }
            }
        });

        this.scene.action("unsubscribe", async (ctx) => {
            try {
                console.log("Unsubscribe button clicked in StartScene");
                await ctx.answerCbQuery();
                await ctx.scene.enter("unsubscribe");
            } catch (error) {
                console.log("Callback query error (unsubscribe):", error);
                try {
                    await ctx.scene.enter("unsubscribe");
                } catch (sceneError) {
                    console.log("Scene enter error:", sceneError);
                }
            }
        });

        this.scene.action("my_subscriptions", async (ctx) => {
            try {
                console.log("My subscriptions button clicked in StartScene");
                await ctx.answerCbQuery();
                await ctx.scene.enter("my_subscriptions");
            } catch (error) {
                console.log("Callback query error (my_subscriptions):", error);
                try {
                    await ctx.scene.enter("my_subscriptions");
                } catch (sceneError) {
                    console.log("Scene enter error:", sceneError);
                }
            }
        });

        this.scene.action("settings", async (ctx) => {
            try {
                console.log("Settings button clicked in StartScene");
                await ctx.answerCbQuery();
                await ctx.scene.enter("settings");
            } catch (error) {
                console.log("Callback query error (settings):", error);
                try {
                    await ctx.scene.enter("settings");
                } catch (sceneError) {
                    console.log("Scene enter error:", sceneError);
                }
            }
        });

        this.scene.action("help", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.editMessageText(
                    "ℹ️ *Детальна довідка по боту*\n\n" +
                    "🎧 *Що робить бот:*\n" +
                    "News Podcast Bot - це інтелектуальний помічник для отримання персоналізованих новин у вигляді подкастів.\n\n" +
                    "*📝 Доступні команди:*\n" +
                    "• `/start` - почати роботу з ботом або повернутися до головного меню\n" +
                    "• `/subscribe` - швидко перейти до підписки на теми новин\n" +
                    "• `/unsubscribe` - швидко перейти до відписки від тем\n" +
                    "• `/my_subscriptions` - переглянути свої поточні підписки\n" +
                    "• `/settings` - налаштувати частоту новин та аудіо подкасти\n\n" +
                    "*🔧 Як користуватися:*\n" +
                    "1️⃣ *Підписка:* Натисніть '📝 Підписатися на теми' та оберіть цікаві теми\n" +
                    "2️⃣ *Перегляд:* Використовуйте '📋 Мої підписки' для перегляду активних підписок\n" +
                    "3️⃣ *Управління:* Кнопка '❌ Відписатися' дозволяє видалити непотрібні теми\n" +
                    "4️⃣ *Налаштування:* Оберіть частоту отримання новин та увімкніть аудіо подкасти\n" +
                    "5️⃣ *Отримання новин:* Бот автоматично надсилатиме новини згідно з вашими налаштуваннями (в розробці)\n\n" +
                    "*💡 Поради:*\n" +
                    "• Підписуйтеся на 3-5 тем для оптимального досвіду\n" +
                    "• Регулярно переглядайте та оновлюйте свої підписки\n" +
                    "• Використовуйте кнопки меню для зручної навігації\n\n" +
                    "*🆘 Підтримка:*\n" +
                    "Якщо виникли питання, скористайтеся кнопкою 'ℹ️ Допомога' в головному меню",
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад до меню", "back_to_start")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Callback query error (help):", error);
            }
        });

        this.scene.action("back_to_start", async (ctx) => {
            try {
                console.log("Re-entering start scene");
                await ctx.answerCbQuery();
                await ctx.scene.reenter();
            } catch (error) {
                console.log("Callback query error (back_to_start):", error);
                try {
                    await ctx.scene.reenter();
                } catch (sceneError) {
                    console.log("Scene reenter error:", sceneError);
                }
            }
        });

    }
}
