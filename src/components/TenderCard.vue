<template>
  <div
    @click="$router.push(tenderRoute(tender))"
    class="card card-hover p-5 cursor-pointer group relative overflow-hidden"
  >
    <div
      class="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
      :class="accentLine"
    />

    <div class="flex items-center justify-between mb-3">
      <StatusBadge :type="status.type" :label="status.label" />
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          {{ tender.portal }}
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

    <h3 class="text-base font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
      {{ tender.title || "Untitled tender" }}
    </h3>

    <div class="flex items-center gap-2 text-sm text-slate-600 mb-1">
      <BuildingOffice2Icon class="w-4 h-4 text-slate-400 shrink-0" />
      <span class="line-clamp-1">{{ orgOf(tender) || "—" }}</span>
    </div>
    <div v-if="placeOf(tender)" class="flex items-center gap-2 text-sm text-slate-600 mb-3">
      <MapPinIcon class="w-4 h-4 text-slate-400 shrink-0" />
      <span class="line-clamp-1">{{ placeOf(tender) }}</span>
    </div>

    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
      <div class="flex items-center gap-1.5">
        <CalendarIcon class="w-4 h-4 text-slate-400" />
        <span class="font-medium">Closes:</span>
        <span class="text-slate-700">{{ formatDateTime(tender.closing_at) }}</span>
        <span v-if="daysLeft !== null && daysLeft >= 0" class="text-slate-400">({{ daysLeft }}d left)</span>
      </div>
      <div v-if="tender.estimated_value" class="flex items-center gap-1.5">
        <CurrencyRupeeIcon class="w-4 h-4 text-slate-400" />
        <span class="text-slate-700 font-semibold">{{ formatMoneyShort(tender.estimated_value) }}</span>
      </div>
      <div v-if="tender.emd_amount !== null && tender.emd_amount !== undefined" class="flex items-center gap-1.5">
        <span class="font-medium">EMD:</span>
        <span class="text-slate-700">{{ formatMoneyShort(tender.emd_amount) }}</span>
      </div>
      <div class="flex items-center gap-1.5 truncate">
        <HashtagIcon class="w-4 h-4 text-slate-400" />
        <span class="text-slate-700 truncate font-mono">{{ tender.tender_id }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useToast } from "vue-toastification";
import {
  BuildingOffice2Icon,
  CalendarIcon,
  CurrencyRupeeIcon,
  HashtagIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import StatusBadge from "./StatusBadge.vue";
import { useBookmarks } from "../store/bookmarks";
import { formatDateTime, daysUntil, tenderStatus } from "../utils/dateUtils";
import { tenderRoute, orgOf, placeOf, formatMoneyShort } from "../utils/tender";

const props = defineProps({
  tender: { type: Object, required: true },
});

const { isBookmarked, toggle } = useBookmarks();
const toast = useToast();

const bookmarked = computed(() => isBookmarked(props.tender));
const status     = computed(() => tenderStatus(props.tender));
const daysLeft   = computed(() => daysUntil(props.tender.closing_at));

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
