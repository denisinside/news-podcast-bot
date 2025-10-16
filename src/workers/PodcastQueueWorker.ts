import { Job } from 'bullmq';
import { BaseQueueWorker } from './BaseQueueWorker';
import { IConfigService } from '@/config';

export interface PodcastJobData {
    podcastId: string;
    title: string;
    content: string;
    userId: string;
    scheduledAt?: Date;
    publishImmediately?: boolean;
}

export class PodcastQueueWorker extends BaseQueueWorker<PodcastJobData> {
    constructor(configService: IConfigService) {
        super('podcast-generation', configService);
    }

    protected async processJob(job: Job<PodcastJobData>): Promise<void> {
        const { podcastId, title, content, userId, publishImmediately } = job.data;

        try {
            await job.updateProgress(10);
            console.log(`Processing podcast: ${title} for user ${userId}`);

            // 1. Генерація аудіо
            await job.updateProgress(30);
            await this.generateAudio(content);

            // 2. Обробка метаданих
            await job.updateProgress(60);
            await this.processMetadata(podcastId, title);

            // 3. Збереження результату
            await job.updateProgress(80);
            await this.savePodcast(podcastId, userId);

            // 4. Публікація (якщо потрібно)
            if (publishImmediately) {
                await job.updateProgress(90);
                await this.publishPodcast(podcastId, userId);
            }

            await job.updateProgress(100);
            console.log(`Podcast ${podcastId} processed successfully`);
        } catch (error) {
            console.error(`Error processing podcast ${podcastId}:`, error);
            throw error;
        }
    }

    private async generateAudio(content: string): Promise<void> {
        await this.delay(2000);
        console.log('Audio generated');
    }

    private async processMetadata(podcastId: string, title: string): Promise<void> {
        await this.delay(1000);
        console.log('Metadata processed');
    }

    private async savePodcast(podcastId: string, userId: string): Promise<void> {
        await this.delay(1000);
        console.log('Podcast saved to database');
    }

    private async publishPodcast(podcastId: string, userId: string): Promise<void> {
        await this.delay(1000);
        console.log('Podcast published');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    protected getConcurrency(): number {
        return 3;
    }

    protected onCompleted(job: Job) {
        super.onCompleted(job);
        console.log(`Podcast ${job.data.podcastId} generation completed`);
    }

    protected onFailed(job: Job | undefined, error: Error) {
        super.onFailed(job, error);
        if (job) {
            console.error(`Failed to generate podcast ${job.data.podcastId}`);
        }
    }
}

