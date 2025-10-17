import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { IAdminService } from "@application/interfaces/IAdminService";
import { AdminMiddleware } from "@infrastructure/middleware/AdminMiddleware";

export class AdminMenuScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "admin_menu";

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

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            // Check if user is admin
            const isAdmin = await this.adminMiddleware.isAdmin(ctx);
            if (!isAdmin) {
                await ctx.reply("❌ У вас немає доступу до адміністративної панелі.");
                return ctx.scene.enter("start");
            }

            await ctx.reply(
                "👑 *Адміністративна панель*\n\n" +
                "Оберіть дію:",
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("📰 Керування топіками", "admin_topics")],
                        [Markup.button.callback("📊 Статистика", "admin_statistics")],
                        [Markup.button.callback("👥 Керування користувачами", "admin_users")],
                        [Markup.button.callback("📢 Розсилка повідомлень", "admin_broadcast")],
                        [Markup.button.callback("📢 Реклама", "admin_advertisement")],
                        [Markup.button.callback("🔄 Запустити парсинг новин", "trigger_news_parsing")],
                        [Markup.button.callback("🔙 Назад до головного меню", "back_to_start")]
                    ]).reply_markup
                }
            );
        });

        // Handle /start command
        this.scene.command('start', async (ctx) => {
            try {
                await ctx.reply("🔙 Повертаємося до головного меню...");
                await ctx.scene.leave();
                await ctx.scene.enter("start");
            } catch (error: any) {
                console.log("Error handling /start command:", error);
                // If user blocked the bot, just leave the scene silently
                if (error.code === 403) {
                    try {
                        await ctx.scene.leave();
                    } catch (leaveError) {
                        console.log("Error leaving scene:", leaveError);
                    }
                }
            }
        });

        this.scene.action("admin_topics", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_topics");
            } catch (error) {
                console.log("Error entering admin_topics scene:", error);
            }
        });

        this.scene.action("admin_statistics", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_statistics");
            } catch (error) {
                console.log("Error entering admin_statistics scene:", error);
            }
        });

        this.scene.action("admin_users", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_users");
            } catch (error) {
                console.log("Error entering admin_users scene:", error);
            }
        });

        this.scene.action("admin_broadcast", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_broadcast");
            } catch (error) {
                console.log("Error entering admin_broadcast scene:", error);
            }
        });

        this.scene.action("admin_advertisement", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("admin_advertisement");
            } catch (error) {
                console.log("Error entering admin_advertisement scene:", error);
            }
        });

        this.scene.action("trigger_news_parsing", async (ctx) => {
            try {
                await ctx.answerCbQuery("🔄 Запускаю парсинг новин...");
                
                const result = await this.adminService.triggerNewsParsing();
                
                if (result.success) {
                    await ctx.reply(`✅ ${result.message}`);
                } else {
                    await ctx.reply(`❌ ${result.message}`);
                }
                
                // Return to admin menu
                await ctx.scene.reenter();
            } catch (error) {
                console.log("Error triggering news parsing:", error);
                await ctx.reply("❌ Помилка при запуску парсингу новин.");
            }
        });

        this.scene.action("back_to_start", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("start");
            } catch (error) {
                console.log("Error returning to start:", error);
            }
        });
    }
}

