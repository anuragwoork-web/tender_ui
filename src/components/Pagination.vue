<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
    <button
      @click="$emit('change', currentPage - 1)"
      :disabled="currentPage === 1"
      class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      <ChevronLeftIcon class="w-4 h-4" />
    </button>

    <button
      v-for="p in visiblePages"
      :key="p + '_' + Math.random()"
      @click="typeof p === 'number' && $emit('change', p)"
      :disabled="p === '...'"
      class="min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200"
      :class="[
        p === currentPage
          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow'
          : p === '...'
            ? 'text-slate-400 cursor-default'
            : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-primary-300'
      ]"
    >
      {{ p }}
    </button>

    <button
      @click="$emit('change', currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      <ChevronRightIcon class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages:  { type: Number, required: true },
});
defineEmits(["change"]);

const visiblePages = computed(() => {
  const total = props.totalPages;
  const cur = props.currentPage;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (cur > 3) pages.push("...");

  const start = Math.max(2, cur - 1);
  const end   = Math.min(total - 1, cur + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (cur < total - 2) pages.push("...");
  pages.push(total);
  return pages;
});
</script>
