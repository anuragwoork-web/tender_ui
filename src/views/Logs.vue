<template>
  <div class="space-y-6 animate-slide-up">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Collector Runs</h1>
        <p class="text-slate-500 mt-1">Every portal sweep: what the portal showed, what changed, details fetched</p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative">
          <select v-model="portal" @change="load" class="appearance-none input-field py-1.5 pr-9 min-w-[150px]">
            <option value="">All portals</option>
            <option v-for="p in portals" :key="p.code" :value="p.code">{{ p.name }}</option>
          </select>
          <ChevronDownIcon class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
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

    <!-- Summary -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div v-for="c in summary" :key="c.key" class="card p-4 border-l-4" :class="c.border">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">{{ c.label }}</p>
        <p class="text-2xl font-bold tabular-nums mt-1" :class="c.text">{{ c.value }}</p>
      </div>
    </div>

    <!-- Filter pills -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="opt in filterOptions"
        :key="opt"
        @click="filter = opt"
        class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 capitalize"
        :class="filter === opt
          ? 'bg-primary-600 text-white shadow-soft'
          : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'"
      >
        {{ opt }}
        <span v-if="opt !== 'all'" class="ml-1 text-xs opacity-80">({{ counts[opt] || 0 }})</span>
      </button>
    </div>

    <div v-if="loading && !runs.length" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card p-4 animate-pulse h-20" />
    </div>

    <div v-else-if="!filtered.length" class="card p-12 text-center">
      <ClipboardDocumentListIcon class="w-12 h-12 mx-auto text-slate-400 mb-3" />
      <h3 class="text-lg font-semibold text-slate-900 mb-1">No runs found</h3>
      <p class="text-sm text-slate-500">No collector runs match this filter.</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="run in filtered" :key="run.id" class="card card-hover p-5 relative overflow-hidden">
        <div class="absolute top-0 left-0 bottom-0 w-1" :class="runLook(run.status).bar" />
        <div class="flex items-start gap-4 pl-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="runLook(run.status).bg">
            <component
              :is="runLook(run.status).icon"
              class="w-5 h-5"
              :class="[runLook(run.status).color, run.status === 'running' ? 'animate-spin' : '']"
            />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <router-link
                :to="{ path: '/tenders', query: { portal: run.portal } }"
                class="font-bold text-slate-900 uppercase text-sm hover:text-primary-600"
              >{{ run.portal }}</router-link>
              <StatusBadge :type="runLook(run.status).badge" :label="run.status" />
              <span class="text-xs text-slate-400">sweep #{{ run.id }} · {{ run.kind }}</span>
            </div>

            <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600">
              <span class="flex items-center gap-1.5">
                <ClockIcon class="w-4 h-4 text-slate-400" />
                {{ formatDateTime(run.started_at) }}
                <span class="text-slate-400">({{ formatRelative(run.started_at) }})</span>
              </span>
              <span v-if="run.duration_sec !== null" class="flex items-center gap-1.5">
                <BoltIcon class="w-4 h-4 text-slate-400" />
                {{ formatDuration(run.duration_sec) }}
              </span>
              <span v-if="run.requests" class="text-xs text-slate-400">{{ n(run.requests) }} requests</span>
            </div>

            <div v-if="run.status !== 'running'" class="flex items-center gap-2 mt-3 flex-wrap">
              <span class="chip bg-slate-100 text-slate-700" title="Tenders listed / what the portal itself counted">
                <ListBulletIcon class="w-3.5 h-3.5" />
                listed {{ n(run.listed) }}<template v-if="run.expected"> / {{ n(run.expected) }}</template>
              </span>
              <span class="chip bg-emerald-50 text-emerald-700"><PlusCircleIcon class="w-3.5 h-3.5" />{{ n(run.new_count) }} new</span>
              <span class="chip bg-amber-50 text-amber-700"><ArrowsRightLeftIcon class="w-3.5 h-3.5" />{{ n(run.changed_count) }} changed</span>
              <span class="chip bg-slate-100 text-slate-700"><MinusCircleIcon class="w-3.5 h-3.5" />{{ n(run.gone_count) }} gone</span>
              <span v-if="run.reappeared_count" class="chip bg-blue-50 text-blue-700">{{ n(run.reappeared_count) }} reappeared</span>
              <span class="chip bg-primary-50 text-primary-700"><DocumentMagnifyingGlassIcon class="w-3.5 h-3.5" />{{ n(run.details_fetched) }} details</span>
              <span v-if="run.details_failed" class="chip bg-red-50 text-red-700"><XCircleIcon class="w-3.5 h-3.5" />{{ n(run.details_failed) }} detail failed</span>
            </div>
            <p v-else class="text-xs text-blue-600 mt-2">Chal raha hai — counts sweep khatam hone par aayenge.</p>

            <div v-if="run.error_message" class="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <p class="font-semibold mb-1 flex items-center gap-1.5">
                <ExclamationTriangleIcon class="w-3.5 h-3.5" />
                Error
              </p>
              <p class="font-mono leading-relaxed break-words">{{ run.error_message }}</p>
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
  ArrowsRightLeftIcon,
  BoltIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";

import StatusBadge from "../components/StatusBadge.vue";
import { tenderApi } from "../api/tender";
import { formatDateTime, formatRelative } from "../utils/dateUtils";
import { runLook, formatDuration } from "../utils/runs";

const runs    = ref([]);
const portals = ref([]);
const loading = ref(true);
const limit   = ref(50);
const portal  = ref("");
const filter  = ref("all");
const toast   = useToast();

const n = (v) => Number(v || 0).toLocaleString("en-IN");
const filterOptions = ["all", "running", "success", "partial", "failed"];

const counts = computed(() => {
  const c = {};
  for (const r of runs.value) c[r.status] = (c[r.status] || 0) + 1;
  return c;
});

const summary = computed(() => [
  { key: "running", label: "Running", value: counts.value.running || 0, border: "border-blue-500", text: "text-blue-600" },
  { key: "success", label: "Success", value: counts.value.success || 0, border: "border-emerald-500", text: "text-emerald-600" },
  { key: "partial", label: "Partial", value: counts.value.partial || 0, border: "border-amber-500", text: "text-amber-600" },
  { key: "failed",  label: "Failed",  value: counts.value.failed || 0,  border: "border-red-500", text: "text-red-600" },
  { key: "total",   label: "Total Runs", value: runs.value.length, border: "border-slate-400", text: "text-slate-900" },
]);

const filtered = computed(() =>
  filter.value === "all" ? runs.value : runs.value.filter((r) => r.status === filter.value)
);

async function load() {
  loading.value = true;
  try {
    const params = { limit: limit.value };
    if (portal.value) params.portal = portal.value;
    const res = await tenderApi.getSweeps(params);
    runs.value = res.sweeps || [];
  } catch (e) {
    toast.error(`Failed to load runs: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  load();
  try {
    portals.value = (await tenderApi.listPortals(0)).portals || [];
  } catch { /* filter stays empty */ }
});
</script>

<style scoped>
.chip {
  @apply flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium;
}
</style>
