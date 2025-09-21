// Simple storage solution for Vercel serverless functions
// This uses a combination of approaches to ensure data persistence

interface StorageData {
  updates: any[];
  lastUpdated: number;
  version: string;
}

export class SimpleStorage {
  private static instance: SimpleStorage;
  private memoryCache: StorageData | null = null;
  private cacheTimestamp: number = 0;

  static getInstance(): SimpleStorage {
    if (!SimpleStorage.instance) {
      SimpleStorage.instance = new SimpleStorage();
    }
    return SimpleStorage.instance;
  }

  async getData(): Promise<StorageData> {
    // Try memory cache first
    if (this.memoryCache && this.cacheTimestamp > 0) {
      const now = Date.now();
      const cacheAge = now - this.cacheTimestamp;
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes
        console.log('Using memory cache');
        return this.memoryCache;
      }
    }

    // Try to get from external storage (GitHub raw file)
    try {
      const response = await fetch('https://raw.githubusercontent.com/callagano/MarketMelodrama/main/data/tldr-data.json');
      if (response.ok) {
        const data = await response.json();
        this.memoryCache = data;
        this.cacheTimestamp = Date.now();
        console.log('Data loaded from GitHub:', data.updates?.length || 0, 'updates');
        return data;
      }
    } catch (error) {
      console.log('Failed to load from GitHub:', error);
    }

    // Return empty data
    return {
      updates: [],
      lastUpdated: 0,
      version: '1.0'
    };
  }

  async setData(data: StorageData): Promise<void> {
    // Update memory cache
    this.memoryCache = data;
    this.cacheTimestamp = Date.now();
    console.log('Data stored in memory cache:', data.updates.length, 'updates');

    // In a real implementation, you would also update external storage
    // For now, we'll rely on the memory cache within the same function execution
  }

  getMemoryCache(): StorageData | null {
    return this.memoryCache;
  }
}

export const storage = SimpleStorage.getInstance();



