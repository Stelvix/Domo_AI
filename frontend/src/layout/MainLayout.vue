<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground font-sans relative selection:bg-primary selection:text-primary-foreground">
    <!-- Ambient Background Lighting & Cyber Grid -->
    <div class="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0"></div>
    <div class="fixed inset-0 bg-radial-glow pointer-events-none z-0"></div>

    <div class="relative z-10 flex flex-col min-h-screen">
      <!-- Operations Toolbar -->
      <OfficeToolbar
        :is-ollama-connected="isOllamaConnected"
        :online-count="onlineAgents.length"
        :total-count="totalCount"
        :is-syncing="isSyncing"
        v-model:active-tab="activeTab"
        @sync="handleSync"
        @open-command-menu="isCommandMenuOpen = true"
      />

      <!-- Main Content Container -->
      <main class="flex-1 flex flex-col relative overflow-x-hidden">
        <!-- Loading Indicator -->
        <div v-if="isLoading && agents.length === 0" class="flex-1 flex items-center justify-center p-8">
          <div class="flex flex-col items-center space-y-3 font-mono text-xs text-primary">
            <RefreshCw :size="24" class="animate-spin" />
            <span>Initialisation du Centre d'Opérations AOC...</span>
          </div>
        </div>

        <!-- View 1: Pixel Office Floor Grid -->
        <div v-else-if="activeTab === 'office'" class="flex-1 flex flex-col">
          <PixelOfficeGrid
            :agents="agents"
            :selected-agent-id="selectedAgent?.id || null"
            :search-query="searchQuery"
            @select="handleSelectAgent"
            @chat="handleOpenChat"
            @configure="handleOpenConfig"
            @sync="handleSync"
          />
        </div>

        <!-- View 2: AOC System Monitor & HUD -->
        <div v-else-if="activeTab === 'monitor'" class="flex-1 flex flex-col">
          <AocMonitorView
            :agents="agents"
            :is-ollama-connected="isOllamaConnected"
            @chat="handleOpenChat"
            @configure="handleOpenConfig"
            @sync="handleSync"
          />
        </div>
      </main>

      <!-- Chat Drawer -->
      <ChatWindow
        :is-open="isChatOpen"
        :agent="activeChatAgent"
        @close="isChatOpen = false"
        @configure="handleOpenConfig"
      />

      <!-- Agent Configuration Modal -->
      <AgentConfigModal
        :is-open="isConfigOpen"
        :agent="activeConfigAgent"
        @close="isConfigOpen = false"
        @save="handleSaveConfig"
      />

      <!-- Command Palette (Cmd + K) -->
      <CommandMenu
        v-model:open="isCommandMenuOpen"
        :agents="agents"
        @sync="handleSync"
        @chat="handleOpenChat"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import OfficeToolbar from '@/features/office/components/OfficeToolbar.vue';
import PixelOfficeGrid from '@/features/office/components/PixelOfficeGrid.vue';
import AocMonitorView from '@/features/office/components/AocMonitorView.vue';
import AgentConfigModal from '@/features/office/components/AgentConfigModal.vue';
import ChatWindow from '@/features/chat/components/ChatWindow.vue';
import CommandMenu from '@/components/ui/CommandMenu.vue';
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

const activeTab = ref<'office' | 'monitor'>('office');
const searchQuery = ref('');
const isCommandMenuOpen = ref(false);

const isChatOpen = ref(false);
const activeChatAgent = ref<Agent | null>(null);

const isConfigOpen = ref(false);
const activeConfigAgent = ref<Agent | null>(null);

onMounted(async () => {
  await loadAgents();
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
