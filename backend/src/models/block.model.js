const pool = require("../config/db");

async function blockUser(blockerId, blockedId) {
  await pool.query(`INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [blockerId, blockedId]);
  await pool.query(
    `DELETE FROM follows WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)`,
    [blockerId, blockedId]
  );
}

async function unblockUser(blockerId, blockedId) {
  await pool.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [blockerId, blockedId]);
}

async function isBlocked(userA, userB) {
  const result = await pool.query(
    `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [userA, userB]
  );
  return result.rows.length > 0;
}

async function getRelatedBlockedIds(userId) {
  const result = await pool.query(
    `SELECT blocked_id AS id FROM blocks WHERE blocker_id = $1
     UNION SELECT blocker_id AS id FROM blocks WHERE blocked_id = $1`,
    [userId]
  );
  return result.rows.map((r) => r.id);
}

async function muteUser(muterId, mutedId) {
  await pool.query(`INSERT INTO mutes (muter_id, muted_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [muterId, mutedId]);
}

async function unmuteUser(muterId, mutedId) {
  await pool.query(`DELETE FROM mutes WHERE muter_id = $1 AND muted_id = $2`, [muterId, mutedId]);
}

async function getMutedIds(userId) {
  const result = await pool.query(`SELECT muted_id AS id FROM mutes WHERE muter_id = $1`, [userId]);
  return result.rows.map((r) => r.id);
}

module.exports = { blockUser, unblockUser, isBlocked, getRelatedBlockedIds, muteUser, unmuteUser, getMutedIds };
