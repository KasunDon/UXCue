import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { lightTokens, darkTokens, type Tokens } from "@uxcue/ui";
import { getPlatform } from "../platform/index";

type Mode = "light" | "dark";
const platform = getPlatform();
const THEME_KEY = "themeMode";

interface ThemeContextValue {
  t: Tokens;
  mode: Mode;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  t: lightTokens,
  mode: "light",
  toggle: () => {},
});

/** Side-panel theme: follows system by default; user toggle persists in storage. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );

  useEffect(() => {
    void platform.storage.get<Mode>(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setMode(stored);
    });
  }, []);

  const toggle = () =>
    setMode((prev) => {
      const next: Mode = prev === "dark" ? "light" : "dark";
      void platform.storage.set(THEME_KEY, next);
      return next;
    });

  const t = mode === "dark" ? darkTokens : lightTokens;
  return <ThemeContext.Provider value={{ t, mode, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTokens = (): Tokens => useContext(ThemeContext).t;
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
