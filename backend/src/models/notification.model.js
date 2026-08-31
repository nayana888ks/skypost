const pool = require("../config/db");
const { emitToUser } = require("../socket");

async function createNotification({ recipientId, actorId, type, tweetId = null }) {
  if (recipientId === actorId) return;
  const result = await pool.query(
    `INSERT INTO notifications (recipient_id, actor_id, type, tweet_id)
     VALUES ($1, $2, $3, $4) RETURNING id, type, tweet_id, created_at`,
    [recipientId, actorId, type, tweetId]
  );
  emitToUser(recipientId, "notification", result.rows[0]);
}

async function getNotifications(userId, limit = 30) {
  const result = await pool.query(
    `SELECT n.id, n.type, n.is_read, n.created_at, n.tweet_id,
            u.username AS actor_username, u.display_name AS actor_display_name, u.avatar_url AS actor_avatar_url
     FROM notifications n JOIN users u ON n.actor_id = u.id
     WHERE n.recipient_id = $1 ORDER BY n.created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false`, [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

async function markAllRead(userId) {
  await pool.query(`UPDATE notifications SET is_read = true WHERE recipient_id = $1`, [userId]);
}

module.exports = { createNotification, getNotifications, getUnreadCount, markAllRead };
