import { Queue, Job, JobsOptions, RepeatableJob } from "bullmq";

export interface IQueueService {
    getQueue(queueName: string): Queue;

    addDelayedJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        delay: number
    ): Promise<Job<T>>;

    addScheduledJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        scheduledTime: Date
    ): Promise<Job<T>>;

    addRecurringJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        pattern: string,
        options?: Omit<JobsOptions, "repeat">
    ): Promise<Job<T>>;

    addIntervalJob<T = any>(
        queueName: string,
        jobName: string,
        data: T,
        intervalMs: number,
        options?: Omit<JobsOptions, "repeat">
    ): Promise<Job<T>>;

    removeRecurringJob(queueName: string, jobId: string): Promise<void>;

    getRecurringJobs(queueName: string): Promise<RepeatableJob[]>;

    clearQueue(queueName: string): Promise<void>;

    close(): Promise<void>;
}
