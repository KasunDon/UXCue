/**
 * Shared design tokens (docs/06 Visual Tokens, docs/18 brand system).
 * Light + dark palettes; the side panel picks one via the theme context.
 */

export interface Tokens {
  color: {
    bg: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    textMuted: string;
    border: string;
    headerBg: string;
    headerText: string;
    primary: string;
    primaryStrong: string;
    link: string;
    focus: string;
    attention: string;
    danger: string;
    success: string;
  };
  radius: string;
  fontUi: string;
  fontMono: string;
}

const fontUi =
  'Inter, "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const fontMono = '"IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", Consolas, monospace';

export const lightTokens: Tokens = {
  color: {
    bg: "#f6f8fb",
    surface: "#ffffff",
    surfaceMuted: "#eef3f7",
    text: "#101418",
    textMuted: "#52606d",
    border: "#d4dde7",
    headerBg: "#0b0f14",
    headerText: "#ffffff",
    primary: "#00a88f",
    primaryStrong: "#007f70",
    link: "#2563eb",
    focus: "#2563eb",
    attention: "#b7791f",
    danger: "#cf2e2e",
    success: "#23845a",
  },
  radius: "8px",
  fontUi,
  fontMono,
};

/** Near-black dark theme (docs/18: no purple/slate soup, high contrast, teal accent). */
export const darkTokens: Tokens = {
  color: {
    bg: "#0b0f14",
    surface: "#141b24",
    surfaceMuted: "#1b2431",
    text: "#e6edf3",
    textMuted: "#8b98a5",
    border: "#2a3644",
    headerBg: "#05080c",
    headerText: "#ffffff",
    primary: "#12b89e",
    primaryStrong: "#0f9d87",
    link: "#6ba7ff",
    focus: "#6ba7ff",
    attention: "#e0a33a",
    danger: "#ff6b6b",
    success: "#3fbf87",
  },
  radius: "8px",
  fontUi,
  fontMono,
};

/** Back-compat default (light). Prefer the theme context in the side panel. */
export const tokens = lightTokens;
