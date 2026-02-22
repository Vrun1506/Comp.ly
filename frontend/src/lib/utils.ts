import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Accepts ISO string, Firestore Timestamp object, or any Date-like value */
function toDateSafe(value: unknown): Date | null {
  if (!value) return null;
  // Firestore Timestamp: has .toDate() method
  if (typeof value === "object" && typeof (value as any).toDate === "function") {
    return (value as any).toDate();
  }
  // Plain object with seconds/nanoseconds
  if (typeof value === "object" && "seconds" in (value as any)) {
    return new Date((value as any).seconds * 1000);
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function timeAgo(value: unknown): string {
  const d = toDateSafe(value);
  if (!d) return "";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function formatDate(value: unknown): string {
  const d = toDateSafe(value);
  if (!d) return "";
  try {
    return format(d, "MMM d, yyyy");
  } catch {
    return "";
  }
}

export function severityColor(severity: string) {
  switch (severity) {
    case "P0":
      return "badge-p0";
    case "P1":
      return "badge-p1";
    case "P2":
      return "badge-p2";
    default:
      return "badge-p2";
  }
}

export function scanStatusColor(status: string) {
  switch (status) {
    case "completed": return "text-green-700 bg-green-50";
    case "running":   return "text-blue-700 bg-blue-50";
    case "queued":    return "text-warm-grey-600 bg-warm-grey-100";
    case "failed":    return "text-red-700 bg-red-50";
    default:          return "text-warm-grey-600 bg-warm-grey-100";
  }
}
