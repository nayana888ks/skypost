const redisClient = require("../config/redis");
const followModel = require("../models/follow.model");

const CELEBRITY_THRESHOLD = 1000;
function timelineKey(userId) { return `timeline:${userId}`; }
const MAX_TIMELINE_LENGTH = 800;

async function fanOutTweet(tweet, authorFollowerCount) {
  if (authorFollowerCount >= CELEBRITY_THRESHOLD) return;
  const followerIds = await followModel.getFollowers(tweet.user_id);
  for (const followerId of followerIds) {
    const key = timelineKey(followerId);
    await redisClient.lPush(key, tweet.id.toString());
    await redisClient.lTrim(key, 0, MAX_TIMELINE_LENGTH - 1);
  }
}

module.exports = { fanOutTweet, timelineKey, CELEBRITY_THRESHOLD, MAX_TIMELINE_LENGTH };
