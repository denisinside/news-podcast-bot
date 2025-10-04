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
            console.log("SubscribeScene");
            const topics: ITopic[] = await this.adminService.getAllTopics();

            if (!topics || topics.length === 0) {
                await ctx.reply(
                    "❌ *Немає доступних тем для підписки.*\n\n" +
                    "На жаль, зараз немає активних тем. Спробуйте пізніше.",
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback("🔙 Назад до меню", "back_to_start")]
                        ])
                    }
                );
                return;
            }

            const buttons = topics.map((t) => [Markup.button.callback(t.name, t.id)]);
            await ctx.reply("Виберіть тему для підписки:", Markup.inlineKeyboard(buttons));
        });

        this.scene.action(/.*/, async (ctx) => {
            const topicId: Types.ObjectId = new Types.ObjectId(ctx.match[0]);
            await this.subscriptionService.subscribe(String(ctx.from!.id), topicId);
            await ctx.editMessageText("✅ Ви підписані на цю тему!");
            await ctx.scene.leave();
        });
    }

}