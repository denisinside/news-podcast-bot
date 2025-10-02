import { MongoClient, Db } from "mongodb";
import { IConfigService } from "./IConfigService";

export class MongoDbService {
    private db?: Db;
    private client?: MongoClient;

    constructor(private readonly config: IConfigService) {}

    public async connect(): Promise<void> {
        if (this.db) return;

        const uri = this.config.get("MONGO_URI");
        this.client = new MongoClient(uri);

        await this.client.connect();
        this.db = this.client.db();
        console.log("MongoDB connected");
    }

    public getDb(): Db {
        if (!this.db) throw new Error("MongoDB doesn't exist");
        return this.db;
    }

    public async disconnect(): Promise<void> {
        if (!this.client) return;
        await this.client.close();
        this.db = undefined;
        this.client = undefined;
        console.log("MongoDB disconnected");
    }
}
