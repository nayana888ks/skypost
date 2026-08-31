require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const tweetRoutes = require("./routes/tweet.routes");
const followRoutes = require("./routes/follow.routes");
const userRoutes = require("./routes/user.routes");
const notificationRoutes = require("./routes/notification.routes");
const blockRoutes = require("./routes/block.routes");

const { initSocket } = require("./socket");
const redisClient = require("./config/redis");

const app = express();
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/tweets", tweetRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/relations", blockRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 4000;

// Wait for Redis to actually be connected before accepting traffic --
// otherwise the very first request(s) after a fresh container start
// could read an empty/not-yet-ready cache and look like a real bug.
redisClient.connectPromise
  .then(() => {
    httpServer.listen(PORT, () => console.log(`Backend (HTTP + WebSocket) running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to Redis, starting anyway:", err.message);
    httpServer.listen(PORT, () => console.log(`Backend running on port ${PORT} (Redis connection issue)`));
  });
