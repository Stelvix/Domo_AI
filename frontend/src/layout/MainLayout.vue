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
        v-model:search-query="searchQuery"
        @sync="handleSync"
        @open-command-menu="isCommandMenuOpen = true"
        @open-install="isInstallOpen = true"
        @open-new-agent="isNewAgentOpen = true"
      />

      <!-- Alert Banner : erreurs applicatives / état d'Ollama -->
      <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-3 space-y-2">
        <div
          v-if="error"
          class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-destructive/15 border border-destructive/40 text-destructive-foreground text-xs font-mono"
        >
          <span class="flex items-center gap-2">
            <AlertTriangle :size="14" class="shrink-0" />
            {{ error }}
          </span>
          <button type="button" class="shrink-0 opacity-70 hover:opacity-100" @click="clearError">
            <X :size="14" />
          </button>
        </div>

        <div
          v-if="!isOllamaConnected && !isLoading"
          class="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono"
        >
          <ServerOff :size="14" class="shrink-0" />
          <span>
            Ollama est injoignable. Lancez <code class="px-1 rounded bg-amber-500/15">ollama serve</code>
            puis cliquez sur « Sync » pour détecter vos modèles locaux.
          </span>
        </div>

        <div
          v-if="isBrowserOffline"
          class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-300 text-xs font-mono"
        >
          <WifiOff :size="14" class="shrink-0" />
          <span>Connexion réseau perdue — l'application fonctionne en mode hors-ligne.</span>
        </div>
      </div>

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
            @move="handleMoveAgent"
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
        @delete="handleDeleteAgent"
      />

      <!-- Création d'un nouvel assistant -->
      <NewAgentDialog :open="isNewAgentOpen" @close="isNewAgentOpen = false" @create="handleCreateAgent" />

      <!-- Command Palette (Cmd + K) -->
      <CommandMenu
        v-model:open="isCommandMenuOpen"
        :agents="agents"
        @sync="handleSync"
        @chat="handleOpenChat"
      />

      <!-- Installation PWA sur mobile (QR code) -->
      <InstallPwaDialog v-model:open="isInstallOpen" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RefreshCw, X, AlertTriangle, ServerOff, WifiOff } from 'lucide-vue-next';
import OfficeToolbar from '@/features/office/components/OfficeToolbar.vue';
import PixelOfficeGrid from '@/features/office/components/PixelOfficeGrid.vue';
import AocMonitorView from '@/features/office/components/AocMonitorView.vue';
import AgentConfigModal from '@/features/office/components/AgentConfigModal.vue';
import NewAgentDialog from '@/features/office/components/NewAgentDialog.vue';
import ChatWindow from '@/features/chat/components/ChatWindow.vue';
import CommandMenu from '@/components/ui/CommandMenu.vue';
import InstallPwaDialog from '@/features/install/components/InstallPwaDialog.vue';
import { useAgents } from '@/features/office/composables/useAgents';
import type { Agent, CreateAgentPayload, UpdateAgentPayload } from '@/types/agent';

const {
  agents,
  selectedAgent,
  onlineAgents,
  totalCount,
  isOllamaConnected,
  isLoading,
  isSyncing,
  error,
  loadAgents,
  syncWithOllama,
  selectAgent,
  updateAgent,
  moveAgent,
  removeAgent,
  createAgent,
  clearError,
} = useAgents();

const activeTab = ref<'office' | 'monitor'>('office');
const searchQuery = ref('');
const isCommandMenuOpen = ref(false);
const isInstallOpen = ref(false);

const isNewAgentOpen = ref(false);

const isChatOpen = ref(false);
const activeChatAgent = ref<Agent | null>(null);

const isConfigOpen = ref(false);
const activeConfigAgent = ref<Agent | null>(null);

const isBrowserOffline = ref(!navigator.onLine);

function handleOnline() {
  isBrowserOffline.value = false;
}

function handleOffline() {
  isBrowserOffline.value = true;
}

onMounted(async () => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  await loadAgents();
  if (agents.value.length === 0) {
    await syncWithOllama();
  }
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
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

async function handleSaveConfig(
  { id, data }: { id: string; data: UpdateAgentPayload },
  done: (success: boolean) => void
) {
  const updated = await updateAgent(id, data);
  if (updated && activeChatAgent.value?.id === id) {
    activeChatAgent.value = { ...activeChatAgent.value, ...updated };
  }
  done(Boolean(updated));
}

/**
 * Création d'un nouvel assistant depuis l'interface
 */
async function handleCreateAgent(
  payload: CreateAgentPayload,
  done: (success: boolean) => void
) {
  const created = await createAgent(payload);
  if (created) {
    selectAgent(created.id);
  }
  done(Boolean(created));
}

/**
 * Déplacement d'un agent sur la grille pixel art (drag & drop)
 */
async function handleMoveAgent({
  id,
  positionX,
  positionY,
}: {
  id: string;
  positionX: number;
  positionY: number;
}) {
  await moveAgent(id, positionX, positionY);
}

/**
 * Suppression d'un agent du bureau
 */
async function handleDeleteAgent(id: string, done: (success: boolean) => void) {
  const removed = await removeAgent(id);
  if (removed) {
    if (activeChatAgent.value?.id === id) {
      activeChatAgent.value = null;
      isChatOpen.value = false;
    }
  }
  done(removed);
}
</script>
