/**
 * Shared design tokens (docs/06 Visual Tokens, docs/18 brand system).
 * Components are added in the side-panel UI stories and the design pass.
 */

export const tokens = {
  color: {
    bg: "#f6f8fb",
    surface: "#ffffff",
    surfaceMuted: "#eef3f7",
    text: "#101418",
    textMuted: "#52606d",
    border: "#d4dde7",
    primary: "#00a88f",
    primaryStrong: "#007f70",
    link: "#2563eb",
    focus: "#2563eb",
    attention: "#b7791f",
    danger: "#cf2e2e",
    success: "#23845a",
  },
  radius: "8px",
  fontUi: 'Inter, "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono: '"IBM Plex Mono", "JetBrains Mono", "SFMono-Regular", Consolas, monospace',
} as const;

export type Tokens = typeof tokens;
