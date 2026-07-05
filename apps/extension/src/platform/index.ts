/**
 * Platform adapter (D015) — the ONLY module allowed to touch `chrome.*` APIs.
 *
 * Feature code depends on this interface, never on `chrome.*` directly, so the
 * extension can be ported (Release 6: Edge -> Firefox -> Safari) and mocked in
 * the Playwright e2e suite behind a single seam. A lint rule
 * (`no-restricted-globals` for `chrome`) enforces this from `UXL-EXT-001`.
 *
 * The concrete Chrome implementation and the capture/storage/sidePanel/commands/
 * downloads facades are added in `UXL-EXT-001`. This file seeds the seam from
 * the first line of extension code, as D015 requires.
 */

export type PlatformName = "chrome" | "edge" | "firefox" | "mock";

export interface PlatformAdapter {
  readonly platform: PlatformName;
  // capture, storage, sidePanel, commands, downloads facades land in UXL-EXT-001.
}
