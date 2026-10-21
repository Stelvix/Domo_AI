<template>
  <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-md">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <!-- Logo AOC & Status Global -->
      <div class="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
        <div class="flex items-center space-x-2.5">
          <!-- Pixel Art Icon AOC -->
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold font-mono text-xs shadow-inner">
            AOC
          </div>
          <div>
            <h1 class="text-xs sm:text-sm font-bold font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
              <span>PIXEL OFFICE</span>
              <span class="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-sky-400">PWA</span>
            </h1>
            <p class="text-[11px] text-slate-400 hidden sm:block">Agent Operations Center • Local LLM Workstation</p>
          </div>
        </div>

        <!-- Statut de Connexion Ollama -->
        <div
          class="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border"
          :class="{
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30': isOllamaConnected,
            'bg-amber-500/10 text-amber-400 border-amber-500/30': !isOllamaConnected,
          }"
          :title="isOllamaConnected ? 'Connecté à l\'API Ollama locale' : 'Impossible de joindre Ollama sur localhost:11434'"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="isOllamaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
          ></span>
          <span class="text-[11px] font-medium">
            {{ isOllamaConnected ? `${onlineCount} en ligne` : 'Ollama Hors-ligne' }}
          </span>
        </div>
      </div>

      <!-- Barre d'outils / Recherche / Bouton de synchronisation -->
      <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <!-- Champ de recherche rapide -->
        <div class="relative flex-1 sm:w-56">
          <Search class="absolute left-2.5 top-2.5 text-slate-400" :size="14" />
          <input
            :value="searchQuery"
            type="text"
            placeholder="Filtrer agent, rôle..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- Bouton Synchronisation Ollama -->
        <button
          type="button"
          :disabled="isSyncing"
          class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all active:scale-95 disabled:opacity-50"
          title="Détecter et synchroniser les modèles depuis Ollama"
          @click="$emit('sync')"
        >
          <RefreshCw :size="13" :class="{ 'animate-spin text-sky-400': isSyncing }" />
          <span class="hidden sm:inline">{{ isSyncing ? 'Scan...' : 'Sync Ollama' }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RefreshCw, Search } from 'lucide-vue-next';

defineProps<{
  isOllamaConnected: boolean;
  onlineCount: number;
  totalCount: number;
  isSyncing: boolean;
  searchQuery: string;
}>();

defineEmits<{
  (e: 'sync'): void;
  (e: 'update:searchQuery', query: string): void;
}>();
</script>
