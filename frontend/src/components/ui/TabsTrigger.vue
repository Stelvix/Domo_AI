<template>
  <TabsTrigger
    :value="value"
    :class="
      cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1 text-xs font-mono font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border',
        $attrs.class as string
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>

<script setup lang="ts">
import { TabsTrigger } from 'radix-vue';
import { cn } from '@/lib/utils';

defineProps<{
  value: string;
}>();
</script>
