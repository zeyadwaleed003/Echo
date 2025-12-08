import Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  // --- Basic Keys --- //

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T, ttl?: number) {
    const data = JSON.stringify(value);

    if (ttl) return this.redis.set(key, data, 'EX', ttl); // 'EX': tells Redis that the next argument is the time to live (TTL) in seconds
    return this.redis.set(key, data);
  }

  // --- Sets --- //

  async sadd(key: string, ...values: string[]) {
    return this.redis.sadd(key, ...values);
  }

  async scard(key: string) {
    return this.redis.scard(key);
  }

  async srem(key: string, ...values: string[]) {
    return this.redis.srem(key, ...values);
  }

  async del(key: string) {
    return this.redis.del(key);
  }
}
