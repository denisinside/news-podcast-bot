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
            const articles: IArticle[] = await this.newsFinderService.getArticlesForUser(userId);

            if (!articles.length) {
                throw new Error("Жодних новин не знайдено за ключовими словами");
            }

            for (const article of articles) {
                const message = this.messageTemplateService.formatNewsNotification(
                    article,
                    "Новини"
                );

                await this.notificationService.sendMessageWithMedia(userId, message.text, message.imageUrl,message.url);
                console.log(`News sent to user ${userId}: ${article.title}`);
            }

            console.log(`✅ Усі новини (${articles.length}) надіслані користувачу ${userId}`);
        } catch (error) {
            console.error(`❌ Failed to generate/send news:`, error);

            const message = this.messageTemplateService.formatErrorNotification(
                "Не вдалося згенерувати новини"
            );

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