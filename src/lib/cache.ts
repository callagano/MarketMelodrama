import { promises as fs } from 'fs';
import path from 'path';

interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheManager {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(process.cwd(), '.cache');
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheFile = this.getCacheFilePath(key);
      const cacheContent = await fs.readFile(cacheFile, 'utf-8');
      const cacheData: CacheData<T> = JSON.parse(cacheContent);

      // Check if cache is still valid (24 hours)
      const now = Date.now();
      if (now < cacheData.expiresAt) {
        return cacheData.data;
      }

      // Cache expired, remove the file
      await this.delete(key);
      return null;
    } catch (error) {
      // Cache file doesn't exist or is invalid
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlHours: number = 24): Promise<void> {
    try {
      await this.ensureCacheDir();
      
      const now = Date.now();
      const expiresAt = now + (ttlHours * 60 * 60 * 1000); // Convert hours to milliseconds
      
      const cacheData: CacheData<T> = {
        data,
        timestamp: now,
        expiresAt
      };

      const cacheFile = this.getCacheFilePath(key);
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error(`Failed to save cache for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const cacheFile = this.getCacheFilePath(key);
      await fs.unlink(cacheFile);
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.unlink(path.join(this.cacheDir, file));
        }
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheInfo(key: string): Promise<{ exists: boolean; expiresAt?: number; age?: number } | null> {
    try {
      const cacheFile = this.getCacheFilePath(key);
      const cacheContent = await fs.readFile(cacheFile, 'utf-8');
      const cacheData: CacheData<any> = JSON.parse(cacheContent);
      
      const now = Date.now();
      const age = now - cacheData.timestamp;
      
      return {
        exists: true,
        expiresAt: cacheData.expiresAt,
        age
      };
    } catch (error) {
      return { exists: false };
    }
  }
}

// Export a singleton instance
export const cacheManager = new CacheManager();

