import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { avatarColor } from "../theme";
import { useTheme } from "../ThemeContext";

function Avatar({ username, displayName, avatarUrl, size = 40 }) {
  const initial = (displayName || username || "?")[0].toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", marginRight: 12, flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: avatarColor(username || ""),
      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
      marginRight: 12, flexShrink: 0, fontWeight: "bold"
    }}>
      {initial}
    </div>
  );
}

function Tweet({ tweet, onDeleted }) {
  const { colors, cardStyle } = useTheme();
  const [liked, setLiked] = useState(!!tweet.is_liked);
  const [likeCount, setLikeCount] = useState(tweet.like_count || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyCount, setReplyCount] = useState(tweet.reply_count || 0);
  const [reposted, setReposted] = useState(!!tweet.has_reposted);
  const [repostCount, setRepostCount] = useState(tweet.repost_count || 0);
  const [deleted, setDeleted] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");
  const isOwnTweet = currentUser && currentUser.username === tweet.username && !tweet.original_id;
  const isRepost = !!tweet.original_id;
  const display = isRepost
    ? { content: tweet.original_content, created_at: tweet.original_created_at, username: tweet.original_username,
        display_name: tweet.original_display_name, avatar_url: tweet.original_avatar_url, image_url: tweet.original_image_url }
    : tweet;

  function linkify(text) {
    const parts = (text || "").split(/(\s+)/);
    return parts.map((part, i) => {
      if (part.startsWith("#") && part.length > 1) {
        return <Link key={i} to={`/?q=${encodeURIComponent(part.slice(1))}`} style={{ color: colors.primary, textDecoration: "none" }}>{part}</Link>;
      }
      if (part.startsWith("@") && part.length > 1) {
        return <Link key={i} to={`/profile/${part.slice(1)}`} style={{ color: colors.primary, textDecoration: "none" }}>{part}</Link>;
      }
      return part;
    });
  }

  const toggleLike = async () => {
    if (liked) {
      setLiked(false); setLikeCount((c) => Math.max(c - 1, 0));
      await api.delete(`/tweets/${tweet.id}/like`);
    } else {
      setLiked(true); setLikeCount((c) => c + 1);
      await api.post(`/tweets/${tweet.id}/like`);
    }
  };

  const doRepost = async () => {
    if (reposted) return;
    setReposted(true); setRepostCount((c) => c + 1);
    await api.post(`/tweets/${tweet.id}/repost`);
  };

  const loadReplies = async () => {
    const next = !showReplies;
    setShowReplies(next);
    if (next && replies.length === 0) {
      const res = await api.get(`/tweets/${tweet.id}/replies`);
      setReplies(res.data);
    }
  };

  const postReply = async () => {
    if (!replyText.trim()) return;
    await api.post("/tweets", { content: replyText, replyToId: tweet.id });
    const res = await api.get(`/tweets/${tweet.id}/replies`);
    setReplies(res.data); setReplyCount((c) => c + 1); setReplyText("");
  };

  const doDelete = async () => {
    if (!window.confirm("Delete this tweet? This can't be undone from the UI.")) return;
    await api.delete(`/tweets/${tweet.id}`);
    setDeleted(true);
    onDeleted?.(tweet.id);
  };

  if (deleted) return null;

  return (
    <div style={cardStyle}>
      {isRepost && (
        <div style={{ color: colors.textGray, fontSize: 12, marginBottom: 6 }}>
          🔁 Reposted by {tweet.display_name || tweet.username}
        </div>
      )}
      <div style={{ display: "flex" }}>
        <Avatar username={display.username} displayName={display.display_name} avatarUrl={display.avatar_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong style={{ color: colors.textDark }}>{display.display_name || display.username}</strong>{" "}
              <span style={{ color: colors.textGray }}>@{display.username}</span>{" "}
              <span style={{ color: colors.textGray, fontSize: 12 }}>· {new Date(display.created_at).toLocaleString()}</span>
            </div>
            {isOwnTweet && (
              <button onClick={doDelete} title="Delete tweet" style={{ background: "none", border: "none", color: colors.textGray, cursor: "pointer", fontSize: 13 }}>🗑️</button>
            )}
          </div>
          <div style={{ color: colors.textDark, marginTop: 2, wordBreak: "break-word" }}>{linkify(display.content || "")}</div>
          {display.image_url && (
            <img src={display.image_url} alt="attached" style={{ maxWidth: "100%", borderRadius: 10, marginTop: 8, maxHeight: 320, objectFit: "cover" }} />
          )}
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            <button onClick={toggleLike} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? colors.danger : colors.textGray, fontSize: 14 }}>
              {liked ? "♥" : "♡"} {likeCount}
            </button>
            <button onClick={loadReplies} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textGray, fontSize: 14 }}>
              💬 {replyCount}
            </button>
            <button onClick={doRepost} disabled={reposted} style={{ background: "none", border: "none", cursor: reposted ? "default" : "pointer", color: reposted ? "#17BF63" : colors.textGray, fontSize: 14 }}>
              🔁 {repostCount}
            </button>
          </div>
          {showReplies && (
            <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: `2px solid ${colors.border}` }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..."
                  style={{ flex: 1, padding: 6, border: `1px solid ${colors.border}`, borderRadius: 6, background: colors.surface, color: colors.textDark }} />
                <button onClick={postReply} style={{ background: colors.primary, color: "white", border: "none", borderRadius: 14, padding: "4px 14px", cursor: "pointer" }}>Reply</button>
              </div>
              {replies.map((r) => (
                <div key={r.id} style={{ display: "flex", padding: "8px 0" }}>
                  <Avatar username={r.username} displayName={r.display_name} avatarUrl={r.avatar_url} size={28} />
                  <div>
                    <div><strong style={{ color: colors.textDark, fontSize: 14 }}>{r.display_name}</strong> <span style={{ color: colors.textGray, fontSize: 12 }}>@{r.username}</span></div>
                    <div style={{ color: colors.textDark, fontSize: 14 }}>{linkify(r.content)}</div>
                  </div>
                </div>
              ))}
              {replies.length === 0 && <p style={{ color: colors.textGray, fontSize: 13 }}>No replies yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tweet;
