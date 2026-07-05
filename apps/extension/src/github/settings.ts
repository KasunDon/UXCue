import { getPlatform } from "../platform/index";
import type { GitHubRepoRef } from "./client";

/** GitHub connection + per-project repo, stored in chrome.storage.local. */
const platform = getPlatform();
const TOKEN_KEY = "githubToken";
const LOGIN_KEY = "githubLogin";
const REPOS_KEY = "githubRepos";

export function getToken(): Promise<string | undefined> {
  return platform.storage.get<string>(TOKEN_KEY);
}
export async function connect(token: string, login: string): Promise<void> {
  await platform.storage.set(TOKEN_KEY, token);
  await platform.storage.set(LOGIN_KEY, login);
}
export function getLogin(): Promise<string | undefined> {
  return platform.storage.get<string>(LOGIN_KEY);
}
export async function disconnect(): Promise<void> {
  await platform.storage.remove(TOKEN_KEY);
  await platform.storage.remove(LOGIN_KEY);
}

export async function getProjectRepo(projectId: string): Promise<GitHubRepoRef | undefined> {
  const map = await platform.storage.get<Record<string, GitHubRepoRef>>(REPOS_KEY);
  return map?.[projectId];
}
export async function setProjectRepo(projectId: string, ref: GitHubRepoRef): Promise<void> {
  const map = (await platform.storage.get<Record<string, GitHubRepoRef>>(REPOS_KEY)) ?? {};
  map[projectId] = ref;
  await platform.storage.set(REPOS_KEY, map);
}
