<template>
  <div :class="cn(badgeVariants({ variant }), $attrs.class as string)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground border border-border',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        neon: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
        purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type BadgeProps = VariantProps<typeof badgeVariants>;

withDefaults(
  defineProps<{
    variant?: BadgeProps['variant'];
  }>(),
  {
    variant: 'default',
  }
);
</script>
