<template>
  <div class="space-y-6 animate-slide-up">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Tenders</h1>
        <p class="text-slate-500 mt-1">
          <span v-if="loading">Loading…</span>
          <span v-else>
            <span class="font-semibold text-slate-900">{{ total.toLocaleString("en-IN") }}</span>
            tenders found
            <span v-if="hasActiveFilters" class="text-primary-600 ml-1">(filtered)</span>
          </span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View toggle -->
        <div class="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-soft">
          <button
            @click="viewMode = 'table'"
            class="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition-all duration-200"
            :class="viewMode === 'table'
              ? 'bg-primary-600 text-white shadow-soft'
              : 'text-slate-500 hover:text-slate-800'"
          >
            <TableCellsIcon class="w-4 h-4" />
            Table
          </button>
          <button
            @click="viewMode = 'cards'"
            class="px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition-all duration-200"
            :class="viewMode === 'cards'
              ? 'bg-primary-600 text-white shadow-soft'
              : 'text-slate-500 hover:text-slate-800'"
          >
            <Squares2X2Icon class="w-4 h-4" />
            Cards
          </button>
        </div>

        <button
          @click="onExport"
          :disabled="loading || !tenders.length"
          class="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowDownTrayIcon class="w-4 h-4" />
          Export to Excel
        </button>
      </div>
    </div>

    <!-- Search bar -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        v-model="searchInput"
        @input="debouncedSearch"
        type="text"
        placeholder="Search by title, tender ID, reference or organisation..."
        class="input-field pl-12 text-base"
      />
      <button
        v-if="searchInput"
        @click="clearSearch"
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 transition-colors"
      >
        <XMarkIcon class="w-4 h-4 text-slate-400" />
      </button>
    </div>

    <!-- Filters -->
    <FilterPanel
      v-model="filters"
      :portals="portals"
      :states="states"
      @change="onFilterChange"
    />

    <!-- Loading -->
    <div v-if="loading && !tenders.length">
      <div v-if="viewMode === 'table'" class="card p-6 animate-pulse h-96" />
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="i in 6" :key="i" class="card p-5 animate-pulse h-44" />
      </div>
    </div>

    <!-- Table view (default) -->
    <TenderTable
      v-else-if="tenders.length && viewMode === 'table'"
      :tenders="tenders"
    />

    <!-- Card view -->
    <div
      v-else-if="tenders.length && viewMode === 'cards'"
      class="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      <TenderCard
        v-for="tender in tenders"
        :key="tenderKey(tender)"
        :tender="tender"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="card p-12 text-center">
      <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <InboxIcon class="w-10 h-10 text-slate-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-1">No tenders found</h3>
      <p class="text-sm text-slate-500 mb-4">
        Try adjusting your filters or search query.
      </p>
      <button @click="resetAll" class="btn-ghost">Clear all filters</button>
    </div>

    <!-- Pagination -->
    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @change="changePage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useDebounceFn } from "@vueuse/core";
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  InboxIcon,
  TableCellsIcon,
  Squares2X2Icon,
} from "@heroicons/vue/24/outline";

import TenderCard from "../components/TenderCard.vue";
import TenderTable from "../components/TenderTable.vue";
import FilterPanel from "../components/FilterPanel.vue";
import Pagination from "../components/Pagination.vue";
import { tenderApi } from "../api/tender";
import { exportTendersToExcel } from "../utils/exportExcel";
import { DEFAULT_FILTERS, tenderKey } from "../utils/tender";

const route   = useRoute();
const router  = useRouter();
const toast   = useToast();

const tenders     = ref([]);
const portals     = ref([]);
const states      = ref([]);
const total       = ref(0);
const totalPages  = ref(0);
const currentPage = ref(Number(route.query.page) || 1);
const loading     = ref(true);
const limit       = 25;

function readView() {
  try { return localStorage.getItem("tender_view_mode") || "table"; } catch { return "table"; }
}
const viewMode = ref(readView());
watch(viewMode, (val) => { try { localStorage.setItem("tender_view_mode", val); } catch { /* ignore */ } });

const searchInput = ref(route.query.q || "");
const filters = ref(Object.fromEntries(
  Object.entries(DEFAULT_FILTERS).map(([k, v]) => [k, route.query[k] ?? v])
));

const hasActiveFilters = computed(() =>
  searchInput.value ||
  Object.keys(DEFAULT_FILTERS).some((k) => filters.value[k] !== DEFAULT_FILTERS[k])
);

async function loadPortals() {
  try {
    const res = await tenderApi.getStats();
    portals.value = (res.portals || []).filter((p) => p.total > 0);
  } catch (e) {
    console.error(e);
  }
}

async function loadStates() {
  try {
    const res = await tenderApi.getFacets(filters.value.portal || undefined);
    states.value = res.states || [];
  } catch (e) {
    states.value = [];
  }
}

// IST end of the chosen day, so "closes by 5 Nov" includes tenders closing on 5 Nov
const endOfDayIst = (d) => `${d}T23:59:59+05:30`;

async function loadTenders() {
  loading.value = true;
  try {
    const f = filters.value;
    const [sort, order] = (f.sort || DEFAULT_FILTERS.sort).split(":");
    const params = {
      page: currentPage.value,
      limit,
      portal: f.portal,
      state: f.state,
      lifecycle: f.lifecycle,
      has_detail: f.has_detail,
      closing_before: f.closing_before ? endOfDayIst(f.closing_before) : "",
      sort,
      order,
      q: searchInput.value.trim(),
    };
    Object.keys(params).forEach((k) => {
      if (params[k] === "" || params[k] === null || params[k] === undefined) delete params[k];
    });

    const res = await tenderApi.listTenders(params);
    tenders.value    = res.items || [];
    total.value      = res.total || 0;
    totalPages.value = Math.ceil((res.total || 0) / limit);

    // URL keeps the UI's own filter values (not the API's), so a reload restores the page
    const query = { ...f, q: searchInput.value.trim(), page: currentPage.value > 1 ? currentPage.value : "" };
    Object.keys(query).forEach((k) => {
      if (query[k] === "" || query[k] === DEFAULT_FILTERS[k]) delete query[k];
    });
    router.replace({ query });
  } catch (e) {
    toast.error(`Failed to load tenders: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1;
  loadTenders();
}, 400);

let lastPortal = filters.value.portal;
function onFilterChange() {
  currentPage.value = 1;
  if (filters.value.portal !== lastPortal) {
    lastPortal = filters.value.portal;
    filters.value.state = "";
    loadStates();
  }
  loadTenders();
}

function changePage(page) {
  currentPage.value = page;
  loadTenders();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearSearch() {
  searchInput.value = "";
  currentPage.value = 1;
  loadTenders();
}

function resetAll() {
  searchInput.value = "";
  filters.value = { ...DEFAULT_FILTERS };
  lastPortal = "";
  currentPage.value = 1;
  loadStates();
  loadTenders();
}

async function onExport() {
  try {
    await exportTendersToExcel(
      tenders.value,
      `tenders_page${currentPage.value}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("Excel file downloaded");
  } catch (e) {
    toast.error(`Export failed: ${e.message}`);
  }
}

watch(() => route.query.portal, (val) => {
  if ((val || "") !== filters.value.portal) {
    filters.value = { ...filters.value, portal: val || "", state: "" };
    lastPortal = filters.value.portal;
    currentPage.value = 1;
    loadStates();
    loadTenders();
  }
});

onMounted(async () => {
  loadPortals();
  loadStates();
  await loadTenders();
});
</script>
