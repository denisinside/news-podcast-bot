import { IConfigService } from "./IConfigService";
import { config, DotenvParseOutput } from "dotenv";

export class ConfigService implements IConfigService {
    private config: DotenvParseOutput;

    constructor() {
        const { error, parsed } = config();
        if (error) {
            throw new Error('Cannot find .env file');
        }
        if (!parsed) {
            throw new Error('.env file is empty');
        }
        this.config = parsed;
    }

    get(key: string): string{
        const resValue: string = this.config[key];
        if (!resValue) {
            throw new Error(`.env file has not key ${key}`);
        }
        return resValue;
    }


}