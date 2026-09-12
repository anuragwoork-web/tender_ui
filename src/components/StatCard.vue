<template>
  <div
    class="card card-hover p-6 group cursor-pointer relative overflow-hidden"
    :class="bgClass"
  >
    <!-- Decorative gradient blob -->
    <div
      class="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150"
      :class="blobClass"
    />

    <div class="relative">
      <div class="flex items-start justify-between mb-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          :class="iconBgClass"
        >
          <component :is="icon" class="w-6 h-6" :class="iconColorClass" />
        </div>
        <span
          v-if="trend"
          class="text-xs font-medium px-2 py-1 rounded-full"
          :class="trendClass"
        >
          {{ trend }}
        </span>
      </div>

      <div>
        <p class="text-sm font-medium text-slate-500 mb-1">{{ label }}</p>
        <p class="text-3xl font-bold text-slate-900 tabular-nums">
          {{ formattedValue }}
        </p>
        <p v-if="subtitle" class="text-xs text-slate-400 mt-2">{{ subtitle }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label:    { type: String, required: true },
  value:    { type: [Number, String], required: true },
  icon:     { type: Object, required: true },
  subtitle: String,
  trend:    String,
  color:    { type: String, default: "blue" }, // blue, emerald, amber, red
});

const formattedValue = computed(() => {
  if (typeof props.value === "number") {
    return props.value.toLocaleString("en-IN");
  }
  return props.value;
});

const colorMap = {
  blue:    { bg: "bg-blue-50",    icon: "bg-blue-100",    iconColor: "text-blue-600",    blob: "bg-blue-400" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100", iconColor: "text-emerald-600", blob: "bg-emerald-400" },
  amber:   { bg: "bg-amber-50",   icon: "bg-amber-100",   iconColor: "text-amber-600",   blob: "bg-amber-400" },
  red:     { bg: "bg-red-50",     icon: "bg-red-100",     iconColor: "text-red-600",     blob: "bg-red-400" },
};

const bgClass        = computed(() => colorMap[props.color].bg);
const iconBgClass    = computed(() => colorMap[props.color].icon);
const iconColorClass = computed(() => colorMap[props.color].iconColor);
const blobClass      = computed(() => colorMap[props.color].blob);

const trendClass = computed(() => {
  if (!props.trend) return "";
  if (props.trend.startsWith("+")) return "bg-emerald-100 text-emerald-700";
  if (props.trend.startsWith("-")) return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
});
</script>
