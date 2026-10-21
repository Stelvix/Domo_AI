<template>
  <p :class="cn('text-xs text-muted-foreground font-mono', $attrs.class as string)">
    <slot />
  </p>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';
</script>
