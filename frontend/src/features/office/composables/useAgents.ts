import { computed } from 'vue';
import { useAgentStore } from '@/stores/agent.store';
import type { UpdateAgentPayload } from '@/types/agent';

export function useAgents() {
  const store = useAgentStore();

  const agents = computed(() => store.agents);
  const selectedAgent = computed(() => store.selectedAgent);
  const onlineAgents = computed(() => store.onlineAgents);
  const offlineAgents = computed(() => store.offlineAgents);
  const totalCount = computed(() => store.totalCount);
  const isOllamaConnected = computed(() => store.isOllamaConnected);
  const isLoading = computed(() => store.isLoading);
  const isSyncing = computed(() => store.isSyncing);
  const error = computed(() => store.error);
  const lastSyncAt = computed(() => store.lastSyncAt);

  const loadAgents = () => store.loadAgents();
  const syncWithOllama = () => store.syncWithOllama();
  const selectAgent = (id: string | null) => store.selectAgent(id);
  const updateAgent = (id: string, payload: UpdateAgentPayload) => store.updateAgentConfig(id, payload);
  const getAgentAtPosition = (x: number, y: number) => store.getAgentAtPosition(x, y);

  return {
    // État réactif
    agents,
    selectedAgent,
    onlineAgents,
    offlineAgents,
    totalCount,
    isOllamaConnected,
    isLoading,
    isSyncing,
    error,
    lastSyncAt,

    // Actions
    loadAgents,
    syncWithOllama,
    selectAgent,
    updateAgent,
    getAgentAtPosition,
  };
}
