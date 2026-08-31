const tweetModel = require("../models/tweet.model");
const userModel = require("../models/user.model");
const notificationModel = require("../models/notification.model");
const fanoutService = require("../services/fanoutService");
const timelineService = require("../services/timelineService");
const blockModel = require("../models/block.model");

async function createTweet(req, res) {
  const { content, replyToId, imageUrl } = req.body;
  const userId = req.user.id;
  if (!content || content.length > 280) return res.status(400).json({ error: "Tweet must be 1-280 characters" });

  const tweet = await tweetModel.createTweet({ userId, content, replyToId, imageUrl });
  const author = await userModel.findById(userId);
  try {
    await fanoutService.fanOutTweet(tweet, author.follower_count);
  } catch (err) {
    console.error("Fan-out error:", err.message);
  }

  if (replyToId) {
    const parent = await tweetModel.getTweetById(replyToId);
    if (parent) {
      await notificationModel.createNotification({ recipientId: parent.user_id, actorId: userId, type: "reply", tweetId: replyToId });
    }
  }

  res.status(201).json(tweet);
}

async function getTimeline(req, res) {
  const { before } = req.query;
  try {
    const timeline = await timelineService.getTimeline(req.user.id, 20, before || null);
    res.json(timeline);
  } catch (err) {
    res.status(501).json({ error: "Timeline service error", detail: err.message });
  }
}

async function search(req, res) {
  const { q, before } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query param ?q=" });
  const viewerId = req.user?.id || null;
  let results = await tweetModel.searchTweets(q, 20, viewerId, before || null);
  if (viewerId) {
    const blockedIds = new Set(await blockModel.getRelatedBlockedIds(viewerId));
    results = results.filter((t) => !blockedIds.has(t.user_id));
  }
  res.json(results);
}

async function like(req, res) {
  const tweetId = req.params.id;
  const wasNewLike = await tweetModel.likeTweet(req.user.id, tweetId);
  if (wasNewLike) {
    const tweet = await tweetModel.getTweetById(tweetId);
    if (tweet) {
      await notificationModel.createNotification({ recipientId: tweet.user_id, actorId: req.user.id, type: "like", tweetId });
    }
  }
  res.status(204).send();
}

async function unlike(req, res) {
  await tweetModel.unlikeTweet(req.user.id, req.params.id);
  res.status(204).send();
}

async function getReplies(req, res) {
  const viewerId = req.user?.id || null;
  const replies = await tweetModel.getReplies(req.params.id, viewerId);
  res.json(replies);
}

async function repost(req, res) {
  const originalTweetId = req.params.id;
  const userId = req.user.id;
  const { tweet, alreadyReposted } = await tweetModel.repostTweet(userId, originalTweetId);

  if (!alreadyReposted) {
    const author = await userModel.findById(userId);
    try {
      await fanoutService.fanOutTweet(tweet, author.follower_count);
    } catch (err) {
      console.error("Fan-out error on repost:", err.message);
    }
    const original = await tweetModel.getTweetById(originalTweetId);
    if (original) {
      await notificationModel.createNotification({ recipientId: original.user_id, actorId: userId, type: "repost", tweetId: originalTweetId });
    }
  }

  res.status(201).json(tweet);
}

async function deleteTweet(req, res) {
  const deleted = await tweetModel.softDeleteTweet(req.user.id, req.params.id);
  if (!deleted) return res.status(404).json({ error: "Tweet not found or you don't own it" });
  res.status(204).send();
}

async function getTrending(req, res) {
  const trending = await tweetModel.getTrendingHashtags(24, 10);
  res.json(trending);
}

module.exports = { createTweet, getTimeline, search, like, unlike, getReplies, repost, deleteTweet, getTrending };
