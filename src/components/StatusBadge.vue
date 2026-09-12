<template>
  <span :class="badgeClass">
    <span
      v-if="type === 'warning' || type === 'danger'"
      class="w-1.5 h-1.5 rounded-full"
      :class="dotClass"
    />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  type:  { type: String, default: "neutral" }, // success, warning, danger, neutral
  label: { type: String, required: true },
});

const badgeClass = computed(() => {
  const map = {
    success: "badge-success",
    warning: "badge-warning",
    danger:  "badge-danger",
    neutral: "badge-neutral",
  };
  return map[props.type] || "badge-neutral";
});

const dotClass = computed(() => {
  const map = {
    warning: "bg-amber-500",
    danger:  "bg-red-500",
  };
  return map[props.type] || "";
});
</script>
