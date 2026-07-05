/**
 * UXCue MV3 extension entry surface. The service worker, content script,
 * page-world shim, and side panel are built in Epic B (UXL-EXT-001+).
 */

export type { PlatformAdapter, PlatformName } from "./platform/index";

export const EXTENSION_PACKAGE = "@uxcue/extension" as const;
