<template>
  <div class="card p-4 flex flex-wrap items-center gap-3 animate-fade-in">
    <!-- Portal -->
    <div class="relative">
      <select
        v-model="local.portal"
        @change="emitChange"
        class="appearance-none input-field pr-9 cursor-pointer min-w-[140px]"
      >
        <option value="">All Portals</option>
        <option v-for="p in portals" :key="p.code" :value="p.code">
          {{ p.name }}
        </option>
      </select>
      <ChevronDownIcon class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>

    <!-- Status -->
    <div class="relative">
      <select
        v-model="local.status"
        @change="emitChange"
        class="appearance-none input-field pr-9 cursor-pointer min-w-[140px]"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="closed">Closed</option>
      </select>
      <ChevronDownIcon class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>

    <!-- Closing date -->
    <div class="relative">
      <input
        v-model="local.closing_before"
        @change="emitChange"
        type="date"
        class="input-field min-w-[160px]"
        placeholder="Closes before"
      />
    </div>

    <!-- Sort -->
    <div class="relative">
      <select
        v-model="local.sort_by"
        @change="emitChange"
        class="appearance-none input-field pr-9 cursor-pointer min-w-[180px]"
      >
        <option value="published_date">Sort: Newest</option>
        <option value="closing_date">Sort: Closing Date</option>
        <option value="title">Sort: Title (A-Z)</option>
      </select>
      <ChevronDownIcon class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>

    <!-- Clear -->
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

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  portals:    { type: Array,  default: () => [] },
});

const emit = defineEmits(["update:modelValue", "change"]);

const local = ref({
  portal:         "",
  status:         "",
  closing_before: "",
  sort_by:        "published_date",
  ...props.modelValue,
});

watch(() => props.modelValue, (val) => {
  local.value = { ...local.value, ...val };
}, { deep: true });

const hasFilters = computed(() =>
  local.value.portal || local.value.status || local.value.closing_before
);

function emitChange() {
  emit("update:modelValue", { ...local.value });
  emit("change", { ...local.value });
}

function clear() {
  local.value = { portal: "", status: "", closing_before: "", sort_by: "published_date" };
  emitChange();
}
</script>
