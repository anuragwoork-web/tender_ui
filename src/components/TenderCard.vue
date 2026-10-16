<template>
  <div
    @click="$router.push(`/tenders/${tender.id}`)"
    class="card card-hover p-5 cursor-pointer group relative overflow-hidden"
  >
    <!-- Top accent line based on status -->
    <div
      class="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
      :class="accentLine"
    />

    <!-- Top row: status + portal -->
    <div class="flex items-center justify-between mb-3">
      <StatusBadge :type="status.type" :label="status.label" />
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {{ tender.portal_code }}
        </span>
        <button
          @click.stop="onBookmark"
          class="p-1.5 rounded-lg hover:bg-amber-50 transition-all duration-200 active:scale-90"
        >
          <StarSolidIcon v-if="bookmarked" class="w-5 h-5 text-amber-500" />
          <StarIcon v-else class="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors" />
        </button>
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-base font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
      {{ tender.title || "Untitled tender" }}
    </h3>

    <div v-if="tender.listing_type || tender.tender_category" class="flex flex-wrap items-center gap-1.5 mb-2">
      <span v-if="tender.listing_type" class="badge-neutral">{{ listingTypeLabel(tender.listing_type) }}</span>
      <span v-if="tender.tender_category" class="text-xs text-slate-500">{{ tender.tender_category }}</span>
    </div>

    <!-- Org -->
    <div class="flex items-center gap-2 text-sm text-slate-600 mb-3">
      <BuildingOffice2Icon class="w-4 h-4 text-slate-400 shrink-0" />
      <span class="line-clamp-1">{{ tender.organisation_name || "—" }}</span>
    </div>

    <!-- Bottom row: dates + ref -->
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
      <div class="flex items-center gap-1.5">
        <CalendarIcon class="w-4 h-4 text-slate-400" />
        <span class="font-medium">Closes:</span>
        <span class="text-slate-700">{{ formatDate(tender.closing_date) }}</span>
        <span v-if="daysLeft !== null && daysLeft >= 0" class="text-slate-400">
          ({{ daysLeft }}d left)
        </span>
      </div>
      <div v-if="tender.tender_reference" class="flex items-center gap-1.5 truncate">
        <HashtagIcon class="w-4 h-4 text-slate-400" />
        <span class="font-medium">Ref:</span>
        <span class="text-slate-700 truncate font-mono">{{ tender.tender_reference }}</span>
      </div>
    </div>

    <!-- Hover footer (View Details arrow) -->
    <div class="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <ArrowRightIcon class="w-4 h-4 text-primary-600" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useToast } from "vue-toastification";
import {
  BuildingOffice2Icon,
  CalendarIcon,
  HashtagIcon,
  StarIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import StatusBadge from "./StatusBadge.vue";
import { useBookmarks } from "../store/bookmarks";
import { formatDate, daysUntil, getTenderStatus } from "../utils/dateUtils";
import { listingTypeLabel } from "../utils/listingType";

const props = defineProps({
  tender: { type: Object, required: true },
});

const { isBookmarked, toggle } = useBookmarks();
const toast = useToast();

const bookmarked = computed(() => isBookmarked(props.tender.id));
const status     = computed(() => getTenderStatus(props.tender.closing_date, props.tender.status));
const daysLeft   = computed(() => (props.tender.status === "closed" ? null : daysUntil(props.tender.closing_date)));

const accentLine = computed(() => {
  const map = {
    success: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    warning: "bg-gradient-to-r from-amber-400 to-amber-600",
    danger:  "bg-gradient-to-r from-red-400 to-red-600",
    neutral: "bg-gradient-to-r from-slate-300 to-slate-400",
  };
  return map[status.value.type] || map.neutral;
});

function onBookmark() {
  toggle(props.tender);
  toast.success(bookmarked.value ? "Bookmarked" : "Removed from bookmarks");
}
</script>
