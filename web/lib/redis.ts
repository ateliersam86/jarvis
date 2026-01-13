import Redis from 'ioredis';

// Use a global variable to preserve the client across module reloads in HMR
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL || 'redis://jarvis-redis:6379');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

redis.on('error', (err) => console.error('Redis Client Error', err));
