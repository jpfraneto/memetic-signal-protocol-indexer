import { Queue, ConnectionOptions } from "bullmq";

// Job data interfaces
export interface SignalResolutionJobData {
  signalId: number;
  tokenAddress: string;
  expiresAt: number;
  fid: number;
  transactionHash: string;
}

export type JobType = "RESOLVE_SINGLE_SIGNAL";

// Parse Redis connection from REDIS_URL
function getRedisConnection(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  // Parse Redis URL
  // Expected format: redis://user:pass@host:port or rediss://user:pass@host:port
  try {
    const url = new URL(redisUrl);

    return {
      family: 0,
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      db: 1, // Use database 1 for queues (separate from any existing cache)
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
      // Handle TLS for rediss:// URLs
      ...(url.protocol === "rediss:" && { tls: {} }),
    };
  } catch (error) {
    console.error("Failed to parse REDIS_URL:", error);
    throw new Error(`Invalid REDIS_URL format: ${error}`);
  }
}

// Create Redis connection
const redisConnection = getRedisConnection();

// Create BullMQ Queue instance
export const signalResolutionQueue = new Queue("signal-resolution", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs for debugging
    removeOnFail: 50, // Keep failed jobs for investigation
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Error handling for queue connection
signalResolutionQueue.on("error", (error: Error) => {
  console.error("Signal resolution queue error:", error);
});

signalResolutionQueue.on("waiting", (job: any) => {
  console.log(`Signal resolution job ${job.id} is waiting`);
});

// Note: BullMQ v4 uses different event names than v3
// These events may not be available in v4, so we'll keep minimal logging

// Health check function
export async function checkQueueHealth(): Promise<boolean> {
  try {
    await signalResolutionQueue.isPaused();
    return true;
  } catch (error) {
    console.error("Queue health check failed:", error);
    return false;
  }
}

export default signalResolutionQueue;
