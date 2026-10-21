<template>
  <div class="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
    <!-- Top Metrics Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card class="border-sky-500/20 bg-sky-950/10">
        <CardHeader class="pb-2">
          <CardDescription class="text-sky-400 flex items-center justify-between">
            <span>DÉTECTION OLLAMA</span>
            <Activity :size="15" />
          </CardDescription>
          <CardTitle class="text-2xl font-mono text-slate-100">
            {{ isOllamaConnected ? 'OPÉRATIONNEL' : 'HORS-LIGNE' }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-[11px] text-muted-foreground font-mono">
            {{ isOllamaConnected ? 'Passerelle locale connectée sur port 11434' : 'Démon Ollama inactif' }}
          </p>
        </CardContent>
      </Card>

      <Card class="border-emerald-500/20 bg-emerald-950/10">
        <CardHeader class="pb-2">
          <CardDescription class="text-emerald-400 flex items-center justify-between">
            <span>MODÈLES EN LIGNE</span>
            <Cpu :size="15" />
          </CardDescription>
          <CardTitle class="text-2xl font-mono text-slate-100">
            {{ onlineCount }} <span class="text-sm font-normal text-muted-foreground">/ {{ agents.length }}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-[11px] text-muted-foreground font-mono">
            Agents immédiatement disponibles pour l'inférence
          </p>
        </CardContent>
      </Card>

      <Card class="border-purple-500/20 bg-purple-950/10">
        <CardHeader class="pb-2">
          <CardDescription class="text-purple-400 flex items-center justify-between">
            <span>EMPREINTE DISQUE / VRAM</span>
            <HardDrive :size="15" />
          </CardDescription>
          <CardTitle class="text-2xl font-mono text-slate-100">
            {{ totalStorageFormatted }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-[11px] text-muted-foreground font-mono">
            Poids cumulé des poids de modèles GGUF
          </p>
        </CardContent>
      </Card>

      <Card class="border-amber-500/20 bg-amber-950/10">
        <CardHeader class="pb-2">
          <CardDescription class="text-amber-400 flex items-center justify-between">
            <span>HISTORIQUE CONVERSATIONS</span>
            <MessagesSquare :size="15" />
          </CardDescription>
          <CardTitle class="text-2xl font-mono text-slate-100">
            {{ totalConversations }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-[11px] text-muted-foreground font-mono">
            Sessions persistées en base SQLite
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Telemetry Table of LLM Models -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Télémétrie des Modèles Locaux (AOC HUD)</CardTitle>
            <CardDescription>Spécifications détaillées, quantification et assignation des rôles</CardDescription>
          </div>
          <Button variant="neon" size="sm" @click="$emit('sync')">
            <RefreshCw :size="13" class="mr-1.5" />
            Scanner
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono text-xs">
            <thead class="border-b border-border text-[11px] text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th class="p-3">Statut</th>
                <th class="p-3">Modèle / Agent</th>
                <th class="p-3">Rôle Métier Injecté</th>
                <th class="p-3">Paramètres</th>
                <th class="p-3">Quantification</th>
                <th class="p-3">Taille</th>
                <th class="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr
                v-for="agent in agents"
                :key="agent.id"
                class="hover:bg-accent/40 transition-colors"
              >
                <td class="p-3 whitespace-nowrap">
                  <Badge :variant="agent.status === 'online' ? 'success' : 'secondary'">
                    {{ agent.status }}
                  </Badge>
                </td>
                <td class="p-3 whitespace-nowrap">
                  <div class="font-bold text-foreground">{{ agent.displayName || agent.modelName }}</div>
                  <div class="text-[10px] text-muted-foreground">{{ agent.modelName }}</div>
                </td>
                <td class="p-3 max-w-xs truncate text-muted-foreground">
                  {{ agent.role || 'Superviseur AOC' }}
                </td>
                <td class="p-3 whitespace-nowrap">
                  <Badge variant="outline" class="text-[10px]">
                    {{ agent.metadata?.parameterSize || 'Standard' }}
                  </Badge>
                </td>
                <td class="p-3 whitespace-nowrap">
                  <Badge variant="outline" class="text-[10px]">
                    {{ agent.metadata?.quantization || 'GGUF' }}
                  </Badge>
                </td>
                <td class="p-3 whitespace-nowrap text-muted-foreground">
                  {{ agent.metadata?.size ? formatBytes(agent.metadata.size) : '--' }}
                </td>
                <td class="p-3 text-right whitespace-nowrap space-x-1.5">
                  <Button variant="outline" size="sm" @click="$emit('configure', agent)">
                    Paramètres
                  </Button>
                  <Button variant="default" size="sm" @click="$emit('chat', agent)">
                    Terminal
                  </Button>
                </td>
              </tr>
              <tr v-if="agents.length === 0">
                <td colspan="7" class="p-8 text-center text-muted-foreground">
                  Aucun modèle détecté. Assurez-vous qu'Ollama est actif et lancez la détection.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Activity, Cpu, HardDrive, MessagesSquare, RefreshCw } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
import CardDescription from '@/components/ui/CardDescription.vue';
import CardContent from '@/components/ui/CardContent.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import type { Agent } from '@/types/agent';

const props = defineProps<{
  agents: Agent[];
  isOllamaConnected: boolean;
}>();

defineEmits<{
  (e: 'chat', agent: Agent): void;
  (e: 'configure', agent: Agent): void;
  (e: 'sync'): void;
}>();

const onlineCount = computed(() => {
  return props.agents.filter((a) => a.status !== 'offline').length;
});

const totalStorageFormatted = computed(() => {
  const totalBytes = props.agents.reduce((acc, a) => acc + (a.metadata?.size || 0), 0);
  return formatBytes(totalBytes);
});

const totalConversations = computed(() => {
  return props.agents.reduce((acc, a) => acc + (a._count?.conversations || 0), 0);
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
</script>
