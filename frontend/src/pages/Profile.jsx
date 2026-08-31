import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Tweet from "../components/Tweet";
import { openImageUpload } from "../cloudinary";
import { avatarColor, PRESET_AVATARS } from "../theme";
import { useTheme } from "../ThemeContext";

function Profile() {
  const { colors, buttonStyle, inputStyle, cardStyle } = useTheme();
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [stats, setStats] = useState(null);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [form, setForm] = useState({ displayName: "", bio: "", avatarUrl: "" });

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");
  const isOwnProfile = currentUser && currentUser.username === username;

  const loadProfile = async () => {
    try {
      const res = await api.get(`/users/${username}`);
      setUser(res.data.user);
      setTweets(res.data.tweets);
      setStats(res.data.stats);
      if (res.data.relation) setBlocked(res.data.relation.blocked);
      setForm({
        displayName: res.data.user.display_name || "",
        bio: res.data.user.bio || "",
        avatarUrl: res.data.user.avatar_url || "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "User not found");
    }
  };

  useEffect(() => {
    loadProfile();
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const toggleFollow = async () => {
    if (!user) return;
    if (following) await api.delete(`/follow/${user.id}`);
    else await api.post(`/follow/${user.id}`);
    setFollowing(!following);
    loadProfile();
  };

  const toggleBlock = async () => {
    if (!user) return;
    if (blocked) { await api.delete(`/relations/block/${user.id}`); setBlocked(false); }
    else { await api.post(`/relations/block/${user.id}`); setBlocked(true); setFollowing(false); }
  };

  const toggleMute = async () => {
    if (!user) return;
    if (muted) { await api.delete(`/relations/mute/${user.id}`); setMuted(false); }
    else { await api.post(`/relations/mute/${user.id}`); setMuted(true); }
  };

  const saveProfile = async () => {
    const res = await api.put("/users/me", form);
    setUser((u) => ({ ...u, ...res.data }));
    sessionStorage.setItem("user", JSON.stringify({ ...currentUser, ...res.data }));
    setEditing(false);
  };

  const pickAvatar = () => {
    setUploadError("");
    openImageUpload(
      (url) => setForm((f) => ({ ...f, avatarUrl: url })),
      (errMsg) => setUploadError(errMsg),
      { square: true }
    );
  };

  const handleDeleted = (tweetId) => setTweets((t) => t.filter((tw) => tw.id !== tweetId));

  if (error) return <p style={{ textAlign: "center", marginTop: 40, color: colors.danger }}>{error}</p>;
  if (!user) return <p style={{ textAlign: "center", marginTop: 40, color: colors.textGray }}>Loading...</p>;

  const initial = (user.display_name || user.username)[0].toUpperCase();

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "0 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {!editing ? (
        <>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", marginBottom: 12 }} />
          ) : (
            <div style={{ width: 84, height: 84, borderRadius: "50%", background: avatarColor(user.username), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: "bold", marginBottom: 12 }}>
              {initial}
            </div>
          )}
          <h2 style={{ margin: "4px 0", color: colors.textDark }}>{user.display_name}</h2>
          <p style={{ color: colors.textGray, margin: "2px 0" }}>@{user.username}</p>
          <p style={{ color: colors.textDark }}>{user.bio}</p>
          <p style={{ color: colors.textDark }}><strong>{user.follower_count}</strong> <span style={{ color: colors.textGray }}>followers</span></p>

          {stats && (
            <div style={{ ...cardStyle, display: "flex", gap: 24, padding: 14, marginTop: 8 }}>
              <div><div style={{ fontWeight: "bold", color: colors.textDark }}>{stats.tweetCount}</div><div style={{ color: colors.textGray, fontSize: 12 }}>Tweets</div></div>
              <div><div style={{ fontWeight: "bold", color: colors.textDark }}>{stats.totalLikesReceived}</div><div style={{ color: colors.textGray, fontSize: 12 }}>Likes received</div></div>
              <div><div style={{ fontWeight: "bold", color: colors.textDark }}>{stats.totalRepliesReceived}</div><div style={{ color: colors.textGray, fontSize: 12 }}>Replies received</div></div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {isOwnProfile ? (
              <button onClick={() => setEditing(true)} style={buttonStyle}>Edit Profile</button>
            ) : (
              <>
                <button onClick={toggleFollow} style={buttonStyle} disabled={blocked}>{following ? "Unfollow" : "Follow"}</button>
                <button onClick={toggleMute} style={{ ...buttonStyle, background: "transparent", color: colors.textDark, border: `1px solid ${colors.border}` }}>{muted ? "Unmute" : "Mute"}</button>
                <button onClick={toggleBlock} style={{ ...buttonStyle, background: "transparent", color: colors.danger, border: `1px solid ${colors.danger}` }}>{blocked ? "Unblock" : "Block"}</button>
              </>
            )}
          </div>
          {blocked && !isOwnProfile && <p style={{ color: colors.danger, fontSize: 13, marginTop: 8 }}>You've blocked this account.</p>}
        </>
      ) : (
        <div style={{ maxWidth: 460 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar preview" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatarColor(user.username), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: "bold" }}>
                {initial}
              </div>
            )}
            <button onClick={pickAvatar} style={{ ...buttonStyle, background: "transparent", color: colors.primary, border: `1px solid ${colors.primary}` }}>Upload Photo</button>
          </div>
          {uploadError && <p style={{ color: colors.danger, fontSize: 13 }}>{uploadError}</p>}

          <p style={{ color: colors.textGray, fontSize: 13, marginBottom: 6 }}>Or pick a ready-made avatar (120 options):</p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6,
            maxHeight: 220, overflowY: "auto", padding: 8, marginBottom: 16,
            border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.background
          }}>
            {PRESET_AVATARS.map((url) => (
              <img
                key={url}
                src={url}
                alt="preset avatar option"
                onClick={() => setForm((f) => ({ ...f, avatarUrl: url }))}
                style={{
                  width: 40, height: 40, borderRadius: "50%", cursor: "pointer",
                  border: form.avatarUrl === url ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  background: colors.surface,
                }}
              />
            ))}
          </div>

          <input placeholder="Display name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} style={inputStyle} />
          <textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveProfile} style={buttonStyle}>Save</button>
            <button onClick={() => setEditing(false)} style={{ ...buttonStyle, background: "transparent", color: colors.primary, border: `1px solid ${colors.primary}` }}>Cancel</button>
          </div>
        </div>
      )}

      <hr style={{ margin: "20px 0", border: "none", borderTop: `1px solid ${colors.border}` }} />

      {tweets.length === 0 && <p style={{ color: colors.textGray }}>No tweets yet.</p>}
      {tweets.map((t) => (
        <Tweet key={t.id} tweet={{ ...t, username: user.username, display_name: user.display_name, avatar_url: user.avatar_url }} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}

export default Profile;
