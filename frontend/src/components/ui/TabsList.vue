<template>
  <TabsList
    :class="
      cn(
        'inline-flex h-9 items-center justify-center rounded-xl bg-secondary/80 p-1 text-muted-foreground border border-border/80 backdrop-blur-md',
        $attrs.class as string
      )
    "
  >
    <slot />
  </TabsList>
</template>

<script setup lang="ts">
import { TabsList } from 'radix-vue';
import { cn } from '@/lib/utils';
</script>
