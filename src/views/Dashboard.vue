<template>
  <div class="space-y-8 animate-slide-up">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p class="text-slate-500 mt-1">
          Overview of tender aggregation across all portals
        </p>
      </div>
      <button @click="refresh" class="btn-ghost flex items-center gap-2">
        <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Stats Cards -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="card p-6 animate-pulse h-36" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        label="Total Tenders"
        :value="stats.total_tenders || 0"
        :icon="DocumentTextIcon"
        subtitle="Across all portals"
        color="blue"
      />
      <StatCard
        label="Active Tenders"
        :value="stats.active_tenders || 0"
        :icon="CheckCircleIcon"
        subtitle="Currently accepting bids"
        color="emerald"
      />
      <StatCard
        label="Closing Soon"
        :value="stats.closing_soon || 0"
        :icon="ClockIcon"
        subtitle="Closing within 3 days"
        color="amber"
      />
    </div>

    <!-- Two-column section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Portal Breakdown -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Portal Breakdown</h2>
            <p class="text-xs text-slate-500 mt-0.5">Tenders per portal</p>
          </div>
          <Cog6ToothIcon class="w-5 h-5 text-slate-400" />
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-16 bg-slate-100 rounded-lg animate-pulse" />
        </div>

        <div v-else-if="(stats.portals || []).length" class="space-y-4">
          <div
            v-for="portal in stats.portals"
            :key="portal.code"
            class="group p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-card transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-200"
            @click="$router.push({ path: '/tenders', query: { portal: portal.code } })"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-soft">
                  {{ portal.code?.slice(0, 2).toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-slate-900">{{ portal.portal_name }}</p>
                  <p class="text-xs text-slate-500">{{ portal.code }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-slate-900 tabular-nums">
                  {{ Number(portal.tender_count || 0).toLocaleString("en-IN") }}
                </p>
                <p class="text-xs text-slate-400">
                  {{ portal.last_scraped ? formatRelative(portal.last_scraped) : "Never" }}
                </p>
              </div>
            </div>

            <!-- Progress bar (% of total) -->
            <div class="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
              <div
                class="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-500"
                :style="{ width: percentOfTotal(portal.tender_count) + '%' }"
              />
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-slate-400">
          <Cog6ToothIcon class="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No portals configured yet</p>
        </div>
      </div>

      <!-- Recent Runs -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Recent Scrape Runs</h2>
            <p class="text-xs text-slate-500 mt-0.5">Last 5 scheduled runs</p>
          </div>
          <router-link to="/logs" class="text-xs font-medium text-primary-600 hover:text-primary-700">
            View all →
          </router-link>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-14 bg-slate-100 rounded-lg animate-pulse" />
        </div>

        <div v-else-if="(stats.recent_runs || []).length" class="space-y-2">
          <div
            v-for="(run, i) in stats.recent_runs"
            :key="i"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center"
              :class="runStatusBg(run.status)"
            >
              <component :is="runStatusIcon(run.status)" class="w-5 h-5" :class="runStatusColor(run.status)" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900 uppercase text-xs">{{ run.portal }}</span>
                <StatusBadge :type="badgeType(run.status)" :label="run.status" />
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ formatRelative(run.started_at) }} ·
                new {{ run.new_tenders || 0 }} ·
                skip {{ run.skipped_existing || 0 }} ·
                fail {{ run.failed_tenders || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-slate-400">
          <ClockIcon class="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No scrape runs yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useToast } from "vue-toastification";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/vue/24/outline";

import StatCard from "../components/StatCard.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { tenderApi } from "../api/tender";
import { formatRelative } from "../utils/dateUtils";

const stats   = ref({});
const loading = ref(true);
const toast   = useToast();

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

const totalCount = computed(() =>
  (stats.value.portals || []).reduce((sum, p) => sum + Number(p.tender_count || 0), 0)
);

function percentOfTotal(count) {
  if (!totalCount.value) return 0;
  return Math.min(100, (Number(count || 0) / totalCount.value) * 100);
}

function runStatusBg(status) {
  if (status === "success") return "bg-emerald-100";
  if (status === "partial") return "bg-amber-100";
  if (status === "failed")  return "bg-red-100";
  return "bg-slate-100";
}
function runStatusColor(status) {
  if (status === "success") return "text-emerald-600";
  if (status === "partial") return "text-amber-600";
  if (status === "failed")  return "text-red-600";
  return "text-slate-500";
}
function runStatusIcon(status) {
  if (status === "success") return CheckCircleIcon;
  if (status === "partial") return ExclamationTriangleIcon;
  if (status === "failed")  return XCircleIcon;
  return ClockIcon;
}
function badgeType(status) {
  if (status === "success") return "success";
  if (status === "partial") return "warning";
  if (status === "failed")  return "danger";
  return "neutral";
}
</script>
