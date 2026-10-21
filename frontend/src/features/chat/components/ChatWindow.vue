<template>
  <div
    v-if="isOpen && agent"
    class="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="$emit('close')"
  >
    <!-- Slide-over Drawer Container -->
    <div
      class="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full bg-card/95 border-l border-border flex flex-col shadow-2xl backdrop-blur-2xl overflow-hidden animate-in slide-in-from-right duration-300"
    >
      <!-- Chat Header -->
      <div class="px-4 py-3 bg-card border-b border-border flex items-center justify-between gap-3">
        <!-- Agent Identity & Avatar -->
        <div class="flex items-center space-x-3 truncate">
          <PixelAvatar :sprite-id="agent.avatarSprite" :status="agent.status" :size="40" />
          <div class="truncate">
            <div class="flex items-center space-x-2">
              <h2 class="text-sm font-bold font-mono text-foreground truncate">
                {{ agent.displayName || agent.modelName }}
              </h2>
              <Badge :variant="isGenerating ? 'warning' : agent.status === 'online' ? 'success' : 'secondary'" class="text-[9px] px-1.5 py-0">
                {{ isGenerating ? 'analyse' : agent.status }}
              </Badge>
            </div>
            <p class="text-[11px] font-mono text-muted-foreground truncate">{{ agent.modelName }}</p>
          </div>
        </div>

        <!-- Role Badge & Header Actions -->
        <div class="flex items-center space-x-1.5">
          <RoleSelector :role="agent.role" :system-prompt="agent.systemPrompt" class="hidden sm:flex" />

          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-muted-foreground"
            :class="{ 'bg-accent text-primary': showSidebar }"
            title="Historique des discussions"
            @click="showSidebar = !showSidebar"
          >
            <History :size="15" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-muted-foreground"
            title="Paramètres de l'agent"
            @click="$emit('configure', agent)"
          >
            <Settings :size="15" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-muted-foreground"
            title="Fermer"
            @click="$emit('close')"
          >
            <X :size="16" />
          </Button>
        </div>
      </div>

      <!-- Main Chat Body with Sidebar Drawer -->
      <div class="flex-1 flex overflow-hidden relative">
        <!-- Conversation Sidebar (Collapsible) -->
        <div
          v-if="showSidebar"
          class="w-64 border-r border-border bg-card/90 flex flex-col absolute inset-y-0 left-0 z-20 sm:static shadow-xl transition-all"
        >
          <div class="p-3 border-b border-border flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-foreground">Discussions</span>
            <Button
              variant="default"
              size="sm"
              class="h-7 text-[11px] px-2.5"
              @click="startNewChat"
            >
              <Plus :size="12" class="mr-1" />
              <span>Nouveau</span>
            </Button>
          </div>

          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <div
              v-for="conv in conversations"
              :key="conv.id"
              class="group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer border"
              :class="[
                conv.id === activeConversationId
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border-transparent',
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
                class="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                @click.stop="deleteConv(conv.id)"
              >
                <Trash2 :size="12" />
              </button>
            </div>

            <div v-if="conversations.length === 0" class="p-4 text-center text-xs text-muted-foreground font-mono">
              Aucun historique pour cet agent.
            </div>
          </div>
        </div>

        <!-- Message List & Chat View -->
        <div class="flex-1 flex flex-col bg-background/50 overflow-hidden">
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
              class="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground"
            >
              <PixelAvatar :sprite-id="agent.avatarSprite" :status="agent.status" :size="48" class="mb-3" />
              <h4 class="text-xs font-mono font-bold text-foreground mb-1">
                Session Active : {{ agent.displayName || agent.modelName }}
              </h4>
              <p class="text-[11px] font-mono max-w-sm text-muted-foreground leading-relaxed mb-4">
                Posez vos questions ou demandez une analyse. Le prompt système est injecté automatiquement.
              </p>
              <div class="flex flex-wrap gap-1.5 justify-center max-w-md">
                <button
                  v-for="prompt in quickPrompts"
                  :key="prompt"
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg bg-card border border-border text-[11px] font-mono text-foreground hover:border-primary hover:text-primary transition-colors shadow-xs"
                  @click="sendQuickPrompt(prompt)"
                >
                  "{{ prompt }}"
                </button>
              </div>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div v-if="error" class="mx-4 mb-2 p-2.5 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive-foreground text-xs font-mono flex items-center justify-between">
            <span>{{ error }}</span>
            <button type="button" class="text-destructive-foreground hover:opacity-80" @click="error = null">
              <X :size="14" />
            </button>
          </div>

          <!-- Chat Input Area -->
          <div class="p-3 sm:p-4 bg-card/80 border-t border-border">
            <!-- Bandeau d'état de la génération -->
            <div
              v-if="isGenerating"
              class="mb-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300 text-[10px] font-mono"
            >
              <Loader2 :size="12" class="animate-spin shrink-0" />
              <span class="truncate">
                {{ agent.displayName || agent.modelName }} est en train de produire sa réponse...
              </span>
            </div>

            <div class="relative flex items-end space-x-2">
              <textarea
                v-model="inputContent"
                ref="textareaRef"
                rows="1"
                placeholder="Écrivez un message (Entrée pour envoyer, Maj+Entrée pour saut de ligne)..."
                class="flex-1 bg-background/80 border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none font-sans max-h-32 transition-all leading-normal shadow-inner"
                @keydown.enter.exact.prevent="handleSend"
                @input="autoResize"
              ></textarea>

              <!-- Bouton Arrêter ou Envoyer -->
              <Button
                v-if="isGenerating"
                variant="destructive"
                size="default"
                class="h-10 px-3.5 rounded-xl font-mono"
                @click="stopGeneration"
              >
                <Square :size="13" class="fill-current mr-1" />
                <span class="hidden sm:inline">Stop</span>
              </Button>

              <Button
                v-else
                variant="default"
                size="default"
                :disabled="!inputContent.trim() || agent.status === 'offline'"
                class="h-10 px-4 rounded-xl font-mono shadow-md"
                @click="handleSend"
              >
                <Send :size="13" class="sm:mr-1.5" />
                <span class="hidden sm:inline">Envoyer</span>
              </Button>
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
  Loader2,
} from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
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
  'Comment optimiser une architecture logicielle moderne ?',
  'Écris un composant Vue 3 avec TypeScript et Tailwind.',
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
