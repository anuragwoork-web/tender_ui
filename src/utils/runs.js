// Look of a collector sweep status (tc_sweeps.status: running | success | partial | failed)
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";

const LOOKS = {
  success: { bg: "bg-emerald-100", color: "text-emerald-600", icon: CheckCircleIcon, badge: "success", bar: "bg-emerald-500", dot: "bg-emerald-400 hover:bg-emerald-500" },
  partial: { bg: "bg-amber-100", color: "text-amber-600", icon: ExclamationTriangleIcon, badge: "warning", bar: "bg-amber-500", dot: "bg-amber-400 hover:bg-amber-500" },
  failed:  { bg: "bg-red-100", color: "text-red-600", icon: XCircleIcon, badge: "danger", bar: "bg-red-500", dot: "bg-red-400 hover:bg-red-500" },
  running: { bg: "bg-blue-100", color: "text-blue-600", icon: ArrowPathIcon, badge: "neutral", bar: "bg-blue-500", dot: "bg-blue-400 animate-pulse" },
};
const NONE = { bg: "bg-slate-100", color: "text-slate-500", icon: ClockIcon, badge: "neutral", bar: "bg-slate-400", dot: "bg-slate-200" };

export const runLook = (status) => LOOKS[status] || NONE;

export function formatDuration(sec) {
  if (sec === null || sec === undefined) return "—";
  const n = Number(sec);
  if (n < 60) return `${n}s`;
  if (n < 3600) return `${Math.floor(n / 60)}m ${n % 60}s`;
  return `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`;
}
