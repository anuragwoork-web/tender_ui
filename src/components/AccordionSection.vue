<template>
  <div class="card overflow-hidden">
    <button
      @click="open = !open"
      class="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors duration-200"
    >
      <div class="flex items-center gap-3">
        <component v-if="icon" :is="icon" class="w-5 h-5 text-primary-600" />
        <span class="font-semibold text-slate-900">{{ title }}</span>
        <span v-if="count" class="badge-neutral">{{ count }} items</span>
      </div>
      <ChevronDownIcon
        class="w-5 h-5 text-slate-400 transition-transform duration-300"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[2000px]"
      leave-from-class="opacity-100 max-h-[2000px]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="open" class="overflow-hidden">
        <div class="px-6 pb-5 pt-2 border-t border-slate-100">
          <slot />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  title:        { type: String, required: true },
  icon:         Object,
  count:        [Number, String],
  defaultOpen:  { type: Boolean, default: false },
});

const open = ref(props.defaultOpen);
</script>
