import {BaseQueueWorker} from "@/workers/BaseQueueWorker";
import {IConfigService, IQueueService} from "@/config";
import {PodcastJobData, PodcastQueueWorker} from "@/workers/PodcastQueueWorker";
import {PostJobData, PostQueueWorker} from "@/workers/PostQueueWorker";

export class QueueManager {
    private workers: BaseQueueWorker[] = [];
    private isInitialized = false;

    constructor(
        private queueService: IQueueService,
        private configService: IConfigService
    ) {}

    public async initialize() {
        if (this.isInitialized) {
            console.log('Queue manager already initialized');
            return;
        }

        console.log('Initializing queue workers...');

        const podcastWorker = new PodcastQueueWorker(this.configService);
        const postWorker = new PostQueueWorker(this.configService);

        this.workers.push(podcastWorker, postWorker);

        this.isInitialized = true;
        console.log('Queue workers initialized successfully');
    }

    public async schedulePodcast(data: PodcastJobData, scheduledAt: Date) {
        return await this.queueService.addScheduledJob(
            'podcast-generation',
            'generate-podcast',
            data,
            scheduledAt
        );
    }

    public async addPodcast(data: PodcastJobData) {
        const queue = this.queueService.getQueue('podcast-generation');
        return await queue.add('generate-podcast', data);
    }

    public async schedulePost(data: PostJobData, scheduledAt: Date) {
        return await this.queueService.addScheduledJob(
            'post-publishing',
            'publish-post',
            data,
            scheduledAt
        );
    }

    public async addRecurringPost(
        data: PostJobData,
        cronPattern: string // '0 9 * * *' - щодня о 9:00
    ) {
        return await this.queueService.addRecurringJob(
            'post-publishing',
            'publish-post',
            data,
            cronPattern
        );
    }

    public async addIntervalPost(
        data: PostJobData,
        intervalMs: number // кожні 3 години = 3 * 60 * 60 * 1000
    ) {
        return await this.queueService.addIntervalJob(
            'post-publishing',
            'publish-post',
            data,
            intervalMs
        );
    }

    public async getScheduledPosts() {
        return await this.queueService.getRecurringJobs('post-publishing');
    }

    public async removeScheduledPost(jobId: string) {
        return await this.queueService.removeRecurringJob('post-publishing', jobId);
    }

    public async clearPodcastQueue() {
        return await this.queueService.clearQueue('podcast-generation');
    }

    public async clearPostQueue() {
        return await this.queueService.clearQueue('post-publishing');
    }

    public async pauseAll() {
        await Promise.all(this.workers.map(worker => worker.pause()));
        console.log('All workers paused');
    }

    public async resumeAll() {
        await Promise.all(this.workers.map(worker => worker.resume()));
        console.log('All workers resumed');
    }

    public async shutdown() {
        console.log('Shutting down queue manager...');

        await Promise.all(this.workers.map(worker => worker.close()));

        await this.queueService.close();

        this.isInitialized = false;
        console.log('Queue manager shut down successfully');
    }
}