import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { avatarColor } from "../theme";
import { useTheme } from "../ThemeContext";

function WhoToFollow() {
  const { colors, cardStyle } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);

  useEffect(() => {
    api.get("/users/suggestions").then((res) => setSuggestions(res.data));
  }, []);

  const follow = async (userId) => {
    await api.post(`/follow/${userId}`);
    setFollowedIds((ids) => [...ids, userId]);
  };

  if (suggestions.length === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", color: colors.textDark, fontSize: 16 }}>Who to follow</h3>
      {suggestions.map((u) => {
        const alreadyFollowed = followedIds.includes(u.id);
        return (
          <div key={u.id} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <Link to={`/profile/${u.username}`} style={{ display: "flex", alignItems: "center", flex: 1, textDecoration: "none" }}>
              {u.avatar_url ? (
                <img src={u.avatar_url} alt={u.username} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", marginRight: 10 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarColor(u.username), color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, fontWeight: "bold", fontSize: 14 }}>
                  {(u.display_name || u.username)[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: colors.textDark, fontSize: 14, fontWeight: "bold" }}>{u.display_name} {u.follower_count >= 1000 && "⭐"}</div>
                <div style={{ color: colors.textGray, fontSize: 12 }}>@{u.username}</div>
              </div>
            </Link>
            <button
              onClick={() => follow(u.id)}
              disabled={alreadyFollowed}
              style={{
                background: alreadyFollowed ? "transparent" : colors.primary,
                color: alreadyFollowed ? colors.textGray : "white",
                border: alreadyFollowed ? `1px solid ${colors.border}` : "none",
                borderRadius: 16, padding: "5px 12px", fontSize: 13, cursor: alreadyFollowed ? "default" : "pointer"
              }}
            >
              {alreadyFollowed ? "Followed" : "Follow"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default WhoToFollow;
