<template>
  <div class="space-y-6 animate-slide-up max-w-6xl mx-auto">
    <!-- Back + actions -->
    <div class="flex items-center justify-between">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 font-medium transition-colors group"
      >
        <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Tenders
      </button>

      <div class="flex items-center gap-2">
        <button
          v-if="tender?.detail_url"
          @click="openSource"
          class="btn-ghost flex items-center gap-2"
        >
          <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          {{ tender?.portal_code === "gem" ? "Search on Portal" : "View on Portal" }}
        </button>
        <button
          @click="onBookmark"
          class="btn-ghost flex items-center gap-2"
          :class="bookmarked ? 'bg-amber-50 border-amber-200 text-amber-700' : ''"
        >
          <StarSolidIcon v-if="bookmarked" class="w-4 h-4 text-amber-500" />
          <StarIcon v-else class="w-4 h-4" />
          {{ bookmarked ? "Bookmarked" : "Bookmark" }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="card p-8 animate-pulse h-48" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6 animate-pulse h-64" />
        <div class="card p-6 animate-pulse h-64" />
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!tender" class="card p-12 text-center">
      <ExclamationTriangleIcon class="w-12 h-12 mx-auto text-amber-500 mb-3" />
      <h3 class="text-lg font-semibold text-slate-900 mb-1">Tender not found</h3>
      <p class="text-sm text-slate-500">This tender may have been removed.</p>
    </div>

    <!-- Detail content -->
    <template v-else>
      <!-- Hero card -->
      <div class="card p-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1.5" :class="accentLine" />
        <div class="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 blur-3xl" :class="blobClass" />

        <div class="relative">
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge :type="status.type" :label="status.label" />
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {{ tender.portal_code }} · {{ tender.portal_name }}
            </span>
            <span v-if="tender.listing_type" class="badge-neutral">{{ listingTypeLabel(tender.listing_type) }}</span>
            <span v-if="tender.tender_reference" class="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              # {{ tender.tender_reference }}
            </span>
          </div>

          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4">
            {{ tender.title || "Untitled tender" }}
          </h1>

          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            <div v-if="tender.organisation_name" class="flex items-center gap-2">
              <BuildingOffice2Icon class="w-4 h-4 text-slate-400" />
              <span>{{ tender.organisation_name }}</span>
            </div>
            <div v-if="locationStr" class="flex items-center gap-2">
              <MapPinIcon class="w-4 h-4 text-slate-400" />
              <span>{{ locationStr }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Two-column: Key Dates + Financials -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CalendarIcon class="w-5 h-5 text-primary-600" />
            Key Dates
          </h2>
          <div>
            <InfoRow label="Published"        :value="formatDateTime(tender.published_date)" />
            <InfoRow label="Closing"          :value="formatDateTime(tender.closing_date)" :valueClass="closingHighlight" />
            <InfoRow label="Opening"          :value="formatDateTime(tender.opening_date)" />
            <InfoRow label="Bid Submission"   v-if="tender.bid_submission_start || tender.bid_submission_end">
              {{ formatDate(tender.bid_submission_start) }} → {{ formatDate(tender.bid_submission_end) }}
            </InfoRow>
            <InfoRow label="Doc Download"     v-if="tender.doc_download_start || tender.doc_download_end">
              {{ formatDate(tender.doc_download_start) }} → {{ formatDate(tender.doc_download_end) }}
            </InfoRow>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CurrencyRupeeIcon class="w-5 h-5 text-emerald-600" />
            Financials
          </h2>
          <div>
            <InfoRow label="Tender Fee"       :value="formatCurrency(tender.tender_fee)" />
            <InfoRow label="EMD Amount"       :value="formatCurrency(tender.emd_amount)" />
            <InfoRow label="Estimated Value"  :value="formatCurrency(tender.estimated_value)" valueClass="text-lg font-bold text-emerald-700" />
            <InfoRow label="Tender Type"      :value="tender.tender_type" v-if="tender.tender_type" />
            <InfoRow label="Category"         :value="tender.tender_category" v-if="tender.tender_category" />
          </div>
        </div>
      </div>

      <!-- Accordions -->
      <div class="space-y-3">
        <AccordionSection
          v-if="hasAuthority"
          title="Authority Details"
          :icon="BuildingOffice2Icon"
          default-open
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Authority Name"    :value="tender.authority_name" />
            <InfoRow label="Authority Address" :value="tender.authority_address" />
            <InfoRow label="Organisation Type" :value="tender.organisation_type" />
            <InfoRow label="Location"          :value="tender.location" />
          </div>
        </AccordionSection>

        <AccordionSection
          v-if="tender.work_description"
          title="Work Description"
          :icon="DocumentTextIcon"
        >
          <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {{ tender.work_description }}
          </p>
        </AccordionSection>

        <AccordionSection
          v-if="hasExtraData"
          title="Additional Information"
          :icon="InformationCircleIcon"
          :count="Object.keys(tender.extra_data).length"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow
              v-for="(value, key) in tender.extra_data"
              :key="key"
              :label="key"
              :value="String(value || '—')"
            />
          </div>
        </AccordionSection>
      </div>

      <!-- Documents -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PaperClipIcon class="w-5 h-5 text-primary-600" />
            Documents
          </h2>
          <span class="badge-neutral">{{ (tender.documents || []).length }}</span>
        </div>

        <div v-if="(tender.documents || []).length" class="space-y-2">
          <a
            v-for="doc in tender.documents"
            :key="doc.id"
            :href="absoluteDocUrl(doc.document_url)"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200 group"
          >
            <div class="w-10 h-10 rounded-lg bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
              <DocumentIcon class="w-5 h-5 text-primary-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 truncate">
                {{ doc.document_name || "Document" }}
              </p>
              <p class="text-xs text-slate-500">
                {{ doc.document_type || "file" }}
                <span v-if="doc.file_size"> · {{ formatFileSize(doc.file_size) }}</span>
                <span v-if="doc.file_extension"> · {{ doc.file_extension }}</span>
              </p>
            </div>
            <ArrowTopRightOnSquareIcon class="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
          </a>
        </div>

        <div v-else class="text-center py-8 text-slate-400">
          <PaperClipIcon class="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p class="text-sm">No documents attached</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  StarIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  PaperClipIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import StatusBadge from "../components/StatusBadge.vue";
import InfoRow from "../components/InfoRow.vue";
import AccordionSection from "../components/AccordionSection.vue";
import { tenderApi } from "../api/tender";
import { formatDate, formatDateTime, formatRelative, getTenderStatus, daysUntil } from "../utils/dateUtils";
import { useBookmarks } from "../store/bookmarks";
import { listingTypeLabel } from "../utils/listingType";

const route = useRoute();
const toast = useToast();

const tender  = ref(null);
const loading = ref(true);

const { isBookmarked, toggle } = useBookmarks();
const bookmarked = computed(() => tender.value && isBookmarked(tender.value.id));

const status = computed(() =>
  tender.value ? getTenderStatus(tender.value.closing_date, tender.value.status) : { type: "neutral", label: "" }
);

const accentLine = computed(() => {
  const map = {
    success: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    warning: "bg-gradient-to-r from-amber-400 to-amber-600",
    danger:  "bg-gradient-to-r from-red-400 to-red-600",
    neutral: "bg-gradient-to-r from-slate-300 to-slate-400",
  };
  return map[status.value.type] || map.neutral;
});

const blobClass = computed(() => {
  const map = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger:  "bg-red-400",
    neutral: "bg-slate-400",
  };
  return map[status.value.type] || map.neutral;
});

const closingHighlight = computed(() => {
  const days = tender.value && tender.value.status !== "closed" ? daysUntil(tender.value.closing_date) : null;
  if (days === null) return "";
  if (days < 0) return "text-red-600";
  if (days <= 3) return "text-amber-700 font-bold";
  return "";
});

const locationStr = computed(() => {
  if (!tender.value) return "";
  const parts = [tender.value.city, tender.value.state, tender.value.country].filter(Boolean);
  return parts.length ? parts.join(", ") : tender.value.location || "";
});

const hasAuthority = computed(() =>
  tender.value && (tender.value.authority_name || tender.value.authority_address ||
                   tender.value.organisation_type || tender.value.location)
);

const hasExtraData = computed(() =>
  tender.value?.extra_data &&
  typeof tender.value.extra_data === "object" &&
  Object.keys(tender.value.extra_data).length > 0
);

// Portal code → base origin map
const PORTAL_BASES = {
  eprocure: "https://eprocure.gov.in",
  etenders: "https://etenders.gov.in",
};

function absoluteDocUrl(url) {
  if (!url) return "#";
  // Already absolute
  if (/^https?:\/\//i.test(url)) return url;

  // Try to derive base from tender's detail_url first
  if (tender.value?.detail_url) {
    try {
      const u = new URL(tender.value.detail_url);
      return u.origin + (url.startsWith("/") ? url : "/" + url);
    } catch {
      // fall through
    }
  }

  // Fallback: portal code map
  const base = PORTAL_BASES[tender.value?.portal_code];
  if (base) {
    return base + (url.startsWith("/") ? url : "/" + url);
  }

  return url;
}

function formatCurrency(val) {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return "₹ " + num.toLocaleString("en-IN");
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  const num = Number(bytes);
  if (num < 1024) return num + " B";
  if (num < 1024 * 1024) return (num / 1024).toFixed(1) + " KB";
  return (num / (1024 * 1024)).toFixed(1) + " MB";
}

function openSource() {
  const t = tender.value;
  // GeM: portal URL-search support nahi karta, isliye bid number clipboard pe
  // copy karke all-bids page kholte — user wahan paste + search kare.
  if (t?.portal_code === "gem") {
    const bidNo = t.tender_reference || "";
    const openBids = () =>
      window.open("https://bidplus.gem.gov.in/all-bids", "_blank", "noopener");
    if (bidNo && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(bidNo)
        .then(() => toast.success(`Bid number copied: ${bidNo} — GeM ke search box mein paste karein`))
        .catch(() => toast.info(`Bid number: ${bidNo} — GeM ke search box mein daalein`))
        .finally(openBids);
    } else {
      openBids();
    }
    return;
  }
  // Baaki portals: seedha detail/document URL kholo
  window.open(t.detail_url, "_blank", "noopener");
}

function onBookmark() {
  toggle(tender.value);
  toast.success(bookmarked.value ? "Bookmarked" : "Removed from bookmarks");
}

async function load() {
  loading.value = true;
  try {
    tender.value = await tenderApi.getTender(route.params.id);
  } catch (e) {
    if (e.status === 404) {
      tender.value = null;
    } else {
      toast.error(`Failed to load tender: ${e.message}`);
    }
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, load);
onMounted(load);
</script>
