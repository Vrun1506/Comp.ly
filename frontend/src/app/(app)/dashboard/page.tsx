"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { listWorkspaces, listScans } from "@/lib/firestore";
import { createConsultancy } from "@/lib/firestore";
import type { Workspace, Scan } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FolderKanban,
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Building2,
} from "lucide-react";
import { timeAgo, scanStatusColor } from "@/lib/utils";

interface ConsultancyModalProps {
  userId: string;
  onCreated: () => void;
}

function ConsultancySetupModal({ userId, onCreated }: ConsultancyModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    await createConsultancy(name.trim(), userId);
    setLoading(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-warm-brown-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-warm-brown-600" />
          </div>
          <div>
            <h2 className="font-semibold text-warm-grey-900">Set up your consultancy</h2>
            <p className="text-sm text-warm-grey-500">One-time setup before you start</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Consultancy name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Acme Compliance Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button className="w-full" loading={loading} onClick={handleCreate}>
            Create consultancy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { userProfile, refetchProfile } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [recentScans, setRecentScans] = useState<{ scan: Scan; workspace: Workspace }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showConsultancyModal, setShowConsultancyModal] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    if (!userProfile.consultancyId) {
      setShowConsultancyModal(true);
      setLoadingData(false);
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  async function fetchData() {
    if (!userProfile?.consultancyId) return;
    setLoadingData(true);
    const ws = await listWorkspaces(userProfile.consultancyId);
    setWorkspaces(ws);

    // Fetch recent scans across all workspaces (max 3 each)
    const scanPairs: { scan: Scan; workspace: Workspace }[] = [];
    for (const w of ws.slice(0, 5)) {
      const scans = await listScans(w.id);
      scans.slice(0, 2).forEach((s) => scanPairs.push({ scan: s, workspace: w }));
    }
    scanPairs.sort(
      (a, b) =>
        new Date(b.scan.startedAt).getTime() - new Date(a.scan.startedAt).getTime()
    );
    setRecentScans(scanPairs.slice(0, 5));
    setLoadingData(false);
  }

  const totalFindings = workspaces.length;
  const activeWorkspaces = workspaces.filter((w) => w.status === "active").length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {showConsultancyModal && userProfile && (
        <ConsultancySetupModal
          userId={userProfile.uid}
          onCreated={async () => {
            setShowConsultancyModal(false);
            await refetchProfile();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-warm-grey-900">
            Good morning{userProfile?.name ? `, ${userProfile.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-warm-grey-500 mt-1">
            Here&apos;s an overview of your compliance projects.
          </p>
        </div>
        <Button onClick={() => router.push("/workspaces/new")}>
          <Plus className="w-4 h-4" /> New Workspace
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warm-brown-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-warm-brown-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-grey-900">{activeWorkspaces}</p>
              <p className="text-xs text-warm-grey-500">Active workspaces</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-grey-900">{recentScans.length}</p>
              <p className="text-xs text-warm-grey-500">Recent scans</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-warm-grey-900">
                {recentScans.filter((r) => r.scan.status === "completed").length}
              </p>
              <p className="text-xs text-warm-grey-500">Scans completed</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Workspaces */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-grey-800">Workspaces</h2>
            <Link
              href="/workspaces"
              className="text-sm text-warm-brown-600 hover:text-warm-brown-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-warm-grey-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : workspaces.length === 0 ? (
            <Card className="text-center py-10">
              <FolderKanban className="w-8 h-8 text-warm-grey-300 mx-auto mb-3" />
              <p className="text-warm-grey-500 text-sm">No workspaces yet</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => router.push("/workspaces/new")}
              >
                Create first workspace
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {workspaces.slice(0, 5).map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className="flex items-center justify-between px-4 py-3 bg-white border border-warm-grey-200 rounded-xl hover:border-warm-brown-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="font-medium text-warm-grey-900 text-sm">{ws.clientName}</p>
                    <p className="text-xs text-warm-grey-400 mt-0.5">
                      {ws.complianceFrameworks?.join(", ")} · {ws.cloudProvider}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ws.status === "active" ? "success" : "default"}>
                      {ws.status}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-warm-grey-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent scans */}
        <div className="col-span-2">
          <h2 className="font-semibold text-warm-grey-800 mb-4">Recent Scans</h2>

          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-warm-grey-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentScans.length === 0 ? (
            <Card className="text-center py-8">
              <ScanSearch className="w-7 h-7 text-warm-grey-300 mx-auto mb-2" />
              <p className="text-warm-grey-500 text-sm">No scans yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentScans.map(({ scan, workspace }) => (
                <Link
                  key={scan.id}
                  href={`/workspaces/${workspace.id}/scans/${scan.id}`}
                  className="block px-4 py-3 bg-white border border-warm-grey-200 rounded-xl hover:border-warm-brown-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-warm-grey-700 truncate">
                      {workspace.clientName}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${scanStatusColor(scan.status)}`}
                    >
                      {scan.status}
                    </span>
                  </div>
                  {scan.summary && (
                    <div className="flex gap-2 mt-1">
                      <span className="badge-p0">{scan.summary.p0} P0</span>
                      <span className="badge-p1">{scan.summary.p1} P1</span>
                    </div>
                  )}
                  <p className="text-xs text-warm-grey-400 mt-1">
                    {timeAgo(scan.startedAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
