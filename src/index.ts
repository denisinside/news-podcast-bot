import { NewsPodcastBot } from "./NewsPodcastBot";
import { ConfigService } from "./config/ConfigService";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene } from "./presentation/telegram/scenes/IScene";
import { SubscribeScene } from "./presentation/telegram/scenes/SubscribeScene";
import { UnsubscribeScene } from "./presentation/telegram/scenes/UnsubscribeScene";
import { MySubscriptionsScene } from "./presentation/telegram/scenes/MySubscriptionsScene";
import { SettingsScene } from "./presentation/telegram/scenes/SettingsScene";
import { AdminMenuScene } from './presentation/telegram/scenes/AdminMenuScene';
import { AdminTopicsScene } from './presentation/telegram/scenes/AdminTopicsScene';
import { AdminStatisticsScene } from './presentation/telegram/scenes/AdminStatisticsScene';
import { AdminUsersScene } from './presentation/telegram/scenes/AdminUsersScene';
import { AdminBroadcastScene } from './presentation/telegram/scenes/AdminBroadcastScene';
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
import { PodcastService } from "./application/services/PodcastService";
import { PodcastRepository } from "./infrastructure/repositories/PodcastRepository";
import { FileStorageClient } from "./infrastructure/clients/FileStorageClient";
import { GeminiClient } from "./infrastructure/clients/GeminiClient";
import { IUserService } from "@application/interfaces";
import { AdminMiddleware } from '@infrastructure/middleware/AdminMiddleware';

const config = new ConfigService();

const userRepository = new UserRepository();
const topicRepository = new TopicRepository();
const articleRepository = new ArticleRepository();
const subscriptionRepository = new SubscriptionRepository();
const podcastRepository = new PodcastRepository();
const queueClient = new QueueClient();
const storageClient = new FileStorageClient();  
const geminiClient = new GeminiClient(config.get('GEMINI_API_KEY'));

const adminService = new AdminService(topicRepository, userRepository, subscriptionRepository, podcastRepository);
const subscriptionService = new SubscriptionService(subscriptionRepository);
const userSettingsService = new UserSettingsService();
const newsFinderService = new NewsFinderService(articleRepository, topicRepository);
const schedulingService = new SchedulingService(userRepository, subscriptionRepository, queueClient, newsFinderService);
const podcastService = new PodcastService(podcastRepository, articleRepository, subscriptionRepository, storageClient, geminiClient);
const userService: IUserService = new UserService(userRepository);
const adminMiddleware = new AdminMiddleware(userRepository);

const commands: ICommand[] = [];

const bot = new NewsPodcastBot(config, commands, []);

const scenes: IScene[] = [
    new StartScene(adminService, subscriptionService, userService),
    new SubscribeScene(adminService, subscriptionService),
    new UnsubscribeScene(adminService, subscriptionService),
    new MySubscriptionsScene(adminService, subscriptionService),
    new SettingsScene(userSettingsService),
    new AdminMenuScene(adminService, adminMiddleware),
    new AdminTopicsScene(adminService, adminMiddleware),
    new AdminStatisticsScene(adminService, adminMiddleware),
    new AdminUsersScene(adminService, adminMiddleware),
    new AdminBroadcastScene(adminService, adminMiddleware, bot.bot)
];

bot.scenes = scenes;
bot.init();
