<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="th">Status</th>
            <th class="th">Title</th>
            <th class="th whitespace-nowrap">Organisation</th>
            <th class="th whitespace-nowrap">Location</th>
            <th class="th whitespace-nowrap text-right">Value / EMD</th>
            <th class="th whitespace-nowrap">Portal</th>
            <th class="th whitespace-nowrap">Closing</th>
            <th class="th text-right"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tender in tenders"
            :key="tenderKey(tender)"
            @click="$router.push(tenderRoute(tender))"
            class="border-b border-slate-100 last:border-b-0 hover:bg-primary-50/40 transition-colors duration-200 cursor-pointer group"
          >
            <td class="px-4 py-3">
              <StatusBadge :type="tenderStatus(tender).type" :label="tenderStatus(tender).label" />
            </td>

            <td class="px-4 py-3 max-w-md">
              <p class="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {{ tender.title || "Untitled" }}
              </p>
              <p class="text-[11px] font-mono text-slate-400 mt-0.5 line-clamp-1">
                {{ tender.tender_id }}<span v-if="tender.ref_no && tender.ref_no !== tender.tender_id"> · {{ tender.ref_no }}</span>
              </p>
            </td>

            <td class="px-4 py-3 max-w-[220px]">
              <p class="text-sm text-slate-600 line-clamp-2">{{ orgOf(tender) || "—" }}</p>
            </td>

            <td class="px-4 py-3 max-w-[160px]">
              <p class="text-sm text-slate-600 line-clamp-2">{{ placeOf(tender) || "—" }}</p>
            </td>

            <td class="px-4 py-3 text-right whitespace-nowrap">
              <p class="text-sm font-semibold text-slate-800 tabular-nums">{{ formatMoneyShort(tender.estimated_value) }}</p>
              <p v-if="tender.emd_amount !== null && tender.emd_amount !== undefined" class="text-[11px] text-slate-400 tabular-nums">
                EMD {{ formatMoneyShort(tender.emd_amount) }}
              </p>
            </td>

            <td class="px-4 py-3 whitespace-nowrap">
              <span class="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {{ tender.portal }}
              </span>
              <span
                v-if="!tender.detail_fetched_at"
                class="block text-[10px] text-slate-400 mt-1"
                title="Detail page not fetched yet — only listing fields so far"
              >list only</span>
            </td>

            <td class="px-4 py-3 whitespace-nowrap">
              <p class="text-sm text-slate-700 font-medium">{{ formatDateTime(tender.closing_at) }}</p>
              <p
                v-if="daysUntil(tender.closing_at) !== null && daysUntil(tender.closing_at) >= 0"
                class="text-xs text-slate-400"
              >
                {{ daysUntil(tender.closing_at) }}d left
              </p>
            </td>

            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button
                @click.stop="onBookmark(tender)"
                class="p-1.5 rounded-md hover:bg-amber-100 transition-all duration-200 active:scale-90"
                :title="isBookmarked(tender) ? 'Remove bookmark' : 'Bookmark'"
              >
                <StarSolidIcon v-if="isBookmarked(tender)" class="w-4 h-4 text-amber-500" />
                <StarIcon v-else class="w-4 h-4 text-slate-400" />
              </button>
              <ArrowRightIcon class="w-4 h-4 text-slate-400 inline-block ml-1 group-hover:translate-x-1 group-hover:text-primary-600 transition-all" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useToast } from "vue-toastification";
import { StarIcon, ArrowRightIcon } from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import StatusBadge from "./StatusBadge.vue";
import { useBookmarks } from "../store/bookmarks";
import { formatDateTime, daysUntil, tenderStatus } from "../utils/dateUtils";
import { tenderKey, tenderRoute, orgOf, placeOf, formatMoneyShort } from "../utils/tender";

defineProps({
  tenders: { type: Array, required: true },
});

const { isBookmarked, toggle } = useBookmarks();
const toast = useToast();

function onBookmark(tender) {
  toggle(tender);
  toast.success(isBookmarked(tender) ? "Bookmarked" : "Removed from bookmarks");
}
</script>

<style scoped>
.th {
  @apply text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider;
}
</style>
