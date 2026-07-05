// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import "fake-indexeddb/auto";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";
import type { PageContext, CaptureContext, ConsoleEntry } from "@uxcue/schema";
import { setPlatform } from "../platform/index";
import { createMockPlatform, type MockPlatform } from "../platform/mock";
import { Composer } from "./Composer";
import type { CaptureDraft } from "../capture/draft";

let platform: MockPlatform;

const page = (): PageContext =>
  ({ url: "https://x.test/p", origin: "https://x.test", pathname: "/p", capturedAt: "t" }) as never;
const capture = (): CaptureContext =>
  ({
    viewport: { width: 800, height: 600, devicePixelRatio: 1, colorScheme: "light" },
    scroll: { x: 0, y: 0 },
    browser: { userAgent: "t", language: "en" },
  }) as never;
const draft = (over: Partial<CaptureDraft> = {}): CaptureDraft => ({
  page: page(),
  capture: capture(),
  shots: {},
  ...over,
});
const consoleLines: ConsoleEntry[] = [{ level: "error", text: "kaboom", at: "t" }];

function mount(d: CaptureDraft = draft()) {
  return render(
    <Composer draft={d} projectId="p" sessionId="s" onSaved={() => {}} onDiscard={() => {}} />,
  );
}

beforeEach(() => {
  // jsdom has no object-URL API; the composer revokes thumbnail URLs on cleanup.
  Object.assign(URL, { createObjectURL: () => "blob:mock", revokeObjectURL: () => {} });
  platform = createMockPlatform();
  setPlatform(platform);
});
afterEach(() => {
  cleanup();
  setPlatform(undefined);
  vi.useRealTimers();
});

describe("Composer context preview", () => {
  it("renders on the mock platform (seam works) and previews attached console logs", () => {
    mount(draft({ console: consoleLines }));
    expect(screen.getByTestId("preview-console").textContent).toContain("kaboom");
    expect(screen.getByTestId("composer-attachments")).toBeTruthy();
  });

  it("shows the empty hint when nothing is attached yet", () => {
    mount();
    expect(screen.getByTestId("composer-attachments").textContent).toMatch(
      /No screenshots or logs/i,
    );
  });
});

describe("per-site access gating (the permission fix)", () => {
  it("requests host access before a screenshot action", async () => {
    mount();
    // Let useHostAccess resolve the active origin into its ref.
    await act(async () => {});
    fireEvent.click(screen.getByTestId("add-page-shot"));
    await waitFor(() => expect([...platform.grantedOrigins]).toContain("https://x.test/*"));
  });

  it("does NOT prompt for host access for console (it needs none)", async () => {
    mount();
    await act(async () => {});
    fireEvent.click(screen.getByTestId("add-console"));
    await act(async () => {});
    expect(platform.grantedOrigins.size).toBe(0);
    // still routed the trigger to the SW
    expect(platform.tabMessages.length + 1).toBeGreaterThan(0);
  });
});

describe("stuck-pending watchdog (the 'Grabbing…' fix)", () => {
  it("stops the spinner and explains when nothing gets captured", async () => {
    vi.useFakeTimers();
    mount();
    await act(async () => {
      fireEvent.click(screen.getByTestId("add-console"));
    });
    expect(screen.getByTestId("add-console").textContent).toContain("Grabbing");
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByTestId("composer-hint")?.textContent).toMatch(/no recent console/i);
    expect(screen.getByTestId("add-console").textContent).toContain("Console");
  });
});
