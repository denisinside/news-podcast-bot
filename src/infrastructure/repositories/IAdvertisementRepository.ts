import { IAdvertisement } from '@models/Advertisement';

export interface IAdvertisementRepository {
    create(data: {
        text: string;
        images?: string[];
        buttons?: Array<{ text: string; url: string }>;
        targetType: string;
        targetData?: string;
        scheduledFor?: Date;
        createdBy: string;
        status?: string;
    }): Promise<IAdvertisement>;

    findById(id: string): Promise<IAdvertisement | null>;
    findByStatus(status: string): Promise<IAdvertisement[]>;
    findScheduled(): Promise<IAdvertisement[]>;
    findReadyToSend(): Promise<IAdvertisement[]>;
    updateStatus(id: string, status: string): Promise<boolean>;
    findAll(): Promise<IAdvertisement[]>;
    update(id: string, data: Partial<IAdvertisement>): Promise<IAdvertisement | null>;
    delete(id: string): Promise<boolean>;
    findByCreator(createdBy: string): Promise<IAdvertisement[]>;
}
