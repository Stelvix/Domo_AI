<template>
  <h3 :class="cn('text-sm font-bold font-mono tracking-tight text-slate-100', $attrs.class as string)">
    <slot />
  </h3>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';
</script>
