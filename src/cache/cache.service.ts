import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(CacheService.name);
  private fallbackCache = new Map<string, { value: any; expiry: number }>();
  private useRedis = false;

  async onModuleInit() {
    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error', err);
        this.useRedis = false;
      });

      await this.client.connect();
      this.useRedis = true;
      this.logger.log('✅ Connected to Redis');
    } catch (error) {
      this.logger.warn('⚠️  Redis not available, using fallback in-memory cache');
      this.useRedis = false;
      setInterval(() => this.cleanup(), 60000);
    }
  }

  async onModuleDestroy() {
    if (this.useRedis && this.client) {
      await this.client.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis) {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      const item = this.fallbackCache.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expiry) {
        this.fallbackCache.delete(key);
        return null;
      }
      
      return item.value as T;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (this.useRedis) {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } else {
      const expiry = Date.now() + (ttl * 1000);
      this.fallbackCache.set(key, { value, expiry });
    }
  }

  async del(key: string): Promise<void> {
    if (this.useRedis) {
      await this.client.del(key);
    } else {
      this.fallbackCache.delete(key);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.useRedis) {
      return await this.client.keys(pattern);
    } else {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Array.from(this.fallbackCache.keys()).filter(key => regex.test(key));
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.fallbackCache.entries()) {
      if (now > item.expiry) {
        this.fallbackCache.delete(key);
      }
    }
  }
}