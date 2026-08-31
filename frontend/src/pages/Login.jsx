import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../ThemeContext";
import { notifyAuthChanged } from "../authEvents";

function Login() {
  const { colors, inputStyle, buttonStyle, authBackground, authCardStyle } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      notifyAuthChanged();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={{ ...authBackground, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={authCardStyle}>
        <h1 style={{ color: colors.primary, marginBottom: 4, fontSize: 28 }}>Skypost</h1>
        <p style={{ color: colors.textGray, marginBottom: 24 }}>Log in to see what's happening.</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          {error && <p style={{ color: colors.danger }}>{error}</p>}
          <button type="submit" style={{ ...buttonStyle, width: "100%", marginTop: 8 }}>Log in</button>
        </form>
        <p style={{ color: colors.textGray, marginTop: 20, textAlign: "center" }}>
          No account? <Link to="/signup" style={{ color: colors.primary, fontWeight: "bold" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
