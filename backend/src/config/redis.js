const { createClient } = require("redis");
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Exported so app.js can wait for this to resolve before accepting
// requests -- avoids a cold-start race where the very first request
// after a fresh container start could hit Redis before it's ready.
const connectPromise = redisClient.connect();

module.exports = redisClient;
module.exports.connectPromise = connectPromise;
