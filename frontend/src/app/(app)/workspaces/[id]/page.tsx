"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getWorkspace, listRepos, listScans, updateWorkspace, listDocuments, addDocument, removeDocument } from "@/lib/firestore";
import { uploadWorkspaceDocument, deleteStorageFile } from "@/lib/storage";
import { githubApi, scanApi } from "@/lib/api";
import type { Workspace, Repo, Scan, ComplianceFramework, CloudProvider, InfrastructureType, WorkspaceDocument } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Github,
  ScanSearch,
  Plus,
  ExternalLink,
  CheckCircle2,
  Loader2,
  GitBranch,
  Clock,
  AlertTriangle,
  Pencil,
  X,
  FileText,
  Upload,
  Trash2,
  Paperclip,
} from "lucide-react";
import { timeAgo, scanStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FRAMEWORK_OPTIONS: { value: ComplianceFramework; label: string; desc: string }[] = [
  { value: "GDPR",    label: "GDPR",     desc: "EU General Data Protection Regulation" },
  { value: "DORA",    label: "DORA",     desc: "Digital Operational Resilience Act" },
  { value: "ISO27001", label: "ISO 27001", desc: "Information Security Management" },
  { value: "SOC2",    label: "SOC 2",    desc: "Service Organization Controls" },
  { value: "HIPAA",   label: "HIPAA",    desc: "Health Data Privacy Act" },
  { value: "PCI-DSS", label: "PCI-DSS",  desc: "Payment Card Industry Standard" },
];

const CLOUD_OPTIONS: { value: CloudProvider; label: string }[] = [
  { value: "AWS",        label: "Amazon Web Services" },
  { value: "Azure",      label: "Microsoft Azure" },
  { value: "GCP",        label: "Google Cloud Platform" },
  { value: "Multi-Cloud", label: "Multi-Cloud" },
];

const INFRA_OPTIONS: { value: InfrastructureType; label: string }[] = [
  { value: "Terraform",      label: "Terraform / OpenTofu" },
  { value: "Kubernetes",     label: "Kubernetes" },
  { value: "CloudFormation", label: "AWS CloudFormation" },
  { value: "Mixed",          label: "Mixed" },
];

interface EditModalProps {
  workspace: Workspace;
  onClose: () => void;
  onSaved: (updated: Workspace) => void;
}

function EditWorkspaceModal({ workspace, onClose, onSaved }: EditModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName:          workspace.clientName,
    clientIndustry:      workspace.clientIndustry,
    complianceFrameworks: workspace.complianceFrameworks ?? [] as ComplianceFramework[],
    cloudProvider:       workspace.cloudProvider,
    infrastructureType:  workspace.infrastructureType,
    status:              workspace.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggleFramework(fw: ComplianceFramework) {
    setForm((f) => ({
      ...f,
      complianceFrameworks: f.complianceFrameworks.includes(fw)
        ? f.complianceFrameworks.filter((x) => x !== fw)
        : [...f.complianceFrameworks, fw],
    }));
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.clientName.trim()) errs.clientName = "Required";
    if (!form.clientIndustry.trim()) errs.clientIndustry = "Required";
    if (form.complianceFrameworks.length === 0) errs.complianceFrameworks = "Select at least one";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      await updateWorkspace(workspace.id, form);
      onSaved({ ...workspace, ...form });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-warm-grey-900 text-lg">Edit workspace</h2>
          <button onClick={onClose} className="text-warm-grey-400 hover:text-warm-grey-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Client name */}
          <div>
            <label className="label">Client name</label>
            <input className="input" value={form.clientName}
              onChange={(e) => { setForm((f) => ({ ...f, clientName: e.target.value })); setErrors((er) => ({ ...er, clientName: "" })); }} />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
          </div>

          {/* Industry */}
          <div>
            <label className="label">Industry</label>
            <input className="input" value={form.clientIndustry}
              onChange={(e) => { setForm((f) => ({ ...f, clientIndustry: e.target.value })); setErrors((er) => ({ ...er, clientIndustry: "" })); }} />
            {errors.clientIndustry && <p className="text-xs text-red-500 mt-1">{errors.clientIndustry}</p>}
          </div>

          {/* Frameworks */}
          <div>
            <label className="label">Compliance frameworks</label>
            <p className="text-xs text-warm-grey-400 mb-2">Select all that apply</p>
            <div className="grid grid-cols-2 gap-2">
              {FRAMEWORK_OPTIONS.map((fw) => {
                const active = form.complianceFrameworks.includes(fw.value);
                return (
                  <button key={fw.value} type="button" onClick={() => toggleFramework(fw.value)}
                    className={cn("flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      active ? "border-warm-brown-400 bg-warm-brown-50" : "border-warm-grey-200 bg-white hover:border-warm-grey-300"
                    )}>
                    <div className={cn("mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      active ? "bg-warm-brown-500 border-warm-brown-500" : "border-warm-grey-300")}>
                      {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", active ? "text-warm-brown-700" : "text-warm-grey-800")}>{fw.label}</p>
                      <p className="text-xs text-warm-grey-400">{fw.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.complianceFrameworks && <p className="text-xs text-red-500 mt-1.5">{errors.complianceFrameworks}</p>}
          </div>

          {/* Cloud provider */}
          <div>
            <label className="label">Primary cloud provider</label>
            <select className="input" value={form.cloudProvider}
              onChange={(e) => setForm((f) => ({ ...f, cloudProvider: e.target.value as CloudProvider }))}>
              {CLOUD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Infrastructure type */}
          <div>
            <label className="label">Infrastructure type</label>
            <select className="input" value={form.infrastructureType}
              onChange={(e) => setForm((f) => ({ ...f, infrastructureType: e.target.value as InfrastructureType }))}>
              {INFRA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "active" | "archived" }))}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={saving} onClick={handleSave}>Save changes</Button>
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [githubRepos, setGithubRepos] = useState<{ full_name: string; default_branch: string }[]>([]);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [connectingRepo, setConnectingRepo] = useState(false);
  const [tab, setTab] = useState<"overview" | "repos" | "scans" | "documents">("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [githubBanner, setGithubBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const status = searchParams.get("github");
    if (!status) return;
    // Clean the URL without refreshing
    router.replace(`/workspaces/${id}`, { scroll: false });
    if (status === "connected") {
      setGithubBanner({ type: "success", message: "GitHub connected! Loading your repositories…" });
      // Refetch workspace so githubUsername is visible immediately (hides the button)
      getWorkspace(id).then(setWorkspace).catch(() => {});
      handleFetchGitHubRepos();
    } else if (status === "error") {
      const reason = searchParams.get("reason") ?? "OAuth exchange failed";
      setGithubBanner({ type: "error", message: `GitHub connection failed: ${reason}` });
      console.error("[GitHub OAuth] failure reason:", reason);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function fetchAll() {
    setLoading(true);
    const [ws, r, s, docs] = await Promise.all([
      getWorkspace(id),
      listRepos(id),
      listScans(id),
      listDocuments(id),
    ]);
    setWorkspace(ws);
    setRepos(r);
    setScans(s);
    setDocuments(docs);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    // reset input so the same file can be re-selected
    e.target.value = "";

    setUploadProgress(0);
    try {
      const { downloadURL, storagePath } = await uploadWorkspaceDocument(
        id,
        file,
        ({ progress }) => setUploadProgress(Math.round(progress))
      );
      const docId = await addDocument(id, {
        name: file.name,
        storagePath,
        downloadURL,
        size: file.size,
        contentType: file.type || "application/octet-stream",
        uploadedBy: firebaseUser.uid,
      });
      setDocuments((prev) => [
        {
          id: docId,
          name: file.name,
          storagePath,
          downloadURL,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          uploadedBy: firebaseUser.uid,
          uploadedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleDeleteDocument(document: WorkspaceDocument) {
    setDeletingDocId(document.id);
    try {
      await Promise.all([
        deleteStorageFile(document.storagePath),
        removeDocument(id, document.id),
      ]);
      setDocuments((prev) => prev.filter((d) => d.id !== document.id));
    } finally {
      setDeletingDocId(null);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleConnectGitHub() {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;
    const redirect = `${window.location.origin}/api/github/callback`;
    const state = encodeURIComponent(JSON.stringify({ workspaceId: id }));
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&scope=repo&state=${state}`;
  }

  async function handleFetchGitHubRepos() {
    setConnectingRepo(true);
    try {
      const res = await githubApi.listRepos(id);
      setGithubRepos(res.data.repos);
      setShowRepoSelector(true);
    } finally {
      setConnectingRepo(false);
    }
  }

  async function handleConnectRepo(fullName: string, defaultBranch: string) {
    await githubApi.connectRepo(id, fullName, defaultBranch);
    setShowRepoSelector(false);
    fetchAll();
  }

  async function handleTriggerScan(repoId: string) {
    setScanning(repoId);
    try {
      await scanApi.trigger(id, repoId);
      await fetchAll();
    } finally {
      setScanning(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-warm-brown-500" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <p className="text-warm-grey-500">Workspace not found.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {showEditModal && workspace && (
        <EditWorkspaceModal
          workspace={workspace}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => { setWorkspace(updated); setShowEditModal(false); }}
        />
      )}
      {githubBanner && (
        <div className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-4 text-sm",
          githubBanner.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
        )}>
          <span>{githubBanner.message}</span>
          <button onClick={() => setGithubBanner(null)} className="text-current opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
      {/* Back */}
      <Link
        href="/workspaces"
        className="inline-flex items-center gap-2 text-sm text-warm-grey-500 hover:text-warm-grey-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All workspaces
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-warm-grey-900">
            {workspace.clientName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            {(workspace.complianceFrameworks ?? []).map((f) => (
              <Badge key={f} variant="info">{f}</Badge>
            ))}
            <Badge variant="default">{workspace.cloudProvider}</Badge>
            <Badge variant="default">{workspace.infrastructureType}</Badge>
            <Badge variant={workspace.status === "active" ? "success" : "default"}>
              {workspace.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          {!workspace?.githubUsername && (
            <Button variant="secondary" size="sm" onClick={handleConnectGitHub}>
              <Github className="w-4 h-4" /> Connect GitHub
            </Button>
          )}
          {repos.length > 0 && (
            <Button
              size="sm"
              onClick={() => handleTriggerScan(repos[0].id)}
              loading={!!scanning}
            >
              <ScanSearch className="w-4 h-4" /> Run Scan
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-warm-grey-200 mb-6">
        {(["overview", "repos", "scans", "documents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-warm-brown-500 text-warm-brown-600"
                : "border-transparent text-warm-grey-500 hover:text-warm-grey-700"
            )}
          >
            {t === "documents" ? (
              <span className="flex items-center gap-1.5">
                Documents
                {documents.length > 0 && (
                  <span className="text-xs bg-warm-grey-200 text-warm-grey-600 rounded-full px-1.5 py-0.5 leading-none">
                    {documents.length}
                  </span>
                )}
              </span>
            ) : t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold text-warm-grey-800 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              {[
                ["Client", workspace.clientName],
                ["Industry", workspace.clientIndustry],
                ["Frameworks", (workspace.complianceFrameworks ?? []).join(", ")],
                ["Cloud", workspace.cloudProvider],
                ["Infrastructure", workspace.infrastructureType],
                ["Created", timeAgo(workspace.createdAt)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-warm-grey-500">{label}</dt>
                  <dd className="font-medium text-warm-grey-800">{val}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold text-warm-grey-800 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-warm-grey-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-warm-grey-900">{repos.length}</p>
                <p className="text-xs text-warm-grey-500 mt-0.5">Repos</p>
              </div>
              <div className="bg-warm-grey-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-warm-grey-900">{scans.length}</p>
                <p className="text-xs text-warm-grey-500 mt-0.5">Scans</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-green-700">
                  {scans.filter((s) => s.status === "completed").length}
                </p>
                <p className="text-xs text-warm-grey-500 mt-0.5">Completed</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-semibold text-red-700">
                  {scans
                    .filter((s) => s.summary)
                    .reduce((acc, s) => acc + (s.summary?.p0 ?? 0), 0)}
                </p>
                <p className="text-xs text-warm-grey-500 mt-0.5">P0 Findings</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Repos Tab */}
      {tab === "repos" && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold text-warm-grey-800">Connected Repositories</h2>
            <Button size="sm" variant="secondary" onClick={handleFetchGitHubRepos} loading={connectingRepo}>
              <Plus className="w-4 h-4" /> Add Repo
            </Button>
          </div>

          {showRepoSelector && (
            <Card className="mb-4">
              <h3 className="font-medium text-warm-grey-800 mb-3">Select a repo to connect</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {githubRepos.map((r) => (
                  <button
                    key={r.full_name}
                    onClick={() => handleConnectRepo(r.full_name, r.default_branch)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-warm-grey-200 rounded-lg hover:border-warm-brown-400 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Github className="w-4 h-4 text-warm-grey-400" />
                      <span className="text-sm text-warm-grey-800">{r.full_name}</span>
                    </div>
                    <span className="text-xs text-warm-grey-400">{r.default_branch}</span>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setShowRepoSelector(false)}
              >
                Cancel
              </Button>
            </Card>
          )}

          {repos.length === 0 ? (
            <Card className="text-center py-12">
              <Github className="w-8 h-8 text-warm-grey-300 mx-auto mb-3" />
              <p className="text-warm-grey-500 text-sm">No repos connected</p>
              {!workspace?.githubUsername && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={handleConnectGitHub}
                >
                  Connect GitHub first
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between px-5 py-4 bg-white border border-warm-grey-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-warm-grey-500" />
                    <div>
                      <p className="font-medium text-warm-grey-900">{repo.fullName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-warm-grey-400">
                        <GitBranch className="w-3 h-3" /> {repo.defaultBranch}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={repo.isActive ? "success" : "default"}>
                      {repo.isActive ? "active" : "inactive"}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleTriggerScan(repo.id)}
                      loading={scanning === repo.id}
                    >
                      <ScanSearch className="w-3.5 h-3.5" /> Scan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {tab === "documents" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-warm-grey-800">Documents</h2>
            <label className="cursor-pointer">
              <input
                type="file"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={uploadProgress !== null}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.json,.yaml,.yml"
              />
              <span
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  uploadProgress !== null
                    ? "bg-warm-grey-100 text-warm-grey-400 cursor-not-allowed"
                    : "bg-warm-brown-500 text-white hover:bg-warm-brown-600"
                )}
              >
                {uploadProgress !== null ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading {uploadProgress}%</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload file</>
                )}
              </span>
            </label>
          </div>

          {/* Upload progress bar */}
          {uploadProgress !== null && (
            <div className="w-full bg-warm-grey-100 rounded-full h-1.5 mb-4">
              <div
                className="bg-warm-brown-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {documents.length === 0 && uploadProgress === null ? (
            <Card className="text-center py-12">
              <Paperclip className="w-8 h-8 text-warm-grey-300 mx-auto mb-3" />
              <p className="text-warm-grey-500 text-sm">No documents uploaded yet</p>
              <p className="text-warm-grey-400 text-xs mt-1">Upload PDFs, docs, or config files for this workspace</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between px-4 py-3 bg-white border border-warm-grey-200 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-warm-grey-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-warm-grey-900 truncate">{document.name}</p>
                      <p className="text-xs text-warm-grey-400">
                        {formatBytes(document.size)} &middot; {new Date(document.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <a
                      href={document.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-warm-grey-400 hover:text-warm-brown-600 hover:bg-warm-brown-50 transition-colors"
                      title="Download"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(document)}
                      disabled={deletingDocId === document.id}
                      className="p-1.5 rounded-lg text-warm-grey-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      {deletingDocId === document.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scans Tab */}
      {tab === "scans" && (
        <div>
          <h2 className="font-semibold text-warm-grey-800 mb-4">Scan History</h2>
          {scans.length === 0 ? (
            <Card className="text-center py-12">
              <ScanSearch className="w-8 h-8 text-warm-grey-300 mx-auto mb-3" />
              <p className="text-warm-grey-500 text-sm">No scans yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {scans.map((scan) => (
                <Link
                  key={scan.id}
                  href={`/workspaces/${id}/scans/${scan.id}`}
                  className="flex items-center justify-between px-5 py-4 bg-white border border-warm-grey-200 rounded-xl hover:border-warm-brown-300 hover:shadow-sm transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          scanStatusColor(scan.status)
                        )}
                      >
                        {scan.status}
                      </span>
                      <span className="text-xs font-mono text-warm-grey-400">
                        {scan.commitSha.slice(0, 7)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-warm-grey-400">
                      <Clock className="w-3 h-3" /> {timeAgo(scan.startedAt)}
                    </div>
                  </div>
                  {scan.summary && (
                    <div className="flex items-center gap-2">
                      <span className="badge-p0">{scan.summary.p0} P0</span>
                      <span className="badge-p1">{scan.summary.p1} P1</span>
                      <span className="badge-p2">{scan.summary.p2} P2</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
