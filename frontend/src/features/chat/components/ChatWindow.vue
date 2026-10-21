<template>
  <div
    v-if="isOpen && agent"
    class="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fade-in"
    @click.self="$emit('close')"
  >
    <!-- Slide-over Drawer Container -->
    <div
      class="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden"
    >
      <!-- Chat Header -->
      <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
        <!-- Agent Identity & Avatar -->
        <div class="flex items-center space-x-3 truncate">
          <PixelAvatar :sprite-id="agent.avatarSprite" :status="agent.status" :size="38" />
          <div class="truncate">
            <div class="flex items-center space-x-2">
              <h2 class="text-sm font-bold font-mono text-slate-100 truncate">
                {{ agent.displayName || agent.modelName }}
              </h2>
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-emerald-400 animate-pulse': agent.status === 'online',
                  'bg-amber-400 animate-ping': agent.status === 'thinking',
                  'bg-slate-500': agent.status === 'offline',
                }"
              ></span>
            </div>
            <p class="text-[11px] font-mono text-slate-400 truncate">{{ agent.modelName }}</p>
          </div>
        </div>

        <!-- Role Badge & Header Actions -->
        <div class="flex items-center space-x-2">
          <RoleSelector :role="agent.role" :system-prompt="agent.systemPrompt" class="hidden sm:flex" />

          <button
            type="button"
            title="Historique des discussions"
            class="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            :class="{ 'bg-slate-800 text-sky-400': showSidebar }"
            @click="showSidebar = !showSidebar"
          >
            <History :size="16" />
          </button>

          <button
            type="button"
            title="Configurer l'agent"
            class="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            @click="$emit('configure', agent)"
          >
            <Settings :size="16" />
          </button>

          <button
            type="button"
            title="Fermer le terminal"
            class="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            @click="$emit('close')"
          >
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Main Chat Body with Sidebar Drawer -->
      <div class="flex-1 flex overflow-hidden relative">
        <!-- Conversation Sidebar (Collapsible) -->
        <div
          v-if="showSidebar"
          class="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col absolute inset-y-0 left-0 z-20 sm:static shadow-xl transition-all"
        >
          <div class="p-3 border-b border-slate-800 flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-slate-300">Discussions</span>
            <button
              type="button"
              class="flex items-center space-x-1 px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-mono font-semibold"
              @click="startNewChat"
            >
              <Plus :size="12" />
              <span>Nouveau</span>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <div
              v-for="conv in conversations"
              :key="conv.id"
              class="group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer"
              :class="[
                conv.id === activeConversationId
                  ? 'bg-sky-950/70 text-sky-300 border border-sky-800/60'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
              ]"
              @click="selectConv(conv.id)"
            >
              <div class="flex items-center space-x-2 truncate">
                <MessageSquare :size="13" class="shrink-0" />
                <span class="truncate">{{ conv.title || 'Discussion' }}</span>
              </div>
              <button
                type="button"
                title="Supprimer"
                class="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                @click.stop="deleteConv(conv.id)"
              >
                <Trash2 :size="12" />
              </button>
            </div>

            <div v-if="conversations.length === 0" class="p-4 text-center text-xs text-slate-500 font-mono">
              Aucun historique pour cet agent.
            </div>
          </div>
        </div>

        <!-- Message List & Chat View -->
        <div class="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          <!-- Messages Scrollable Thread -->
          <div ref="messageThreadRef" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            <!-- Messages List -->
            <MessageBubble
              v-for="msg in messages"
              :key="msg.id"
              :message="msg"
              :agent-name="agent.displayName || agent.modelName"
            />

            <!-- Empty Chat State -->
            <div
              v-if="messages.length === 0"
              class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500"
            >
              <PixelAvatar :sprite-id="agent.avatarSprite" :status="agent.status" :size="48" class="mb-3" />
              <h4 class="text-xs font-mono font-bold text-slate-300 mb-1">
                Poste connecté : {{ agent.displayName || agent.modelName }}
              </h4>
              <p class="text-[11px] font-mono max-w-sm text-slate-400 leading-relaxed mb-4">
                Posez vos questions techniques, demandez une analyse ou commencez une session de pair-programming.
              </p>
              <div class="flex flex-wrap gap-1.5 justify-center max-w-md">
                <button
                  v-for="prompt in quickPrompts"
                  :key="prompt"
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors"
                  @click="sendQuickPrompt(prompt)"
                >
                  "{{ prompt }}"
                </button>
              </div>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div v-if="error" class="mx-4 mb-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono flex items-center justify-between">
            <span>{{ error }}</span>
            <button type="button" class="text-rose-400 hover:text-rose-200" @click="error = null">
              <X :size="14" />
            </button>
          </div>

          <!-- Chat Input Area -->
          <div class="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
            <div class="relative flex items-end space-x-2">
              <textarea
                v-model="inputContent"
                ref="textareaRef"
                rows="1"
                placeholder="Écrivez un message (Entrée pour envoyer, Maj+Entrée pour saut de ligne)..."
                class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none font-sans max-h-32 transition-all leading-normal"
                @keydown.enter.exact.prevent="handleSend"
                @input="autoResize"
              ></textarea>

              <!-- Bouton Arrêter ou Envoyer -->
              <button
                v-if="isGenerating"
                type="button"
                class="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-semibold shadow-md transition-all active:scale-95 flex items-center space-x-1"
                @click="stopGeneration"
              >
                <Square :size="13" class="fill-current" />
                <span class="hidden sm:inline">Stop</span>
              </button>

              <button
                v-else
                type="button"
                :disabled="!inputContent.trim() || agent.status === 'offline'"
                class="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold shadow-md shadow-sky-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                @click="handleSend"
              >
                <Send :size="13" />
                <span class="hidden sm:inline">Envoyer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import {
  X,
  Send,
  Square,
  History,
  Settings,
  Plus,
  MessageSquare,
  Trash2,
} from 'lucide-vue-next';
import PixelAvatar from '@/features/office/components/PixelAvatar.vue';
import RoleSelector from './RoleSelector.vue';
import MessageBubble from './MessageBubble.vue';
import { useChat } from '../composables/useChat';
import type { Agent } from '@/types/agent';

const props = defineProps<{
  isOpen: boolean;
  agent: Agent | null;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'configure', agent: Agent): void;
}>();

const {
  conversations,
  activeConversationId,
  messages,
  isGenerating,
  error,
  loadConversations,
  selectConversation,
  startNewConversation,
  sendMessage,
  stopGeneration,
  removeConversation,
} = useChat();

const inputContent = ref('');
const showSidebar = ref(false);
const messageThreadRef = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const quickPrompts = [
  'Présente-toi et décris tes compétences clés.',
  'Comment optimiser une architecture Node.js / Express ?',
  'Écris un exemple de composable Vue 3 avec TypeScript.',
];

// Chargement des conversations à l'ouverture pour l'agent actif
watch(
  () => props.agent,
  async (newAgent) => {
    if (newAgent && props.isOpen) {
      await loadConversations(newAgent.id);
      scrollToBottom();
    }
  },
  { immediate: true }
);

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  }
);

watch(
  () => messages.value[messages.value.length - 1]?.content,
  () => {
    scrollToBottom();
  }
);

function scrollToBottom() {
  nextTick(() => {
    if (messageThreadRef.value) {
      messageThreadRef.value.scrollTop = messageThreadRef.value.scrollHeight;
    }
  });
}

function autoResize() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 120)}px`;
  }
}

async function handleSend() {
  if (!inputContent.value.trim() || !props.agent || isGenerating.value) return;
  const content = inputContent.value;
  inputContent.value = '';
  if (textareaRef.value) textareaRef.value.style.height = 'auto';

  await sendMessage(props.agent.id, content);
}

function sendQuickPrompt(promptText: string) {
  inputContent.value = promptText;
  handleSend();
}

async function startNewChat() {
  if (!props.agent) return;
  await startNewConversation(props.agent.id);
  showSidebar.value = false;
}

async function selectConv(convId: string) {
  await selectConversation(convId);
  showSidebar.value = false;
  scrollToBottom();
}

async function deleteConv(convId: string) {
  if (!props.agent) return;
  await removeConversation(convId);
}
</script>
