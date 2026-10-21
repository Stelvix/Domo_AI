<template>
  <div :class="cn('flex flex-col space-y-1.5 p-4 sm:p-5', $attrs.class as string)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';
</script>
