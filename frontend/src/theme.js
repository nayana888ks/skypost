function buildTheme(mode) {
  const isDark = mode === "dark";
  const colors = {
    primary: "#1DA1F2",
    primaryHover: "#1a91da",
    background: isDark ? "#15202B" : "#ffffff",
    surface: isDark ? "#192734" : "#ffffff",
    border: isDark ? "#38444D" : "#e6ecf0",
    textDark: isDark ? "#F5F8FA" : "#14171A",
    textGray: isDark ? "#8899A6" : "#657786",
    danger: "#E0245E",
  };

  const inputStyle = {
    display: "block", width: "100%", padding: "10px 12px", marginBottom: 10,
    border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15, outline: "none",
    boxSizing: "border-box", background: colors.surface, color: colors.textDark,
  };

  const buttonStyle = {
    background: colors.primary, color: "white", border: "none", borderRadius: 20,
    padding: "10px 20px", fontWeight: "bold", fontSize: 15, cursor: "pointer",
  };

  const cardStyle = {
    background: colors.surface, borderRadius: 14,
    boxShadow: isDark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.08)",
    marginBottom: 12, padding: "14px 16px", border: isDark ? `1px solid ${colors.border}` : "none",
  };

  const authBackground = {
    minHeight: "100vh", background: "linear-gradient(135deg, #1DA1F2 0%, #6dd5ed 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  const authCardStyle = {
    background: colors.surface, borderRadius: 20, boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    padding: "40px 36px", maxWidth: 380, width: "90%",
  };

  return { colors, inputStyle, buttonStyle, cardStyle, authBackground, authCardStyle };
}

const AVATAR_PALETTE = ["#1DA1F2", "#17BF63", "#F45D22", "#794BC4", "#E0245E", "#FFAD1F", "#00B87C", "#8B5CF6", "#F91880", "#0F9B8E"];

export function avatarColor(username = "") {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// 120 preset avatars across 6 DiceBear styles (free, no signup, no
// Cloudinary needed) -- 20 per style for variety in Edit Profile.
const AVATAR_STYLES = ["avataaars", "personas", "micah", "lorelei", "adventurer", "notionists"];
export const PRESET_AVATARS = AVATAR_STYLES.flatMap((style) =>
  Array.from({ length: 20 }, (_, i) => `https://api.dicebear.com/7.x/${style}/svg?seed=${style}${i + 1}`)
);

export { buildTheme };
