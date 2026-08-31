import { createContext, useContext, useState, useEffect } from "react";
import { buildTheme } from "./theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "light");

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));
  const theme = buildTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, ...theme }}>
      <div style={{ background: theme.colors.background, minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
