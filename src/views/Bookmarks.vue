<template>
  <div class="space-y-6 animate-slide-up">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <StarSolidIcon class="w-8 h-8 text-amber-500" />
          Bookmarks
        </h1>
        <p class="text-slate-500 mt-1">
          <span v-if="bookmarks.length">
            <span class="font-semibold text-slate-900">{{ bookmarks.length }}</span>
            saved tender{{ bookmarks.length === 1 ? '' : 's' }}
          </span>
          <span v-else>No tenders saved yet</span>
        </p>
      </div>

      <button
        v-if="bookmarks.length"
        @click="confirmClear"
        class="btn-ghost flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200"
      >
        <TrashIcon class="w-4 h-4" />
        Clear all
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!bookmarks.length" class="card p-16 text-center">
      <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <StarIcon class="w-12 h-12 text-amber-400" />
      </div>
      <h3 class="text-xl font-bold text-slate-900 mb-2">No bookmarks yet</h3>
      <p class="text-slate-500 mb-6 max-w-md mx-auto">
        Star ⭐ any tender to save it here for quick access later.
        Bookmarks are saved locally in your browser.
      </p>
      <router-link to="/tenders" class="btn-primary inline-flex items-center gap-2">
        <DocumentTextIcon class="w-4 h-4" />
        Browse Tenders
      </router-link>
    </div>

    <!-- Sort bar -->
    <div v-else class="flex items-center gap-3 text-sm">
      <span class="text-slate-500">Sort by:</span>
      <button
        v-for="opt in sortOptions"
        :key="opt.value"
        @click="sortBy = opt.value"
        class="px-3 py-1 rounded-full font-medium transition-all duration-200"
        :class="sortBy === opt.value
          ? 'bg-primary-600 text-white shadow-soft'
          : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Grid -->
    <div v-if="bookmarks.length" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TenderCard
        v-for="tender in sortedBookmarks"
        :key="tender.id"
        :tender="tender"
      />
    </div>

    <!-- Confirmation modal -->
    <transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showConfirm"
        @click.self="showConfirm = false"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div class="card p-6 max-w-md w-full animate-slide-up">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">Clear all bookmarks?</h3>
          <p class="text-sm text-slate-600 mb-6">
            This will remove all {{ bookmarks.length }} saved tenders from your browser.
            This cannot be undone.
          </p>
          <div class="flex items-center gap-3 justify-end">
            <button @click="showConfirm = false" class="btn-ghost">Cancel</button>
            <button
              @click="clearAll"
              class="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useToast } from "vue-toastification";
import {
  StarIcon,
  TrashIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/vue/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/vue/24/solid";

import TenderCard from "../components/TenderCard.vue";
import { useBookmarks } from "../store/bookmarks";

const { bookmarks } = useBookmarks();
const toast = useToast();

const showConfirm = ref(false);
const sortBy = ref("newest");

const sortOptions = [
  { value: "newest",  label: "Recently Bookmarked" },
  { value: "closing", label: "Closing Soonest" },
  { value: "title",   label: "Title A-Z" },
];

const sortedBookmarks = computed(() => {
  const list = [...bookmarks.value];
  if (sortBy.value === "newest") {
    return list.sort((a, b) =>
      new Date(b.bookmarked_at || 0) - new Date(a.bookmarked_at || 0)
    );
  }
  if (sortBy.value === "closing") {
    return list.sort((a, b) =>
      new Date(a.closing_date || 0) - new Date(b.closing_date || 0)
    );
  }
  if (sortBy.value === "title") {
    return list.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
  }
  return list;
});

function confirmClear() {
  showConfirm.value = true;
}

function clearAll() {
  bookmarks.value.splice(0, bookmarks.value.length);
  showConfirm.value = false;
  toast.success("All bookmarks cleared");
}
</script>
