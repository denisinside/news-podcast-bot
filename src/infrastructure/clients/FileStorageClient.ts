import { IFileStorageClient } from './IFileStorageClient';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FileStorageClient implements IFileStorageClient {
    private readonly storagePath: string;

    constructor(storagePath: string = 'temp_audio') {
        this.storagePath = path.resolve(process.cwd(), storagePath);
        this.initializeStorage().catch(err => console.error('Failed to initialize local storage:', err));
    }

    private async initializeStorage(): Promise<void> {
        await fs.mkdir(this.storagePath, { recursive: true });
    }

    async upload(buffer: Buffer, fileName: string): Promise<string> {
        const filePath = path.join(this.storagePath, fileName);
        await fs.writeFile(filePath, buffer);
        return filePath;
    }
    
    async download(fileName: string): Promise<Buffer> {
        const filePath = path.join(this.storagePath, fileName);
        return fs.readFile(filePath);
    }
    
    async delete(fileName: string): Promise<void> {
        const filePath = path.join(this.storagePath, fileName);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }
    }
}
