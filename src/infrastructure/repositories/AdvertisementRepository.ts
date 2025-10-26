import { Advertisement, IAdvertisement } from '@models/Advertisement';
import { IAdvertisementRepository } from './IAdvertisementRepository';
import { Types } from 'mongoose';

export class AdvertisementRepository implements IAdvertisementRepository {
    async create(data: {
        text: string;
        images?: string[];
        buttons?: Array<{ text: string; url: string }>;
        targetType: string;
        targetData?: string;
        scheduledFor?: Date;
        createdBy: string;
        status?: string;
    }): Promise<IAdvertisement> {
        const advertisement = new Advertisement(data);
        return await advertisement.save();
    }

    async findById(id: string): Promise<IAdvertisement | null> {
        return Advertisement.findById(id);
    }

    async findByStatus(status: string): Promise<IAdvertisement[]> {
        return Advertisement.find({ status }).sort({ createdAt: -1 });
    }

    async findScheduled(): Promise<IAdvertisement[]> {
        return Advertisement.find({
            status: 'SCHEDULED'
        }).sort({ scheduledFor: 1 });
    }

    async findReadyToSend(): Promise<IAdvertisement[]> {
        const now = new Date();
        return Advertisement.find({
            status: 'SCHEDULED',
            scheduledFor: { $lte: now }
        }).sort({ scheduledFor: 1 });
    }

    async updateStatus(id: string, status: string): Promise<boolean> {
        try {
            const result = await Advertisement.findByIdAndUpdate(id, { status }, { new: true });
            return !!result;
        } catch (error) {
            console.error('Error updating advertisement status:', error);
            return false;
        }
    }

    async findAll(): Promise<IAdvertisement[]> {
        return Advertisement.find().sort({ createdAt: -1 });
    }

    async update(id: string, data: Partial<IAdvertisement>): Promise<IAdvertisement | null> {
        return Advertisement.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Advertisement.findByIdAndDelete(id);
        return result !== null;
    }

    async findByCreator(createdBy: string): Promise<IAdvertisement[]> {
        return Advertisement.find({ createdBy }).sort({ createdAt: -1 });
    }
}
