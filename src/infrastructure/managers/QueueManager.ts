import {BaseQueueWorker} from "@/workers/BaseQueueWorker";
import {IConfigService, IQueueService} from "@/config";
import {NewsQueueWorker} from "@/workers/NewsQueueWorker";
import {PodcastQueueWorker} from "@/workers/PodcastQueueWorker";
import {
    IMessageTemplateService,
    INewsFinderService,
    INotificationService,
    IPodcastService
} from "@application/interfaces";
import {IUserSettingsService} from "@application/interfaces/IUserSettingsService";
import {NewsFrequency} from "@/models";
import {NewsParserQueueWorker} from "@/workers/NewsParserQueueWorker";
import {toString} from "bullmq";

export class QueueManager {
    private workers: BaseQueueWorker[] = [];
    private isInitialized = false;
    private readonly queueService: IQueueService;
    private readonly messageTemplateService: IMessageTemplateService;
    private readonly notificationService: INotificationService;
    private readonly configService: IConfigService;
    private readonly newsFinderService: INewsFinderService;
    private readonly userSettingsService: IUserSettingsService;
    private readonly podcastService: IPodcastService;

    constructor(
        queueService: IQueueService,
        configService: IConfigService,
        notificationService: INotificationService,
        messageTemplateService: IMessageTemplateService,
        newsFinderService: INewsFinderService,
        userSettingsService: IUserSettingsService,
        podcastService: IPodcastService
    ) {
        this.queueService = queueService;
        this.configService = configService;
        this.notificationService = notificationService;
        this.messageTemplateService = messageTemplateService;
        this.newsFinderService = newsFinderService;
        this.userSettingsService = userSettingsService;
        this.newsFinderService = newsFinderService;
        this.podcastService = podcastService;
    }

    public async initialize() {
        if (this.isInitialized) {
            console.log('Queue manager already initialized');
            return;
        }

        console.log('Initializing queue workers...');
        const newsParserWorker = new NewsParserQueueWorker(this.configService, this.newsFinderService);

        const podcastWorker = new PodcastQueueWorker(this.configService, this.podcastService);
        const newsWorker = new NewsQueueWorker(
            this.configService,
            this.notificationService,
            this.messageTemplateService,
            this.newsFinderService
        );

        this.workers.push(podcastWorker, newsWorker, newsParserWorker);

        this.isInitialized = true;
        console.log('Queue workers initialized successfully');

        // Clean up old repeatable jobs
        const postQueue = this.queueService.getQueue("post-publishing");
        const postRepeatableJobs = await postQueue.getRepeatableJobs();

        for (const job of postRepeatableJobs) {
            await postQueue.removeRepeatableByKey(job.key);
            console.log(`Removed repeatable job: ${job.name}`);
        }

        const podcastQueue = this.queueService.getQueue("podcast-generation");
        const podcastRepeatableJobs = await podcastQueue.getRepeatableJobs();

        for (const job of podcastRepeatableJobs) {
            await podcastQueue.removeRepeatableByKey(job.key);
            console.log(`Removed repeatable podcast job: ${job.name}`);
        }

        // Clean up old news parser jobs
        const newsParserQueue = this.queueService.getQueue("news-parser");
        const newsParserRepeatableJobs = await newsParserQueue.getRepeatableJobs();

        for (const job of newsParserRepeatableJobs) {
            await newsParserQueue.removeRepeatableByKey(job.key);
            console.log(`Removed repeatable news parser job: ${job.name}`);
        }

        await this.initializeAllUsers();
        await this.addIntervalParsingNews(1000*60*15);

    }

    public async initializeUser(userId: string) {
        console.log(`Initializing user ${userId} in queue...`);

        const settings = await this.userSettingsService.getUserSettings(parseInt(userId));

        if (!settings) {
            console.error(`Settings not found for user ${userId}`);
            return;
        }

        // Remove existing jobs for this user
        await this.removeUserFromQueues(userId);

        // Add user to news queue based on their news frequency setting
        if (settings.newsFrequency !== NewsFrequency.DISABLED) {
            const intervalMs = this.getIntervalFromFrequency(settings.newsFrequency);
            await this.addIntervalPost(userId, intervalMs);
            console.log(`User ${userId} initialized with ${settings.newsFrequency} frequency (${intervalMs}ms)`);
        } else {
            console.log(`User ${userId} has news disabled`);
        }

        // Add user to podcast queue if enabled
        if (settings.enableAudioPodcasts) {
            await this.addIntervalPodcast(userId, this.getIntervalFromFrequency(settings.newsFrequency));
            console.log(`User ${userId} initialized with podcasts enabled`);
        } else {
            console.log(`User ${userId} has podcasts disabled`);
        }
    }

    public async initializeAllUsers() {
        console.log('Initializing all users in queue...');

        try {
            // Get all user settings from database
            const allSettings = await this.userSettingsService.getAllUserSettings();

            console.log(`Found ${allSettings.length} users to initialize`);

            for (const settings of allSettings) {
                try {
                    await this.initializeUser(settings.userId.toString());
                } catch (error) {
                    console.error(`Failed to initialize user ${settings.userId}:`, error);
                    // Continue with other users even if one fails
                }
            }

            console.log('All users initialized successfully');
        } catch (error) {
            console.error('Failed to initialize all users:', error);
            throw error;
        }
    }

    private async removeUserFromQueues(userId: string) {
        // Remove from post queue
        const postQueue = this.queueService.getQueue('post-publishing');
        const postRepeatableJobs = await postQueue.getRepeatableJobs();

        for (const job of postRepeatableJobs) {
            if (job.name === `publish-post-${userId}`) {
                await postQueue.removeRepeatableByKey(job.key);
                console.log(`Removed post job for user ${userId}`);
            }
        }

        // Remove from podcast queue
        const podcastQueue = this.queueService.getQueue('podcast-generation');
        const podcastRepeatableJobs = await podcastQueue.getRepeatableJobs();

        for (const job of podcastRepeatableJobs) {
            if (job.name === `generate-podcast-${userId}`) {
                await podcastQueue.removeRepeatableByKey(job.key);
                console.log(`Removed podcast job for user ${userId}`);
            }
        }
    }


    private getIntervalFromFrequency(frequency: NewsFrequency): number {
        switch (frequency) {
            case NewsFrequency.HOURLY:
                return 60 * 60  * 1000; // 1 hour
            case NewsFrequency.EVERY_3_HOURS:
                return 3 * 60 * 60 * 1000; // 3 hours
            case NewsFrequency.TWICE_DAILY:
                return 12 * 60 * 60 * 1000; // 12 hours
            case NewsFrequency.DAILY:
                return 24 * 60 * 60 * 1000; // 24 hours
            default:
                return 24 * 60 * 60 * 1000; // Default to daily
        }
    }

    // Post queue methods
    public async schedulePost(userId: string, scheduledAt: Date) {
        return await this.queueService.addScheduledJob(
            'post-publishing',
            'publish-post',
            { userId },
            scheduledAt
        );
    }

    public async addRecurringPost(
        userId: string,
        cronPattern: string
    ) {
        return await this.queueService.addRecurringJob(
            'post-publishing',
            'publish-post',
            { userId },
            cronPattern
        );
    }

    public async addIntervalPost(
        userId: string,
        intervalMs: number
    ) {
        return await this.queueService.addIntervalJob(
            'post-publishing',
            `publish-post-${userId}`,
            { userId },
            intervalMs
        );
    }

    public async addIntervalParsingNews(
        intervalMs: number
    ) {
        return await this.queueService.addIntervalJob(
            'news-parser',
            `news-parser-job`,
            { undefined },
            intervalMs
        );
    }

    // Podcast queue methods
    public async schedulePodcast(userId: string, scheduledAt: Date) {
        return await this.queueService.addScheduledJob(
            'podcast-generation',
            'generate-podcast',
            { userId },
            scheduledAt
        );
    }

    public async addIntervalPodcast(
        userId: string,
        intervalMs: number
    ) {
        return await this.queueService.addIntervalJob(
            'podcast-generation',
            `generate-podcast-${userId}`,
            { userId },
            intervalMs
        );
    }

    public async addPodcast(userId: string) {
        const queue = this.queueService.getQueue('podcast-generation');
        return await queue.add('generate-podcast', { userId });
    }

    // Queue management methods
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