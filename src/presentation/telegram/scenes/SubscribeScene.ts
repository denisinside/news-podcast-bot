import { IScene } from "./IScene";
import { BaseScene } from "telegraf/scenes";
import { IBotContext } from "../../../context/IBotContext";
import { Markup, Scenes } from "telegraf";
import { ITopic } from "../../../models";
import { IAdminService } from "../../../application/interfaces/IAdminService";
import { ISubscriptionService } from "../../../application/interfaces/ISubscriptionService";

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
            const topics: ITopic[] = await this.adminService.getAllTopics();
            const buttons = topics.map((t) => [Markup.button.callback(t.name, t.id)]);
            await ctx.reply("Виберіть тему для підписки:", Markup.inlineKeyboard(buttons));
        });

        this.scene.action(/.*/, async (ctx) => {
            const topicId = ctx.match[0];
            await this.subscriptionService.subscribe(ctx.from!.id as any, topicId as any);
            await ctx.editMessageText("✅ Ви підписані на цю тему!");
            await ctx.scene.leave();
        });
    }

}