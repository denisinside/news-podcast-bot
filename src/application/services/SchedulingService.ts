import { IUserRepository } from "@/infrastructure/repositories/IUserRepository";
import { ISubscriptionRepository } from "@/infrastructure/repositories/ISubscriptionRepository";
import { INewsFinderService } from "../interfaces/INewsFinderService";
import {QueueManager} from "@infrastructure/managers/QueueManager";


export class SchedulingService {
    private userRepository: IUserRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private queueClient: QueueManager;
    private newsFinderService: INewsFinderService;

    constructor(
        userRepository: IUserRepository,
        subscriptionRepository: ISubscriptionRepository,
        queueManager: QueueManager,
        newsFinderService: INewsFinderService
    ) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.queueClient = queueManager;
        this.newsFinderService = newsFinderService;
    }

    async scheduleNewsFetching() {
        await this.newsFinderService.fetchAndSaveAllTopics();
    }

    async scheduleDailyPodcasts() {
        await this.newsFinderService.fetchAndSaveAllTopics();
    }
}