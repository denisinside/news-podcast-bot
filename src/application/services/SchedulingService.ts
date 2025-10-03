import { IUserRepository } from "@/infrastructure/repositories/IUserRepository";
import { ISubscriptionRepository } from "@/infrastructure/repositories/ISubscriptionRepository";
import { IQueueClient } from "@/infrastructure/clients/IQueueClient";


export class SchedulingService {
    private userRepository: IUserRepository;
    private subscriptionRepository: ISubscriptionRepository;
    private queueClient: IQueueClient;

    constructor(
        userRepository: IUserRepository,
        subscriptionRepository: ISubscriptionRepository,
        queueClient: IQueueClient
    ) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.queueClient = queueClient;
    }
    
    
}