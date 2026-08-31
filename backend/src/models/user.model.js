const pool = require("../config/db");

async function createUser({ username, email, passwordHash, displayName }) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, display_name)
     VALUES ($1, $2, $3, $4) RETURNING id, username, email, display_name, created_at`,
    [username, email, passwordHash, displayName]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query(
    "SELECT id, username, display_name, bio, avatar_url, follower_count, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

async function findByUsername(username) {
  const result = await pool.query(
    "SELECT id, username, display_name, bio, avatar_url, follower_count, created_at FROM users WHERE username = $1",
    [username]
  );
  return result.rows[0];
}

async function findCelebritiesAmong(userIds, threshold) {
  if (userIds.length === 0) return [];
  const result = await pool.query(
    `SELECT id, username, display_name, avatar_url FROM users WHERE id = ANY($1) AND follower_count >= $2`,
    [userIds, threshold]
  );
  return result.rows;
}

async function listAll() {
  const result = await pool.query(
    `SELECT id, username, display_name, bio, avatar_url, follower_count
     FROM users ORDER BY follower_count DESC, username ASC LIMIT 200`
  );
  return result.rows;
}

async function updateProfile(userId, { displayName, bio, avatarUrl }) {
  const result = await pool.query(
    `UPDATE users SET display_name = COALESCE($2, display_name), bio = COALESCE($3, bio),
     avatar_url = COALESCE($4, avatar_url) WHERE id = $1
     RETURNING id, username, display_name, bio, avatar_url, follower_count`,
    [userId, displayName, bio, avatarUrl]
  );
  return result.rows[0];
}

async function getSuggestions(userId, limit = 5) {
  const result = await pool.query(
    `SELECT id, username, display_name, avatar_url, follower_count
     FROM users
     WHERE id != $1
       AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = $1)
       AND id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = $1)
       AND id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = $1)
     ORDER BY follower_count DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function getStats(userId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE t.is_deleted = false) AS tweet_count,
       COALESCE(SUM(t.like_count) FILTER (WHERE t.is_deleted = false), 0) AS total_likes_received,
       (SELECT COUNT(*) FROM tweets r
        WHERE r.reply_to_id IN (SELECT id FROM tweets WHERE user_id = $1) AND r.is_deleted = false
       ) AS total_replies_received
     FROM tweets t WHERE t.user_id = $1`,
    [userId]
  );
  const row = result.rows[0];
  return {
    tweetCount: parseInt(row.tweet_count, 10),
    totalLikesReceived: parseInt(row.total_likes_received, 10),
    totalRepliesReceived: parseInt(row.total_replies_received, 10),
  };
}

module.exports = {
  createUser, findByEmail, findById, findByUsername, findCelebritiesAmong,
  listAll, updateProfile, getSuggestions, getStats,
};
