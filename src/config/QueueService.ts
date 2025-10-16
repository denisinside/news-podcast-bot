import { JobsOptions, Queue, QueueOptions } from "bullmq";
import {IConfigService, IQueueService} from "@/config";

export class QueueService  implements IQueueService  {
    private queues: Map<string, Queue> = new Map();
    private connection: QueueOptions['connection'];

    constructor(private configService: IConfigService) {
        this.connection = {
            username: this.configService.get('REDIS_USERNAME'),
            host: this.configService.get('REDIS_HOST'),
            port: parseInt(this.configService.get('REDIS_PORT')),
            password: this.configService.get('REDIS_PASSWORD'),
        };

    }
    public getQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, {
                connection: this.connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: {
                        count: 100,
                        age: 24 * 3600,
                    },
                    removeOnFail: {
                        count: 500,
                        age: 7 * 24 * 3600,
                    },
                },
            });

            this.queues.set(queueName, queue);
        }

        return this.queues.get(queueName)!;
    }

    public async addDelayedJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        delay: number
    ){
        const queue = this.getQueue(queueName);
        return await queue.add(jobName, data, { delay });
    }

    public async addScheduledJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        scheduledTime: Date
    ) {
        const queue = this.getQueue(queueName);
        const delay = scheduledTime.getTime() - Date.now();

        if (delay < 0) {
            throw new Error('Scheduled time must be in the future');
        }

        return await queue.add(jobName, data, { delay });
    }

    public async addRecurringJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        pattern: string,
        options?: Omit<JobsOptions, 'repeat'>
    ) {
        const queue = this.getQueue(queueName);
        return await queue.add(jobName, data, {
            ...options,
            repeat: {
                pattern,
            },
        });
    }

    public async addIntervalJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        intervalMs: number,
        options?: Omit<JobsOptions, 'repeat'>
    ) {
        const queue = this.getQueue(queueName);
        return await queue.add(jobName, data, {
            ...options,
            repeat: {
                every: intervalMs,
            },
        });
    }

    public async removeRecurringJob(queueName: string, jobId: string) {
        const queue = this.getQueue(queueName);
        const job = await queue.getJob(jobId);

        if (job) {
            await job.remove();
        }
    }

    public async getRecurringJobs(queueName: string) {
        const queue = this.getQueue(queueName);
        return await queue.getRepeatableJobs();
    }

    public async clearQueue(queueName: string) {
        const queue = this.getQueue(queueName);
        await queue.drain();
    }

    public async close() {
        const closePromises = Array.from(this.queues.values()).map(queue =>
            queue.close()
        );
        await Promise.all(closePromises);
        this.queues.clear();
    }

}