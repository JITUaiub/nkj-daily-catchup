import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const s = localStorage.getItem("workday.theme") as Theme | null;
  return s === "light" || s === "dark" || s === "system" ? s : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(getSystemTheme);

  useEffect(() => {
    const apply = (t: Theme) => {
      const r = t === "system" ? getSystemTheme() : t;
      setResolved(r);
      document.documentElement.classList.toggle("dark", r === "dark");
    };
    apply(theme);
    localStorage.setItem("workday.theme", theme);
    if (theme === "system") {
      const m = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => apply("system");
      m.addEventListener("change", listener);
      return () => m.removeEventListener("change", listener);
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
