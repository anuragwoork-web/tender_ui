<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Status
            </th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Title
            </th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              Organisation
            </th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              Reference
            </th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              Portal
            </th>
            <th class="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
              Closing
            </th>
            <th class="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tender in tenders"
            :key="tender.id"
            @click="$router.push(`/tenders/${tender.id}`)"
            class="border-b border-slate-100 last:border-b-0 hover:bg-primary-50/40 transition-colors duration-200 cursor-pointer group"
          >
            <!-- Status -->
            <td class="px-4 py-3">
              <StatusBadge :type="statusOf(tender).type" :label="statusOf(tender).label" />
            </td>

            <!-- Title -->
            <td class="px-4 py-3 max-w-md">
              <p class="font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {{ tender.title || "Untitled" }}
              </p>
              <p v-if="tender.listing_type || tender.tender_category" class="mt-1 flex flex-wrap items-center gap-1.5">
                <span v-if="tender.listing_type" class="badge-neutral">{{ listingTypeLabel(tender.listing_type) }}</span>
                <span v-if="tender.tender_category" class="text-xs text-slate-500">{{ tender.tender_category }}</span>
              </p>
            </td>

            <!-- Org -->
            <td class="px-4 py-3 max-w-[200px]">
              <p class="text-sm text-slate-600 line-clamp-1">
                {{ tender.organisation_name || "—" }}
              </p>
            </td>

            <!-- Ref -->
            <td class="px-4 py-3 max-w-[180px]">
              <p class="text-xs font-mono text-slate-700 line-clamp-1">
                {{ tender.tender_reference || "—" }}
              </p>
            </td>

            <!-- Portal -->
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="text-xs font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {{ tender.portal_code }}
              </span>
            </td>

            <!-- Closing -->
            <td class="px-4 py-3 whitespace-nowrap">
              <p class="text-sm text-slate-700 font-medium">
                {{ formatDate(tender.closing_date) }}
              </p>
              <p
                v-if="daysLeftOf(tender) !== null && daysLeftOf(tender) >= 0"
                class="text-xs text-slate-400"
              >
                {{ daysLeftOf(tender) }}d left
              </p>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button
                @click.stop="onBookmark(tender)"
                class="p-1.5 rounded-md hover:bg-amber-100 transition-all duration-200 active:scale-90"
              >
                <StarSolidIcon v-if="isBookmarked(tender.id)" class="w-4 h-4 text-amber-500" />
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
import {
  StarIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import StatusBadge from "./StatusBadge.vue";
import { useBookmarks } from "../store/bookmarks";
import { formatDate, daysUntil, getTenderStatus } from "../utils/dateUtils";
import { listingTypeLabel } from "../utils/listingType";

defineProps({
  tenders: { type: Array, required: true },
});

const { isBookmarked, toggle } = useBookmarks();
const toast = useToast();

const statusOf    = (t) => getTenderStatus(t.closing_date, t.status);
const daysLeftOf  = (t) => (t.status === "closed" ? null : daysUntil(t.closing_date));

function onBookmark(tender) {
  toggle(tender);
  toast.success(isBookmarked(tender.id) ? "Bookmarked" : "Removed from bookmarks");
}
</script>
