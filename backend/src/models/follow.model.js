const pool = require("../config/db");

async function followUser(followerId, followingId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [followerId, followingId]
    );
    await client.query(`UPDATE users SET follower_count = follower_count + 1 WHERE id = $1`, [followingId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function unfollowUser(followerId, followingId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`, [followerId, followingId]);
    await client.query(`UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1`, [followingId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getFollowers(userId) {
  const result = await pool.query(`SELECT follower_id FROM follows WHERE following_id = $1`, [userId]);
  return result.rows.map((r) => r.follower_id);
}

async function getFollowing(userId) {
  const result = await pool.query(`SELECT following_id FROM follows WHERE follower_id = $1`, [userId]);
  return result.rows.map((r) => r.following_id);
}

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
