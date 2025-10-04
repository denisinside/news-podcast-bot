import { IUserSettingsService } from "../interfaces/IUserSettingsService";
import { IUserSettings, NewsFrequency, UserSettings } from "@/models";

export class UserSettingsService implements IUserSettingsService {
    
    async getUserSettings(userId: number): Promise<IUserSettings | null> {
        console.log(`Getting settings for user ${userId}`);
        
        const settings = await UserSettings.findOne({ userId });
        
        // Create default settings if they don't exist
        if (!settings) {
            return await this.createDefaultSettings(userId);
        }
        
        return settings;
    }

    async createDefaultSettings(userId: number): Promise<IUserSettings> {
        console.log(`Creating default settings for user ${userId}`);
        
        const settings = new UserSettings({
            userId,
            newsFrequency: NewsFrequency.DAILY,
            enableAudioPodcasts: false
        });
        
        await settings.save();
        return settings;
    }

    async updateNewsFrequency(userId: number, frequency: NewsFrequency): Promise<void> {
        console.log(`Updating news frequency for user ${userId} to ${frequency}`);
        
        await UserSettings.findOneAndUpdate(
            { userId },
            { newsFrequency: frequency },
            { upsert: true, new: true }
        );
    }

    async updateAudioPodcasts(userId: number, enabled: boolean): Promise<void> {
        console.log(`Updating audio podcasts for user ${userId} to ${enabled}`);
        
        await UserSettings.findOneAndUpdate(
            { userId },
            { enableAudioPodcasts: enabled },
            { upsert: true, new: true }
        );
    }
}

