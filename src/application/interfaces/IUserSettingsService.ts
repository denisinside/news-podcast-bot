import { IUserSettings, NewsFrequency } from "../../models/UserSettings";

export interface IUserSettingsService {
    getUserSettings(userId: number): Promise<IUserSettings | null>;
    updateNewsFrequency(userId: number, frequency: NewsFrequency): Promise<void>;
    updateAudioPodcasts(userId: number, enabled: boolean): Promise<void>;
    createDefaultSettings(userId: number): Promise<IUserSettings>;
    getAllUserSettings(): Promise<IUserSettings[]>;
}

