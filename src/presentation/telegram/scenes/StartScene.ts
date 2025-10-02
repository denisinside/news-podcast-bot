import { IScene } from "./IScene";
import { Markup, Scenes } from "telegraf";
import { IBotContext } from "../../../context/IBotContext";
import { BaseScene } from "telegraf/scenes";

export class StartScene implements IScene {
    private readonly scene: Scenes.BaseScene<IBotContext>;
    name: string = "start";

    constructor() {
        this.scene = new BaseScene<IBotContext>(this.name);
        this.registerHandlers();
    }

    getScene(): BaseScene<IBotContext> {
        return this.scene;
    }

    private registerHandlers() {
        this.scene.enter(async (ctx) => {
            await ctx.reply(
                "Привіт! Я новинний подкаст-бот 🎧\n" +
                "Можу надсилати новини та генерувати подкасти по обраним темам.",
                Markup.inlineKeyboard([
                    [Markup.button.callback("Підписатися на теми", "subscribe")],
                    [Markup.button.callback("Пропустити", "skip")]
                ])
            );
        });

        this.scene.action("subscribe", async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.scene.enter("subscribe");
        });

        this.scene.action("skip", async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.editMessageText("Добре! Можеш підписатися пізніше через команди.");
            await ctx.scene.leave();
        });
    }
}
