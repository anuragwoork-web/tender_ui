<template>
  <button
    @click="download"
    :disabled="busy"
    class="btn-ghost flex items-center gap-2 disabled:opacity-50"
    title="Counts, runs, field completeness and recent logs in one zip (no passwords or cookies)"
  >
    <ArrowPathIcon v-if="busy" class="w-4 h-4 animate-spin" />
    <ArrowDownTrayIcon v-else class="w-4 h-4" />
    {{ busy ? "Preparing…" : "Download Report" }}
  </button>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "vue-toastification";
import { ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";
import { tenderApi } from "../api/tender";

const busy  = ref(false);
const toast = useToast();

async function download() {
  busy.value = true;
  try {
    const blob = await tenderApi.downloadReport();
    const stamp = new Date().toISOString().slice(0, 16).split("-").join("").split(":").join("").split("T").join("");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collector-report-${stamp}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded — ye zip file bhej do");
  } catch (e) {
    toast.error(`Report failed: ${e.message}`);
  } finally {
    busy.value = false;
  }
}
</script>
