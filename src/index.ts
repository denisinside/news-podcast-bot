import { NewsPodcastBot } from "./NewsPodcastBot";
import { ConfigService } from "./config/ConfigService";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene } from "./presentation/telegram/scenes/IScene";
import { SubscribeScene } from "./presentation/telegram/scenes/SubscribeScene";
import { AdminService } from "./application/services/AdminService";
import { SubscriptionService } from "./application/services/SubscriptionService";
import {StartScene} from "./presentation/telegram/scenes/StartScene";

const config = new ConfigService();
const adminService = new AdminService(null as any, null as any);
const subscriptionService = new SubscriptionService(null as any);


const commands: ICommand[] = [

];
const scenes: IScene[] = [
    new SubscribeScene(adminService,subscriptionService),
    new StartScene()
];


const bot = new NewsPodcastBot(config, commands, scenes);
bot.init();
