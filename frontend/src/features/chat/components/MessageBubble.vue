<template>
  <div
    class="flex flex-col mb-4 group"
    :class="message.role === 'user' ? 'items-end' : 'items-start'"
  >
    <!-- Role & Timestamp header -->
    <div class="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mb-1 px-1">
      <span class="font-semibold" :class="message.role === 'user' ? 'text-sky-400' : 'text-emerald-400'">
        {{ message.role === 'user' ? 'Vous' : agentName || 'Agent AOC' }}
      </span>
      <span>•</span>
      <span>{{ formatTime(message.createdAt) }}</span>
      <button
        v-if="!message.isStreaming && message.content"
        type="button"
        title="Copier le message"
        class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-slate-200"
        @click="copyContent"
      >
        <Copy :size="11" />
      </button>
    </div>

    <!-- Bubble Content -->
    <div
      class="max-w-[88%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed shadow-md border"
      :class="[
        message.role === 'user'
          ? 'bg-sky-600 text-white border-sky-500 rounded-tr-xs'
          : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-xs',
      ]"
    >
      <!-- Raisonnement interne (modèles "thinking") -->
      <div
        v-if="showReasoning"
        class="mb-2.5 rounded-lg border border-amber-500/25 bg-amber-950/20 overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-mono text-amber-400/90 hover:bg-amber-500/10 transition-colors"
          @click="reasoningOpen = !reasoningOpen"
        >
          <span class="flex items-center gap-1.5">
            <Brain :size="11" />
            <span>{{ reasoningOpen ? 'Masquer le raisonnement' : 'Voir le raisonnement' }}</span>
          </span>
          <ChevronDown v-if="!reasoningOpen" :size="12" />
          <ChevronUp v-else :size="12" />
        </button>
        <div
          v-if="reasoningOpen"
          class="px-2.5 pb-2 text-[11px] leading-relaxed text-amber-100/70 whitespace-pre-wrap font-mono border-t border-amber-500/15"
        >
          {{ message.reasoning }}
        </div>
      </div>

      <!-- Contenu markdown -->
      <MarkdownContent :content="message.content" />

      <!-- Curseur clignotant lors du streaming SSE -->
      <span
        v-if="message.isStreaming && !message.content"
        class="inline-block w-1.5 h-3.5 bg-sky-400 align-middle animate-pulse ml-0.5"
      ></span>

      <!-- Indicateur de rédaction quand seul le raisonnement arrive -->
      <div
        v-if="message.isStreaming && message.content"
        class="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-sky-300/80"
      >
        <Loader2 :size="10" class="animate-spin" />
        <span>génération en cours...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Copy, Brain, ChevronDown, ChevronUp, Loader2 } from 'lucide-vue-next';
import MarkdownContent from '@/components/ui/MarkdownContent.vue';
import type { ChatMessage } from '@/types/chat';

const props = defineProps<{
  message: ChatMessage;
  agentName?: string;
}>();

const reasoningOpen = ref(false);

const showReasoning = computed(() => Boolean(props.message.reasoning?.trim()));

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

async function copyContent() {
  if (!navigator.clipboard || !props.message.content) return;
  try {
    await navigator.clipboard.writeText(props.message.content);
  } catch {
    // Le presse-papiers peut être refusé : on ignore silencieusement.
  }
}
</script>
