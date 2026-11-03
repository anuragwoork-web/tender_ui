<template>
  <div class="space-y-6 animate-slide-up max-w-6xl mx-auto">
    <!-- Back + actions -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 font-medium transition-colors group"
      >
        <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Tenders
      </button>

      <div class="flex items-center gap-2">
        <button v-if="tender" @click="copyId" class="btn-ghost flex items-center gap-2">
          <ClipboardDocumentIcon class="w-4 h-4" />
          Copy Tender ID
        </button>
        <button v-if="tender?.detail_url" @click="openSource" class="btn-ghost flex items-center gap-2">
          <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          {{ tender.portal === "gem" ? "Open on GeM" : "View on Portal" }}
        </button>
        <button
          v-if="tender"
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
      <p class="text-sm text-slate-500">{{ portal }} / {{ tenderId }}</p>
    </div>

    <template v-else>
      <!-- Hero -->
      <div class="card p-8 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1.5" :class="accentLine" />
        <div class="relative">
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge :type="status.type" :label="status.label" />
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {{ tender.portal }} · {{ tender.portal_name }}
            </span>
            <span class="text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              {{ tender.tender_id }}
            </span>
            <span
              v-if="tender.ref_no && tender.ref_no !== tender.tender_id"
              class="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200"
            >
              Ref: {{ tender.ref_no }}
            </span>
          </div>

          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4">
            {{ tender.title || "Untitled tender" }}
          </h1>

          <div class="flex flex-col gap-2 text-sm text-slate-600">
            <div v-if="orgParts.length" class="flex items-start gap-2">
              <BuildingOffice2Icon class="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span>
                <template v-for="(part, i) in orgParts" :key="i">
                  <span v-if="i" class="text-slate-300 mx-1">›</span>{{ part }}
                </template>
              </span>
            </div>
            <div v-if="place" class="flex items-center gap-2">
              <MapPinIcon class="w-4 h-4 text-slate-400" />
              <span>{{ place }}<span v-if="tender.pincode"> — {{ tender.pincode }}</span></span>
            </div>
          </div>

          <div
            v-if="!tender.detail_fetched_at"
            class="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2"
          >
            <InformationCircleIcon class="w-5 h-5 shrink-0" />
            <span>
              Abhi sirf listing ka data hai. Detail page (EMD, fee, value, documents) agle sweep mein aayega.
            </span>
          </div>
        </div>
      </div>

      <!-- Key dates + Financials -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card p-6">
          <h2 class="section-title">
            <CalendarIcon class="w-5 h-5 text-primary-600" />
            Key Dates (IST)
          </h2>
          <InfoRow label="Published" :value="dt(tender.published_at)" />
          <InfoRow v-if="tender.doc_download_start || tender.doc_download_end" label="Document Download">
            {{ dt(tender.doc_download_start) }} → {{ dt(tender.doc_download_end) }}
          </InfoRow>
          <InfoRow v-if="tender.clarification_start || tender.clarification_end" label="Clarification">
            {{ dt(tender.clarification_start) }} → {{ dt(tender.clarification_end) }}
          </InfoRow>
          <InfoRow v-if="tender.pre_bid_at" label="Pre-bid Meeting" :value="dt(tender.pre_bid_at)" />
          <InfoRow v-if="tender.bid_submission_start" label="Bid Submission Start" :value="dt(tender.bid_submission_start)" />
          <InfoRow label="Closing (Bid Submission End)" :value="dt(tender.closing_at)" :valueClass="closingHighlight" />
          <InfoRow label="Bid Opening" :value="dt(tender.opening_at)" />
        </div>

        <div class="card p-6">
          <h2 class="section-title">
            <CurrencyRupeeIcon class="w-5 h-5 text-emerald-600" />
            Financials
          </h2>
          <InfoRow label="Estimated Value" :value="formatMoney(tender.estimated_value)" valueClass="text-lg font-bold text-emerald-700" />
          <InfoRow label="EMD Amount">
            {{ formatMoney(tender.emd_amount) }}
            <span v-if="tender.emd_exemption_allowed" class="ml-2 badge-neutral">exemption allowed</span>
          </InfoRow>
          <InfoRow label="Tender Fee">
            {{ formatMoney(tender.tender_fee) }}
            <span v-if="tender.tender_fee_exemption_allowed" class="ml-2 badge-neutral">exemption allowed</span>
          </InfoRow>
          <InfoRow v-if="tender.processing_fee !== null && tender.processing_fee !== undefined" label="Processing Fee" :value="formatMoney(tender.processing_fee)" />
          <InfoRow v-if="tender.payment_mode" label="Payment Mode" :value="tender.payment_mode" />
        </div>
      </div>

      <!-- Tender information -->
      <div v-if="infoRows.length" class="card p-6">
        <h2 class="section-title">
          <DocumentTextIcon class="w-5 h-5 text-primary-600" />
          Tender Information
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoRow v-for="row in infoRows" :key="row.label" :label="row.label" :value="String(row.value)" />
        </div>
      </div>

      <div class="space-y-3">
        <AccordionSection v-if="tender.work_description" title="Work Description" :icon="DocumentTextIcon" default-open>
          <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{{ tender.work_description }}</p>
        </AccordionSection>

        <AccordionSection v-if="hasAuthority" title="Tender Inviting Authority" :icon="BuildingOffice2Icon">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Name" :value="tender.authority_name" />
            <InfoRow label="Address" :value="tender.authority_address" />
            <InfoRow v-if="tender.pre_bid_place" label="Pre-bid Place" :value="tender.pre_bid_place" />
            <InfoRow v-if="tender.bid_opening_place" label="Bid Opening Place" :value="tender.bid_opening_place" />
          </div>
        </AccordionSection>

        <AccordionSection
          v-if="(tender.corrigenda || []).length"
          title="Corrigenda"
          :icon="PencilSquareIcon"
          :count="tender.corrigenda.length"
          default-open
        >
          <div class="space-y-2">
            <div v-for="c in tender.corrigenda" :key="c.seq" class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span class="text-xs font-bold text-slate-500 w-6">#{{ c.seq }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900">{{ c.title }}</p>
                <p class="text-xs text-slate-500">
                  <span v-if="c.corr_type">{{ c.corr_type }} · </span>first seen {{ dt(c.first_seen_at) }}
                </p>
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection v-if="events.length" title="Change History" :icon="ClockIcon" :count="events.length">
          <div class="space-y-2">
            <div v-for="(e, i) in events" :key="i" class="flex items-start gap-3 text-sm">
              <StatusBadge :type="eventType(e.event)" :label="e.event" />
              <div class="flex-1 min-w-0">
                <p class="text-slate-700">
                  <span v-if="e.field" class="font-mono text-xs text-slate-500">{{ e.field }}: </span>
                  <span v-if="e.old_value" class="line-through text-slate-400 mr-1">{{ e.old_value }}</span>
                  <span v-if="e.new_value">{{ e.new_value }}</span>
                </p>
                <p class="text-xs text-slate-400">{{ dt(e.detected_at) }}</p>
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          v-if="rawRows.length"
          title="All Fields from Portal"
          :icon="InformationCircleIcon"
          :count="rawRows.length"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow v-for="row in rawRows" :key="row.label" :label="row.label" :value="row.value" />
          </div>
        </AccordionSection>

        <AccordionSection v-if="pdfText" title="Tender PDF Text" :icon="DocumentIcon">
          <pre class="text-xs text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">{{ pdfText }}</pre>
        </AccordionSection>
      </div>

      <!-- Documents -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title !mb-0">
            <PaperClipIcon class="w-5 h-5 text-primary-600" />
            Documents
          </h2>
          <span class="badge-neutral">{{ (tender.documents || []).length }}</span>
        </div>

        <div v-if="(tender.documents || []).length" class="space-y-2">
          <component
            :is="doc.url ? 'a' : 'div'"
            v-for="(doc, i) in tender.documents"
            :key="i"
            :href="doc.url ? absoluteUrl(doc.url) : undefined"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 transition-all duration-200 group"
            :class="doc.url ? 'hover:border-primary-300 hover:bg-primary-50/30' : ''"
          >
            <div class="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <DocumentIcon class="w-5 h-5 text-primary-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 truncate">{{ doc.name || "Document" }}</p>
              <p class="text-xs text-slate-500">
                {{ doc.section }}
                <span v-if="doc.doc_type"> · {{ doc.doc_type }}</span>
                <span v-if="doc.description"> · {{ doc.description }}</span>
                <span v-if="doc.size_text"> · {{ doc.size_text }}</span>
              </p>
            </div>
            <ArrowTopRightOnSquareIcon v-if="doc.url" class="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
          </component>
          <p class="text-xs text-slate-400 mt-2">
            Jin documents par link nahi hai, wo portal par login/captcha ke baad hi download hote hain.
          </p>
        </div>

        <div v-else class="text-center py-8 text-slate-400">
          <PaperClipIcon class="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p class="text-sm">No documents recorded</p>
        </div>
      </div>

      <!-- Collector record -->
      <div class="card p-6">
        <h2 class="section-title">
          <CircleStackIcon class="w-5 h-5 text-slate-500" />
          Collector Record
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8">
          <InfoRow label="First Seen" :value="dt(tender.first_seen_at)" />
          <InfoRow label="Last Seen on Portal" :value="dt(tender.last_seen_at)" />
          <InfoRow label="Detail Fetched" :value="dt(tender.detail_fetched_at)" />
          <InfoRow v-if="tender.gone_at" label="Gone At" :value="dt(tender.gone_at)" />
          <InfoRow v-if="tender.nit_group" label="NIT Group" :value="tender.nit_group" />
          <InfoRow v-if="(tender.quality_flags || []).length" label="Data Quality Flags" :value="tender.quality_flags.join(', ')" />
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
  BuildingOffice2Icon,
  CalendarIcon,
  CircleStackIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  DocumentIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon,
  PaperClipIcon,
  PencilSquareIcon,
  StarIcon,
} from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import StatusBadge from "../components/StatusBadge.vue";
import InfoRow from "../components/InfoRow.vue";
import AccordionSection from "../components/AccordionSection.vue";
import { tenderApi } from "../api/tender";
import { formatDateTime, daysUntil, tenderStatus } from "../utils/dateUtils";
import { formatMoney, orgChainParts, placeOf } from "../utils/tender";
import { useBookmarks } from "../store/bookmarks";

const route = useRoute();
const toast = useToast();

const portal   = computed(() => route.params.portal);
const tenderId = computed(() => {
  const id = route.params.tenderId;
  return Array.isArray(id) ? id.join("/") : id;
});

const tender  = ref(null);
const events  = ref([]);
const loading = ref(true);

const { isBookmarked, toggle } = useBookmarks();
const bookmarked = computed(() => tender.value && isBookmarked(tender.value));
const status = computed(() => tenderStatus(tender.value));

const dt = (v) => (v ? formatDateTime(v) : "—");

const accentLine = computed(() => ({
  success: "bg-gradient-to-r from-emerald-400 to-emerald-600",
  warning: "bg-gradient-to-r from-amber-400 to-amber-600",
  danger:  "bg-gradient-to-r from-red-400 to-red-600",
  neutral: "bg-gradient-to-r from-slate-300 to-slate-400",
}[status.value.type] || "bg-slate-300"));

const closingHighlight = computed(() => {
  const days = tender.value ? daysUntil(tender.value.closing_at) : null;
  if (days === null) return "";
  if (days < 0) return "text-red-600";
  if (days <= 3) return "text-amber-700 font-bold";
  return "";
});

const orgParts = computed(() => {
  if (!tender.value) return [];
  const parts = orgChainParts(tender.value);
  return parts.length ? parts : [tender.value.org_name].filter(Boolean);
});
const place = computed(() => (tender.value ? placeOf(tender.value) : ""));

const hasAuthority = computed(() =>
  tender.value && (tender.value.authority_name || tender.value.authority_address ||
                   tender.value.pre_bid_place || tender.value.bid_opening_place)
);

const INFO_FIELDS = [
  ["tender_type", "Tender Type"],
  ["tender_category", "Tender Category"],
  ["contract_type", "Contract Type"],
  ["form_of_contract", "Form of Contract"],
  ["product_category", "Product Category"],
  ["sub_category", "Sub Category"],
  ["tenderer_class", "Tenderer Class"],
  ["covers", "Number of Covers"],
  ["bid_validity_days", "Bid Validity (days)"],
  ["period_of_work_days", "Period of Work (days)"],
];
const infoRows = computed(() =>
  INFO_FIELDS
    .map(([key, label]) => ({ label, value: tender.value?.[key] }))
    .filter((r) => r.value !== null && r.value !== undefined && r.value !== "")
);

// Every caption/value the portal showed, as stored (detail_raw). Long blobs are shown separately.
const HIDDEN_RAW = new Set(["pdf_text", "pdf_url"]);
const rawRows = computed(() => {
  const raw = tender.value?.detail_raw;
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw)
    .filter(([k, v]) => !HIDDEN_RAW.has(k) && v !== null && v !== "" && typeof v !== "object")
    .map(([k, v]) => ({ label: k, value: String(v) }));
});
const pdfText = computed(() => tender.value?.detail_raw?.pdf_text || "");

function eventType(e) {
  return { new: "success", changed: "warning", corrigendum: "warning", gone: "danger", reappeared: "success" }[e] || "neutral";
}

function absoluteUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  try {
    return new URL(url, tender.value?.detail_url).href;
  } catch {
    return url;
  }
}

async function copyId() {
  try {
    await navigator.clipboard.writeText(tender.value.tender_id);
    toast.success(`Copied: ${tender.value.tender_id}`);
  } catch {
    toast.info(tender.value.tender_id);
  }
}

function openSource() {
  window.open(tender.value.detail_url, "_blank", "noopener");
}

function onBookmark() {
  toggle(tender.value);
  toast.success(bookmarked.value ? "Bookmarked" : "Removed from bookmarks");
}

async function load() {
  loading.value = true;
  events.value = [];
  try {
    tender.value = await tenderApi.getTender(portal.value, tenderId.value);
    tenderApi.getTenderEvents(portal.value, tenderId.value)
      .then((r) => { events.value = (r.events || []).slice().reverse(); })
      .catch(() => {});
  } catch (e) {
    tender.value = null;
    if (e.status !== 404) toast.error(`Failed to load tender: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

watch(() => [route.params.portal, route.params.tenderId], load);
onMounted(load);
</script>

<style scoped>
.section-title {
  @apply text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2;
}
</style>
