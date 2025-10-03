import { NewsPodcastBot } from "./NewsPodcastBot";
import { ConfigService } from "./config/ConfigService";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene } from "./presentation/telegram/scenes/IScene";
import { SubscribeScene } from "./presentation/telegram/scenes/SubscribeScene";
import { UnsubscribeScene } from "./presentation/telegram/scenes/UnsubscribeScene";
import { MySubscriptionsScene } from "./presentation/telegram/scenes/MySubscriptionsScene";
import { AdminService } from "./application/services/AdminService";
import { SubscriptionService } from "./application/services/SubscriptionService";
import { StartScene } from "./presentation/telegram/scenes/StartScene";

const config = new ConfigService();
const adminService = new AdminService();
const subscriptionService = new SubscriptionService();


const commands: ICommand[] = [];

const scenes: IScene[] = [
    new StartScene(adminService, subscriptionService),
    new SubscribeScene(adminService, subscriptionService),
    new UnsubscribeScene(adminService, subscriptionService),
    new MySubscriptionsScene(adminService, subscriptionService)
];


const bot = new NewsPodcastBot(config, commands, scenes);
bot.init();
