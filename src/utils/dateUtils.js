import { formatDistanceToNow, format, differenceInDays, parseISO } from "date-fns";

export function formatRelative(date) {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function formatDate(date, fmt = "dd MMM yyyy") {
  if (!date) return "—";
  try {
    return format(new Date(date), fmt);
  } catch {
    return "—";
  }
}

export function formatDateTime(date) {
  return formatDate(date, "dd MMM yyyy, hh:mm a");
}

export function daysUntil(date) {
  if (!date) return null;
  try {
    return differenceInDays(new Date(date), new Date());
  } catch {
    return null;
  }
}

export function getTenderStatus(closingDate) {
  if (!closingDate) return { label: "Unknown", type: "neutral" };
  const days = daysUntil(closingDate);
  if (days === null) return { label: "Unknown", type: "neutral" };
  if (days < 0)  return { label: "Closed", type: "danger" };
  if (days <= 3) return { label: "Closing Soon", type: "warning" };
  if (days <= 7) return { label: `${days} days left`, type: "warning" };
  return { label: "Active", type: "success" };
}
