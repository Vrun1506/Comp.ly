// ─── Auth / User Types ────────────────────────────────────────────────────────

export interface User {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  consultancyId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  lastLoginAt: string;
}

// ─── Consultancy ──────────────────────────────────────────────────────────────

export interface Consultancy {
  id: string;
  name: string;
  createdBy: string;
  plan: "hackathon";
  createdAt: string;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export type ComplianceFramework = "GDPR" | "DORA" | "ISO27001" | "SOC2" | "HIPAA" | "PCI-DSS";
export type CloudProvider = "AWS" | "Azure" | "GCP" | "Multi-Cloud";
export type InfrastructureType = "Terraform" | "Kubernetes" | "Mixed" | "CloudFormation";

export interface Workspace {
  id: string;
  consultancyId: string;
  clientName: string;
  clientIndustry: string;
  complianceFrameworks: ComplianceFramework[];
  cloudProvider: CloudProvider;
  infrastructureType: InfrastructureType;
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  githubUsername?: string;
}

// ─── GitHub Integration ───────────────────────────────────────────────────────

export interface GitHubIntegration {
  mode: "oauth" | "app";
  githubUsername: string;
  connectedAt: string;
  // accessToken is never exposed to frontend
}

// ─── Repository ───────────────────────────────────────────────────────────────

export interface Repo {
  id: string;
  fullName: string;
  defaultBranch: string;
  connectedAt: string;
  isActive: boolean;
}

// ─── Scan ─────────────────────────────────────────────────────────────────────

export type ScanStatus = "queued" | "running" | "completed" | "failed";

export interface ScanSummary {
  totalFindings: number;
  p0: number;
  p1: number;
  p2: number;
}

export interface Scan {
  id: string;
  repoId: string;
  commitSha: string;
  status: ScanStatus;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  summary?: ScanSummary;
}

// ─── Finding ──────────────────────────────────────────────────────────────────

export type Severity = "P0" | "P1" | "P2";

export interface Finding {
  id: string;
  severity: Severity;
  ruleId: string;
  regulationRef: string;
  title: string;
  description: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  evidence: string;
  confidence: number;
  createdAt: string;
}

// ─── Fix Plan ─────────────────────────────────────────────────────────────────

export interface FixPlan {
  id: string;
  findingId: string;
  planText: string;
  targetFiles: string[];
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

// ─── Pull Request ─────────────────────────────────────────────────────────────

export type PRStatus = "open" | "merged" | "closed";

export interface PullRequest {
  id: string;
  branchName: string;
  githubPrNumber: number;
  githubPrUrl: string;
  status: PRStatus;
  createdAt: string;
}

// ─── Agent Log ────────────────────────────────────────────────────────────────

export interface AgentLog {
  id: string;
  agentName: string;
  status: "running" | "success" | "error";
  inputSummary: string;
  outputSummary: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

// ─── Workspace Documents ──────────────────────────────────────────────────────

export interface WorkspaceDocument {
  id: string;
  name: string;
  storagePath: string;
  downloadURL: string;
  size: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
  code?: string;
}
