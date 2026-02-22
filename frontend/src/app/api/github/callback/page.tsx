"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { githubApi } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function GitHubCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      router.replace("/workspaces");
      return;
    }

    let workspaceId: string;
    try {
      workspaceId = JSON.parse(state).workspaceId;
    } catch {
      router.replace("/workspaces");
      return;
    }

    const redirectUri = `${window.location.origin}/api/github/callback`;

    githubApi
      .connectOAuth(workspaceId, code, redirectUri)
      .then(() => {
        router.replace(`/workspaces/${workspaceId}?github=connected`);
      })
      .catch((err) => {
        const rawDetail = err?.response?.data?.detail ?? err?.message ?? "unknown";
        const detail = typeof rawDetail === "string" ? rawDetail : JSON.stringify(rawDetail);
        console.error("[GitHub OAuth] connect failed:", detail, err?.response?.data);
        router.replace(`/workspaces/${workspaceId}?github=error&reason=${encodeURIComponent(detail)}`);
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-warm-brown-500 mx-auto mb-4" />
        <p className="text-warm-grey-600">Connecting GitHub…</p>
      </div>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense>
      <GitHubCallbackInner />
    </Suspense>
  );
}
