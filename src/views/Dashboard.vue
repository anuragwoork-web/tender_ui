<template>
  <div class="space-y-8 animate-slide-up">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p class="text-slate-500 mt-1">All-India tender collector — live view of the collector database</p>
      </div>
      <button @click="refresh" class="btn-ghost flex items-center gap-2">
        <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Stats -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="card p-6 animate-pulse h-36" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        label="Active Tenders"
        :value="stats.active_tenders || 0"
        :icon="DocumentTextIcon"
        :subtitle="`${portalsWithData} portals · ${n(stats.total_tenders)} stored in all`"
        color="blue"
        @click="$router.push('/tenders')"
      />
      <StatCard
        label="Closing Soon"
        :value="stats.closing_soon || 0"
        :icon="ClockIcon"
        subtitle="Active, closing within 3 days"
        color="amber"
        @click="$router.push({ path: '/tenders', query: { closing_before: in3Days } })"
      />
      <StatCard
        label="New Today"
        :value="stats.new_today || 0"
        :icon="SparklesIcon"
        subtitle="First seen since 00:00 IST"
        color="emerald"
        @click="$router.push({ path: '/tenders', query: { sort: 'first_seen_at:desc' } })"
      />
      <StatCard
        label="Full Detail"
        :value="stats.active_with_detail || 0"
        :icon="DocumentMagnifyingGlassIcon"
        :subtitle="`${detailPct}% of active tenders have detail (EMD, fee, value…)`"
        color="red"
        @click="$router.push({ path: '/tenders', query: { has_detail: 'true' } })"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Portal breakdown -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Portal Breakdown</h2>
            <p class="text-xs text-slate-500 mt-0.5">Active tenders per portal · bar = share of detail fetched</p>
          </div>
          <router-link to="/portals" class="text-xs font-medium text-primary-600 hover:text-primary-700">All portals →</router-link>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-14 bg-slate-100 rounded-lg animate-pulse" />
        </div>

        <div v-else-if="topPortals.length" class="space-y-2 max-h-[560px] overflow-y-auto pr-1">
          <div
            v-for="portal in topPortals"
            :key="portal.code"
            class="group p-3 rounded-xl bg-slate-50 hover:bg-white hover:shadow-card transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-200"
            @click="$router.push({ path: '/tenders', query: { portal: portal.code } })"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-xs shadow-soft">
                  {{ portal.code.slice(0, 3).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-slate-900 truncate">{{ portal.name }}</p>
                  <p class="text-xs text-slate-500">
                    {{ portal.code }} · seen {{ portal.last_seen ? formatRelative(portal.last_seen) : "never" }}
                  </p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xl font-bold text-slate-900 tabular-nums">{{ n(portal.active) }}</p>
                <p class="text-[11px] text-slate-400 tabular-nums">detail {{ pct(portal.with_detail, portal.active) }}%</p>
              </div>
            </div>
            <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                :style="{ width: pct(portal.with_detail, portal.active) + '%' }"
              />
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-slate-400">
          <Cog6ToothIcon class="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No tenders collected yet</p>
        </div>
      </div>

      <!-- Recent sweeps -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Recent Collector Runs</h2>
            <p class="text-xs text-slate-500 mt-0.5">Latest portal sweeps</p>
          </div>
          <router-link to="/logs" class="text-xs font-medium text-primary-600 hover:text-primary-700">View all →</router-link>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-14 bg-slate-100 rounded-lg animate-pulse" />
        </div>

        <div v-else-if="(stats.recent_sweeps || []).length" class="space-y-2">
          <div
            v-for="run in stats.recent_sweeps"
            :key="run.id"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            <div class="w-9 h-9 rounded-full flex items-center justify-center" :class="look(run.status).bg">
              <component :is="look(run.status).icon" class="w-5 h-5" :class="[look(run.status).color, run.status === 'running' ? 'animate-spin' : '']" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900 uppercase text-xs">{{ run.portal }}</span>
                <StatusBadge :type="look(run.status).badge" :label="run.status" />
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ formatRelative(run.started_at) }}
                <template v-if="run.status !== 'running'">
                  · listed {{ n(run.listed) }}<span v-if="run.expected">/{{ n(run.expected) }}</span>
                  · new {{ n(run.new_count) }} · changed {{ n(run.changed_count) }} · gone {{ n(run.gone_count) }}
                  · details {{ n(run.details_fetched) }}
                </template>
              </p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-slate-400">
          <ClockIcon class="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No collector runs yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import {
  ArrowPathIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@heroicons/vue/24/outline";

import StatCard from "../components/StatCard.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { tenderApi } from "../api/tender";
import { formatRelative } from "../utils/dateUtils";
import { runLook } from "../utils/runs";

const stats   = ref({});
const loading = ref(true);
const toast   = useToast();

const n = (v) => Number(v || 0).toLocaleString("en-IN");
const pct = (part, whole) => (whole ? Math.round((Number(part || 0) / whole) * 100) : 0);
const look = runLook;

const topPortals = computed(() => (stats.value.portals || []).filter((p) => p.total > 0));
const portalsWithData = computed(() => topPortals.value.length);
const detailPct = computed(() => pct(stats.value.active_with_detail, stats.value.active_tenders));

const in3Days = (() => {
  const d = new Date(Date.now() + 3 * 86400000);
  return d.toISOString().slice(0, 10);
})();

async function load() {
  loading.value = true;
  try {
    stats.value = await tenderApi.getStats();
  } catch (e) {
    toast.error(`Failed to load stats: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function refresh() {
  await load();
  toast.success("Dashboard refreshed");
}

onMounted(load);
</script>
