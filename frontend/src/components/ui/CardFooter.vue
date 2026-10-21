<template>
  <div :class="cn('flex items-center p-4 sm:p-5 pt-0', $attrs.class as string)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';
</script>
