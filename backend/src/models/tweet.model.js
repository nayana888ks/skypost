const pool = require("../config/db");

async function createTweet({ userId, content, replyToId = null, originalTweetId = null, imageUrl = null }) {
  const result = await pool.query(
    `INSERT INTO tweets (user_id, content, reply_to_id, original_tweet_id, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, content, reply_to_id, original_tweet_id, image_url, created_at`,
    [userId, content, replyToId, originalTweetId, imageUrl]
  );
  return result.rows[0];
}

async function getTweetById(id) {
  const result = await pool.query(
    `SELECT t.*, u.username, u.display_name, u.avatar_url
     FROM tweets t JOIN users u ON t.user_id = u.id
     WHERE t.id = $1 AND t.is_deleted = false`,
    [id]
  );
  return result.rows[0];
}

const TWEET_SELECT_COLUMNS = `
  t.id, t.user_id, t.content, t.created_at, t.like_count, t.image_url,
  u.username, u.display_name, u.avatar_url,
  (SELECT COUNT(*) FROM tweets r WHERE r.reply_to_id = t.id AND r.is_deleted = false) AS reply_count,
  (SELECT COUNT(*) FROM tweets rp WHERE rp.original_tweet_id = t.id AND rp.is_deleted = false) AS repost_count,
  EXISTS(SELECT 1 FROM likes l WHERE l.tweet_id = t.id AND l.user_id = $2) AS is_liked,
  EXISTS(SELECT 1 FROM tweets rp2 WHERE rp2.original_tweet_id = t.id AND rp2.user_id = $2 AND rp2.is_deleted = false) AS has_reposted,
  ot.id AS original_id, ot.content AS original_content, ot.created_at AS original_created_at,
  ot.image_url AS original_image_url, ou.username AS original_username,
  ou.display_name AS original_display_name, ou.avatar_url AS original_avatar_url
`;

const ORIGINAL_JOIN = `
  LEFT JOIN tweets ot ON t.original_tweet_id = ot.id AND ot.is_deleted = false
  LEFT JOIN users ou ON ot.user_id = ou.id
`;

async function getRecentTweetsByUser(userId, limit = 20, viewerId = null, beforeDate = null) {
  const params = [userId, viewerId, limit];
  let dateFilter = "";
  if (beforeDate) {
    params.push(beforeDate);
    dateFilter = `AND t.created_at < $${params.length}`;
  }
  const result = await pool.query(
    `SELECT ${TWEET_SELECT_COLUMNS} FROM tweets t JOIN users u ON t.user_id = u.id ${ORIGINAL_JOIN}
     WHERE t.user_id = $1 AND t.is_deleted = false ${dateFilter}
     ORDER BY t.created_at DESC LIMIT $3`,
    params
  );
  return result.rows;
}

async function searchTweets(query, limit = 20, viewerId = null, beforeDate = null) {
  const params = [query, viewerId, limit];
  let dateFilter = "";
  if (beforeDate) {
    params.push(beforeDate);
    dateFilter = `AND t.created_at < $${params.length}`;
  }
  const result = await pool.query(
    `SELECT ${TWEET_SELECT_COLUMNS}, ts_rank(t.search_vector, plainto_tsquery('english', $1)) AS rank
     FROM tweets t JOIN users u ON t.user_id = u.id ${ORIGINAL_JOIN}
     WHERE t.search_vector @@ plainto_tsquery('english', $1) AND t.is_deleted = false ${dateFilter}
     ORDER BY rank DESC LIMIT $3`,
    params
  );
  return result.rows;
}

async function getTweetsByIds(ids, viewerId = null) {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT ${TWEET_SELECT_COLUMNS} FROM tweets t JOIN users u ON t.user_id = u.id ${ORIGINAL_JOIN}
     WHERE t.id = ANY($1) AND t.is_deleted = false`,
    [ids, viewerId]
  );
  return result.rows;
}

async function getReplies(tweetId, viewerId = null) {
  const result = await pool.query(
    `SELECT t.id, t.user_id, t.content, t.created_at, t.like_count, t.image_url,
            u.username, u.display_name, u.avatar_url,
            EXISTS(SELECT 1 FROM likes l WHERE l.tweet_id = t.id AND l.user_id = $2) AS is_liked
     FROM tweets t JOIN users u ON t.user_id = u.id
     WHERE t.reply_to_id = $1 AND t.is_deleted = false ORDER BY t.created_at ASC`,
    [tweetId, viewerId]
  );
  return result.rows;
}

async function likeTweet(userId, tweetId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO likes (user_id, tweet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [userId, tweetId]
    );
    if (inserted.rowCount > 0) {
      await client.query(`UPDATE tweets SET like_count = like_count + 1 WHERE id = $1`, [tweetId]);
    }
    await client.query("COMMIT");
    return inserted.rowCount > 0;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function unlikeTweet(userId, tweetId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const deleted = await client.query(
      `DELETE FROM likes WHERE user_id = $1 AND tweet_id = $2 RETURNING *`,
      [userId, tweetId]
    );
    if (deleted.rowCount > 0) {
      await client.query(`UPDATE tweets SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1`, [tweetId]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function repostTweet(userId, originalTweetId) {
  const existing = await pool.query(
    `SELECT * FROM tweets WHERE user_id = $1 AND original_tweet_id = $2`,
    [userId, originalTweetId]
  );
  if (existing.rows.length > 0) return { tweet: existing.rows[0], alreadyReposted: true };
  const result = await pool.query(
    `INSERT INTO tweets (user_id, content, original_tweet_id) VALUES ($1, '', $2) RETURNING *`,
    [userId, originalTweetId]
  );
  return { tweet: result.rows[0], alreadyReposted: false };
}

async function softDeleteTweet(userId, tweetId) {
  const result = await pool.query(
    `UPDATE tweets SET is_deleted = true WHERE id = $1 AND user_id = $2 RETURNING id`,
    [tweetId, userId]
  );
  return result.rowCount > 0;
}

async function getTrendingHashtags(hoursBack = 24, limit = 10) {
  const result = await pool.query(
    `SELECT content FROM tweets WHERE created_at > NOW() - INTERVAL '${hoursBack} hours' AND is_deleted = false`
  );
  const counts = {};
  const hashtagPattern = /#(\w+)/g;
  for (const row of result.rows) {
    const matches = row.content.match(hashtagPattern) || [];
    for (const tag of matches) {
      const clean = tag.toLowerCase();
      counts[clean] = (counts[clean] || 0) + 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([tag, count]) => ({ tag, count }));
}

module.exports = {
  createTweet, getTweetById, getRecentTweetsByUser, searchTweets, getTweetsByIds,
  getReplies, likeTweet, unlikeTweet, repostTweet, softDeleteTweet, getTrendingHashtags,
};
