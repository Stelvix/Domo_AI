<template>
  <div class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col">
    <!-- Office Room Ambient Elements (Pixel Wall Decor & Server Rack) -->
    <div class="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      <div class="flex items-center space-x-4">
        <!-- Pixel Server Rack Animation -->
        <div class="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400">
          <Server :size="14" class="text-sky-400" />
          <span>RACK LOCAL</span>
          <div class="flex space-x-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          </div>
        </div>

        <div class="text-xs text-slate-400 font-mono hidden md:block">
          Open-Space des Modèles IA • Cliquez sur un bureau pour ouvrir le terminal
        </div>
      </div>

      <div class="flex items-center space-x-3 text-xs font-mono text-slate-400">
        <span class="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60">
          Total : {{ agents.length }}
        </span>
        <span class="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
          En ligne : {{ onlineCount }}
        </span>
      </div>
    </div>

    <!-- Grille des Bureaux d'Agents -->
    <div
      v-if="filteredAgents.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 flex-1"
    >
      <AgentDesk
        v-for="agent in filteredAgents"
        :key="agent.id"
        :agent="agent"
        :is-selected="agent.id === selectedAgentId"
        @select="$emit('select', $event)"
        @chat="$emit('chat', $event)"
        @configure="$emit('configure', $event)"
      />
    </div>

    <!-- Empty State : Aucun agent détecté -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto"
    >
      <div class="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-sky-400 mb-4 shadow-xl">
        <Bot :size="32" />
      </div>

      <h3 class="text-base font-bold font-mono text-slate-200 mb-2">
        {{ searchQuery ? 'Aucun agent ne correspond à la recherche' : 'Aucun bureau occupé dans l’Office' }}
      </h3>

      <p class="text-xs text-slate-400 mb-6 font-mono leading-relaxed">
        {{
          searchQuery
            ? 'Essayez de modifier vos termes de recherche pour filtrer vos modèles.'
            : 'Assurez-vous qu\'Ollama est lancé sur votre machine (`ollama serve`) et synchronisez pour importer automatiquement vos LLMs locaux.'
        }}
      </p>

      <button
        v-if="!searchQuery"
        type="button"
        class="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition-all active:scale-95"
        @click="$emit('sync')"
      >
        <RefreshCw :size="14" />
        <span>Détecter les modèles Ollama</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Server, Bot, RefreshCw } from 'lucide-vue-next';
import AgentDesk from './AgentDesk.vue';
import type { Agent } from '@/types/agent';

const props = defineProps<{
  agents: Agent[];
  selectedAgentId: string | null;
  searchQuery: string;
}>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'chat', agent: Agent): void;
  (e: 'configure', agent: Agent): void;
  (e: 'sync'): void;
}>();

const onlineCount = computed(() => {
  return props.agents.filter((a) => a.status !== 'offline').length;
});

const filteredAgents = computed(() => {
  if (!props.searchQuery.trim()) return props.agents;
  const q = props.searchQuery.toLowerCase();
  return props.agents.filter(
    (a) =>
      a.displayName?.toLowerCase().includes(q) ||
      a.modelName.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q)
  );
});
</script>
