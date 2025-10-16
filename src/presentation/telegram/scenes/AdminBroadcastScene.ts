import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { IAdminService } from "@application/interfaces/IAdminService";
import { AdminMiddleware } from "@infrastructure/middleware/AdminMiddleware";
import { Telegraf } from "telegraf";
import { INotificationService } from "@application/interfaces/INotificationService";

interface SessionData {
    message?: string;
    targetType?: 'all' | 'topic' | 'active';
    topicId?: string;
}

export class AdminBroadcastScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "admin_broadcast";

    constructor(
        private readonly adminService: IAdminService,
        private readonly adminMiddleware: AdminMiddleware,
        private readonly bot: Telegraf<IBotContext>,
        private readonly notificationService: INotificationService
    ) {
        this.scene = new BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private getSessionData(ctx: IBotContext): SessionData {
        if (!ctx.scene.session) {
            (ctx.scene as any).session = {};
        }
        if (!(ctx.scene.session as any).adminBroadcast) {
            (ctx.scene.session as any).adminBroadcast = {};
        }
        return (ctx.scene.session as any).adminBroadcast;
    }

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            const isAdmin = await this.adminMiddleware.isAdmin(ctx);
            if (!isAdmin) {
                await ctx.reply("❌ У вас немає доступу до цієї функції.");
                return ctx.scene.enter("start");
            }

            const sessionData = this.getSessionData(ctx);
            sessionData.message = undefined;
            sessionData.targetType = undefined;
            sessionData.topicId = undefined;

            await ctx.reply(
                "📢 *Розсилка повідомлень*\n\n" +
                "Оберіть кому відправити повідомлення:",
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("👥 Всім користувачам", "broadcast_all")],
                        [Markup.button.callback("✅ Тільки активним", "broadcast_active")],
                        [Markup.button.callback("📰 За топіком", "broadcast_topic")],
                        [Markup.button.callback("🧪 Тестове повідомлення", "test_broadcast")],
                        [Markup.button.callback("🔙 Назад", "back_to_admin")]
                    ]).reply_markup
                }
            );
        });

        this.scene.action("broadcast_all", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const sessionData = this.getSessionData(ctx);
                sessionData.targetType = 'all';

                await ctx.reply(
                    "✍️ Введіть повідомлення для розсилки всім користувачам:\n\n" +
                    "Ви можете використовувати Markdown для форматування.",
                    { parse_mode: 'Markdown' }
                );
            } catch (error) {
                console.log("Error starting broadcast to all:", error);
            }
        });

        this.scene.action("broadcast_active", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const sessionData = this.getSessionData(ctx);
                sessionData.targetType = 'active';

                await ctx.reply(
                    "✍️ Введіть повідомлення для розсилки активним користувачам:\n\n" +
                    "Ви можете використовувати Markdown для форматування.",
                    { parse_mode: 'Markdown' }
                );
            } catch (error) {
                console.log("Error starting broadcast to active:", error);
            }
        });

        this.scene.action("broadcast_topic", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.showTopicsForBroadcast(ctx);
            } catch (error) {
                console.log("Error showing topics for broadcast:", error);
            }
        });

        this.scene.action(/^broadcast_to_topic_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];
                const sessionData = this.getSessionData(ctx);
                sessionData.targetType = 'topic';
                sessionData.topicId = topicId;

                const topic = (await this.adminService.getAllTopics()).find(t => String(t._id) === topicId);
                
                await ctx.reply(
                    `✍️ Введіть повідомлення для розсилки підписникам топіку "${topic?.name}":\n\n` +
                    "Ви можете використовувати Markdown для форматування.",
                    { parse_mode: 'Markdown' }
                );
            } catch (error) {
                console.log("Error starting topic broadcast:", error);
            }
        });

        this.scene.action("confirm_broadcast", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.sendBroadcast(ctx);
            } catch (error) {
                console.log("Error confirming broadcast:", error);
            }
        });

        this.scene.action("cancel_broadcast", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.reply("❌ Розсилку скасовано.");
                await ctx.scene.reenter();
            } catch (error) {
                console.log("Error canceling broadcast:", error);
            }
        });

        this.scene.action("back_to_admin", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_menu");
            } catch (error) {
                console.log("Error returning to admin menu:", error);
            }
        });

        this.scene.action("test_broadcast", async (ctx) => {
            await this.sendTestBroadcast(ctx);
        });

        // Handle text input
        this.scene.on("text", async (ctx) => {
            const sessionData = this.getSessionData(ctx);
            const text = ctx.message.text;

            if (!sessionData.targetType) {
                return;
            }

            sessionData.message = text;

            // Show preview
            let targetText = '';
            let recipientCount = 0;

            try {
                if (sessionData.targetType === 'all') {
                    const users = await this.adminService.getAllUsers();
                    recipientCount = users.length;
                    targetText = 'всім користувачам';
                } else if (sessionData.targetType === 'active') {
                    const users = await this.adminService.getAllUsers();
                    recipientCount = users.filter(u => !u.isBlocked).length;
                    targetText = 'активним користувачам';
                } else if (sessionData.targetType === 'topic' && sessionData.topicId) {
                    // Get topic name and subscriber count directly
                    const topic = (await this.adminService.getAllTopics()).find(t => String(t._id) === sessionData.topicId);
                    const subscriptions = await this.adminService.getSubscriptionStatistics();
                    const topicStats = subscriptions.topicDistribution.find(t => t.topicId === sessionData.topicId);
                    recipientCount = topicStats?.count || 0;
                    targetText = `підписникам топіку "${topic?.name || topicStats?.topicName || 'Невідомий топік'}"`;
                    
                    // Debug logging
                    console.log('Broadcast topic debug:', {
                        topicId: sessionData.topicId,
                        topicName: topic?.name,
                        topicStatsName: topicStats?.topicName,
                        recipientCount,
                        targetText
                    });
                }

                await ctx.reply(
                    "📋 *Попередній перегляд повідомлення:*\n\n" +
                    "━━━━━━━━━━━━━━━━━━━━",
                    { parse_mode: 'Markdown' }
                );

                await ctx.reply(text, { parse_mode: 'Markdown' }).catch(() => {
                    // If markdown fails, send as plain text
                    ctx.reply(text);
                });

                await ctx.reply(
                    "━━━━━━━━━━━━━━━━━━━━\n\n" +
                    `Повідомлення буде відправлено *${targetText}*.\n` +
                    `Орієнтовна кількість отримувачів: *${recipientCount}*\n\n` +
                    "Підтвердити розсилку?",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("✅ Підтвердити", "confirm_broadcast")],
                            [Markup.button.callback("❌ Скасувати", "cancel_broadcast")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Error showing broadcast preview:", error);
                await ctx.reply("❌ Помилка при підготовці розсилки.");
            }
        });
    }

    private async showTopicsForBroadcast(ctx: IBotContext) {
        try {
            const topics = await this.adminService.getTopicsWithSubscribers();

            if (topics.length === 0) {
                await ctx.reply(
                    "❌ Немає доступних топіків для розсилки.",
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад", "back_to_admin")]
                        ]).reply_markup
                    }
                );
                return;
            }

            const buttons = topics
                .filter(t => (t.subscribersCount || 0) > 0)
                .map(topic => [
                    Markup.button.callback(
                        `${topic.name} (${topic.subscribersCount} підписників)`,
                        `broadcast_to_topic_${topic._id}`
                    )
                ]);

            if (buttons.length === 0) {
                await ctx.reply(
                    "❌ Немає топіків з підписниками.",
                    {
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад", "back_to_admin")]
                        ]).reply_markup
                    }
                );
                return;
            }

            buttons.push([Markup.button.callback("🔙 Назад", "back_to_admin")]);

            await ctx.reply(
                "📰 *Оберіть топік для розсилки:*",
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard(buttons).reply_markup
                }
            );
        } catch (error) {
            console.log("Error showing topics for broadcast:", error);
            await ctx.reply("❌ Помилка при завантаженні топіків.");
        }
    }

    private async sendBroadcast(ctx: IBotContext) {
        const sessionData = this.getSessionData(ctx);
        
        if (!sessionData.message) {
            await ctx.reply("❌ Повідомлення не знайдено.");
            return;
        }

        await ctx.reply("⏳ Розсилка розпочата...");

        try {
            let users: string[] = [];

            if (sessionData.targetType === 'all') {
                const allUsers = await this.adminService.getAllUsers();
                users = allUsers.map(u => u._id);
            } else if (sessionData.targetType === 'active') {
                const allUsers = await this.adminService.getAllUsers();
                users = allUsers.filter(u => !u.isBlocked).map(u => u._id);
            } else if (sessionData.targetType === 'topic' && sessionData.topicId) {
                // Get actual subscribers for this topic
                users = await this.adminService.getTopicSubscribers(sessionData.topicId);
                
                // Filter out blocked users
                const allUsers = await this.adminService.getAllUsers();
                const blockedUserIds = allUsers.filter(u => u.isBlocked).map(u => u._id);
                users = users.filter(userId => !blockedUserIds.includes(userId));
            }

            let successCount = 0;
            let failCount = 0;

            for (const userId of users) {
                try {
                    await this.bot.telegram.sendMessage(
                        userId,
                        sessionData.message,
                        { parse_mode: 'Markdown' }
                    ).catch(() => {
                        // If markdown fails, try plain text
                        return this.bot.telegram.sendMessage(userId, sessionData.message!);
                    });
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.log(`Failed to send message to user ${userId}:`, error);
                }

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            await ctx.reply(
                `✅ *Розсилка завершена!*\n\n` +
                `📨 Відправлено: ${successCount}\n` +
                `❌ Помилок: ${failCount}`,
                { parse_mode: 'Markdown' }
            );

            // Clear session data
            sessionData.message = undefined;
            sessionData.targetType = undefined;
            sessionData.topicId = undefined;

            await ctx.scene.reenter();
        } catch (error) {
            console.log("Error sending broadcast:", error);
            await ctx.reply("❌ Помилка при розсилці повідомлень.");
        }
    }

    private async sendTestBroadcast(ctx: IBotContext) {
        try {
            await ctx.answerCbQuery("🧪 Надсилаю тестове повідомлення всім активним користувачам...");

            const testMessage = `🧪 *Тестове повідомлення від адміністратора*

Це тестове повідомлення для перевірки роботи системи розсилки.

✅ Якщо ви бачите це повідомлення, система працює коректно!

📅 Час: ${new Date().toLocaleString('uk-UA')}
👤 Відправлено адміністратором`;

            // Get all active users
            const users = await this.adminService.getAllUsers();
            const activeUsers = users.filter(user => !user.isBlocked);
            
            if (activeUsers.length === 0) {
                await ctx.reply("❌ Немає активних користувачів для тестування.");
                return;
            }

            const userIds = activeUsers.map(user => user._id);
            const result = await this.notificationService.sendBulkMessages(userIds, testMessage);

            await ctx.reply(
                `🧪 *Тестове повідомлення надіслано!*\n\n` +
                `📨 Відправлено: ${result.sent}\n` +
                `❌ Помилок: ${result.failed}\n` +
                `👥 Всього активних користувачів: ${activeUsers.length}`,
                { parse_mode: 'Markdown' }
            );

            await ctx.scene.reenter();
        } catch (error) {
            console.log("Error sending test broadcast:", error);
            await ctx.reply("❌ Помилка при надсиланні тестового повідомлення.");
        }
    }
}

