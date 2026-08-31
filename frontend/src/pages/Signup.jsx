import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../ThemeContext";
import { notifyAuthChanged } from "../authEvents";

function Signup() {
  const { colors, inputStyle, buttonStyle, authBackground, authCardStyle } = useTheme();
  const [form, setForm] = useState({ username: "", email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/signup", form);
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      notifyAuthChanged();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div style={{ ...authBackground, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={authCardStyle}>
        <h1 style={{ color: colors.primary, marginBottom: 4, fontSize: 28 }}>Join Skypost</h1>
        <p style={{ color: colors.textGray, marginBottom: 24 }}>Create your account.</p>
        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Username" onChange={handleChange} style={inputStyle} />
          <input name="displayName" placeholder="Display name" onChange={handleChange} style={inputStyle} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} style={inputStyle} />
          {error && <p style={{ color: colors.danger }}>{error}</p>}
          <button type="submit" style={{ ...buttonStyle, width: "100%", marginTop: 8 }}>Sign up</button>
        </form>
        <p style={{ color: colors.textGray, marginTop: 20, textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: colors.primary, fontWeight: "bold" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
