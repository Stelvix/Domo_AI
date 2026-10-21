<template>
  <button
    :class="cn(buttonVariants({ variant, size }), $attrs.class as string)"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <slot name="prefix" />
    <span v-if="loading" class="w-3.5 h-3.5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
    <slot />
    <slot name="suffix" />
  </button>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-mono font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background/50 hover:bg-accent hover:text-accent-foreground backdrop-blur-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary/40',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        neon: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
        emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-400',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-md px-2.5 text-[11px]',
        lg: 'h-11 rounded-xl px-6 text-sm',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants>;

withDefaults(
  defineProps<{
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: 'default',
    size: 'default',
    disabled: false,
    loading: false,
  }
);
</script>
