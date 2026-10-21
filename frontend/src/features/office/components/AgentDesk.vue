<template>
  <Card
    class="group relative flex flex-col h-full transition-all duration-300 cursor-pointer overflow-hidden hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:-translate-y-1 bg-gradient-to-b from-card to-card/90"
    :class="[
      isSelected ? 'border-primary ring-1 ring-primary/40 shadow-lg shadow-primary/10' : 'border-border/70',
      agent.status === 'offline' ? 'opacity-70 saturate-50' : '',
      isDragging ? 'opacity-40 scale-95' : '',
    ]"
    @click="$emit('select', agent.id)"
    @dragstart="$emit('drag-start', agent)"
    @dragend="$emit('drag-end')"
  >
    <!-- Background grid decoration inside card -->
    <div class="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

    <CardHeader class="p-3.5 pb-2">
      <!-- Desk Top Bar: Statut & Action Paramètres -->
      <div class="flex items-center justify-between">
        <!-- Status Badge -->
        <Badge
          :variant="
            agent.status === 'online'
              ? 'success'
              : agent.status === 'thinking'
              ? 'warning'
              : 'secondary'
          "
          class="text-[10px] px-2 py-0.5"
        >
          <span
            class="w-1.5 h-1.5 rounded-full mr-1.5"
            :class="{
              'bg-emerald-400 animate-pulse': agent.status === 'online',
              'bg-amber-400 animate-ping': agent.status === 'thinking',
              'bg-slate-500': agent.status === 'offline',
            }"
          ></span>
          <span class="capitalize">{{ agent.status }}</span>
        </Badge>

        <!-- Bouton Configurer -->
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-muted-foreground hover:text-primary transition-colors"
          title="Configurer l'agent"
          @click.stop="$emit('configure', agent)"
        >
          <Settings :size="14" />
        </Button>
      </div>
    </CardHeader>

    <CardContent class="p-3.5 pt-0 flex-1 flex flex-col justify-between">
      <!-- Pixel Workstation Scene -->
      <div class="relative w-full h-28 bg-slate-950/80 border border-border/80 rounded-lg flex items-center justify-center overflow-hidden mb-3 shadow-inner">
        <!-- Grille rétro & scanlines -->
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
          <div class="relative w-36 h-7 bg-amber-900 border-t-2 border-amber-700 rounded-xs shadow-md flex items-center justify-center px-2">
            <!-- Écran d'ordinateur rétro éclairé -->
            <div
              class="w-10 h-6 rounded-t-xs border border-slate-950 flex items-center justify-center transition-colors shadow-inner"
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
            <div class="absolute right-3 top-1 w-2.5 h-3 bg-amber-100 rounded-xs border border-slate-900">
              <div class="absolute -top-1 left-0.5 w-1 h-1 bg-amber-800/40 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations Agent -->
      <div class="space-y-1 mb-3">
        <h3 class="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors font-mono">
          {{ agent.displayName || agent.modelName }}
        </h3>
        <p class="text-[11px] font-mono text-muted-foreground truncate">
          {{ agent.modelName }}
        </p>

        <!-- Rôle Métier Badge -->
        <div class="pt-1">
          <Badge variant="outline" class="text-[10px] truncate max-w-full font-sans bg-muted/40">
            {{ agent.role || 'Assistant AOC' }}
          </Badge>
        </div>
      </div>

      <!-- Métadonnées Techniques (Paramètres, Quantification, Poids) -->
      <div v-if="agent.metadata" class="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span v-if="agent.metadata.parameterSize" class="px-1.5 py-0.5 rounded bg-background border border-border">
          {{ agent.metadata.parameterSize }}
        </span>
        <span v-if="agent.metadata.quantization" class="px-1.5 py-0.5 rounded bg-background border border-border">
          {{ agent.metadata.quantization }}
        </span>
        <span v-if="agent.metadata.size" class="text-muted-foreground">
          {{ formatBytes(agent.metadata.size) }}
        </span>
      </div>
    </CardContent>

    <CardFooter class="p-3.5 pt-0">
      <Button
        :variant="agent.status === 'offline' ? 'secondary' : 'default'"
        size="sm"
        class="w-full text-xs"
        @click.stop="$emit('chat', agent)"
      >
        <Terminal :size="13" class="mr-1.5" />
        <span>Ouvrir Terminal</span>
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Settings, Terminal } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardFooter from '@/components/ui/CardFooter.vue';
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import PixelAvatar from './PixelAvatar.vue';
import type { Agent } from '@/types/agent';

defineProps<{
  agent: Agent;
  isSelected?: boolean;
  isDragging?: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'chat', agent: Agent): void;
  (e: 'configure', agent: Agent): void;
  (e: 'drag-start', agent: Agent): void;
  (e: 'drag-end'): void;
}>();

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
</script>
