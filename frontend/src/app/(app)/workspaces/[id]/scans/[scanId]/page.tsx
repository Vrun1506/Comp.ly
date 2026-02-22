"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getScan, listFindings, listPlans, approvePlan } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Scan, Finding, FixPlan } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileCode,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn, severityColor, scanStatusColor, timeAgo } from "@/lib/utils";

function FindingCard({
  finding,
  plan,
  onApprove,
  approvingId,
}: {
  finding: Finding;
  plan?: FixPlan;
  onApprove: (planId: string) => void;
  approvingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-warm-grey-200 rounded-xl bg-white overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-warm-grey-50 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={severityColor(finding.severity)}>{finding.severity}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-warm-grey-900 text-sm">{finding.title}</p>
          <p className="text-xs text-warm-grey-400 mt-0.5 font-mono truncate">
            {finding.filePath}:{finding.lineStart}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="default">{finding.regulationRef}</Badge>
          {plan?.approved && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-warm-grey-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-warm-grey-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-warm-grey-100">
          <div className="pt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-warm-grey-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-warm-grey-700">{finding.description}</p>
            </div>

            {finding.evidence && (
              <div>
                <p className="text-xs font-semibold text-warm-grey-500 uppercase tracking-wide mb-1">
                  Evidence
                </p>
                <pre className="text-xs bg-warm-grey-50 border border-warm-grey-200 rounded-lg p-3 overflow-x-auto font-mono text-warm-grey-800 whitespace-pre-wrap">
                  {finding.evidence}
                </pre>
              </div>
            )}

            {plan && (
              <div className="bg-warm-brown-50 border border-warm-brown-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-warm-brown-800">
                    Fix Plan
                  </p>
                  {plan.approved ? (
                    <Badge variant="success">Approved</Badge>
                  ) : (
                    <Button
                      size="sm"
                      loading={approvingId === plan.id}
                      onClick={() => onApprove(plan.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Plan
                    </Button>
                  )}
                </div>
                <p className="text-sm text-warm-brown-700">{plan.planText}</p>
                {plan.targetFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.targetFiles.map((f) => (
                      <span key={f} className="inline-flex items-center gap-1 text-xs bg-warm-brown-100 text-warm-brown-700 px-2 py-0.5 rounded-full font-mono">
                        <FileCode className="w-3 h-3" />{f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanDetailPage() {
  const { id: workspaceId, scanId } = useParams<{ id: string; scanId: string }>();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [scan, setScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [plans, setPlans] = useState<FixPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"findings">("findings");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "P0" | "P1" | "P2">("ALL");

  useEffect(() => {
    fetchAll();
    // Poll if running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, scanId]);

  useEffect(() => {
    if (scan?.status === "running" || scan?.status === "queued") {
      const interval = setInterval(fetchAll, 3000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan?.status]);

  async function fetchAll() {
    const [s, f, p] = await Promise.all([
      getScan(workspaceId, scanId),
      listFindings(workspaceId, scanId),
      listPlans(workspaceId, scanId),
    ]);
    setScan(s);
    setFindings(f);
    setPlans(p);
    setLoading(false);
  }

  async function handleApprove(planId: string) {
    if (!userProfile) return;
    setApprovingId(planId);
    await approvePlan(workspaceId, scanId, planId, userProfile.uid);
    await fetchAll();
    setApprovingId(null);
  }

  const filteredFindings =
    severityFilter === "ALL"
      ? findings
      : findings.filter((f) => f.severity === severityFilter);

  const approvedCount = plans.filter((p) => p.approved).length;
  const allApproved = plans.length > 0 && approvedCount === plans.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-warm-brown-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href={`/workspaces/${workspaceId}`}
        className="inline-flex items-center gap-2 text-sm text-warm-grey-500 hover:text-warm-grey-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to workspace
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-warm-grey-900">Scan Results</h1>
            {scan && (
              <span
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  scanStatusColor(scan.status)
                )}
              >
                {scan.status}
                {(scan.status === "running" || scan.status === "queued") && (
                  <Loader2 className="w-3 h-3 animate-spin inline ml-1" />
                )}
              </span>
            )}
          </div>
          {scan && (
            <p className="text-sm text-warm-grey-400 font-mono">
              {scan.commitSha.slice(0, 7)} &middot; {timeAgo(scan.startedAt)}
            </p>
          )}
        </div>


      </div>

      {/* Summary pills */}
      {scan?.summary && (
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">{scan.summary.p0} P0</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-700">{scan.summary.p1} P1</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">{scan.summary.p2} P2</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg ml-auto">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              {approvedCount}/{plans.length} plans approved
            </span>
          </div>
        </div>
      )}



      {/* Findings Tab */}
      {tab === "findings" && (
        <div>
          {findings.length > 0 && (
            <div className="flex gap-2 mb-4">
              {(["ALL", "P0", "P1", "P2"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    severityFilter === s
                      ? "bg-warm-brown-100 text-warm-brown-700"
                      : "bg-warm-grey-100 text-warm-grey-600 hover:bg-warm-grey-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {filteredFindings.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <p className="text-warm-grey-500 text-sm">
                {findings.length === 0
                  ? "No findings yet. Scan may still be running."
                  : "No findings match this filter."}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredFindings.map((finding) => {
                const plan = plans.find((p) => p.findingId === finding.id);
                return (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    plan={plan}
                    onApprove={handleApprove}
                    approvingId={approvingId}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}


    </div>
  );
}
