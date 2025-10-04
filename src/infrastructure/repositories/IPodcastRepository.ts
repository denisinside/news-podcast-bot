import { IPodcast } from '@models/Podcast';
import { Types } from 'mongoose';

export interface IPodcastRepository {
    create(data: { userId: String; articles: Types.ObjectId[] }): Promise<IPodcast>;
    update(id: Types.ObjectId, data: { status?: string; fileUrl?: string }): Promise<IPodcast | null>;
    findById(id: string): Promise<IPodcast | null>;
    findByUserId(userId: Types.ObjectId): Promise<IPodcast[]>;
    findAll(): Promise<IPodcast[]>;
    delete(id: string): Promise<boolean>;
}
