<template>
  <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
    <div class="flex items-center justify-end px-8 py-4">
      <div
        v-if="lastUpdate"
        class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-200"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Updated {{ lastUpdate }}
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({ lastUpdate: String });
</script>
