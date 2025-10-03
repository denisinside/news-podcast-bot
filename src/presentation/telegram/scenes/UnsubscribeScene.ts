import { IScene } from "./IScene";
import { BaseScene } from "telegraf/scenes";
import { IBotContext } from "../../../context/IBotContext";
import { Markup, Scenes } from "telegraf";
import { IAdminService } from "../../../application/interfaces/IAdminService";
import { ISubscriptionService } from "../../../application/interfaces/ISubscriptionService";

export class UnsubscribeScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "unsubscribe";

    constructor(
        private readonly adminService: IAdminService,
        private readonly subscriptionService: ISubscriptionService
    ) {
        this.scene = new Scenes.BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private registerHandlers(): void {
        this.scene.enter(async (ctx) => {
            try {
                const userId = ctx.from!.id;
                const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);
                
                if (subscriptions.length === 0) {
                await ctx.reply(
                    "📭 *У вас немає активних підписок.*\n\n" +
                    "Скористайтеся командою `/subscribe` щоб підписатися на теми!",
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🏠 Головне меню", "back_to_menu")]
                        ]).reply_markup
                    }
                );
                    return;
                }

                // Get topic names for subscriptions
                const allTopics = await this.adminService.getAllTopics();
                const subscribedTopics = allTopics.filter(topic => 
                    subscriptions.some(sub => sub.topicId === topic.id)
                );

                if (subscribedTopics.length === 0) {
                await ctx.reply(
                    "❌ *Не вдалося знайти інформацію про ваші підписки.*",
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("🏠 Головне меню", "back_to_menu")]
                        ]).reply_markup
                    }
                );
                    return;
                }

                const buttons = subscribedTopics.map(topic => 
                    [Markup.button.callback(`❌ ${topic.name}`, `unsub_${topic.id}`)]
                );
                
                buttons.push([Markup.button.callback("🏠 Головне меню", "back_to_menu")]);

                await ctx.reply(
                    "📋 *Ваші поточні підписки:*\n\n" +
                    subscribedTopics.map(topic => `• ${topic.name}`).join('\n') + "\n\n" +
                    "Натисніть на тему, від якої хочете відписатися:",
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
                    }
                );

            } catch (error) {
                console.log("Unsubscribe scene error:", error);
                await ctx.reply(
                    "❌ Виникла помилка при завантаженні підписок. Спробуйте пізніше.",
                    Markup.inlineKeyboard([
                        [Markup.button.callback("🏠 Головне меню", "back_to_menu")]
                    ])
                );
            }
        });

        this.scene.action(/^unsub_(.+)$/, async (ctx) => {
            try {
                const topicId = ctx.match[1];
                const userId = ctx.from!.id;
                
                await this.subscriptionService.unsubscribe(userId, topicId);
                await ctx.answerCbQuery("✅ Ви успішно відписалися!");
                await ctx.editMessageText(
                    "✅ *Ви успішно відписалися від цієї теми!*\n\n" +
                    "Можете відписатися від інших тем або повернутися до головного меню.",
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("❌ Відписатися від інших тем", "unsubscribe")],
                            [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                        ]).reply_markup
                    }
                );
                
                // Don't automatically reenter - let user choose what to do next

            } catch (error) {
                console.log("Unsubscribe action error:", error);
                try {
                    await ctx.answerCbQuery("❌ Помилка відписки");
                    await ctx.editMessageText("❌ Виникла помилка при відписці. Спробуйте пізніше.");
                } catch (fallbackError) {
                    console.log("Fallback error:", fallbackError);
                }
            }
        });

        this.scene.action("back_to_menu", async (ctx) => {
            try {
                console.log("Back to menu button clicked in UnsubscribeScene");
                await ctx.answerCbQuery("Повертаємося до головного меню...");
                await ctx.scene.leave();
                console.log("Left unsubscribe scene");
                await ctx.scene.enter("start");
                console.log("Entered start scene");
            } catch (error) {
                console.log("Back to menu error:", error);
            }
        });

        this.scene.action("back_to_start", async (ctx) => {
            try {
                console.log("Navigating to start scene from UnsubscribeScene");
                await ctx.answerCbQuery("Переходимо до головного меню...");
                await ctx.scene.leave();
                console.log("Left unsubscribe scene");
                await ctx.scene.enter("start");
                console.log("Entered start scene");
            } catch (error) {
                console.log("Back to start error:", error);
            }
        });

        this.scene.action("unsubscribe", async (ctx) => {
            try {
                await ctx.answerCbQuery();
                await ctx.scene.enter("unsubscribe");
            } catch (error) {
                console.log("Unsubscribe error:", error);
                try {
                    await ctx.scene.enter("unsubscribe");
                } catch (sceneError) {
                    console.log("Scene enter error:", sceneError);
                }
            }
        });
    }
}
