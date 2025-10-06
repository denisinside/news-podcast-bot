export interface IPodcastService {
    generateForUser(userId: string): Promise<string>;
}