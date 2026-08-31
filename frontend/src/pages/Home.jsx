import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import ComposeBox from "../components/ComposeBox";
import Tweet from "../components/Tweet";
import WhoToFollow from "../components/WhoToFollow";
import TrendingWidget from "../components/TrendingWidget";
import { useTheme } from "../ThemeContext";

function Home() {
  const { colors, buttonStyle, inputStyle } = useTheme();
  const [searchParams] = useSearchParams();
  const [tweets, setTweets] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("timeline");
  const [hasMore, setHasMore] = useState(true);

  const loadTimeline = async () => {
    setLoading(true);
    setError("");
    setMode("timeline");
    try {
      const res = await api.get("/tweets/timeline");
      setTweets(res.data);
      setHasMore(res.data.length > 0);
    } catch (err) {
      setError(err.response?.data?.error || "Could not load timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q = query) => {
    if (!q.trim()) return loadTimeline();
    setMode("search");
    const res = await api.get(`/tweets/search?q=${encodeURIComponent(q)}`);
    setTweets(res.data);
    setHasMore(res.data.length > 0);
  };

  const loadMore = async () => {
    if (tweets.length === 0) return;
    const oldest = tweets[tweets.length - 1].created_at;
    if (mode === "search") {
      const res = await api.get(`/tweets/search?q=${encodeURIComponent(query)}&before=${encodeURIComponent(oldest)}`);
      setTweets((t) => [...t, ...res.data]);
      setHasMore(res.data.length > 0);
    } else {
      const res = await api.get(`/tweets/timeline?before=${encodeURIComponent(oldest)}`);
      setTweets((t) => [...t, ...res.data]);
      setHasMore(res.data.length > 0);
    }
  };

  const handleDeleted = (tweetId) => setTweets((t) => t.filter((tw) => tw.id !== tweetId));

  useEffect(() => {
    if (searchParams.get("q")) {
      handleSearch(searchParams.get("q"));
    } else {
      loadTimeline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      maxWidth: 900, margin: "2rem auto", padding: "0 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", gap: 24, alignItems: "flex-start"
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Search tweets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          />
          <button onClick={() => handleSearch()} style={buttonStyle}>Search</button>
        </div>

        <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${colors.border}`, marginBottom: 16 }}>
          <div style={{ padding: "10px 4px", fontWeight: "bold", color: colors.textDark, borderBottom: `3px solid ${colors.primary}` }}>
            {mode === "search" ? `Results for "${query}"` : "For You"}
          </div>
        </div>

        <ComposeBox onPosted={loadTimeline} />

        {loading && <p style={{ color: colors.textGray }}>Loading...</p>}
        {error && <p style={{ color: colors.danger }}>{error}</p>}
        {!loading && tweets.length === 0 && (
          <p style={{ color: colors.textGray, textAlign: "center", padding: "30px 0" }}>
            Nothing here yet — follow some people to see their posts!
          </p>
        )}

        {tweets.map((t) => (
          <Tweet key={`${t.id}-${t.original_id || ""}`} tweet={t} onDeleted={handleDeleted} />
        ))}

        {!loading && tweets.length > 0 && hasMore && (
          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <button onClick={loadMore} style={{ ...buttonStyle, background: "transparent", color: colors.primary, border: `1px solid ${colors.primary}` }}>
              Load more
            </button>
          </div>
        )}
      </div>

      <div style={{ width: 300, flexShrink: 0, display: window.innerWidth < 800 ? "none" : "block" }}>
        <TrendingWidget />
        <WhoToFollow />
      </div>
    </div>
  );
}

export default Home;
