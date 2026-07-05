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
  /** docs/18 productive type scale (extension): fontSize/lineHeight/weight. */
  type: {
    displaySm: TypeStyle;
    titleLg: TypeStyle;
    titleMd: TypeStyle;
    bodyMd: TypeStyle;
    bodySm: TypeStyle;
    labelMd: TypeStyle;
    metaSm: TypeStyle;
    monoSm: TypeStyle;
  };
  /** docs/18 spacing scale (px). */
  space: { xs: number; sm: number; md: number; lg: number; xl: number };
  /** docs/18 motion: 120ms hover, 160ms panel/detail. */
  motion: { hover: string; panel: string };
}

export interface TypeStyle {
  fontSize: number;
  lineHeight: string;
  fontWeight: number;
}

const fontUi =
  'Inter, "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const fontMono = '"IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", Consolas, monospace';

// Type / spacing / motion are theme-independent (docs/18); shared by both palettes.
const type: Tokens["type"] = {
  displaySm: { fontSize: 20, lineHeight: "28px", fontWeight: 700 },
  titleLg: { fontSize: 18, lineHeight: "26px", fontWeight: 700 },
  titleMd: { fontSize: 16, lineHeight: "24px", fontWeight: 650 },
  bodyMd: { fontSize: 14, lineHeight: "21px", fontWeight: 450 },
  bodySm: { fontSize: 13, lineHeight: "19px", fontWeight: 450 },
  labelMd: { fontSize: 13, lineHeight: "18px", fontWeight: 650 },
  metaSm: { fontSize: 12, lineHeight: "17px", fontWeight: 500 },
  monoSm: { fontSize: 12, lineHeight: "17px", fontWeight: 500 },
};
const space: Tokens["space"] = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
const motion: Tokens["motion"] = { hover: "120ms", panel: "160ms" };

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
  type,
  space,
  motion,
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
  type,
  space,
  motion,
};

/** Back-compat default (light). Prefer the theme context in the side panel. */
export const tokens = lightTokens;
