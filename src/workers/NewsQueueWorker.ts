import {IConfigService} from "@/config";
import { Job } from 'bullmq';
import { BaseQueueWorker } from './BaseQueueWorker';
import {IMessageTemplateService, INewsFinderService, INotificationService} from "@application/interfaces";
import {IArticle} from "@/models";
import {getRandomValues} from "node:crypto";

export interface NewsJobData {
    userId: string;
}

export class NewsQueueWorker extends BaseQueueWorker<NewsJobData> {
    private readonly notificationService: INotificationService;
    private readonly messageTemplateService: IMessageTemplateService;
    private readonly newsFinderService: INewsFinderService;

    constructor(
        configService: IConfigService,
        notificationService: INotificationService,
        messageTemplate: IMessageTemplateService,
        newsFinderService: INewsFinderService,
    ) {
        super('post-publishing', configService);
        this.notificationService = notificationService;
        this.messageTemplateService = messageTemplate;
        this.newsFinderService = newsFinderService;
    }

    protected async processJob(job: Job<NewsJobData>): Promise<void> {
        const { userId } = job.data;

        console.log(`Generating news for user ${userId}`);

        try {
            const articles: IArticle[] = await this.newsFinderService.getArticlesByKeywords(["україна"]);

            const randomTestArticle: IArticle | undefined = articles.length > 0
                ? articles[Math.floor(Math.random() * articles.length)]
                : undefined;

            if (!randomTestArticle) {
                throw new Error("Жодних новин не знайдено за ключовими словами");
            }

            const message = this.messageTemplateService.formatNewsNotification(randomTestArticle, "Новини про Ріната");

            await this.notificationService.sendMessage(userId, message);

            console.log(`News sent to user ${userId}`);
        } catch (error) {
            console.error(`Failed to generate/send news:`, error);
            const message = this.messageTemplateService.formatErrorNotification("Не вдалося згенерувати новину");

            await this.notificationService.sendMessage(userId, message);
            throw error;
        }
    }

    protected getConcurrency(): number {
        return 3;
    }

    protected getRateLimiter() {
        return {
            max: 20,
            duration: 60000
        };
    }
}