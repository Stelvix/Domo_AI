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
        v-if="!message.isStreaming"
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
      class="max-w-[85%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed shadow-md border"
      :class="[
        message.role === 'user'
          ? 'bg-sky-600 text-white border-sky-500 rounded-tr-xs'
          : 'bg-slate-900 text-slate-100 border-slate-800 rounded-tl-xs',
      ]"
    >
      <div class="whitespace-pre-wrap break-words font-sans text-xs">
        {{ message.content }}
        <!-- Curseur clignotant lors du streaming SSE -->
        <span
          v-if="message.isStreaming"
          class="inline-block w-1.5 h-3.5 bg-sky-400 align-middle animate-pulse ml-0.5"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Copy } from 'lucide-vue-next';
import type { ChatMessage } from '@/types/chat';

const props = defineProps<{
  message: ChatMessage;
  agentName?: string;
}>();

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function copyContent() {
  if (navigator.clipboard && props.message.content) {
    navigator.clipboard.writeText(props.message.content);
  }
}
</script>
