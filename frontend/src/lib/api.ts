// Axios instance pre-configured with Firebase ID token

import axios from "axios";
import { getIdToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Consultancy ──────────────────────────────────────────────────────────────

export const consultancyApi = {
  create: (name: string) => api.post("/consultancies", { name }),
};

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaceApi = {
  list:   () => api.get("/workspaces"),
  get:    (id: string) => api.get(`/workspaces/${id}`),
  create: (data: Record<string, unknown>) => api.post("/workspaces", data),
};

// ─── GitHub ───────────────────────────────────────────────────────────────────

export const githubApi = {
  connectOAuth: (workspaceId: string, code: string, redirectUri: string) =>
    api.post(`/workspaces/${workspaceId}/github/connect`, { code, redirect_uri: redirectUri }),
  listRepos: (workspaceId: string) =>
    api.get(`/workspaces/${workspaceId}/github/repos`),
  connectRepo: (workspaceId: string, fullName: string, defaultBranch: string) =>
    api.post(`/workspaces/${workspaceId}/repos`, { full_name: fullName, default_branch: defaultBranch }),
};

// ─── Scans ────────────────────────────────────────────────────────────────────

export const scanApi = {
  trigger: (workspaceId: string, repoId: string) =>
    api.post(`/workspaces/${workspaceId}/scans`, { repoId }),
  get: (workspaceId: string, scanId: string) =>
    api.get(`/workspaces/${workspaceId}/scans/${scanId}`),
};

// ─── Plans ────────────────────────────────────────────────────────────────────

export const planApi = {
  approve: (workspaceId: string, scanId: string, planId: string) =>
    api.post(
      `/workspaces/${workspaceId}/scans/${scanId}/plans/${planId}/approve`
    ),
};

// ─── Pull Requests ────────────────────────────────────────────────────────────

export const prApi = {
  create: (workspaceId: string, scanId: string) =>
    api.post(`/workspaces/${workspaceId}/scans/${scanId}/pull-request`),
};

export default api;
