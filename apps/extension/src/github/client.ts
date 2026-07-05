/**
 * Minimal GitHub REST client (#9). Pure w.r.t. the extension — takes a token and
 * an injectable `fetch` (for tests). Uses only the web fetch API, so it lives
 * outside the platform adapter (D015 restricts chrome.*, not fetch).
 *
 * Auth: a fine-grained PAT for the dogfood/local flow (O002). A GitHub App is
 * the later hosted/team model.
 */

export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export interface RepoSummary extends GitHubRepoRef {
  fullName: string;
  private: boolean;
}

export interface CreatedIssue {
  number: number;
  url: string;
}

export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(`GitHub ${status}: ${message}`);
    this.name = "GitHubError";
  }
}

type FetchFn = typeof fetch;

export class GitHubClient {
  constructor(
    private readonly token: string,
    private readonly fetchImpl: FetchFn = fetch,
  ) {}

  private async api(path: string, init?: RequestInit): Promise<Response> {
    const res = await this.fetchImpl(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...init?.headers,
      },
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = (await res.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        /* keep statusText */
      }
      throw new GitHubError(res.status, message);
    }
    return res;
  }

  /** Validate the token; returns the authenticated login. */
  async getLogin(): Promise<string> {
    const data = (await (await this.api("/user")).json()) as { login: string };
    return data.login;
  }

  /** Repos the user owns, collaborates on, or reaches via an org. */
  async listRepos(): Promise<RepoSummary[]> {
    const res = await this.api(
      "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    );
    const data = (await res.json()) as {
      name: string;
      full_name: string;
      private: boolean;
      owner: { login: string };
    }[];
    return data.map((r) => ({
      owner: r.owner.login,
      repo: r.name,
      fullName: r.full_name,
      private: r.private,
    }));
  }

  async createIssue(
    ref: GitHubRepoRef,
    input: { title: string; body: string; labels?: string[] },
  ): Promise<CreatedIssue> {
    const res = await this.api(`/repos/${ref.owner}/${ref.repo}/issues`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { number: number; html_url: string };
    return { number: data.number, url: data.html_url };
  }

  /**
   * Create/update a file via the Contents API (screenshots -> .uxcue/screenshots/).
   * Returns the raw download URL that renders in the issue body.
   */
  async putFile(
    ref: GitHubRepoRef,
    path: string,
    base64Content: string,
    message: string,
  ): Promise<string> {
    // Look up an existing sha so re-commits update instead of 409.
    let sha: string | undefined;
    try {
      const existing = (await (
        await this.api(`/repos/${ref.owner}/${ref.repo}/contents/${path}`)
      ).json()) as { sha?: string };
      sha = existing.sha;
    } catch {
      /* file doesn't exist yet */
    }
    const res = await this.api(`/repos/${ref.owner}/${ref.repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({ message, content: base64Content, ...(sha ? { sha } : {}) }),
    });
    const data = (await res.json()) as { content: { download_url: string } };
    return data.content.download_url;
  }
}
