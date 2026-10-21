<template>
  <div class="min-h-screen flex flex-col bg-[#080c14] text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
    <!-- Top Operations Toolbar -->
    <OfficeToolbar
      :is-ollama-connected="isOllamaConnected"
      :online-count="onlineAgents.length"
      :total-count="totalCount"
      :is-syncing="isSyncing"
      v-model:search-query="searchQuery"
      @sync="handleSync"
    />

    <!-- Main Office Floor Room -->
    <main class="flex-1 flex flex-col relative overflow-x-hidden">
      <!-- Loading indicator -->
      <div v-if="isLoading && agents.length === 0" class="flex-1 flex items-center justify-center p-8">
        <div class="flex flex-col items-center space-y-3 font-mono text-xs text-sky-400">
          <RefreshCw :size="24" class="animate-spin" />
          <span>Chargement de l'espace AOC...</span>
        </div>
      </div>

      <!-- Office Grid -->
      <PixelOfficeGrid
        v-else
        :agents="agents"
        :selected-agent-id="selectedAgent?.id || null"
        :search-query="searchQuery"
        @select="handleSelectAgent"
        @chat="handleOpenChat"
        @configure="handleOpenConfig"
        @sync="handleSync"
      />
    </main>

    <!-- Modale de Chat / Terminal -->
    <ChatWindow
      :is-open="isChatOpen"
      :agent="activeChatAgent"
      @close="isChatOpen = false"
      @configure="handleOpenConfig"
    />

    <!-- Modale de Configuration de l'Agent -->
    <AgentConfigModal
      :is-open="isConfigOpen"
      :agent="activeConfigAgent"
      @close="isConfigOpen = false"
      @save="handleSaveConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import OfficeToolbar from '@/features/office/components/OfficeToolbar.vue';
import PixelOfficeGrid from '@/features/office/components/PixelOfficeGrid.vue';
import AgentConfigModal from '@/features/office/components/AgentConfigModal.vue';
import ChatWindow from '@/features/chat/components/ChatWindow.vue';
import { useAgents } from '@/features/office/composables/useAgents';
import type { Agent, UpdateAgentPayload } from '@/types/agent';

const {
  agents,
  selectedAgent,
  onlineAgents,
  totalCount,
  isOllamaConnected,
  isLoading,
  isSyncing,
  loadAgents,
  syncWithOllama,
  selectAgent,
  updateAgent,
} = useAgents();

const searchQuery = ref('');
const isChatOpen = ref(false);
const activeChatAgent = ref<Agent | null>(null);

const isConfigOpen = ref(false);
const activeConfigAgent = ref<Agent | null>(null);

onMounted(async () => {
  await loadAgents();
  // Si aucun agent en base, tentative de synchronisation automatique avec Ollama
  if (agents.value.length === 0) {
    await syncWithOllama();
  }
});

function handleSelectAgent(id: string) {
  selectAgent(id);
}

function handleOpenChat(agent: Agent) {
  activeChatAgent.value = agent;
  selectAgent(agent.id);
  isChatOpen.value = true;
}

function handleOpenConfig(agent: Agent) {
  activeConfigAgent.value = agent;
  isConfigOpen.value = true;
}

async function handleSync() {
  await syncWithOllama();
}

async function handleSaveConfig({ id, data }: { id: string; data: UpdateAgentPayload }) {
  await updateAgent(id, data);
  if (activeChatAgent.value && activeChatAgent.value.id === id) {
    activeChatAgent.value = { ...activeChatAgent.value, ...data };
  }
}
</script>
