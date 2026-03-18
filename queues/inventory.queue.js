const { Queue } = require('bullmq');
const IORedis = require('ioredis');


const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1', 
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null, 
});

const inventoryQueue = new Queue('inventory-sync', {
  connection,
  defaultJobOptions: {
    attempts: 5, 
    backoff: {
      type: 'exponential',
      delay: 5000, 
    },
    removeOnComplete: true,
    removeOnFail: false, 
  },
});

module.exports = { inventoryQueue, connection };