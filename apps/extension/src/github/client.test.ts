import { describe, it, expect, vi } from "vitest";
import { GitHubClient, GitHubError } from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    json: async () => body,
  } as unknown as Response;
}

describe("GitHubClient", () => {
  it("validates the token and returns the login", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ login: "kdon" }));
    const c = new GitHubClient("tok", fetchImpl as unknown as typeof fetch);
    expect(await c.getLogin()).toBe("kdon");
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/user");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("lists repos across owner/collaborator/org", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse([
        { name: "UXCue", full_name: "kdon/UXCue", private: false, owner: { login: "kdon" } },
        { name: "app", full_name: "acme/app", private: true, owner: { login: "acme" } },
      ]),
    );
    const c = new GitHubClient("tok", fetchImpl as unknown as typeof fetch);
    const repos = await c.listRepos();
    expect(repos).toHaveLength(2);
    expect(repos[0]).toEqual({
      owner: "kdon",
      repo: "UXCue",
      fullName: "kdon/UXCue",
      private: false,
    });
    expect(String(fetchImpl.mock.calls[0]![0])).toContain(
      "affiliation=owner,collaborator,organization_member",
    );
  });

  it("creates an issue and returns number + url", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ number: 42, html_url: "https://github.com/kdon/UXCue/issues/42" }),
      );
    const c = new GitHubClient("tok", fetchImpl as unknown as typeof fetch);
    const created = await c.createIssue(
      { owner: "kdon", repo: "UXCue" },
      { title: "t", body: "b", labels: ["uxcue"] },
    );
    expect(created).toEqual({ number: 42, url: "https://github.com/kdon/UXCue/issues/42" });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/repos/kdon/UXCue/issues");
    expect(init.method).toBe("POST");
  });

  it("throws GitHubError with the API message on failure", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ message: "Bad credentials" }, 401));
    const c = new GitHubClient("bad", fetchImpl as unknown as typeof fetch);
    await expect(c.getLogin()).rejects.toBeInstanceOf(GitHubError);
    await expect(c.getLogin()).rejects.toThrow("Bad credentials");
  });

  it("commits a file via the Contents API and returns the raw URL", async () => {
    const fetchImpl = vi
      .fn()
      // first call: get existing sha -> 404
      .mockResolvedValueOnce(jsonResponse({ message: "Not Found" }, 404))
      // second: PUT
      .mockResolvedValueOnce(
        jsonResponse({
          content: {
            download_url:
              "https://raw.githubusercontent.com/kdon/UXCue/main/.uxcue/screenshots/a.png",
          },
        }),
      );
    const c = new GitHubClient("tok", fetchImpl as unknown as typeof fetch);
    const url = await c.putFile(
      { owner: "kdon", repo: "UXCue" },
      ".uxcue/screenshots/a.png",
      "AAAA",
      "add",
    );
    expect(url).toContain("raw.githubusercontent.com");
    expect(fetchImpl.mock.calls[1]![1].method).toBe("PUT");
  });
});
