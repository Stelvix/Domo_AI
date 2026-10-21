<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="flex flex-col space-y-3">
      <!-- Search input in command menu -->
      <div class="relative flex items-center border-b border-border pb-3">
        <Search class="mr-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          v-model="query"
          ref="inputRef"
          type="text"
          placeholder="Rechercher un modèle, un rôle ou une action..."
          class="flex h-6 w-full rounded-md bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground font-mono"
        />
        <kbd class="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ESC
        </kbd>
      </div>

      <!-- Action suggestions -->
      <div class="max-h-72 overflow-y-auto space-y-1 font-mono text-xs">
        <!-- Section: Actions Globales -->
        <div class="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Actions Rapides
        </div>
        <button
          type="button"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
          @click="triggerSync"
        >
          <div class="flex items-center space-x-2.5">
            <RefreshCw :size="14" class="text-sky-400" />
            <span>Synchroniser avec Ollama</span>
          </div>
          <Badge variant="outline" class="text-[10px]">Sync</Badge>
        </button>

        <!-- Section: Modèles Détectés -->
        <div class="px-2 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Modèles & Bureaux ({{ filteredAgents.length }})
        </div>
        <div v-if="filteredAgents.length === 0" class="px-3 py-4 text-center text-xs text-muted-foreground">
          Aucun modèle trouvé pour "{{ query }}".
        </div>
        <button
          v-for="agent in filteredAgents"
          :key="agent.id"
          type="button"
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors group"
          @click="selectAgentChat(agent)"
        >
          <div class="flex items-center space-x-2.5 truncate">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="agent.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"
            ></span>
            <div class="truncate">
              <span class="font-bold text-foreground group-hover:text-primary transition-colors">
                {{ agent.displayName || agent.modelName }}
              </span>
              <span class="text-muted-foreground ml-2 text-[10px]">{{ agent.role }}</span>
            </div>
          </div>
          <Badge variant="secondary" class="shrink-0 text-[10px]">Ouvrir Chat</Badge>
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Search, RefreshCw } from 'lucide-vue-next';
import Dialog from './Dialog.vue';
import Badge from './Badge.vue';
import type { Agent } from '@/types/agent';

const props = defineProps<{
  open: boolean;
  agents: Agent[];
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'sync'): void;
  (e: 'chat', agent: Agent): void;
}>();

const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const filteredAgents = computed(() => {
  if (!query.value.trim()) return props.agents;
  const q = query.value.toLowerCase();
  return props.agents.filter(
    (a) =>
      a.displayName?.toLowerCase().includes(q) ||
      a.modelName.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q)
  );
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      query.value = '';
      nextTick(() => {
        inputRef.value?.focus();
      });
    }
  }
);

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    emit('update:open', !props.open);
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function triggerSync() {
  emit('sync');
  emit('update:open', false);
}

function selectAgentChat(agent: Agent) {
  emit('chat', agent);
  emit('update:open', false);
}
</script>
