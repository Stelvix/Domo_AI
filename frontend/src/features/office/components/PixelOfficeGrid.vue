<template>
  <div class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col">
    <!-- Office Room Ambient Elements (Pixel Wall Decor & Server Rack) -->
    <div class="mb-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shadow-sm">
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
        <span class="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 hidden sm:inline">
          Bureaux libres : {{ freeSlots }}
        </span>
      </div>
    </div>

    <!-- La pièce : open-space pixel art -->
    <div
      class="relative flex-1 rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-2xl overflow-hidden"
    >
      <!-- Sol : dalles pixel art -->
      <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>
      <!-- Néons ambiants -->
      <div class="absolute -top-24 left-1/4 w-72 h-48 bg-sky-500/10 blur-3xl rounded-full pointer-events-none"></div>
      <div class="absolute -bottom-24 right-1/4 w-72 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>

      <div class="relative overflow-x-auto overflow-y-hidden p-3 sm:p-5">
        <div
          class="office-grid mx-auto grid gap-3 sm:gap-4"
          :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
        >
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="office-cell relative rounded-xl transition-colors"
            :class="{
              'bg-sky-500/5 ring-1 ring-sky-400/40': dragOverCell === cell.key,
            }"
            @dragover.prevent="dragOverCell = cell.key"
            @dragleave="dragOverCell === cell.key && (dragOverCell = null)"
            @drop.prevent="handleDrop(cell)"
          >
            <AgentDesk
              v-if="cell.agent"
              :agent="cell.agent"
              :is-selected="cell.agent.id === selectedAgentId"
              :is-dragging="draggingAgentId === cell.agent.id"
              draggable="true"
              @select="$emit('select', $event)"
              @chat="$emit('chat', $event)"
              @configure="$emit('configure', $event)"
              @drag-start="handleDragStart"
              @drag-end="handleDragEnd"
            />

            <!-- Bureau vacant -->
            <div
              v-else
              class="h-full min-h-[190px] rounded-xl border-2 border-dashed border-slate-800/80 bg-slate-950/40 flex flex-col items-center justify-center gap-2 text-slate-700"
            >
              <Armchair :size="22" />
              <span class="font-mono text-[10px] uppercase tracking-wider">Bureau libre</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Astuce d'interaction -->
    <p class="mt-3 text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
      <Move :size="11" />
      <span>Glissez-déposez un agent sur un bureau libre pour réorganiser l'open-space.</span>
    </p>

    <!-- Empty State : Aucun agent détecté -->
    <div
      v-if="filteredAgents.length === 0"
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
import { computed, ref } from 'vue';
import { Server, Bot, RefreshCw, Armchair, Move } from 'lucide-vue-next';
import AgentDesk from './AgentDesk.vue';
import type { Agent } from '@/types/agent';

/** Nombre de colonnes de la grille pixel art (aligné sur OFFICE_GRID_COLUMNS côté backend). */
const columns = 4;

const props = defineProps<{
  agents: Agent[];
  selectedAgentId: string | null;
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'chat', agent: Agent): void;
  (e: 'configure', agent: Agent): void;
  (e: 'move', payload: { id: string; positionX: number; positionY: number }): void;
  (e: 'sync'): void;
}>();

const draggingAgentId = ref<string | null>(null);
const dragOverCell = ref<string | null>(null);

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

/**
 * Hauteur de la grille : elle couvre la position la plus basse occupée et
 * conserve toujours une rangée libre pour le drag & drop.
 */
const rows = computed(() => {
  const maxY = props.agents.reduce((acc, agent) => Math.max(acc, agent.positionY), 0);
  const needed = Math.ceil(props.agents.length / columns);
  return Math.max(needed, maxY + 1, 1);
});

/**
 * Liste des cases de la grille avec l'agent qui les occupe (s'il y en a un).
 */
const cells = computed(() => {
  const result: { key: string; x: number; y: number; agent: Agent | null }[] = [];

  for (let y = 0; y < rows.value; y++) {
    for (let x = 0; x < columns; x++) {
      const agent =
        props.agents.find((a) => a.positionX === x && a.positionY === y) ?? null;
      result.push({ key: `${x}:${y}`, x, y, agent });
    }
  }

  return result;
});

const freeSlots = computed(() => cells.value.filter((cell) => !cell.agent).length);

function handleDragStart(agent: Agent) {
  draggingAgentId.value = agent.id;
}

function handleDragEnd() {
  draggingAgentId.value = null;
  dragOverCell.value = null;
}

function handleDrop(cell: { x: number; y: number }) {
  const agentId = draggingAgentId.value;
  dragOverCell.value = null;
  draggingAgentId.value = null;

  if (!agentId) return;

  const agent = props.agents.find((a) => a.id === agentId);
  if (!agent) return;
  if (agent.positionX === cell.x && agent.positionY === cell.y) return;

  emit('move', { id: agentId, positionX: cell.x, positionY: cell.y });
}
</script>

<style scoped>
.office-grid {
  min-width: 620px;
}

.office-cell {
  min-height: 190px;
  display: flex;
}

.office-cell > * {
  width: 100%;
}
</style>
