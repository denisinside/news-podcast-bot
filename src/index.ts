import { NewsPodcastBot } from "./NewsPodcastBot";
import { ConfigService } from "./config/ConfigService";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene } from "./presentation/telegram/scenes/IScene";
import { SubscribeScene } from "./presentation/telegram/scenes/SubscribeScene";
//import { UnsubscribeScene } from "./presentation/telegram/scenes/UnsubscribeScene";
//import { MySubscriptionsScene } from "./presentation/telegram/scenes/MySubscriptionsScene";
import { SettingsScene } from "./presentation/telegram/scenes/SettingsScene";
import { AdminService, UserService } from "@application/services";
import { SubscriptionService } from "@application/services";
import { UserSettingsService } from "@application/services/UserSettingsService";
import { StartScene } from "./presentation/telegram/scenes/StartScene";
import { SubscriptionRepository } from "./infrastructure/repositories/SubscriptionRepository";
import { UserRepository } from "./infrastructure/repositories/UserRepository";
import { TopicRepository } from "./infrastructure/repositories/TopicRepository";
import { ArticleRepository } from "./infrastructure/repositories/ArticleRepository";
import { NewsFinderService } from "./application/services/NewsFinderService";
import { SchedulingService } from "./application/services/SchedulingService";
import { QueueClient } from "./infrastructure/clients/QueueClient";
import { IUserService } from "@application/interfaces";

const config = new ConfigService();

const userRepository = new UserRepository();
const topicRepository = new TopicRepository();
const articleRepository = new ArticleRepository();
const subscriptionRepository = new SubscriptionRepository();

const queueClient = new QueueClient();

const adminService = new AdminService(topicRepository, userRepository);
const subscriptionService = new SubscriptionService(subscriptionRepository);
const userSettingsService = new UserSettingsService();
const newsFinderService = new NewsFinderService(articleRepository, topicRepository);
const schedulingService = new SchedulingService(userRepository, subscriptionRepository, queueClient, newsFinderService);
const userService: IUserService = new UserService(userRepository);

const commands: ICommand[] = [];

const scenes: IScene[] = [
    new StartScene(adminService, subscriptionService, userService),
    new SubscribeScene(adminService, subscriptionService),
    //new UnsubscribeScene(adminService, subscriptionService),
    //new MySubscriptionsScene(adminService, subscriptionService),
    new SettingsScene(userSettingsService)
];


const bot = new NewsPodcastBot(config, commands, scenes);
bot.init();
