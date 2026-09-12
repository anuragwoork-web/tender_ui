<template>
  <div class="space-y-6 animate-slide-up">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Scrape Logs</h1>
        <p class="text-slate-500 mt-1">History of all scheduled and manual scrape runs</p>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="text-slate-500">Show:</span>
          <select v-model.number="limit" @change="load" class="input-field py-1.5 min-w-[90px]">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
        </div>
        <button @click="load" class="btn-ghost flex items-center gap-2">
          <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card p-4 border-l-4 border-emerald-500">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Success</p>
        <p class="text-2xl font-bold text-emerald-600 tabular-nums mt-1">{{ counts.success }}</p>
      </div>
      <div class="card p-4 border-l-4 border-amber-500">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Partial</p>
        <p class="text-2xl font-bold text-amber-600 tabular-nums mt-1">{{ counts.partial }}</p>
      </div>
      <div class="card p-4 border-l-4 border-red-500">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Failed</p>
        <p class="text-2xl font-bold text-red-600 tabular-nums mt-1">{{ counts.failed }}</p>
      </div>
      <div class="card p-4 border-l-4 border-slate-400">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Runs</p>
        <p class="text-2xl font-bold text-slate-900 tabular-nums mt-1">{{ logs.length }}</p>
      </div>
    </div>

    <!-- Filter pills -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        @click="filter = opt.value"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
        :class="filter === opt.value
          ? 'bg-primary-600 text-white shadow-soft'
          : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'"
      >
        {{ opt.label }}
        <span v-if="opt.value !== 'all'" class="ml-1 text-xs opacity-80">({{ counts[opt.value] || 0 }})</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !logs.length" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card p-4 animate-pulse h-20" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!filteredLogs.length" class="card p-12 text-center">
      <ClipboardDocumentListIcon class="w-12 h-12 mx-auto text-slate-400 mb-3" />
      <h3 class="text-lg font-semibold text-slate-900 mb-1">No logs found</h3>
      <p class="text-sm text-slate-500">No scrape runs match this filter.</p>
    </div>

    <!-- Logs list -->
    <div v-else class="space-y-3">
      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="card card-hover p-5 relative overflow-hidden"
      >
        <div class="absolute top-0 left-0 bottom-0 w-1" :class="statusBar(log.status)" />

        <div class="flex items-start gap-4 pl-3">
          <!-- Status icon -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            :class="statusBg(log.status)"
          >
            <component :is="statusIcon(log.status)" class="w-5 h-5" :class="statusColor(log.status)" />
          </div>

          <!-- Main -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="font-bold text-slate-900 uppercase text-sm">{{ log.portal }}</span>
              <StatusBadge :type="badgeType(log.status)" :label="log.status" />
              <span class="text-xs text-slate-400">
                triggered by <span class="font-medium text-slate-600">{{ log.triggered_by || "—" }}</span>
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <span class="flex items-center gap-1.5">
                <ClockIcon class="w-4 h-4 text-slate-400" />
                {{ formatDateTime(log.started_at) }}
                <span class="text-slate-400">({{ formatRelative(log.started_at) }})</span>
              </span>
              <span v-if="log.duration_sec !== null" class="flex items-center gap-1.5">
                <BoltIcon class="w-4 h-4 text-slate-400" />
                {{ formatDuration(log.duration_sec) }}
              </span>
            </div>

            <!-- Counts row -->
            <div class="flex items-center gap-2 mt-3 flex-wrap">
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                <PlusCircleIcon class="w-3.5 h-3.5" />
                {{ log.new_tenders || 0 }} new
              </div>
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                <ArrowsRightLeftIcon class="w-3.5 h-3.5" />
                {{ log.skipped_existing || 0 }} skipped
              </div>
              <div
                v-if="log.failed_tenders"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium"
              >
                <XCircleIcon class="w-3.5 h-3.5" />
                {{ log.failed_tenders }} failed
              </div>
            </div>

            <!-- Error message -->
            <div
              v-if="log.error_message"
              class="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
            >
              <p class="font-semibold mb-1 flex items-center gap-1.5">
                <ExclamationTriangleIcon class="w-3.5 h-3.5" />
                Error
              </p>
              <p class="font-mono leading-relaxed">{{ log.error_message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import {
  ArrowPathIcon,
  ClockIcon,
  BoltIcon,
  PlusCircleIcon,
  ArrowsRightLeftIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/vue/24/outline";

import StatusBadge from "../components/StatusBadge.vue";
import { tenderApi } from "../api/tender";
import { formatDateTime, formatRelative } from "../utils/dateUtils";

const logs    = ref([]);
const loading = ref(true);
const limit   = ref(20);
const filter  = ref("all");
const toast   = useToast();

const filterOptions = [
  { value: "all",     label: "All" },
  { value: "success", label: "Success" },
  { value: "partial", label: "Partial" },
  { value: "failed",  label: "Failed" },
];

const counts = computed(() => ({
  success: logs.value.filter(l => l.status === "success").length,
  partial: logs.value.filter(l => l.status === "partial").length,
  failed:  logs.value.filter(l => l.status === "failed").length,
}));

const filteredLogs = computed(() => {
  if (filter.value === "all") return logs.value;
  return logs.value.filter(l => l.status === filter.value);
});

async function load() {
  loading.value = true;
  try {
    const res = await tenderApi.getLogs(limit.value);
    logs.value = res.logs || [];
  } catch (e) {
    toast.error(`Failed to load logs: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

function statusBar(status) {
  return {
    success: "bg-emerald-500",
    partial: "bg-amber-500",
    failed:  "bg-red-500",
  }[status] || "bg-slate-400";
}
function statusBg(status) {
  return {
    success: "bg-emerald-100",
    partial: "bg-amber-100",
    failed:  "bg-red-100",
  }[status] || "bg-slate-100";
}
function statusColor(status) {
  return {
    success: "text-emerald-600",
    partial: "text-amber-600",
    failed:  "text-red-600",
  }[status] || "text-slate-500";
}
function statusIcon(status) {
  return {
    success: CheckCircleIcon,
    partial: ExclamationTriangleIcon,
    failed:  XCircleIcon,
  }[status] || ClockIcon;
}
function badgeType(status) {
  return {
    success: "success",
    partial: "warning",
    failed:  "danger",
  }[status] || "neutral";
}
function formatDuration(sec) {
  if (sec === null || sec === undefined) return "—";
  const n = Number(sec);
  if (n < 60)   return `${n}s`;
  if (n < 3600) return `${Math.floor(n / 60)}m ${n % 60}s`;
  return `${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m`;
}

onMounted(load);
</script>
