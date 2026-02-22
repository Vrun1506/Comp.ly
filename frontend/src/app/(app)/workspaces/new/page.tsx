"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createWorkspace } from "@/lib/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  ComplianceFramework,
  CloudProvider,
  InfrastructureType,
} from "@/types";

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

export default function NewWorkspacePage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    clientName:          "",
    clientIndustry:      "",
    complianceFrameworks: [] as ComplianceFramework[],
    cloudProvider:       "" as CloudProvider | "",
    infrastructureType:  "" as InfrastructureType | "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function toggleFramework(fw: ComplianceFramework) {
    setForm((f) => ({
      ...f,
      complianceFrameworks: f.complianceFrameworks.includes(fw)
        ? f.complianceFrameworks.filter((x) => x !== fw)
        : [...f.complianceFrameworks, fw],
    }));
    setErrors((e) => ({ ...e, complianceFrameworks: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.clientName.trim()) errs.clientName = "Required";
    if (!form.clientIndustry.trim()) errs.clientIndustry = "Required";
    if (form.complianceFrameworks.length === 0) errs.complianceFrameworks = "Select at least one";
    if (!form.cloudProvider) errs.cloudProvider = "Required";
    if (!form.infrastructureType) errs.infrastructureType = "Required";
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (!userProfile) return;
    setLoading(true);
    try {
      const id = await createWorkspace({
        consultancyId:        userProfile.consultancyId,
        clientName:           form.clientName.trim(),
        clientIndustry:       form.clientIndustry.trim(),
        complianceFrameworks: form.complianceFrameworks,
        cloudProvider:        form.cloudProvider as CloudProvider,
        infrastructureType:   form.infrastructureType as InfrastructureType,
        createdBy:            userProfile.uid,
      });
      router.replace(`/workspaces/${id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/workspaces"
        className="inline-flex items-center gap-2 text-sm text-warm-grey-500 hover:text-warm-grey-700 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to workspaces
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-warm-brown-100 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-warm-brown-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-warm-grey-900">New Workspace</h1>
          <p className="text-sm text-warm-grey-500">
            One workspace = one client compliance project
          </p>
        </div>
      </div>

      <Card>
        <div className="space-y-5">
          <Input
            label="Client name"
            placeholder="e.g. Acme Bank"
            value={form.clientName}
            onChange={(e) => update("clientName", e.target.value)}
            error={errors.clientName}
          />
          <Input
            label="Industry"
            placeholder="e.g. Financial Services"
            value={form.clientIndustry}
            onChange={(e) => update("clientIndustry", e.target.value)}
            error={errors.clientIndustry}
          />

          {/* Multi-select compliance frameworks */}
          <div>
            <label className="label">Compliance frameworks</label>
            <p className="text-xs text-warm-grey-400 mb-2">Select all that apply</p>
            <div className="grid grid-cols-2 gap-2">
              {FRAMEWORK_OPTIONS.map((fw) => {
                const active = form.complianceFrameworks.includes(fw.value);
                return (
                  <button
                    key={fw.value}
                    type="button"
                    onClick={() => toggleFramework(fw.value)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      active
                        ? "border-warm-brown-400 bg-warm-brown-50"
                        : "border-warm-grey-200 bg-white hover:border-warm-grey-300"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      active ? "bg-warm-brown-500 border-warm-brown-500" : "border-warm-grey-300"
                    )}>
                      {active && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", active ? "text-warm-brown-700" : "text-warm-grey-800")}>
                        {fw.label}
                      </p>
                      <p className="text-xs text-warm-grey-400">{fw.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.complianceFrameworks && (
              <p className="text-xs text-red-500 mt-1.5">{errors.complianceFrameworks}</p>
            )}
          </div>
          <Select
            label="Primary cloud provider"
            options={CLOUD_OPTIONS}
            value={form.cloudProvider}
            onChange={(e) => update("cloudProvider", e.target.value)}
            error={errors.cloudProvider}
          />
          <Select
            label="Infrastructure type"
            options={INFRA_OPTIONS}
            value={form.infrastructureType}
            onChange={(e) => update("infrastructureType", e.target.value)}
            error={errors.infrastructureType}
          />

          <div className="pt-2 flex gap-3">
            <Button loading={loading} onClick={handleSubmit} className="flex-1">
              Create workspace
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
