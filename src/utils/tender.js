// Helpers shared by list, card, detail and bookmarks for collector v1 tenders.
// A tender is identified by portal + official tender id (unique per portal).

export const tenderKey = (t) => `${t.portal}/${t.tender_id}`;

export const tenderRoute = (t) => ({
  name: "TenderDetail",
  params: { portal: t.portal, tenderId: t.tender_id },
});

export function formatMoney(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return "₹ " + num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Short money for tables: ₹ 12.6 Cr / ₹ 3.2 L
export function formatMoneyShort(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  if (num >= 1e7) return `₹ ${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `₹ ${(num / 1e5).toFixed(2)} L`;
  return "₹ " + num.toLocaleString("en-IN");
}

export function placeOf(t) {
  const loc = (t.location || "").trim();
  const state = (t.state || "").trim();
  // IREPS locations already end with the state ("DSD-SBC, SWR Karnataka")
  if (state && loc.toLowerCase().includes(state.toLowerCase())) return loc;
  return [loc, state].filter(Boolean).join(", ");
}

// "Org||Unit||Sub-unit" → "Org › Unit › Sub-unit"
export function orgOf(t) {
  if (t.org_name) return t.org_name;
  return (t.org_chain || "").split("||").map((s) => s.trim()).filter(Boolean).join(" › ");
}

export function orgChainParts(t) {
  return (t.org_chain || "").split("||").map((s) => s.trim()).filter(Boolean);
}

// Tender list filters (FilterPanel + TenderList + URL query)
export const DEFAULT_FILTERS = {
  portal: "", state: "", lifecycle: "active", has_detail: "", closing_before: "", sort: "closing_at:asc",
};
