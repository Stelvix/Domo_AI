<template>
  <TabsRoot
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :class="cn('flex flex-col', $attrs.class as string)"
  >
    <slot />
  </TabsRoot>
</template>

<script setup lang="ts">
import { TabsRoot } from 'radix-vue';
import { cn } from '@/lib/utils';

defineProps<{
  modelValue?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>
