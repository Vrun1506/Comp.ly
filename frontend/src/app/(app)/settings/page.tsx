"use client";

import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, Shield, Building2 } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  const { userProfile, firebaseUser } = useAuth();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-warm-grey-900 mb-8">Settings</h1>

      {/* Profile */}
      <Card className="mb-6">
        <h2 className="font-semibold text-warm-grey-800 mb-5">Profile</h2>
        <div className="flex items-center gap-5">
          {firebaseUser?.photoURL ? (
            <Image
              src={firebaseUser.photoURL}
              alt="avatar"
              width={64}
              height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-warm-brown-300 flex items-center justify-center text-white text-xl font-medium">
              {userProfile?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <p className="font-semibold text-warm-grey-900 text-lg">
              {userProfile?.name ?? "—"}
            </p>
            <p className="text-sm text-warm-grey-500">{userProfile?.email}</p>
            <Badge variant="info" className="mt-1">
              {userProfile?.role ?? "member"}
            </Badge>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm border-t border-warm-grey-100 pt-4">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-warm-grey-400" />
            <dt className="w-28 text-warm-grey-500">Name</dt>
            <dd className="text-warm-grey-800">{userProfile?.name ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-warm-grey-400" />
            <dt className="w-28 text-warm-grey-500">Email</dt>
            <dd className="text-warm-grey-800">{userProfile?.email ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-warm-grey-400" />
            <dt className="w-28 text-warm-grey-500">Role</dt>
            <dd className="text-warm-grey-800">{userProfile?.role ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-warm-grey-400" />
            <dt className="w-28 text-warm-grey-500">Consultancy ID</dt>
            <dd className="font-mono text-xs text-warm-grey-600">
              {userProfile?.consultancyId ?? "Not set"}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Environment */}
      <Card>
        <h2 className="font-semibold text-warm-grey-800 mb-4">Environment</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-warm-grey-100">
            <span className="text-warm-grey-500">API URL</span>
            <span className="font-mono text-xs text-warm-grey-700">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-warm-grey-100">
            <span className="text-warm-grey-500">Firebase Project</span>
            <span className="font-mono text-xs text-warm-grey-700">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "—"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-warm-grey-500">Plan</span>
            <Badge variant="warning">hackathon</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
