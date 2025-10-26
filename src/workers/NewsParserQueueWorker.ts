import { Job } from 'bullmq';
import { BaseQueueWorker } from './BaseQueueWorker';
import { IConfigService } from '@/config';
import {INewsFinderService, IPodcastService} from "@application/interfaces";

export class NewsParserQueueWorker extends BaseQueueWorker<any> {

    private readonly newsFinderService: INewsFinderService;

    constructor(configService: IConfigService,
                newsFinderService: INewsFinderService) {
        super('news-parser', configService);
        this.newsFinderService = newsFinderService;
    }

    protected async processJob(job: Job<any>): Promise<void> {
        try {
            await this.newsFinderService.fetchAndSaveAllTopics();
        } catch (error) {
            console.error('Error processing parsing :', error);
            throw error;
        }
    }


}

