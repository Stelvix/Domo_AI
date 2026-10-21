<template>
  <TabsContent
    :value="value"
    :class="
      cn(
        'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        $attrs.class as string
      )
    "
  >
    <slot />
  </TabsContent>
</template>

<script setup lang="ts">
import { TabsContent } from 'radix-vue';
import { cn } from '@/lib/utils';

defineProps<{
  value: string;
}>();
</script>
