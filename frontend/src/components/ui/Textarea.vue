<template>
  <textarea
    :value="modelValue"
    :class="
      cn(
        'flex min-h-[60px] w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono transition-colors',
        $attrs.class as string
      )
    "
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  modelValue?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
