import { NewsPodcastBot } from "./NewsPodcastBot";
import {ConfigService, IConfigService, IQueueService, QueueService} from "@/config";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene } from "./presentation/telegram/scenes/IScene";
import { SubscribeScene } from "./presentation/telegram/scenes/SubscribeScene";
import { UnsubscribeScene } from "./presentation/telegram/scenes/UnsubscribeScene";
import { MySubscriptionsScene } from "./presentation/telegram/scenes/MySubscriptionsScene";
import { SettingsScene } from "./presentation/telegram/scenes/SettingsScene";
import { AdminService, UserService } from "@application/services";
import { SubscriptionService } from "@application/services";
import { UserSettingsService } from "@application/services/UserSettingsService";
import { StartScene } from "./presentation/telegram/scenes/StartScene";
import {
    SubscriptionRepository,
    UserRepository,
    TopicRepository,
    ArticleRepository,
    PodcastRepository,
    IUserRepository,
    ITopicRepository,
    IArticleRepository,
    ISubscriptionRepository,
    IPodcastRepository
} from "./infrastructure/repositories";
import { NewsFinderService, SchedulingService, PodcastService } from "./application/services";
import {
    IAdminService,
    INewsFinderService,
    ISubscriptionService,
    IUserService,
    IUserSettingsService
} from "@application/interfaces";
import {
    IFileStorageClient,
    FileStorageClient,
    IGeminiClient,
    GeminiClient
} from "@infrastructure/clients";
import {QueueManager} from "@infrastructure/managers/QueueManager";



const config = new ConfigService();

const userRepository: IUserRepository = new UserRepository();
const topicRepository: ITopicRepository = new TopicRepository();
const articleRepository: IArticleRepository = new ArticleRepository();
const subscriptionRepository: ISubscriptionRepository = new SubscriptionRepository();
const podcastRepository: IPodcastRepository = new PodcastRepository();
const queueService: IQueueService = new QueueService(config);
const queueManager= new QueueManager(queueService, config);
const storageClient: IFileStorageClient = new FileStorageClient();
const geminiClient: IGeminiClient = new GeminiClient(config.get('GEMINI_API_KEY'));

const adminService: IAdminService = new AdminService(topicRepository, userRepository);
const subscriptionService: ISubscriptionService = new SubscriptionService(subscriptionRepository);
const userSettingsService: IUserSettingsService = new UserSettingsService();
const newsFinderService: INewsFinderService = new NewsFinderService(articleRepository, topicRepository);
// const schedulingService = new SchedulingService(userRepository, subscriptionRepository, queueClient, newsFinderService);
const podcastService = new PodcastService(podcastRepository, articleRepository, subscriptionRepository, storageClient, geminiClient);
const userService: IUserService = new UserService(userRepository);

const commands: ICommand[] = [];

const scenes: IScene[] = [
    new StartScene(adminService, subscriptionService, userService),
    new SubscribeScene(adminService, subscriptionService, queueManager),
    new UnsubscribeScene(adminService, subscriptionService),
    new MySubscriptionsScene(adminService, subscriptionService),
    new SettingsScene(userSettingsService)
];


const bot = new NewsPodcastBot(config, commands, scenes);
bot.init();
