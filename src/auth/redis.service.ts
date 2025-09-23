import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async set(key: string, value: number | string, ttl: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttl);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async zadd(
    key: string,
    score: number,
    member: string,
    ttl?: number,
  ): Promise<void> {
    await this.redis.zadd(key, score, member);
    if (ttl) {
      await this.redis.expire(key, ttl);
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop);
  }

  async zrem(key: string, member: string): Promise<void> {
    await this.redis.zrem(key, member);
  }

  async zcard(key: string): Promise<number> {
    return this.redis.zcard(key);
  }

  async zremrangebyrank(
    key: string,
    start: number,
    stop: number,
  ): Promise<void> {
    await this.redis.zremrangebyrank(key, start, stop);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }
}
