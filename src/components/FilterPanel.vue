<template>
  <div class="card p-4 flex flex-wrap items-center gap-3 animate-fade-in">
    <!-- Portal -->
    <div class="relative">
      <select v-model="local.portal" @change="emitChange" class="appearance-none input-field pr-9 cursor-pointer min-w-[160px]">
        <option value="">All Portals</option>
        <option v-for="p in portals" :key="p.code" :value="p.code">
          {{ p.name }} ({{ Number(p.active || 0).toLocaleString("en-IN") }})
        </option>
      </select>
      <ChevronDownIcon class="chev" />
    </div>

    <!-- State -->
    <div class="relative">
      <select v-model="local.state" @change="emitChange" class="appearance-none input-field pr-9 cursor-pointer min-w-[150px]">
        <option value="">All States</option>
        <option v-for="s in states" :key="s.value" :value="s.value">
          {{ s.value }} ({{ Number(s.count).toLocaleString("en-IN") }})
        </option>
      </select>
      <ChevronDownIcon class="chev" />
    </div>

    <!-- Status -->
    <div class="relative">
      <select v-model="local.lifecycle" @change="emitChange" class="appearance-none input-field pr-9 cursor-pointer min-w-[140px]">
        <option value="active">Active</option>
        <option value="closed">Closed</option>
        <option value="withdrawn_or_cancelled?">Gone from portal</option>
        <option value="any">Any status</option>
      </select>
      <ChevronDownIcon class="chev" />
    </div>

    <!-- Detail -->
    <div class="relative">
      <select v-model="local.has_detail" @change="emitChange" class="appearance-none input-field pr-9 cursor-pointer min-w-[150px]">
        <option value="">Detail: all</option>
        <option value="true">With full detail</option>
        <option value="false">List only</option>
      </select>
      <ChevronDownIcon class="chev" />
    </div>

    <!-- Closing date -->
    <label class="flex items-center gap-2 text-sm text-slate-500">
      Closes by
      <input v-model="local.closing_before" @change="emitChange" type="date" class="input-field min-w-[150px]" />
    </label>

    <!-- Sort -->
    <div class="relative">
      <select v-model="local.sort" @change="emitChange" class="appearance-none input-field pr-9 cursor-pointer min-w-[190px]">
        <option v-for="o in SORTS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <ChevronDownIcon class="chev" />
    </div>

    <button
      v-if="hasFilters"
      @click="clear"
      class="text-sm text-slate-500 hover:text-red-600 font-medium ml-auto flex items-center gap-1 transition-colors"
    >
      <XMarkIcon class="w-4 h-4" />
      Clear all
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { DEFAULT_FILTERS } from "../utils/tender";

// value = "<column>:<asc|desc>" — split by the list page into sort + order
const SORTS = [
  { value: "closing_at:asc",       label: "Sort: Closing soonest" },
  { value: "published_at:desc",    label: "Sort: Newest published" },
  { value: "first_seen_at:desc",   label: "Sort: Newly found" },
  { value: "estimated_value:desc", label: "Sort: Highest value" },
  { value: "emd_amount:desc",      label: "Sort: Highest EMD" },
  { value: "title:asc",            label: "Sort: Title (A-Z)" },
];

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  portals:    { type: Array,  default: () => [] },
  states:     { type: Array,  default: () => [] },
});

const emit = defineEmits(["update:modelValue", "change"]);

const local = ref({ ...DEFAULT_FILTERS, ...props.modelValue });

watch(() => props.modelValue, (val) => {
  local.value = { ...local.value, ...val };
}, { deep: true });

const hasFilters = computed(() =>
  Object.keys(DEFAULT_FILTERS).some((k) => local.value[k] !== DEFAULT_FILTERS[k])
);

function emitChange() {
  emit("update:modelValue", { ...local.value });
  emit("change", { ...local.value });
}

function clear() {
  local.value = { ...DEFAULT_FILTERS };
  emitChange();
}
</script>

<style scoped>
.chev {
  @apply absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none;
}
</style>
