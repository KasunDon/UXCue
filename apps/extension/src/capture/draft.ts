import type {
  ElementContext,
  PageContext,
  CaptureContext,
  ConsoleEntry,
  Issue,
  IssueType,
  Severity,
  IssueStatus,
  AssigneeHint,
  ScreenshotRefs,
} from "@uxcue/schema";
import type { Repository } from "../storage/repository";

/** A pending capture (post-selection, pre-save) held in chrome.storage.local. */
export interface CaptureDraft {
  /** Absent for page-level / viewport / console-only captures. */
  element?: ElementContext;
  page: PageContext;
  capture: CaptureContext;
  shots: {
    element?: { blobKey: string; width: number; height: number };
    viewport?: { blobKey: string; width: number; height: number };
  };
  console?: ConsoleEntry[];
}

export const DRAFT_KEY = "captureDraft";

export interface ComposerForm {
  title: string;
  feedback: string;
  expected?: string;
  suggestedFix?: string;
  type: IssueType;
  severity: Severity;
  status: IssueStatus;
  assigneeHint: AssigneeHint;
}

/** Build the screenshot refs for an issue from a draft's stored blobs. */
export function screenshotRefsFromDraft(displayId: string, draft: CaptureDraft): ScreenshotRefs {
  const refs: ScreenshotRefs = {};
  if (draft.shots.element) {
    refs.element = {
      id: draft.shots.element.blobKey,
      localBlobKey: draft.shots.element.blobKey,
      filename: `${displayId}-element.png`,
      contentType: "image/png",
      width: draft.shots.element.width,
      height: draft.shots.element.height,
    };
  }
  if (draft.shots.viewport) {
    refs.viewport = {
      id: draft.shots.viewport.blobKey,
      localBlobKey: draft.shots.viewport.blobKey,
      filename: `${displayId}-viewport.png`,
      contentType: "image/png",
      width: draft.shots.viewport.width,
      height: draft.shots.viewport.height,
    };
  }
  return refs;
}

/** Create a tracked issue from a capture draft + composer form (blobs already stored). */
export async function createIssueFromDraft(
  repo: Repository,
  ctx: { projectId: string; sessionId: string },
  draft: CaptureDraft,
  form: ComposerForm,
): Promise<Issue> {
  const issue = await repo.createIssue({
    projectId: ctx.projectId,
    sessionId: ctx.sessionId,
    title: form.title || draft.element?.textSnippet || "Page note",
    feedback: form.feedback,
    ...(form.expected ? { expected: form.expected } : {}),
    ...(form.suggestedFix ? { suggestedFix: form.suggestedFix } : {}),
    type: form.type,
    severity: form.severity,
    status: form.status,
    assigneeHint: form.assigneeHint,
    page: draft.page,
    ...(draft.element ? { target: draft.element } : {}),
    capture: draft.capture,
    ...(draft.console?.length ? { diagnostics: { console: draft.console } } : {}),
    screenshots: {},
  });
  const refs = screenshotRefsFromDraft(issue.displayId, draft);
  if (refs.element || refs.viewport) return repo.setScreenshots(issue.id, refs);
  return issue;
}
