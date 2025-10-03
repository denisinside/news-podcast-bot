import { Podcast, IPodcast } from '@models/Podcast';
import { IPodcastRepository } from './IPodcastRepository';
import { Types } from 'mongoose';

export class PodcastRepository implements IPodcastRepository {
    async create(data: { userId: Types.ObjectId; articles: Types.ObjectId[] }): Promise<IPodcast> {
        const podcast = new Podcast(data);
        return await podcast.save();
    }

    async update(id: Types.ObjectId, data: { status?: string; fileUrl?: string }): Promise<IPodcast | null> {
        return await Podcast.findByIdAndUpdate(id, data, { new: true });
    }

    async findById(id: string): Promise<IPodcast | null> {
        return await Podcast.findById(id).populate('articles');
    }

    async findByUserId(userId: Types.ObjectId): Promise<IPodcast[]> {
        return await Podcast.find({ userId }).populate('articles').sort({ creationDate: -1 });
    }

    async findAll(): Promise<IPodcast[]> {
        return await Podcast.find().populate('articles').sort({ creationDate: -1 });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Podcast.findByIdAndDelete(id);
        return result !== null;
    }
}
