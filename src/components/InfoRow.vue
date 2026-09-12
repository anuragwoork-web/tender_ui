<template>
  <div class="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
    <component v-if="icon" :is="icon" class="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <p class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">
        {{ label }}
      </p>
      <p class="text-sm text-slate-900 font-medium break-words" :class="valueClass">
        <slot>{{ value || "—" }}</slot>
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: [String, Number],
  icon:  Object,
  valueClass: String,
});
</script>
