import { Podcast, IPodcast } from '@models/Podcast';
import { IPodcastRepository } from './IPodcastRepository';
import { Types } from 'mongoose';

export class PodcastRepository implements IPodcastRepository {
    async create(data: { userId: string; articles: Types.ObjectId[] }): Promise<IPodcast> {
        const podcast = new Podcast(data);
        return await podcast.save();
    }

    async update(id: Types.ObjectId, data: { status?: string; fileUrl?: string }): Promise<IPodcast | null> {
        return Podcast.findByIdAndUpdate(id, data, { new: true });
    }

    async findById(id: string): Promise<IPodcast | null> {
        return Podcast.findById(id).populate('articles');
    }

    async findByUserId(userId: string): Promise<IPodcast[]> {
        return await Podcast.find({ userId }).populate('articles').sort({ creationDate: -1 });
    }

    async findByUserIdAndStatus(userId: string, status: string): Promise<IPodcast | null> {
        return await Podcast.findOne({ userId, status }).populate('articles');
    }

    async findRecentByUserId(userId: string, timeWindowMs: number): Promise<IPodcast | null> {
        const cutoffDate = new Date(Date.now() - timeWindowMs);
        return await Podcast.findOne({ 
            userId, 
            creationDate: { $gte: cutoffDate },
            status: 'READY'
        }).populate('articles').sort({ creationDate: -1 });
    }

    async findAll(): Promise<IPodcast[]> {
        return Podcast.find().populate('articles').sort({ creationDate: -1 });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Podcast.findByIdAndDelete(id);
        return result !== null;
    }
}
