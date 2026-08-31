import { useState } from "react";
import api from "../services/api";
import { openImageUpload } from "../cloudinary";
import { useTheme } from "../ThemeContext";

function ComposeBox({ onPosted }) {
  const { colors, buttonStyle, cardStyle } = useTheme();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState("");

  const openImagePicker = () => {
    setError("");
    openImageUpload(
      (url) => setImageUrl(url),
      (errMsg) => setError(errMsg)
    );
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUrl) return;
    setError("");
    try {
      await api.post("/tweets", { content: content || "", imageUrl });
      setContent("");
      setImageUrl(null);
      onPosted?.();
    } catch (err) {
      setError(err.response?.data?.error || "Could not post tweet");
    }
  };

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <textarea
        value={content}
        maxLength={280}
        placeholder="What's happening?"
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%", minHeight: 60, padding: 10, fontSize: 16, border: `1px solid ${colors.border}`,
          borderRadius: 8, outline: "none", boxSizing: "border-box", resize: "vertical",
          background: colors.background, color: colors.textDark
        }}
      />
      {imageUrl && (
        <div style={{ position: "relative", marginTop: 8, display: "inline-block" }}>
          <img src={imageUrl} alt="preview" style={{ maxHeight: 160, borderRadius: 10 }} />
          <button
            onClick={() => setImageUrl(null)}
            style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <button onClick={openImagePicker} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }} title="Add photo">
          🖼️
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: colors.textGray, fontSize: 13 }}>{content.length}/280</span>
          <button onClick={handlePost} style={buttonStyle}>Post</button>
        </div>
      </div>
      {error && <p style={{ color: colors.danger, fontSize: 13 }}>{error}</p>}
    </div>
  );
}

export default ComposeBox;
