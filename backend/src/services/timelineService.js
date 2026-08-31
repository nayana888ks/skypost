const redisClient = require("../config/redis");
const followModel = require("../models/follow.model");
const tweetModel = require("../models/tweet.model");
const userModel = require("../models/user.model");
const blockModel = require("../models/block.model");
const { timelineKey, CELEBRITY_THRESHOLD, MAX_TIMELINE_LENGTH } = require("./fanoutService");

async function getTimeline(userId, limit = 20, beforeDate = null) {
  const blockedIds = await blockModel.getRelatedBlockedIds(userId);
  const mutedIds = await blockModel.getMutedIds(userId);
  const hiddenIds = new Set([...blockedIds, ...mutedIds]);

  const cachedIds = await redisClient.lRange(timelineKey(userId), 0, MAX_TIMELINE_LENGTH - 1);
  let cachedTweets = await tweetModel.getTweetsByIds(cachedIds.map(Number), userId);
  cachedTweets = cachedTweets.filter((t) => !hiddenIds.has(t.user_id));
  if (beforeDate) cachedTweets = cachedTweets.filter((t) => new Date(t.created_at) < new Date(beforeDate));

  const followingIds = (await followModel.getFollowing(userId)).filter((id) => !hiddenIds.has(id));
  const celebrities = await userModel.findCelebritiesAmong(followingIds, CELEBRITY_THRESHOLD);

  let celebrityTweets = [];
  for (const celeb of celebrities) {
    const recent = await tweetModel.getRecentTweetsByUser(celeb.id, 10, userId, beforeDate);
    celebrityTweets.push(...recent.map((t) => ({ ...t, username: celeb.username, display_name: celeb.display_name, avatar_url: celeb.avatar_url })));
  }

  const merged = [...cachedTweets, ...celebrityTweets];
  merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return merged.slice(0, limit);
}

module.exports = { getTimeline };
