import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../ThemeContext";

function TrendingWidget() {
  const { colors, cardStyle } = useTheme();
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api.get("/tweets/trending").then((res) => setTrending(res.data));
  }, []);

  if (trending.length === 0) return null;

  return (
    <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", color: colors.textDark, fontSize: 16 }}>Trending</h3>
      {trending.map((t) => (
        <Link key={t.tag} to={`/?q=${encodeURIComponent(t.tag.slice(1))}`} style={{ display: "block", padding: "6px 0", textDecoration: "none" }}>
          <div style={{ color: colors.primary, fontWeight: "bold", fontSize: 14 }}>{t.tag}</div>
          <div style={{ color: colors.textGray, fontSize: 12 }}>{t.count} posts</div>
        </Link>
      ))}
    </div>
  );
}

export default TrendingWidget;
