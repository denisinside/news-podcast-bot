import { IScene } from "./IScene";
import { BaseScene } from "telegraf/scenes";
import { IBotContext } from "../../../context/IBotContext";
import { Markup, Scenes } from "telegraf";
import { IAdminService } from "../../../application/interfaces/IAdminService";
import { ISubscriptionService } from "../../../application/interfaces/ISubscriptionService";
import {QueueManager} from "@infrastructure/managers/QueueManager";

export class MySubscriptionsScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "my_subscriptions";

    constructor(
        private readonly adminService: IAdminService,
        private readonly subscriptionService: ISubscriptionService,
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
                const userId: string = String(ctx.from!.id);
                const subscriptions = await this.subscriptionService.getUserSubscriptions(userId);

                if (subscriptions.length === 0) {
                    await ctx.reply(
                        "📭 *У вас немає активних підписок.*\n\n" +
                        "Скористайтеся кнопкою '📝 Підписатися на теми' щоб підписатися на цікаві теми!",
                        {
                            parse_mode: 'Markdown',
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback("📝 Підписатися на теми", "subscribe")],
                                [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                            ]).reply_markup
                        }
                    );
                    return;
                }

                // Filter out subscriptions with deleted topics (topicId is null)
                const validSubscriptions = subscriptions.filter(sub => sub.topicId !== null);
                
                const allTopics = await this.adminService.getAllTopics();
                const subscribedTopics = allTopics.filter(topic =>
                    validSubscriptions.some(sub => String(sub.topicId._id) === topic.id)
                );

                if (subscribedTopics.length === 0) {
                    await ctx.reply(
                        "📭 *У вас немає активних підписок.*\n\n" +
                        "Можливо, деякі теми були видалені адміністратором.\n\n" +
                        "Підпишіться на нові теми, щоб отримувати новини!",
                        {
                            parse_mode: 'Markdown',
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback("📝 Підписатися на теми", "subscribe")],
                                [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                            ]).reply_markup
                        }
                    );
                    return;
                }

                await ctx.reply(
                    "📋 *Ваші поточні підписки:*\n\n" +
                    subscribedTopics.map(topic => `• ${topic.name}`).join('\n') + "\n\n" +
                    "Ви отримуватимете новини автоматично з цих джерел.\n\n" +
                    "Якщо хочете відписатися від якоїсь теми, скористайтеся кнопкою '❌ Відписатися'.",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("📝 Підписатися на інші теми", "subscribe")],
                            [Markup.button.callback("❌ Відписатися від тем", "unsubscribe")],
                            [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                        ]).reply_markup
                    }
                );

            } catch (error) {
                console.log("My subscriptions scene error:", error);
                await ctx.reply(
                    "❌ Виникла помилка при завантаженні підписок. Спробуйте пізніше.",
                    Markup.inlineKeyboard([
                        [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                    ])
                );
            }
        });

        this.scene.action("subscribe", async (ctx) => {
            try {
                console.log("Subscribe button clicked in MySubscriptionsScene");
                await ctx.answerCbQuery();
                await ctx.scene.enter("subscribe");
            } catch (error) {
                console.log("Subscribe action error:", error);
            }
        });

        this.scene.action("unsubscribe", async (ctx) => {
            try {
                console.log("Unsubscribe button clicked in MySubscriptionsScene");
                await ctx.answerCbQuery();
                await ctx.scene.enter("unsubscribe");
            } catch (error) {
                console.log("Unsubscribe action error:", error);
            }
        });

        this.scene.action("back_to_start", async (ctx) => {
            try {
                console.log("Back to start from MySubscriptionsScene");
                await ctx.answerCbQuery("Повертаємося до головного меню...");
                await ctx.scene.leave();
                await ctx.scene.enter("start");
            } catch (error) {
                console.log("Back to start error:", error);
            }
        });
    }
}

