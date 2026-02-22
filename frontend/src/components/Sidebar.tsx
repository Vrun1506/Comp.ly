"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard },
  { href: "/workspaces",  label: "Workspaces", icon: FolderKanban },
  { href: "/settings",    label: "Settings",   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userProfile, firebaseUser } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-warm-grey-50 border-r border-warm-grey-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-warm-grey-200">
        <ShieldCheck className="w-6 h-6 text-warm-brown-500" />
        <span className="font-semibold text-warm-grey-900 tracking-tight">Comply</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(active ? "sidebar-link-active" : "sidebar-link")}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-warm-grey-200">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          {firebaseUser?.photoURL ? (
            <Image
              src={firebaseUser.photoURL}
              alt="avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-warm-brown-300 flex items-center justify-center text-white text-sm font-medium">
              {userProfile?.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warm-grey-800 truncate">
              {userProfile?.name ?? "User"}
            </p>
            <p className="text-xs text-warm-grey-400 truncate">
              {userProfile?.email ?? ""}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-warm-grey-400 hover:text-warm-grey-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
