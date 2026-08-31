import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import NotificationBell from "./components/NotificationBell";
import { useTheme } from "./ThemeContext";
import { onAuthChanged } from "./authEvents";

function isLoggedIn() {
  return !!sessionStorage.getItem("token");
}

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

// Connects (or reconnects) the socket whenever login state changes,
// without needing a full page reload.
function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    function connect() {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setSocket((prev) => {
          prev?.disconnect();
          return null;
        });
        return;
      }
      const s = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", { auth: { token } });
      setSocket((prev) => {
        prev?.disconnect();
        return s;
      });
    }

    connect();
    const unsubscribe = onAuthChanged(connect);
    return unsubscribe;
  }, []);

  return socket;
}

function NavBar({ socket }) {
  const navigate = useNavigate();
  const { colors, buttonStyle, mode, toggleMode } = useTheme();
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.dispatchEvent(new Event("skypost:auth-changed"));
    navigate("/login");
  };

  if (!isLoggedIn()) return null;

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 24px", borderBottom: `1px solid ${colors.border}`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "sticky", top: 0, background: colors.background, zIndex: 10
    }}>
      <Link to="/" style={{ fontWeight: "bold", textDecoration: "none", color: colors.primary, fontSize: 20 }}>
        Skypost
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Link to="/explore" style={{ color: colors.textDark, textDecoration: "none" }}>Explore</Link>
        {user && (
          <Link to={`/profile/${user.username}`} style={{ color: colors.textDark, textDecoration: "none" }}>
            My Profile
          </Link>
        )}
        <button onClick={toggleMode} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }} title="Toggle dark mode">
          {mode === "light" ? "🌙" : "☀️"}
        </button>
        <NotificationBell socket={socket} />
        <button onClick={logout} style={{ ...buttonStyle, background: "transparent", color: colors.primary, border: `1px solid ${colors.primary}` }}>
          Log out
        </button>
      </div>
    </div>
  );
}

function App() {
  const socket = useSocket();

  return (
    <BrowserRouter>
      <NavBar socket={socket} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
        <Route path="/profile/:username" element={<PrivateRoute><Profile /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
