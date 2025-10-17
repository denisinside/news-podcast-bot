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
        this.stage = new Scenes.Stage<IBotContext>(
            this.scenes.map(scene => scene.getScene())
        );
    }

    public init() {
        this.bot.use(this.stage.middleware());

        this.registerCommands();
        this.registerUnknownCommandHandler();
    }

    private registerCommands() {
        for (const command of this.commands) {
            this.bot.command(command.name, (ctx) => command.execute(ctx));
        }
        for (const scene of this.scenes) {
            this.bot.command(scene.name, (ctx) => ctx.scene.enter(scene.name));
        }
    }

    private registerUnknownCommandHandler() {
        // Handle unknown commands
        this.bot.command(/.*/, async (ctx) => {
            const command = ctx.message.text;
            console.log(`Unknown command received: ${command}`);
            
            await ctx.reply(
                "❓ *Невідома команда*\n\n" +
                "Я не розумію цю команду. Використовуйте кнопки меню для навігації.\n\n" +
                "🔙 Повертаємося до головного меню...",
                { parse_mode: 'Markdown' }
            );
            
            // Return to start scene
            await ctx.scene.enter("start");
        });

        // Handle unknown text messages (not commands)
        this.bot.on('text', async (ctx) => {
            // Only handle if not in a scene or if it's a direct message
            if (!ctx.scene?.session?.current || ctx.scene.session.current === 'start') {
                const message = ctx.message.text;
                console.log(`Unknown text message received: ${message}`);
                
                await ctx.reply(
                    "❓ *Невідоме повідомлення*\n\n" +
                    "Я не розумію це повідомлення. Використовуйте кнопки меню для навігації.\n\n" +
                    "🔙 Повертаємося до головного меню...",
                    { parse_mode: 'Markdown' }
                );
                
                // Return to start scene
                await ctx.scene.enter("start");
            }
        });
    }
}
