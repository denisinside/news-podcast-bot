import { IScene } from "./IScene";
import { BaseScene } from "telegraf/scenes";
import { IBotContext } from "../../../context/IBotContext";
import { Markup, Scenes } from "telegraf";
import { ITopic } from "../../../models";
import { IAdminService } from "../../../application/interfaces/IAdminService";
import { ISubscriptionService } from "../../../application/interfaces/ISubscriptionService";
import {Types} from "mongoose";

export class SubscribeScene implements IScene{
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "subscribe";

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
                const allTopics: ITopic[] = await this.adminService.getAllTopics();

                if (allTopics.length === 0) {
                    await ctx.reply(
                        "❌ *Наразі немає доступних тем для підписки.*\n\n" +
                        "Адміністратор ще не додав жодної теми. Спробуйте пізніше або зверніться до підтримки.",
                        {
                            parse_mode: 'Markdown',
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback("🏠 Головне меню", "back_to_menu")]
                            ]).reply_markup
                        }
                    );
                    return;
                }

                // Get user's current subscriptions
                const userSubscriptions = await this.subscriptionService.getUserSubscriptions(String(ctx.from!.id));
                const subscribedTopicIds = userSubscriptions.map(sub => String(sub.topicId._id));

                // Filter out topics user is already subscribed to
                const availableTopics = allTopics.filter(topic => !subscribedTopicIds.includes(topic.id));

                // Check if user is subscribed to all topics
                if (availableTopics.length === 0) {
                    await ctx.reply(
                        "🎉 *Ви вже підписані на всі доступні теми!*\n\n" +
                        "*📋 Ваші підписки:*\n" +
                        allTopics.map(topic => `• ${topic.name}`).join('\n') + "\n\n" +
                        "Чудово! Тепер ви отримуватимете новини з усіх доступних джерел.",
                        {
                            parse_mode: 'Markdown',
                            reply_markup: Markup.inlineKeyboard([
                                [Markup.button.callback("🏠 Головне меню", "back_to_menu")]
                            ]).reply_markup
                        }
                    );
                    return;
                }

                const buttons = availableTopics.map((topic) =>
                    [Markup.button.callback(`📰 ${topic.name}`, topic.id)]
                );

                buttons.push([Markup.button.callback("🏠 Головне меню", "back_to_menu")]);

                let messageText = "📝 *Підписка на теми новин*\n\n" +
                    "Оберіть теми, які вас цікавлять. Ви отримуватимете новини автоматично!\n\n" +
                    "*💡 Порада:* Підписуйтеся на 3-5 тем для оптимального досвіду.\n\n";

                // Show current subscriptions if any
                if (userSubscriptions.length > 0) {
                    const subscribedTopics = allTopics.filter(topic => subscribedTopicIds.includes(topic.id));
                    if (subscribedTopics.length !== 0)
                    messageText += "*✅ Ви вже підписані на:*\n" +
                        subscribedTopics.map(topic => `• ${topic.name}`).join('\n') + "\n\n";
                }

                messageText += "*📰 Доступні теми для підписки:*";

                await ctx.reply(
                    messageText,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard(buttons).reply_markup
                    }
                );
            } catch (error) {
                console.log("Subscribe scene error:", error);
                await ctx.reply(
                    "❌ Виникла помилка при завантаженні тем. Спробуйте пізніше.",
                    Markup.inlineKeyboard([
                        [Markup.button.callback("🏠 Головне меню", "back_to_menu")]
                    ])
                );
            }
        });

        this.scene.action(/.*/, async (ctx) => {
            try {
                const topicId = ctx.match[0];
                console.log("=== SubscribeScene action triggered ===");
                console.log("Action data:", topicId);
                console.log("Current scene:", ctx.scene?.session?.current);

                // Check if it's back to menu button
                if (topicId === "back_to_menu") {
                    console.log("Back to menu button clicked - redirecting to start scene");
                    await ctx.answerCbQuery("Повертаємося до головного меню...");
                    await ctx.scene.leave();
                    await ctx.scene.enter("start");
                    return;
                }

                // Check if it's back to start button
                if (topicId === "back_to_start") {
                    console.log("=== BACK TO START BUTTON CLICKED ===");
                    console.log("Current scene:", ctx.scene?.session?.current);
                    try {
                        await ctx.answerCbQuery("Переходимо до головного меню...");
                        await ctx.scene.leave();
                        console.log("Left current scene");
                        console.log("Attempting to enter start scene");
                        await ctx.scene.enter("start");
                        console.log("Successfully entered start scene");
                    } catch (error) {
                        console.log("Error with back to start:", error);
                    }
                    return;
                }

                // Check if it's subscribe again button
                if (topicId === "subscribe") {
                    await ctx.answerCbQuery();
                    await ctx.scene.enter("subscribe");
                    return;
                }

                await this.subscriptionService.subscribe(String(ctx.from!.id), new Types.ObjectId(topicId));
                await ctx.answerCbQuery("✅ Ви підписані на цю тему!");

                // Get updated subscriptions to show in message
                let subscriptionsText = "";
                try {
                    const subscriptions = await this.subscriptionService.getUserSubscriptions(String(ctx.from!.id));
                    const allTopics = await this.adminService.getAllTopics();
                    const subscribedTopics = allTopics.filter(topic =>
                        subscriptions.some(sub => sub.topicId === topic.id)
                    );

                    if (subscribedTopics.length > 0) {
                        subscriptionsText = "\n\n*📋 Ваші поточні підписки:*\n" +
                            subscribedTopics.map(topic => `• ${topic.name}`).join('\n');
                    }
                } catch (error) {
                    console.log("Error getting subscriptions for message:", error);
                }

                await ctx.editMessageText(
                    "✅ *Ви підписані на цю тему!*\n\n" +
                    "Тепер ви отримуватимете новини автоматично." +
                    subscriptionsText + "\n\n" +
                    "Можете підписатися на інші теми або повернутися до головного меню.",
                    {
                        parse_mode: 'Markdown',
                        reply_markup: Markup.inlineKeyboard([
                            [Markup.button.callback("📝 Підписатися на інші теми", "subscribe")],
                            [Markup.button.callback("🏠 Головне меню", "back_to_start")]
                        ]).reply_markup
                    }
                );
                // Don't leave scene - stay in subscribe scene to handle button clicks
            } catch (error) {
                console.log("Subscription error:", error);
                try {
                    await ctx.answerCbQuery("❌ Помилка підписки");
                    await ctx.editMessageText("❌ Виникла помилка при підписці. Спробуйте пізніше.");
                    // Stay in scene to allow user to try again or go back
                } catch (fallbackError) {
                    console.log("Fallback error:", fallbackError);
                }
            }
        });
    }

}