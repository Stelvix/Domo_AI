<template>
  <div class="flex items-center space-x-2 text-xs font-mono">
    <div
      class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
      :title="systemPrompt || 'Prompt système par défaut'"
    >
      <ShieldAlert :size="13" class="text-sky-400" />
      <span class="font-medium truncate max-w-[150px] sm:max-w-[220px]">
        {{ role || 'Assistant AOC' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next';

defineProps<{
  role?: string | null;
  systemPrompt?: string | null;
}>();
</script>
