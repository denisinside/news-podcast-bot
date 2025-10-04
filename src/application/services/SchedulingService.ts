import { IUserRepository } from "@/infrastructure/repositories/IUserRepository";
import { ISubscriptionRepository } from "@/infrastructure/repositories/ISubscriptionRepository";
import { IQueueClient } from "@/infrastructure/clients/IQueueClient";
import { INewsFinderService } from "../interfaces/INewsFinderService";


export class SchedulingService {
    private userRepository: IUserRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private queueClient: IQueueClient;
    private newsFinderService: INewsFinderService;

    constructor(
        userRepository: IUserRepository,
        subscriptionRepository: ISubscriptionRepository,
        queueClient: IQueueClient,
        newsFinderService: INewsFinderService
    ) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.queueClient = queueClient;
        this.newsFinderService = newsFinderService;
    }

    async scheduleNewsFetching() {
        await this.newsFinderService.fetchAndSaveAllTopics();
    }

    async scheduleDailyPodcasts() {
        await this.newsFinderService.fetchAndSaveAllTopics();
    }
}