import { AdvertisementService } from '@application/services/AdvertisementService';
import { IAdvertisementRepository } from '@infrastructure/repositories/IAdvertisementRepository';
import { AdvertisementStatus } from '@models/Advertisement';

export class ScheduledAdvertisementProcessor {
    private isRunning = false;
    private intervalId?: NodeJS.Timeout;

    constructor(
        private readonly advertisementRepository: IAdvertisementRepository,
        private readonly advertisementService: AdvertisementService
    ) {}

    start() {
        if (this.isRunning) {
            console.log('ScheduledAdvertisementProcessor is already running');
            return;
        }

        this.isRunning = true;
        console.log('Starting ScheduledAdvertisementProcessor...');

        // Check every minute
        this.intervalId = setInterval(async () => {
            await this.processScheduledAdvertisements();
        }, 60000); // 60 seconds

        // Also run immediately
        this.processScheduledAdvertisements();
    }

    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        console.log('ScheduledAdvertisementProcessor stopped');
    }

    private async processScheduledAdvertisements() {
        try {
            const now = new Date();
            console.log(`Checking for scheduled advertisements at ${now.toISOString()}`);

            // Find advertisements that should be sent now
            const readyToSend = await this.advertisementRepository.findReadyToSend();

            console.log(`Found ${readyToSend.length} advertisements ready to send`);

            for (const advertisement of readyToSend) {
                try {
                    console.log(`Sending scheduled advertisement ${advertisement._id}`);
                    
                    // Update status to SENDING
                    await this.advertisementRepository.updateStatus(String(advertisement._id), AdvertisementStatus.SENDING);
                    
                    // Send the advertisement
                    const result = await this.advertisementService.sendAdvertisement(String(advertisement._id));
                    
                    console.log(`Advertisement ${advertisement._id} sent: ${result.message}`);
                } catch (error) {
                    console.error(`Error sending advertisement ${advertisement._id}:`, error);
                    
                    // Update status to FAILED
                    await this.advertisementRepository.updateStatus(String(advertisement._id), AdvertisementStatus.FAILED);
                }
            }
        } catch (error) {
            console.error('Error processing scheduled advertisements:', error);
        }
    }
}
