import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { avatarColor } from "../theme";
import { useTheme } from "../ThemeContext";

function Explore() {
  const { colors, cardStyle } = useTheme();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "0 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <h2 style={{ color: colors.textDark }}>People</h2>
      {users.map((u) => (
        <Link key={u.id} to={`/profile/${u.username}`} style={{ textDecoration: "none" }}>
          <div style={{ ...cardStyle, display: "flex", alignItems: "center" }}>
            {u.avatar_url ? (
              <img src={u.avatar_url} alt={u.username} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", marginRight: 12 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: avatarColor(u.username), color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12, fontWeight: "bold" }}>
                {(u.display_name || u.username)[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ color: colors.textDark, fontWeight: "bold" }}>{u.display_name} {u.follower_count >= 1000 && "⭐"}</div>
              <div style={{ color: colors.textGray, fontSize: 13 }}>@{u.username} · {u.follower_count.toLocaleString()} followers</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default Explore;
