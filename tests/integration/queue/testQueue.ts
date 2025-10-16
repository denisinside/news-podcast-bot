import { ConfigService, QueueService } from "../../../src/config";
import { QueueManager } from "../../../src/infrastructure/managers/QueueManager";
import { PodcastJobData } from "../../../src/workers/PodcastQueueWorker";
import { PostJobData } from "../../../src/workers/PostQueueWorker";

async function testQueue() {
    console.log('🚀 Starting queue tests...\n');

    // Ініціалізація сервісів
    const configService = new ConfigService();
    const queueService = new QueueService(configService);
    const queueManager = new QueueManager(queueService, configService);

    await queueManager.initialize();

    try {
        // ===== ТЕСТ 1: Негайна генерація подкасту =====

        const podcastData: PodcastJobData = {
            podcastId: 'podcast-001',
            title: 'Test Podcast Episode',
            content: 'This is a test podcast content about AI and technology.',
            userId: 'user-123',
            publishImmediately: true,
        };

        const job1 = await queueManager.addPodcast(podcastData);
        console.log(`✅ Added podcast job: ${job1.id}\n`);

        // Чекаємо 3 секунди
        await delay(3000);

        // ===== ТЕСТ 2: Відкладена генерація подкасту =====
        console.log('📝 Test 2: Scheduled podcast generation');
        const scheduledDate = new Date(Date.now() + 10000); // +10 секунд
        const scheduledPodcast: PodcastJobData = {
            podcastId: 'podcast-002',
            title: 'Scheduled Podcast',
            content: 'This podcast will be generated in 10 seconds.',
            userId: 'user-123',
            publishImmediately: false,
        };

        const job2 = await queueManager.schedulePodcast(scheduledPodcast, scheduledDate);
        console.log(`✅ Scheduled podcast job: ${job2.id} at ${scheduledDate.toISOString()}\n`);

        // ===== ТЕСТ 3: Негайна публікація посту =====
        console.log('📝 Test 3: Immediate post publishing');
        const postData: PostJobData = {
            postId: 'post-001',
            title: 'Breaking News',
            content: 'This is an important news update!',
            userId: 'user-123',
            channelId: 'channel-456',
        };

        const queue = queueService.getQueue('post-publishing');
        const job3 = await queue.add('publish-post', postData);
        console.log(`✅ Added post job: ${job3.id}\n`);

        // Чекаємо 3 секунди
        await delay(3000);

        // ===== ТЕСТ 4: Відкладена публікація посту =====
        console.log('📝 Test 4: Scheduled post publishing');
        const scheduledPostDate = new Date(Date.now() + 15000); // +15 секунд
        const scheduledPost: PostJobData = {
            postId: 'post-002',
            title: 'Scheduled Announcement',
            content: 'This post will be published in 15 seconds.',
            userId: 'user-123',
            channelId: 'channel-456',
        };

        const job4 = await queueManager.schedulePost(scheduledPost, scheduledPostDate);
        console.log(`✅ Scheduled post job: ${job4.id} at ${scheduledPostDate.toISOString()}\n`);

        // ===== ТЕСТ 5: Регулярний пост (cron) =====
        console.log('📝 Test 5: Recurring post with cron');
        const recurringPost: PostJobData = {
            postId: 'post-recurring',
            title: 'Daily Digest',
            content: 'Daily news digest content',
            userId: 'user-123',
            channelId: 'channel-456',
            recurring: true,
        };

        // Кожну хвилину (для тестування, в продакшені: '0 9 * * *' - щодня о 9:00)
        const cronPattern = '*/1 * * * *';
        const job5 = await queueManager.addRecurringPost(recurringPost, cronPattern);
        console.log(`✅ Added recurring post job: ${job5.id} with pattern: ${cronPattern}\n`);

        // ===== ТЕСТ 6: Пост з інтервалом =====
        console.log('📝 Test 6: Interval-based post');
        const intervalPost: PostJobData = {
            postId: 'post-interval',
            title: 'Hourly Update',
            content: 'This post repeats every 30 seconds (test interval)',
            userId: 'user-123',
            channelId: 'channel-456',
            recurring: true,
        };

        const intervalMs = 30000; // 30 секунд (для тестування)
        const job6 = await queueManager.addIntervalPost(intervalPost, intervalMs);
        console.log(`✅ Added interval post job: ${job6.id} every ${intervalMs}ms\n`);

        // ===== ТЕСТ 7: Перегляд запланованих завдань =====
        console.log('Test 7: View scheduled jobs');
        await delay(2000);

        const scheduledPosts = await queueManager.getScheduledPosts();
        console.log(`Scheduled posts count: ${scheduledPosts.length}`);
        scheduledPosts.forEach((job, index) => {
            console.log(`   ${index + 1}. Job: ${job.key}, Pattern: ${job.pattern || job.every}`);
        });
        console.log();

        // ===== ОЧІКУВАННЯ ВИКОНАННЯ =====
        console.log(' Waiting for scheduled jobs to execute...');
        console.log('(Waiting 20 seconds to see scheduled jobs run)\n');
        await delay(20000);

        // ===== ТЕСТ 8: Видалення регулярного завдання =====
        console.log(' Test 8: Remove recurring job');
        const jobsToRemove = await queueManager.getScheduledPosts();
        if (jobsToRemove.length > 0) {
            const jobKey = jobsToRemove[0].key;
            await queueManager.removeScheduledPost(jobKey);
            console.log(` Removed recurring job: ${jobKey}\n`);
        }

        // ===== ТЕСТ 9: Пауза та відновлення воркерів =====
        console.log(' Test 9: Pause and resume workers');
        await queueManager.pauseAll();
        console.log('Workers paused\n');

        await delay(3000);

        await queueManager.resumeAll();
        console.log('Workers resumed\n');

        // Чекаємо ще трохи для завершення задач
        console.log('Waiting for final jobs to complete...\n');
        await delay(10000);

        console.log('All tests completed!\n');

    } catch (error) {
        console.error('Error during tests:', error);
    } finally {
        // Закриваємо всі підключення
        console.log('Cleaning up...');
        await queueManager.shutdown();
        console.log('Cleanup completed');
        process.exit(0);
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Обробка помилок
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Запуск тестів
testQueue();