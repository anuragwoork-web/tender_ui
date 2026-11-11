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
    // IST, whatever the browser's zone: shift by +05:30, then read the UTC fields.
    const ist = new Date(Date.now() + 330 * 60 * 1000).toISOString();
    const stamp = ist.slice(0, 10).split("-").join("") + "-" + ist.slice(11, 16).split(":").join("");
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
