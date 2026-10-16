// What a portal calls the list a tender came from (tenders.listing_type), in words a person reads.
// Unknown values fall back to a capitalised version, so a new portal's list shows up without a code change.
const LABELS = {
  active:           "Open",
  live:             "Live",
  latest:           "Latest",
  upcoming:         "Upcoming",
  progress:         "Under progress",
  under_evaluation: "Under evaluation",
  opened:           "Bids opened",
  awarded:          "Awarded",
  archived:         "Archived",
  eoi:              "EOI",
  tender:           "Tender",
  urban:            "Urban development",
};

export function listingTypeLabel(value) {
  if (!value) return "";
  if (LABELS[value]) return LABELS[value];
  const text = String(value).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
