"""Pydantic request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class ComplianceFramework(str, Enum):
    GDPR    = "GDPR"
    DORA    = "DORA"
    ISO27001 = "ISO27001"
    SOC2    = "SOC2"
    HIPAA   = "HIPAA"
    PCI_DSS = "PCI-DSS"


class CloudProvider(str, Enum):
    AWS          = "AWS"
    AZURE        = "Azure"
    GCP          = "GCP"
    MULTI_CLOUD  = "Multi-Cloud"


class InfrastructureType(str, Enum):
    TERRAFORM       = "Terraform"
    KUBERNETES      = "Kubernetes"
    CLOUDFORMATION  = "CloudFormation"
    MIXED           = "Mixed"


class Severity(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"


# ─── Consultancy ─────────────────────────────────────────────────────────────

class CreateConsultancyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class ConsultancyResponse(BaseModel):
    id: str
    name: str
    created_by: str
    plan: str
    created_at: str


# ─── Workspace ───────────────────────────────────────────────────────────────

class CreateWorkspaceRequest(BaseModel):
    client_name:           str              = Field(..., min_length=1)
    client_industry:       str              = Field(..., min_length=1)
    compliance_frameworks: List[ComplianceFramework] = Field(..., min_length=1)
    cloud_provider:        CloudProvider
    infrastructure_type:   InfrastructureType


class WorkspaceResponse(BaseModel):
    id: str
    consultancy_id: str
    client_name: str
    client_industry: str
    compliance_frameworks: List[str]
    cloud_provider: str
    infrastructure_type: str
    status: str
    created_by: str
    created_at: str


# ─── GitHub ───────────────────────────────────────────────────────────────────

class GitHubConnectRequest(BaseModel):
    code: str
    redirect_uri: str


class ConnectRepoRequest(BaseModel):
    full_name:      str
    default_branch: str = "main"


# ─── Scan ─────────────────────────────────────────────────────────────────────

class TriggerScanRequest(BaseModel):
    repo_id: str


class ScanSummary(BaseModel):
    total_findings: int = 0
    p0: int = 0
    p1: int = 0
    p2: int = 0


class ScanResponse(BaseModel):
    id: str
    repo_id: str
    commit_sha: str
    status: str
    triggered_by: str
    started_at: str
    completed_at: Optional[str] = None
    summary: Optional[ScanSummary] = None


# ─── Finding ─────────────────────────────────────────────────────────────────

class FindingSchema(BaseModel):
    severity:       Severity
    rule_id:        str
    regulation_ref: str
    title:          str
    description:    str
    file_path:      str
    line_start:     int
    line_end:       int
    evidence:       str
    confidence:     float


# ─── Fix Plan ─────────────────────────────────────────────────────────────────

class ApprovePlanResponse(BaseModel):
    plan_id: str
    approved: bool
    approved_by: str


# ─── Pull Request ─────────────────────────────────────────────────────────────

class PullRequestResponse(BaseModel):
    id: str
    branch_name: str
    github_pr_number: int
    github_pr_url: str
    status: str
    created_at: str
