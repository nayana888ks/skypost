import { useEffect, useState } from "react";
import api from "../services/api";
import { useTheme } from "../ThemeContext";

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function messageFor(n) {
  const name = n.actor_display_name || n.actor_username;
  switch (n.type) {
    case "like": return `${name} liked your post`;
    case "reply": return `${name} replied to your post`;
    case "repost": return `${name} reposted your post`;
    case "follow": return `${name} followed you`;
    default: return `${name} interacted with your post`;
  }
}

function NotificationBell({ socket }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = () => {
    api.get("/notifications/unread-count").then((res) => setUnreadCount(res.data.count)).catch(() => {});
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setUnreadCount((c) => c + 1);
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [socket]);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      await api.post("/notifications/read");
      setUnreadCount(0);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={toggleOpen}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative", padding: 4 }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2, background: colors.danger, color: "white",
            borderRadius: "50%", fontSize: 10, width: 16, height: 16, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: 34, width: 300, maxHeight: 400, overflowY: "auto",
          background: colors.surface, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 20
        }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${colors.border}`, fontWeight: "bold", color: colors.textDark }}>
            Notifications
          </div>
          {notifications.length === 0 && (
            <p style={{ padding: 16, color: colors.textGray, fontSize: 13 }}>Nothing yet.</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${colors.border}`, fontSize: 13 }}>
              <div style={{ color: colors.textDark }}>{messageFor(n)}</div>
              <div style={{ color: colors.textGray, fontSize: 11 }}>{timeAgo(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
