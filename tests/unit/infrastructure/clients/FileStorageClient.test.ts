import { FileStorageClient } from '@infrastructure/clients/FileStorageClient';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs/promises
jest.mock('fs/promises');

describe('FileStorageClient', () => {
  let fileStorageClient: FileStorageClient;
  let mockFs: any;

  beforeEach(() => {
    mockFs = fs as any;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default storage path', () => {
      // Arrange
      const expectedPath = path.resolve(process.cwd(), 'temp_audio');

      // Act
      fileStorageClient = new FileStorageClient();

      // Assert
      expect(fileStorageClient).toBeInstanceOf(FileStorageClient);
      expect(mockFs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it('should create instance with custom storage path', () => {
      // Arrange
      const customPath = 'custom_storage';
      const expectedPath = path.resolve(process.cwd(), customPath);

      // Act
      fileStorageClient = new FileStorageClient(customPath);

      // Assert
      expect(fileStorageClient).toBeInstanceOf(FileStorageClient);
      expect(mockFs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });
  });

  describe('upload', () => {
    beforeEach(() => {
      fileStorageClient = new FileStorageClient();
    });

    it('should upload file successfully', async () => {
      // Arrange
      const buffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const expectedPath = path.join(path.resolve(process.cwd(), 'temp_audio'), fileName);
      mockFs.writeFile.mockResolvedValue(undefined);

      // Act
      const result = await fileStorageClient.upload(buffer, fileName);

      // Assert
      expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, buffer);
      expect(result).toBe(expectedPath);
    });

    it('should handle upload errors', async () => {
      // Arrange
      const buffer = Buffer.from('test content');
      const fileName = 'test.txt';
      const error = new Error('Write failed');
      mockFs.writeFile.mockRejectedValue(error);

      // Act & Assert
      await expect(fileStorageClient.upload(buffer, fileName)).rejects.toThrow('Write failed');
    });
  });

  describe('download', () => {
    beforeEach(() => {
      fileStorageClient = new FileStorageClient();
    });

    it('should download file successfully', async () => {
      // Arrange
      const fileName = 'test.txt';
      const expectedPath = path.join(path.resolve(process.cwd(), 'temp_audio'), fileName);
      const expectedBuffer = Buffer.from('file content');
      mockFs.readFile.mockResolvedValue(expectedBuffer);

      // Act
      const result = await fileStorageClient.download(fileName);

      // Assert
      expect(mockFs.readFile).toHaveBeenCalledWith(expectedPath);
      expect(result).toBe(expectedBuffer);
    });

    it('should handle download errors', async () => {
      // Arrange
      const fileName = 'nonexistent.txt';
      const error = new Error('File not found');
      mockFs.readFile.mockRejectedValue(error);

      // Act & Assert
      await expect(fileStorageClient.download(fileName)).rejects.toThrow('File not found');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      fileStorageClient = new FileStorageClient();
    });

    it('should delete file successfully', async () => {
      // Arrange
      const fileName = 'test.txt';
      const expectedPath = path.join(path.resolve(process.cwd(), 'temp_audio'), fileName);
      mockFs.unlink.mockResolvedValue(undefined);

      // Act
      await fileStorageClient.delete(fileName);

      // Assert
      expect(mockFs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle file not found error gracefully', async () => {
      // Arrange
      const fileName = 'nonexistent.txt';
      const expectedPath = path.join(path.resolve(process.cwd(), 'temp_audio'), fileName);
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.unlink.mockRejectedValue(error);

      // Act
      await fileStorageClient.delete(fileName);

      // Assert
      expect(mockFs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should throw error for other delete failures', async () => {
      // Arrange
      const fileName = 'test.txt';
      const expectedPath = path.join(path.resolve(process.cwd(), 'temp_audio'), fileName);
      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mockFs.unlink.mockRejectedValue(error);

      // Act & Assert
      await expect(fileStorageClient.delete(fileName)).rejects.toThrow('Permission denied');
    });
  });

  describe('initializeStorage', () => {
    it('should handle initialization errors gracefully', async () => {
      // Arrange
      const error = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValue(error);
      
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      fileStorageClient = new FileStorageClient();
      
      // Wait for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize local storage:', error);
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});