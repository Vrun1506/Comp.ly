"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { listWorkspaces } from "@/lib/firestore";
import type { Workspace } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, FolderKanban, ArrowRight, Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function WorkspacesPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userProfile?.consultancyId) return;
    listWorkspaces(userProfile.consultancyId).then((ws) => {
      setWorkspaces(ws);
      setLoading(false);
    });
  }, [userProfile]);

  const filtered = workspaces.filter(
    (w) =>
      w.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (w.complianceFrameworks ?? []).some((f) =>
        f.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-warm-grey-900">Workspaces</h1>
          <p className="text-warm-grey-500 mt-1">
            Each workspace represents one client compliance project.
          </p>
        </div>
        <Button onClick={() => router.push("/workspaces/new")}>
          <Plus className="w-4 h-4" /> New Workspace
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey-400" />
        <input
          type="text"
          placeholder="Search workspaces…"
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-warm-grey-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <FolderKanban className="w-10 h-10 text-warm-grey-300 mx-auto mb-4" />
          <h3 className="font-semibold text-warm-grey-700 mb-1">
            {search ? "No results found" : "No workspaces yet"}
          </h3>
          <p className="text-sm text-warm-grey-400 mb-6">
            {search
              ? "Try a different search term."
              : "Create your first workspace to start scanning."}
          </p>
          {!search && (
            <Button onClick={() => router.push("/workspaces/new")}>
              <Plus className="w-4 h-4" /> Create workspace
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="flex items-center justify-between p-5 bg-white border border-warm-grey-200 rounded-xl hover:border-warm-brown-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-warm-brown-100 rounded-lg flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5 text-warm-brown-600" />
                </div>
                <div>
                  <p className="font-semibold text-warm-grey-900">{ws.clientName}</p>
                  <p className="text-sm text-warm-grey-500 mt-0.5">
                    {ws.clientIndustry} &middot; {(ws.complianceFrameworks ?? []).join(", ")} &middot; {ws.cloudProvider}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Badge variant={ws.status === "active" ? "success" : "default"}>
                    {ws.status}
                  </Badge>
                  <p className="text-xs text-warm-grey-400 mt-1">
                    {timeAgo(ws.createdAt)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-warm-grey-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
