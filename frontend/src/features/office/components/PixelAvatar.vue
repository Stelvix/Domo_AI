<template>
  <div
    class="relative inline-flex items-center justify-center transition-all duration-300"
    :class="[
      status === 'offline' ? 'filter grayscale opacity-60' : '',
      status === 'thinking' ? 'animate-bounce' : 'animate-idle',
    ]"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <!-- Avatar Pixel Art via SVG SVG scalable crisply -->
    <svg
      viewBox="0 0 16 16"
      class="w-full h-full pixelated drop-shadow-md"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Base Shadow -->
      <rect x="3" y="15" width="10" height="1" fill="#000000" opacity="0.3" />

      <!-- Cheveux / Coiffure selon le spriteId -->
      <g :fill="avatarPalette.hair">
        <rect x="4" y="2" width="8" height="2" />
        <rect x="3" y="3" width="2" height="4" />
        <rect x="11" y="3" width="2" height="4" />
        <rect v-if="spriteId === 'agent-2' || spriteId === 'agent-4'" x="3" y="2" width="10" height="1" />
      </g>

      <!-- Peau / Visage -->
      <g :fill="avatarPalette.skin">
        <rect x="5" y="4" width="6" height="5" />
        <rect x="4" y="5" width="1" height="3" />
        <rect x="11" y="5" width="1" height="3" />
      </g>

      <!-- Yeux -->
      <rect x="5" y="6" width="1" height="1" fill="#0f172a" />
      <rect x="10" y="6" width="1" height="1" fill="#0f172a" />

      <!-- Accessoire spécifique (Lunettes / Casque / Cravate) -->
      <g v-if="spriteId === 'agent-1' || spriteId === 'agent-5'">
        <!-- Lunettes de dev geek -->
        <rect x="4" y="5" width="3" height="2" fill="none" stroke="#38bdf8" stroke-width="0.5" />
        <rect x="9" y="5" width="3" height="2" fill="none" stroke="#38bdf8" stroke-width="0.5" />
        <rect x="7" y="6" width="2" height="0.5" fill="#38bdf8" />
      </g>
      <g v-else-if="spriteId === 'agent-3' || spriteId === 'agent-6'">
        <!-- Casque audio / headset tech -->
        <rect x="2" y="4" width="1" height="4" fill="#f43f5e" />
        <rect x="13" y="4" width="1" height="4" fill="#f43f5e" />
        <rect x="3" y="1" width="10" height="1" fill="#f43f5e" />
      </g>

      <!-- Vêtements / Buste -->
      <g :fill="avatarPalette.clothes">
        <rect x="4" y="9" width="8" height="5" />
        <rect x="3" y="10" width="1" height="4" />
        <rect x="12" y="10" width="1" height="4" />
      </g>

      <!-- Détail costume / Col / Logo -->
      <rect x="7" y="9" width="2" height="3" :fill="avatarPalette.accent" />
    </svg>

    <!-- Bulle de pensée en cas d'état "thinking" -->
    <div
      v-if="status === 'thinking'"
      class="absolute -top-3 -right-2 bg-amber-400 text-slate-950 px-1 py-0.5 rounded text-[9px] font-mono font-bold animate-pulse shadow-sm"
    >
      ...
    </div>

    <!-- Symbole sommeil si offline -->
    <div
      v-if="status === 'offline'"
      class="absolute -top-3 -right-1 text-slate-400 font-mono text-[10px] font-bold animate-pulse"
    >
      zZ
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AgentStatus } from '@/types/agent';

const props = withDefaults(
  defineProps<{
    spriteId?: string | null;
    status?: AgentStatus;
    size?: number;
  }>(),
  {
    spriteId: 'agent-1',
    status: 'online',
    size: 48,
  }
);

interface Palette {
  hair: string;
  skin: string;
  clothes: string;
  accent: string;
}

const palettes: Record<string, Palette> = {
  'agent-1': { hair: '#3b2f2f', skin: '#fcd34d', clothes: '#0284c7', accent: '#38bdf8' },
  'agent-2': { hair: '#f59e0b', skin: '#fde68a', clothes: '#8b5cf6', accent: '#c4b5fd' },
  'agent-3': { hair: '#1e293b', skin: '#fbcfe8', clothes: '#10b981', accent: '#6ee7b7' },
  'agent-4': { hair: '#dc2626', skin: '#fcd34d', clothes: '#f97316', accent: '#fdba74' },
  'agent-5': { hair: '#64748b', skin: '#fed7aa', clothes: '#6366f1', accent: '#a5b4fc' },
  'agent-6': { hair: '#047857', skin: '#fef08a', clothes: '#ec4899', accent: '#fbcfe8' },
};

const avatarPalette = computed(() => {
  const key = props.spriteId && palettes[props.spriteId] ? props.spriteId : 'agent-1';
  return palettes[key];
});
</script>

<style scoped>
@keyframes idle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

.animate-idle {
  animation: idle 2.5s ease-in-out infinite;
}
</style>
