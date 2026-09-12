<template>
  <div class="flex min-h-screen">
    <Sidebar />
    <div class="flex-1 flex flex-col">
      <Navbar :last-update="lastUpdate" />
      <main class="flex-1 p-8 animate-fade-in">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Sidebar from "./Sidebar.vue";
import Navbar from "./Navbar.vue";
import { tenderApi } from "../../api/tender";
import { formatRelative } from "../../utils/dateUtils";

const lastUpdate = ref("");

onMounted(async () => {
  try {
    const stats = await tenderApi.getStats();
    const recent = stats.recent_runs?.[0];
    if (recent?.finished_at) {
      lastUpdate.value = formatRelative(recent.finished_at);
    }
  } catch {
    lastUpdate.value = "";
  }
});
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
