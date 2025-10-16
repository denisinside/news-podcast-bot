import { IConfigService } from "@config/IConfigService";
import { Telegraf } from "telegraf";
import { IBotContext } from "@context/IBotContext";
import { session }  from "telegraf-session-mongodb";
import { TelegramController } from "./presentation/telegram/TelegramController";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene }   from "./presentation/telegram/scenes/IScene";
import { MongoDbService } from "@config/MongoDbService";
import { Db } from "mongodb";

export class NewsPodcastBot {
    mongoDb: MongoDbService;
    bot: Telegraf<IBotContext>;
    private controller: TelegramController;
    public scenes: IScene[];


    constructor(private readonly configService: IConfigService,
                private readonly commands: ICommand[],
                scenes: IScene[]) {
        this.bot = new Telegraf<IBotContext>(this.configService.get('TELEGRAM_BOT_TOKEN'));
        this.scenes = scenes;

        this.mongoDb = new MongoDbService(this.configService);

        // controller
        this.controller = new TelegramController(this.bot, this.commands, this.scenes);
    }

    public async init() {
        await this.mongoDb.connect();
        const db: Db = this.mongoDb.getDb();

        // middleware
        this.bot.use(
            session(db, { collectionName: "sessions" })
        );

        this.controller = new TelegramController(this.bot, this.commands, this.scenes);
        this.controller.init();

        await this.bot.launch();
        console.log("Бота запущено!");
    }
}
