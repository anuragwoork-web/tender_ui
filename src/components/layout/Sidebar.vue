<template>
  <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0">
    <div class="px-6 py-6 border-b border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
          <DocumentTextIcon class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-white font-bold text-lg leading-tight">Tender Hub</h1>
          <p class="text-xs text-slate-400">Aggregator</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group"
        :class="[
          $route.path === item.path
            ? 'bg-primary-600/20 text-white shadow-glow ring-1 ring-primary-500/30'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5 transition-transform group-hover:scale-110" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary-500 text-white"
        >
          {{ item.badge }}
        </span>
      </router-link>
    </nav>

    <div class="px-4 py-4 border-t border-slate-800">
      <div class="text-xs text-slate-500">
        v1.1.0 · Intelvo Tech
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import {
  HomeIcon,
  DocumentTextIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
} from "@heroicons/vue/24/outline";
import { useBookmarks } from "../../store/bookmarks";

const { bookmarks } = useBookmarks();

const navItems = computed(() => [
  { path: "/",          label: "Dashboard",   icon: HomeIcon },
  { path: "/tenders",   label: "Tenders",     icon: DocumentTextIcon },
  { path: "/bookmarks", label: "Bookmarks",   icon: StarIcon, badge: bookmarks.value.length || null },
  { path: "/logs",      label: "Scrape Logs", icon: ClipboardDocumentListIcon },
  { path: "/portals",   label: "Portals",     icon: Cog6ToothIcon },
]);
</script>
