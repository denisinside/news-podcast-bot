import { IAdminService } from "../interfaces/IAdminService";
import { ITopic } from "../../models";

export class AdminService implements IAdminService {
    async getAllTopics(): Promise<ITopic[]> {
        return [
            { id: "1", name: "Технології", sourceUrl: "https://tech.com/rss" } as ITopic,
            { id: "2", name: "Економіка", sourceUrl: "https://economy.com/rss" } as ITopic,
            { id: "3", name: "Наука", sourceUrl: "https://science.com/rss" } as ITopic,
        ];
    }
}
