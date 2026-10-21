<template>
  <div
    class="group relative flex flex-col bg-slate-900/90 hover:bg-slate-800/95 border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
    :class="[
      isSelected ? 'border-sky-400 ring-2 ring-sky-400/30' : 'border-slate-800 hover:border-slate-700',
      agent.status === 'offline' ? 'opacity-70 saturate-50' : '',
    ]"
    @click="$emit('select', agent.id)"
  >
    <!-- Desk Top Bar: Statut & Action Paramètres -->
    <div class="flex items-center justify-between mb-3">
      <!-- Status Badge -->
      <div class="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border"
        :class="{
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': agent.status === 'online',
          'bg-amber-500/10 text-amber-400 border-amber-500/30': agent.status === 'thinking',
          'bg-slate-800 text-slate-400 border-slate-700': agent.status === 'offline',
        }"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="{
            'bg-emerald-400 animate-pulse': agent.status === 'online',
            'bg-amber-400 animate-ping': agent.status === 'thinking',
            'bg-slate-500': agent.status === 'offline',
          }"
        ></span>
        <span class="capitalize">{{ agent.status }}</span>
      </div>

      <!-- Action Configurer -->
      <button
        type="button"
        title="Configurer l'agent"
        class="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
        @click.stop="$emit('configure', agent)"
      >
        <Settings :size="16" />
      </button>
    </div>

    <!-- Pixel Workstation Scene -->
    <div class="relative w-full h-28 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-center overflow-hidden mb-3">
      <!-- Arrière-plan de la station : grille rétro -->
      <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:8px_8px] opacity-40"></div>

      <!-- Bureau Pixel Art & Écran -->
      <div class="relative z-10 flex flex-col items-center">
        <!-- Avatar assis au bureau -->
        <PixelAvatar
          :sprite-id="agent.avatarSprite"
          :status="agent.status"
          :size="52"
        />

        <!-- Surface du bureau en pixel art -->
        <div class="relative w-36 h-7 bg-amber-900 border-t-2 border-amber-700 rounded-sm shadow-md flex items-center justify-center px-2">
          <!-- Écran de PC posé sur le bureau -->
          <div
            class="w-10 h-6 rounded-t-sm border border-slate-950 flex items-center justify-center transition-colors shadow-inner"
            :class="{
              'bg-sky-950/90 border-sky-400/50 shadow-sky-500/20': agent.status === 'online',
              'bg-amber-950/90 border-amber-400/50 shadow-amber-500/20': agent.status === 'thinking',
              'bg-slate-900 border-slate-700': agent.status === 'offline',
            }"
          >
            <!-- Lignes de code animées sur le mini-écran -->
            <div class="space-y-0.5 w-7">
              <div
                class="h-0.5 rounded-full"
                :class="agent.status === 'online' ? 'bg-sky-400 animate-pulse w-5' : agent.status === 'thinking' ? 'bg-amber-400 animate-ping w-4' : 'bg-slate-700 w-3'"
              ></div>
              <div
                class="h-0.5 rounded-full"
                :class="agent.status === 'online' ? 'bg-sky-300 w-6' : 'bg-slate-800 w-4'"
              ></div>
            </div>
          </div>

          <!-- Tasse de café pixel art -->
          <div class="absolute right-3 top-1 w-2.5 h-3 bg-amber-100 rounded-sm border border-slate-900">
            <div class="absolute -top-1 left-0.5 w-1 h-1 bg-amber-800/40 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Informations Agent -->
    <div class="flex-1 flex flex-col justify-between">
      <div>
        <!-- Nom & Modèle Technique -->
        <div class="flex items-baseline justify-between gap-2 mb-1">
          <h3 class="font-bold text-sm text-slate-100 truncate group-hover:text-sky-300 transition-colors">
            {{ agent.displayName || agent.modelName }}
          </h3>
        </div>

        <p class="text-xs font-mono text-slate-400 truncate mb-2">
          {{ agent.modelName }}
        </p>

        <!-- Rôle Métier Badge -->
        <div class="inline-block px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded text-[11px] font-medium text-slate-300 mb-2 truncate max-w-full">
          {{ agent.role || 'Assistant AOC' }}
        </div>
      </div>

      <!-- Métadonnées Techniques (Taille, Paramètres, Quantification) -->
      <div v-if="agent.metadata" class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span v-if="agent.metadata.parameterSize" class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
          {{ agent.metadata.parameterSize }}
        </span>
        <span v-if="agent.metadata.quantization" class="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
          {{ agent.metadata.quantization }}
        </span>
        <span v-if="agent.metadata.size" class="text-slate-400">
          {{ formatBytes(agent.metadata.size) }}
        </span>
      </div>

      <!-- Bouton d'action Rapide -->
      <div class="mt-3 pt-2">
        <button
          type="button"
          class="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold transition-all duration-150"
          :class="[
            agent.status === 'offline'
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 active:scale-95',
          ]"
          @click.stop="$emit('chat', agent)"
        >
          <MessageSquare :size="14" />
          <span>Ouvrir le Chat</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Settings, MessageSquare } from 'lucide-vue-next';
import PixelAvatar from './PixelAvatar.vue';
import type { Agent } from '@/types/agent';

defineProps<{
  agent: Agent;
  isSelected?: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'chat', agent: Agent): void;
  (e: 'configure', agent: Agent): void;
}>();

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
</script>
