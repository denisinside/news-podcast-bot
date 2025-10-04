import { NewsPodcastBot } from "./NewsPodcastBot";
import { ConfigService } from "@config/ConfigService";
import { ICommand } from "./presentation/telegram/commands/ICommand";
import { IScene } from "./presentation/telegram/scenes/IScene";
import { SubscribeScene } from "./presentation/telegram/scenes/SubscribeScene";
// import { UnsubscribeScene } from "./presentation/telegram/scenes/UnsubscribeScene";
// import { MySubscriptionsScene } from "./presentation/telegram/scenes/MySubscriptionsScene";
import { SettingsScene } from "./presentation/telegram/scenes/SettingsScene";
import {AdminService, UserService} from "@application/services";
import { SubscriptionService } from "@application/services";
import { UserSettingsService } from "@application/services/UserSettingsService";
import { StartScene } from "./presentation/telegram/scenes/StartScene";
import {
    ISubscriptionRepository,
    ITopicRepository,
    IUserRepository, SubscriptionRepository,
    TopicRepository,
    UserRepository
} from "@infrastructure/repositories";
import { IUserService } from "@application/interfaces";

const topicRepository: ITopicRepository = new TopicRepository();
const userRepository: IUserRepository = new UserRepository();
const subscriptionRepository: ISubscriptionRepository = new SubscriptionRepository();

const config = new ConfigService();
const adminService = new AdminService(topicRepository, userRepository);
const subscriptionService = new SubscriptionService(subscriptionRepository);
const userSettingsService = new UserSettingsService();
const userService: IUserService = new UserService(userRepository);

const commands: ICommand[] = [];

const scenes: IScene[] = [
    new StartScene(adminService, subscriptionService, userService),
    new SubscribeScene(adminService, subscriptionService),
    // new UnsubscribeScene(adminService, subscriptionService),
    // new MySubscriptionsScene(adminService, subscriptionService),
    new SettingsScene(userSettingsService)
];


const bot = new NewsPodcastBot(config, commands, scenes);
bot.init();
