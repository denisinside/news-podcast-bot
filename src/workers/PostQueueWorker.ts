import { Job } from 'bullmq';
import { BaseQueueWorker } from './BaseQueueWorker';
import { IConfigService } from '@/config';

export interface PostJobData {
    postId: string;
    title: string;
    content: string;
    userId: string;
    channelId?: string;
    scheduledAt?: Date;
    recurring?: boolean;
}

export class PostQueueWorker extends BaseQueueWorker<PostJobData> {
    constructor(configService: IConfigService) {
        super('post-publishing', configService);
    }

    protected async processJob(job: Job<PostJobData>): Promise<void> {
        const { postId, title, content, userId, channelId, recurring } = job.data;

        try {
            await job.updateProgress(20);
            console.log(`Processing post: ${title} for user ${userId}`);

            // 1. Валідація контенту
            await job.updateProgress(40);
            await this.validateContent(content);

            // 2. Форматування посту
            await job.updateProgress(60);
            const formattedContent = await this.formatPost(content);

            // 3. Публікація
            await job.updateProgress(80);
            await this.publishPost(postId, formattedContent, channelId);

            // 4. Збереження статистики
            await job.updateProgress(90);
            await this.savePostStats(postId, userId);

            await job.updateProgress(100);

            if (recurring) {
                console.log(`Recurring post ${postId} published successfully`);
            }
        } catch (error) {
            console.error(`Error processing post ${postId}:`, error);
            throw error;
        }
    }

    private async validateContent(content: string): Promise<void> {
        await this.delay(500);

        if (!content || content.length === 0) {
            throw new Error('Content is empty');
        }

        if (content.length > 4096) {
            throw new Error('Content is too long');
        }

        console.log('Content validated');
    }

    private async formatPost(content: string): Promise<string> {
        await this.delay(500);
        console.log('Post formatted');
        return content;
    }

    private async publishPost(
        postId: string,
        content: string,
        channelId?: string
    ): Promise<void> {
        await this.delay(1000);
        console.log(`Post published to channel: ${channelId || 'default'}`);
    }

    private async savePostStats(postId: string, userId: string): Promise<void> {
        await this.delay(500);
        console.log('Post stats saved');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    protected getConcurrency(): number {
        return 5;
    }

    protected getRateLimiter() {
        return {
            max: 20,
            duration: 60000,
        };
    }

    protected onCompleted(job: Job) {
        super.onCompleted(job);
        console.log(`Post ${job.data.postId} published successfully`);
    }

    protected onFailed(job: Job | undefined, error: Error) {
        super.onFailed(job, error);
        if (job) {
            console.error(`Failed to publish post ${job.data.postId}`);
        }
    }
}

