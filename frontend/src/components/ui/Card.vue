<template>
  <div
    :class="
      cn(
        'rounded-xl border border-border/80 bg-card/80 text-card-foreground shadow-lg backdrop-blur-md transition-all',
        $attrs.class as string
      )
    "
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';
</script>
