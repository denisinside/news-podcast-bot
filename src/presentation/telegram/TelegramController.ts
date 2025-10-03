import { Scenes, Telegraf } from "telegraf";
import { ICommand } from "./commands/ICommand";
import { IBotContext } from "../../context/IBotContext";
import { IScene } from "./scenes/IScene";


export class TelegramController {
    private stage: Scenes.Stage<any>;

    constructor(
        private readonly bot: Telegraf<IBotContext>,
        private readonly commands: ICommand[],
        private scenes: IScene[] = []
    ) {
        this.stage = new Scenes.Stage<any>(
            this.scenes.map(scene => scene.getScene())
        );
    }


    public init() {
        this.bot.use(this.stage.middleware());

        this.registerCommands();
    }

    private registerCommands() {
        for (const command of this.commands) {
            this.bot.command(command.name, (ctx) => command.execute(ctx));
        }
        for (const scene of this.scenes) {
            this.bot.command(scene.name, (ctx) => ctx.scene.enter(scene.name));
        }
    }
}
