import {Worker, Job, WorkerOptions, JobProgress} from 'bullmq';
import { IConfigService } from '@/config';

export abstract class BaseQueueWorker<T = any> {
    protected worker: Worker;
    protected queueName: string;

    constructor(
        queueName: string,
        private readonly configService: IConfigService
    ) {
        this.queueName = queueName;

        const connection = {
            host: this.configService.get('REDIS_HOST'),
            port: parseInt(this.configService.get('REDIS_PORT',)),
            password: this.configService.get('REDIS_PASSWORD'),
        };

        const workerOptions: WorkerOptions = {
            connection,
            concurrency: this.getConcurrency(),
            limiter: this.getRateLimiter(),
        };

        this.worker = new Worker(
            queueName,
            async (job: Job<T>) => this.processJob(job),
            workerOptions
        );

        this.setupEventHandlers();
    }

    protected abstract processJob(job: Job<T>): Promise<void>;

    protected getConcurrency(): number {
        return 1;
    }

    protected getRateLimiter() {
        return {
            max: 10,
            duration: 1000,
        };
    }

    private setupEventHandlers() {
        this.worker.on('completed', (job: Job) => {
            this.onCompleted(job);
        });

        this.worker.on('failed', (job: Job | undefined, error: Error) => {
            this.onFailed(job, error);
        });

        this.worker.on('progress', (job: Job, progress: JobProgress ) => {
            this.onProgress(job, progress);
        });

        this.worker.on('error', (error: Error) => {
            this.onError(error);
        });
    }

    protected onCompleted(job: Job) {
        console.log(`[${this.queueName}] Job ${job.id} completed successfully`);
    }

    protected onFailed(job: Job | undefined, error: Error) {
        console.error(`[${this.queueName}] Job ${job?.id} failed:`, error.message);
    }

    protected onProgress(job: Job, progress: JobProgress) {
        console.log(`[${this.queueName}] Job ${job.id} progress:`, progress);
    }


    protected onError(error: Error) {
        console.error(`[${this.queueName}] Worker error:`, error.message);
    }

    public async close() {
        await this.worker.close();
    }

    public async pause() {
        await this.worker.pause();
    }

    public async resume() {
        await this.worker.resume();
    }
}
