export interface IFileStorageClient {
    upload(file: Buffer, fileName: string): Promise<string>;
}

