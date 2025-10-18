import { Job } from 'bullmq';
import { BaseQueueWorker } from './BaseQueueWorker';
import { IConfigService } from '@/config';
import { IPodcastService} from "@application/interfaces";

export interface PodcastJobData {
   userId: string;
}

export class PodcastQueueWorker extends BaseQueueWorker<PodcastJobData> {

    private readonly podcastService: IPodcastService;

    constructor(configService: IConfigService,
                podcastService: IPodcastService) {
        super('podcast-generation', configService);
        this.podcastService = podcastService;
    }

    protected async processJob(job: Job<PodcastJobData>): Promise<void> {
        const { userId } = job.data;

        try {
            await this.podcastService.generateForUser(userId);

            console.log(`Podcast processed successfully`);
        } catch (error) {
            console.error('Error processing podcast :', error);
            throw error;
        }
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

