```md
# Comply — Firebase Architecture Plan (Auth + Firestore + Storage)

This document defines the **clean rebuild architecture** for Comply using:

- Firebase Auth (Google login)
- Firestore (database)
- Firebase Storage (documents + artifacts)
- FastAPI (backend API + agents)
- Gemini API (LLM)
- GitHub OAuth (repo access)

We are **not using Miro for now**.
We are focusing on:
> Consultancy users → create client workspaces → connect GitHub → run compliance agents → approve fixes → create PR.

---

# 1. Core Product Model

## Mental Model

- A **User** logs in via Firebase Auth.
- A user belongs to a **Consultancy**.
- A consultancy creates **Workspaces**.
- Each workspace represents **one client**.
- Each workspace connects to **one GitHub repo** (or multiple).
- Agents scan repo → produce findings → produce fix plans → create PR.

---

# 2. Firestore Structure (Final)

We use **Firestore in Native Mode**.

All data must be scoped under a workspace to enforce isolation.

---

## Top-Level Collections

```

users/{uid}
consultancies/{consultancyId}
workspaces/{workspaceId}

```

---

# 3. Users

## `users/{uid}`

Created automatically after first login.

Fields:
- `uid`
- `email`
- `name`
- `photoURL`
- `consultancyId`
- `role` (owner/admin/member)
- `createdAt`
- `lastLoginAt`

---

# 4. Consultancy (Tenant Level)

## `consultancies/{consultancyId}`

Represents the consultancy organization (the paying entity).

Fields:
- `name`
- `createdBy` (uid)
- `plan` (`hackathon`)
- `createdAt`

Subcollection:
```

consultancies/{consultancyId}/members/{uid}

```

Fields:
- `role`
- `joinedAt`

---

# 5. Workspaces (One per Client)

Each workspace represents:
> “Compliance project for one client”

## `workspaces/{workspaceId}`

Fields:
- `consultancyId`
- `clientName`
- `clientIndustry`
- `complianceFramework` (e.g., DORA, GDPR, ISO27001)
- `status` (`active`, `archived`)
- `createdBy`
- `createdAt`

Indexes needed:
- `consultancyId + createdAt`

---

# 6. GitHub Integration

Each workspace connects to GitHub separately.

## `workspaces/{workspaceId}/integrations/github`

Fields:
- `mode` (`oauth` or `app`)
- `accessToken` (encrypted)
- `refreshToken`
- `expiresAt`
- `githubUsername`
- `connectedAt`

Important:
- Encrypt token before storing.
- Never expose to frontend.
- Backend only.

---

# 7. Repositories

## `workspaces/{workspaceId}/repos/{repoId}`

Fields:
- `fullName` (`org/repo`)
- `defaultBranch`
- `connectedAt`
- `isActive`

---

# 8. Scans

## `workspaces/{workspaceId}/scans/{scanId}`

Fields:
- `repoId`
- `commitSha`
- `status` (`queued`, `running`, `completed`, `failed`)
- `triggeredBy`
- `startedAt`
- `completedAt`
- `summary`:
  - `totalFindings`
  - `p0`
  - `p1`
  - `p2`

---

# 9. Findings (Violations)

## `workspaces/{workspaceId}/scans/{scanId}/findings/{findingId}`

Fields:
- `severity` (`P0`, `P1`, `P2`)
- `ruleId`
- `regulationRef`
- `title`
- `description`
- `filePath`
- `lineStart`
- `lineEnd`
- `evidence`
- `confidence`
- `createdAt`

Indexes:
- `severity`
- `ruleId`

---

# 10. Fix Plans

## `workspaces/{workspaceId}/scans/{scanId}/plans/{planId}`

Fields:
- `findingId`
- `planText`
- `targetFiles` (array)
- `approved` (boolean)
- `approvedBy`
- `approvedAt`
- `createdAt`

---

# 11. Pull Requests

## `workspaces/{workspaceId}/scans/{scanId}/pullRequests/{prId}`

Fields:
- `branchName`
- `githubPrNumber`
- `githubPrUrl`
- `status` (`open`, `merged`, `closed`)
- `createdAt`

---

# 12. Agent Run Logs

## `workspaces/{workspaceId}/scans/{scanId}/agentLogs/{logId}`

Fields:
- `agentName`
- `status`
- `inputSummary`
- `outputSummary`
- `startedAt`
- `completedAt`
- `errorMessage`

---

# 13. Firebase Storage Structure

Used for:
- Uploaded regulatory documents
- Generated compliance reports
- File snapshots (optional)

```

/workspaces/{workspaceId}/documents/{docId}.pdf
/workspaces/{workspaceId}/reports/{scanId}.pdf

```

Never store raw GitHub repos in Storage.
Always fetch from GitHub dynamically.

---

# 14. Required Agents (No Miro Agent)

Keep it minimal.

## 1. Repo Ingestor (Non-LLM)
- Pull IaC files from GitHub.
- Filter `.tf`, `.yaml`, `.yml`, `Dockerfile`.

## 2. Compliance Auditor (LLM)
Input:
- Files
- Ruleset JSON

Output:
- Structured findings array

## 3. Remediation Planner (LLM)
Input:
- Findings
- Regulatory context

Output:
- Fix plans per finding

## 4. Patch Generator (LLM)
Input:
- Approved plans
- Original file content

Output:
- Corrected file content

## Optional:
QA Re-Scanner (run auditor again after fixes)

---

# 15. Compliance Metadata Required Per Workspace

When creating a workspace, require:

- Client Name
- Industry
- Primary Cloud Provider (AWS/Azure/GCP)
- Infrastructure Type (Terraform/K8s/Mixed)
- Compliance Framework (GDPR/DORA/ISO27001/etc.)

Optional:
- Risk tolerance level
- Region (EU/US/etc.)

This allows your Auditor to adapt its rules.

---

# 16. Firestore Security Rules (Critical)

Users must only access:
- Their consultancy’s workspaces
- Their workspace scans
- Their own documents

Example logic:
- `request.auth.uid != null`
- `resource.data.consultancyId == getUserConsultancyId(request.auth.uid)`

Never trust frontend filtering.

---

# 17. Dummy Demo Project Plan

Create:
```

demo/sample-infra/

```

Include:
- Open S3 bucket
- No encryption
- Public security group
- Missing logging
- Privileged Kubernetes container

Then:

Demo flow:
1. Create workspace for “Acme Bank”
2. Connect GitHub
3. Select demo repo
4. Run scan
5. Show violations
6. Approve P0 findings
7. Create PR
8. Show PR URL

That’s the entire story.

---

# 18. Order of Implementation

1. Firebase Auth → backend verify token
2. Create consultancy on first login
3. Create workspace
4. GitHub OAuth connect
5. Repo select
6. Scan pipeline (even mocked first)
7. Approve plans
8. Create PR

---

# 19. What We Are NOT Building

- No multi-cloud infra scanning
- No Miro integration
- No billing system
- No RBAC complexity
- No SOC2-level audit logs
- No real-time streaming

Hackathon simplicity only.

---

# 20. Final Architecture Summary

User (Firebase Auth)
→ Consultancy
→ Workspace (per client)
→ Repo
→ Scan
→ Findings
→ Fix Plans
→ Pull Request

Firestore handles all persistence.
Storage handles documents.
FastAPI handles orchestration.
Gemini handles reasoning.

That’s clean.
That’s buildable.
That’s demoable.
```

If you want next, I can give you:

* Firestore index definitions
* Firestore security rule template
* FastAPI dependency pattern for workspace isolation
* Or how to encrypt GitHub tokens before storing in Firestore

