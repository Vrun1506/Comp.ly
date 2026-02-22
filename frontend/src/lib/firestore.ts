// Firestore query helpers

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Workspace,
  Scan,
  Finding,
  FixPlan,
  PullRequest,
  Repo,
  AgentLog,
  Consultancy,
  WorkspaceDocument,
} from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively convert Firestore Timestamps to ISO strings */
function normalizeData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Timestamp) {
      result[k] = v.toDate().toISOString();
    } else if (v !== null && typeof v === "object" && "seconds" in v && "nanoseconds" in v) {
      result[k] = new Date((v as any).seconds * 1000).toISOString();
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      result[k] = normalizeData(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

/** Map a Firestore DocumentSnapshot to a typed record with id */
function fromDoc<T>(snap: DocumentSnapshot): T {
  return { ...normalizeData(snap.data()!), id: snap.id } as unknown as T;
}

// ─── Consultancy ──────────────────────────────────────────────────────────────

export async function getConsultancy(id: string): Promise<Consultancy | null> {
  const snap = await getDoc(doc(db, "consultancies", id));
  if (!snap.exists()) return null;
  return fromDoc<Consultancy>(snap);
}

export async function createConsultancy(
  name: string,
  createdBy: string
): Promise<string> {
  const ref = await addDoc(collection(db, "consultancies"), {
    name,
    createdBy,
    plan: "hackathon",
    createdAt: serverTimestamp(),
  });
  // Update user with consultancyId FIRST so security rules pass on member write
  await updateDoc(doc(db, "users", createdBy), { consultancyId: ref.id, role: "owner" });
  // Now add owner to members subcollection (rule: userConsultancyId() == consultancyId)
  await setDoc(doc(db, "consultancies", ref.id, "members", createdBy), {
    role: "owner",
    joinedAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── Workspaces ───────────────────────────────────────────────────────────────

export async function listWorkspaces(consultancyId: string): Promise<Workspace[]> {
  const q = query(
    collection(db, "workspaces"),
    where("consultancyId", "==", consultancyId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc<Workspace>(d));
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const snap = await getDoc(doc(db, "workspaces", id));
  if (!snap.exists()) return null;
  return fromDoc<Workspace>(snap);
}

export async function createWorkspace(
  data: Omit<Workspace, "id" | "createdAt" | "status">
): Promise<string> {
  const ref = await addDoc(collection(db, "workspaces"), {
    ...data,
    status: "active",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWorkspace(
  id: string,
  data: Partial<Pick<Workspace, "clientName" | "clientIndustry" | "complianceFrameworks" | "cloudProvider" | "infrastructureType" | "status">>
): Promise<void> {
  await updateDoc(doc(db, "workspaces", id), data);
}

// ─── Repos ────────────────────────────────────────────────────────────────────

export async function listRepos(workspaceId: string): Promise<Repo[]> {
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "repos")
  );
  return snap.docs.map((d) => fromDoc<Repo>(d));
}

// ─── Scans ────────────────────────────────────────────────────────────────────

export async function listScans(workspaceId: string): Promise<Scan[]> {
  const q = query(
    collection(db, "workspaces", workspaceId, "scans"),
    orderBy("startedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc<Scan>(d));
}

export async function getScan(
  workspaceId: string,
  scanId: string
): Promise<Scan | null> {
  const snap = await getDoc(
    doc(db, "workspaces", workspaceId, "scans", scanId)
  );
  if (!snap.exists()) return null;
  return fromDoc<Scan>(snap);
}

// ─── Findings ─────────────────────────────────────────────────────────────────

export async function listFindings(
  workspaceId: string,
  scanId: string
): Promise<Finding[]> {
  const q = query(
    collection(db, "workspaces", workspaceId, "scans", scanId, "findings"),
    orderBy("severity", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc<Finding>(d));
}

// ─── Fix Plans ────────────────────────────────────────────────────────────────

export async function listPlans(
  workspaceId: string,
  scanId: string
): Promise<FixPlan[]> {
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "scans", scanId, "plans")
  );
  return snap.docs.map((d) => fromDoc<FixPlan>(d));
}

export async function approvePlan(
  workspaceId: string,
  scanId: string,
  planId: string,
  approvedBy: string
): Promise<void> {
  await updateDoc(
    doc(db, "workspaces", workspaceId, "scans", scanId, "plans", planId),
    {
      approved: true,
      approvedBy,
      approvedAt: serverTimestamp(),
    }
  );
}

// ─── Pull Requests ────────────────────────────────────────────────────────────

export async function listPullRequests(
  workspaceId: string,
  scanId: string
): Promise<PullRequest[]> {
  const snap = await getDocs(
    collection(db, "workspaces", workspaceId, "scans", scanId, "pullRequests")
  );
  return snap.docs.map((d) => fromDoc<PullRequest>(d));
}

// ─── Agent Logs ───────────────────────────────────────────────────────────────

export async function listAgentLogs(
  workspaceId: string,
  scanId: string
): Promise<AgentLog[]> {
  const q = query(
    collection(db, "workspaces", workspaceId, "scans", scanId, "agentLogs"),
    orderBy("startedAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc<AgentLog>(d));
}

// ─── Workspace Documents ──────────────────────────────────────────────────────

export async function listDocuments(
  workspaceId: string
): Promise<WorkspaceDocument[]> {
  const q = query(
    collection(db, "workspaces", workspaceId, "documents"),
    orderBy("uploadedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc<WorkspaceDocument>(d));
}

export async function addDocument(
  workspaceId: string,
  data: Omit<WorkspaceDocument, "id" | "uploadedAt">
): Promise<string> {
  const docRef = await addDoc(
    collection(db, "workspaces", workspaceId, "documents"),
    { ...data, uploadedAt: serverTimestamp() }
  );
  return docRef.id;
}

export async function removeDocument(
  workspaceId: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, "workspaces", workspaceId, "documents", docId));
}
