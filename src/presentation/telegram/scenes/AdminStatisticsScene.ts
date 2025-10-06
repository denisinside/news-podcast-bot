import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { BaseScene } from "telegraf/scenes";
import { IAdminService } from "@application/interfaces/IAdminService";
import { AdminMiddleware } from "@infrastructure/middleware/AdminMiddleware";

export class AdminStatisticsScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "admin_statistics";

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
            const isAdmin = await this.adminMiddleware.isAdmin(ctx);
            if (!isAdmin) {
                await ctx.reply("❌ У вас немає доступу до цієї функції.");
                return ctx.scene.enter("start");
            }

            await ctx.reply(
                "📊 *Статистика системи*\n\n" +
                "Оберіть тип статистики:",
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("👥 Користувачі", "stats_users")],
                        [Markup.button.callback("📰 Підписки", "stats_subscriptions")],
                        [Markup.button.callback("🎙️ Подкасти", "stats_podcasts")],
                        [Markup.button.callback("📈 Загальна статистика", "stats_all")],
                        [Markup.button.callback("🔙 Назад", "back_to_admin")]
                    ]).reply_markup
                }
            );
        });

        this.scene.action("stats_users", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const stats = await this.adminService.getUserStatistics();

                const message = 
                    "👥 *Статистика користувачів*\n\n" +
                    `📊 Всього користувачів: *${stats.totalUsers}*\n` +
                    `✅ Активних: *${stats.activeUsers}*\n` +
                    `🚫 Заблокованих: *${stats.blockedUsers}*\n` +
                    `👑 Адміністраторів: *${stats.adminUsers}*\n\n` +
                    `📈 *Нові користувачі:*\n` +
                    `• За сьогодні: *${stats.newUsersToday}*\n` +
                    `• За тиждень: *${stats.newUsersWeek}*\n` +
                    `• За місяць: *${stats.newUsersMonth}*`;

                await ctx.reply(message, {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("🔙 Назад до статистики", "back_to_stats")]
                    ]).reply_markup
                });
            } catch (error) {
                console.log("Error showing user statistics:", error);
                await ctx.reply("❌ Помилка при завантаженні статистики користувачів.");
            }
        });

        this.scene.action("stats_subscriptions", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const stats = await this.adminService.getSubscriptionStatistics();

                let message = 
                    "📰 *Статистика підписок*\n\n" +
                    `📊 Всього активних підписок: *${stats.totalSubscriptions}*\n` +
                    `📈 Середня кількість на користувача: *${stats.averageSubscriptionsPerUser.toFixed(2)}*\n\n`;

                if (stats.topicDistribution.length > 0) {
                    message += "*Розподіл по топіках:*\n";
                    stats.topicDistribution
                        .sort((a, b) => b.count - a.count)
                        .forEach((topic, index) => {
                            message += `${index + 1}. ${topic.topicName}: *${topic.count}* підписок\n`;
                        });
                } else {
                    message += "Немає активних підписок.";
                }

                await ctx.reply(message, {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("🔙 Назад до статистики", "back_to_stats")]
                    ]).reply_markup
                });
            } catch (error) {
                console.log("Error showing subscription statistics:", error);
                await ctx.reply("❌ Помилка при завантаженні статистики підписок.");
            }
        });

        this.scene.action("stats_podcasts", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                const stats = await this.adminService.getPodcastStatistics();

                const message = 
                    "🎙️ *Статистика подкастів*\n\n" +
                    `📊 Всього подкастів: *${stats.totalPodcasts}*\n\n` +
                    `*По статусах:*\n` +
                    `⏳ Очікують: *${stats.pendingPodcasts}*\n` +
                    `🔄 Генеруються: *${stats.generatingPodcasts}*\n` +
                    `✅ Готові: *${stats.readyPodcasts}*\n` +
                    `❌ Помилки: *${stats.failedPodcasts}*\n\n` +
                    `📈 Успішність: *${stats.totalPodcasts > 0 ? ((stats.readyPodcasts / stats.totalPodcasts) * 100).toFixed(1) : 0}%*`;

                await ctx.reply(message, {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("🔙 Назад до статистики", "back_to_stats")]
                    ]).reply_markup
                });
            } catch (error) {
                console.log("Error showing podcast statistics:", error);
                await ctx.reply("❌ Помилка при завантаженні статистики подкастів.");
            }
        });

        this.scene.action("stats_all", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                
                const [userStats, subStats, podcastStats] = await Promise.all([
                    this.adminService.getUserStatistics(),
                    this.adminService.getSubscriptionStatistics(),
                    this.adminService.getPodcastStatistics()
                ]);

                const message = 
                    "📈 *Загальна статистика системи*\n\n" +
                    `👥 *Користувачі:*\n` +
                    `• Всього: ${userStats.totalUsers}\n` +
                    `• Активних: ${userStats.activeUsers}\n` +
                    `• Нових за тиждень: ${userStats.newUsersWeek}\n\n` +
                    `📰 *Підписки:*\n` +
                    `• Всього: ${subStats.totalSubscriptions}\n` +
                    `• Середня на користувача: ${subStats.averageSubscriptionsPerUser.toFixed(2)}\n\n` +
                    `🎙️ *Подкасти:*\n` +
                    `• Всього: ${podcastStats.totalPodcasts}\n` +
                    `• Готові: ${podcastStats.readyPodcasts}\n` +
                    `• З помилками: ${podcastStats.failedPodcasts}\n\n` +
                    `✨ Система працює стабільно!`;

                await ctx.reply(message, {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.callback("🔙 Назад до статистики", "back_to_stats")]
                    ]).reply_markup
                });
            } catch (error) {
                console.log("Error showing all statistics:", error);
                await ctx.reply("❌ Помилка при завантаженні статистики.");
            }
        });

        this.scene.action("back_to_stats", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.reenter();
            } catch (error) {
                console.log("Error returning to statistics menu:", error);
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
    }
}

