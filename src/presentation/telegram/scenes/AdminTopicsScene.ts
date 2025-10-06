import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { IAdminService } from "@application/interfaces/IAdminService";
import { AdminMiddleware } from "@infrastructure/middleware/AdminMiddleware";

interface SessionData {
    action?: 'create' | 'edit' | 'delete';
    topicId?: string;
    topicName?: string;
    step?: 'name' | 'url';
}

export class AdminTopicsScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "admin_topics";

    constructor(
        private readonly adminService: IAdminService,
        private readonly adminMiddleware: AdminMiddleware
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
        if (!(ctx.scene.session as any).adminTopics) {
            (ctx.scene.session as any).adminTopics = {};
        }
        return (ctx.scene.session as any).adminTopics;
    }

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            const isAdmin = await this.adminMiddleware.isAdmin(ctx);
            if (!isAdmin) {
                await ctx.reply("❌ У вас немає доступу до цієї функції.");
                return ctx.scene.enter("start");
            }

            const sessionData = this.getSessionData(ctx);
            sessionData.action = undefined;
            sessionData.topicId = undefined;
            sessionData.topicName = undefined;
            sessionData.step = undefined;

            await this.showTopicsList(ctx);
        });

        this.scene.action("add_topic", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const sessionData = this.getSessionData(ctx);
                sessionData.action = 'create';
                sessionData.step = 'name';
                
                await ctx.reply(
                    "📝 *Створення нового топіку*\n\n" +
                    "Введіть назву топіку:",
                    { parse_mode: 'Markdown' }
                );
            } catch (error) {
                console.log("Error starting topic creation:", error);
            }
        });

        this.scene.action(/^edit_topic_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];
                const sessionData = this.getSessionData(ctx);
                sessionData.action = 'edit';
                sessionData.topicId = topicId;

                await ctx.reply(
                    "✏️ *Редагування топіку*\n\n" +
                    "Оберіть що хочете змінити:",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("📝 Змінити назву", `edit_name_${topicId}`)],
                            [Markup.button.callback("🔗 Змінити URL джерела", `edit_url_${topicId}`)],
                            [Markup.button.callback("🔙 Назад", "back_to_topics")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Error editing topic:", error);
            }
        });

        this.scene.action(/^edit_name_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];
                const sessionData = this.getSessionData(ctx);
                sessionData.action = 'edit';
                sessionData.topicId = topicId;
                sessionData.step = 'name';

                await ctx.reply(
                    "📝 Введіть нову назву топіку:",
                    { parse_mode: 'Markdown' }
                );
            } catch (error) {
                console.log("Error editing topic name:", error);
            }
        });

        this.scene.action(/^edit_url_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];
                const sessionData = this.getSessionData(ctx);
                sessionData.action = 'edit';
                sessionData.topicId = topicId;
                sessionData.step = 'url';

                await ctx.reply(
                    "🔗 Введіть новий URL джерела:",
                    { parse_mode: 'Markdown' }
                );
            } catch (error) {
                console.log("Error editing topic URL:", error);
            }
        });

        this.scene.action(/^delete_topic_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];

                await ctx.reply(
                    "⚠️ *Ви впевнені що хочете видалити цей топік?*\n\n" +
                    "Всі підписки користувачів на цей топік будуть видалені!",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("✅ Так, видалити", `confirm_delete_${topicId}`)],
                            [Markup.button.callback("❌ Ні, скасувати", "back_to_topics")]
                        ]).reply_markup
                    }
                );
            } catch (error) {
                console.log("Error deleting topic:", error);
            }
        });

        this.scene.action(/^confirm_delete_(.+)$/, async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const topicId = ctx.match[1];

                const result = await this.adminService.deleteTopic(topicId);
                
                if (result) {
                    await ctx.reply("✅ Топік успішно видалено!");
                } else {
                    await ctx.reply("❌ Помилка при видаленні топіку.");
                }

                await this.showTopicsList(ctx);
            } catch (error) {
                console.log("Error confirming topic deletion:", error);
                await ctx.reply("❌ Помилка при видаленні топіку.");
            }
        });

        this.scene.action("back_to_topics", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await this.showTopicsList(ctx);
            } catch (error) {
                console.log("Error returning to topics:", error);
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

        // Handle text input
        this.scene.on("text", async (ctx) => {
            const sessionData = this.getSessionData(ctx);
            const text = ctx.message.text;

            if (sessionData.action === 'create') {
                if (sessionData.step === 'name') {
                    sessionData.topicName = text;
                    sessionData.step = 'url';
                    await ctx.reply("🔗 Тепер введіть URL джерела (RSS):");
                } else if (sessionData.step === 'url') {
                    try {
                        const topic = await this.adminService.createTopic(sessionData.topicName!, text);
                        await ctx.reply(`✅ Топік "${topic.name}" успішно створено!`);
                        sessionData.action = undefined;
                        sessionData.step = undefined;
                        sessionData.topicName = undefined;
                        await this.showTopicsList(ctx);
                    } catch (error) {
                        console.log("Error creating topic:", error);
                        await ctx.reply("❌ Помилка при створенні топіку. Можливо, такий URL вже існує.");
                    }
                }
            } else if (sessionData.action === 'edit') {
                if (sessionData.step === 'name') {
                    try {
                        await this.adminService.updateTopic(sessionData.topicId!, { name: text });
                        await ctx.reply("✅ Назву топіку успішно змінено!");
                        sessionData.action = undefined;
                        sessionData.step = undefined;
                        sessionData.topicId = undefined;
                        await this.showTopicsList(ctx);
                    } catch (error) {
                        console.log("Error updating topic name:", error);
                        await ctx.reply("❌ Помилка при зміні назви топіку.");
                    }
                } else if (sessionData.step === 'url') {
                    try {
                        await this.adminService.updateTopic(sessionData.topicId!, { sourceUrl: text });
                        await ctx.reply("✅ URL джерела успішно змінено!");
                        sessionData.action = undefined;
                        sessionData.step = undefined;
                        sessionData.topicId = undefined;
                        await this.showTopicsList(ctx);
                    } catch (error) {
                        console.log("Error updating topic URL:", error);
                        await ctx.reply("❌ Помилка при зміні URL джерела.");
                    }
                }
            }
        });
    }

    private async showTopicsList(ctx: IBotContext) {
        try {
            const topics = await this.adminService.getTopicsWithSubscribers();

            if (topics.length === 0) {
                await ctx.reply(
                    "📰 *Керування топіками*\n\n" +
                    "Топіків ще немає. Створіть перший топік!",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("➕ Додати топік", "add_topic")],
                            [Markup.button.callback("🔙 Назад", "back_to_admin")]
                        ]).reply_markup
                    }
                );
                return;
            }

            let message = "📰 *Керування топіками*\n\n";
            
            topics.forEach((topic, index) => {
                message += `${index + 1}. *${topic.name}*\n`;
                message += `   👥 Підписників: ${topic.subscribersCount || 0}\n`;
                message += `   🔗 ${topic.sourceUrl}\n\n`;
            });

            // Create buttons for each topic
            const buttons = topics.map(topic => [
                Markup.button.callback(`✏️ ${topic.name}`, `edit_topic_${topic._id}`),
                Markup.button.callback("🗑️", `delete_topic_${topic._id}`)
            ]);

            buttons.push([Markup.button.callback("➕ Додати топік", "add_topic")]);
            buttons.push([Markup.button.callback("🔙 Назад", "back_to_admin")]);

            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: Markup.inlineKeyboard(buttons).reply_markup
            });
        } catch (error) {
            console.log("Error showing topics list:", error);
            await ctx.reply("❌ Помилка при завантаженні списку топіків.");
        }
    }
}

