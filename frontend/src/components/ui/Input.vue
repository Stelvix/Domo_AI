<template>
  <input
    :value="modelValue"
    :class="
      cn(
        'flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1 text-xs text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono',
        $attrs.class as string
      )
    "
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  modelValue?: string | number;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
