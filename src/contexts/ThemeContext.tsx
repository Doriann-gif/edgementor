import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
/** What the user picked — "system" follows the OS setting live. */
export type ThemePreference = Theme | "system";

interface ThemeContextType {
  /** Resolved theme actually applied to the page */
  theme: Theme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  preference: "dark",
  setPreference: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const systemTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

const resolve = (p: ThemePreference): Theme => (p === "system" ? systemTheme() : p);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("edgementor-theme");
      if (stored === "dark" || stored === "light" || stored === "system") return stored;
    }
    return "dark";
  });
  const [theme, setTheme] = useState<Theme>(() => resolve(preference));

  useEffect(() => {
    setTheme(resolve(preference));
    localStorage.setItem("edgementor-theme", preference);
    // Follow OS changes live while on "system"
    if (preference === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: light)");
      const onChange = () => setTheme(systemTheme());
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, [preference]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const setPreference = (p: ThemePreference) => setPreferenceState(p);
  const toggleTheme = () => setPreferenceState(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
