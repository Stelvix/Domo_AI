<template>
  <div
    v-if="isOpen && agent"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div class="flex items-center space-x-3">
          <PixelAvatar :sprite-id="form.avatarSprite" :status="agent.status" :size="36" />
          <div>
            <h2 class="text-sm font-bold font-mono text-slate-100">
              Configurer l'Agent : {{ form.displayName || agent.modelName }}
            </h2>
            <p class="text-xs text-slate-400 font-mono">{{ agent.modelName }}</p>
          </div>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          @click="$emit('close')"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Modal Body (Form) -->
      <div class="p-6 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
        <!-- Choix du sprite Pixel Art -->
        <div>
          <label class="block font-mono font-semibold text-slate-300 mb-2">Style d'avatar Pixel Art</label>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="sId in spriteOptions"
              :key="sId"
              type="button"
              class="p-2 rounded-xl border flex flex-col items-center justify-center transition-all"
              :class="[
                form.avatarSprite === sId
                  ? 'border-sky-400 bg-sky-950/50 ring-2 ring-sky-400/30'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700',
              ]"
              @click="form.avatarSprite = sId"
            >
              <PixelAvatar :sprite-id="sId" :size="32" />
            </button>
          </div>
        </div>

        <!-- Nom d'affichage -->
        <div>
          <label class="block font-mono font-semibold text-slate-300 mb-1">Nom personnalisé du bureau</label>
          <input
            v-model="form.displayName"
            type="text"
            placeholder="Ex: Lead Architecte IA"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs"
          />
        </div>

        <!-- Rôle Métier & Presets -->
        <div>
          <label class="block font-mono font-semibold text-slate-300 mb-1">Rôle Métier Attribué</label>
          <input
            v-model="form.role"
            type="text"
            placeholder="Ex: Développeur Senior Full-Stack"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs mb-2"
          />

          <!-- Presets rapides de rôles -->
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in rolePresets"
              :key="preset.name"
              type="button"
              class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 transition-colors"
              @click="applyPreset(preset)"
            >
              + {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- Prompt Système Métier -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-mono font-semibold text-slate-300">Prompt Système (Injecté dans Ollama)</label>
            <span class="text-[10px] text-slate-400 font-mono">Injecté à chaque interaction</span>
          </div>
          <textarea
            v-model="form.systemPrompt"
            rows="4"
            placeholder="Instructions de comportement pour ce modèle..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono text-xs resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-2">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-400 hover:text-slate-200 transition-colors"
          @click="$emit('close')"
        >
          Annuler
        </button>
        <button
          type="button"
          :disabled="isSaving"
          class="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all active:scale-95 disabled:opacity-50"
          @click="save"
        >
          <Save :size="14" />
          <span>{{ isSaving ? 'Sauvegarde...' : 'Enregistrer' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, Save } from 'lucide-vue-next';
import PixelAvatar from './PixelAvatar.vue';
import type { Agent, UpdateAgentPayload } from '@/types/agent';

const props = defineProps<{
  isOpen: boolean;
  agent: Agent | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { id: string; data: UpdateAgentPayload }): void;
}>();

const spriteOptions = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5', 'agent-6'];

const rolePresets = [
  {
    name: 'Lead Dev',
    role: 'Lead Développeur Full-Stack Senior',
    prompt: 'Tu es un Lead Développeur Senior (15+ ans d\'expérience). Fournis un code propre, structuré, typé et exempt de bugs.',
  },
  {
    name: 'DevOps',
    role: 'Expert DevOps & Infrastructure',
    prompt: 'Tu es un ingénieur DevOps senior. Spécialiste Docker, Kubernetes, CI/CD, résilience et sécurité système.',
  },
  {
    name: 'Code Reviewer',
    role: 'Auditeur de Code & Sécurité',
    prompt: 'Tu es un auditeur de code impitoyable et bienveillant. Analyse les failles, la complexité algorithmique et la maintenabilité.',
  },
  {
    name: 'Superviseur AOC',
    role: 'Superviseur Général AOC',
    prompt: 'Tu es le superviseur central de l\'Agent Operations Center. Coordonne les requêtes et synthétise les réponses avec clarté.',
  },
];

const form = ref<UpdateAgentPayload>({
  displayName: '',
  role: '',
  systemPrompt: '',
  avatarSprite: 'agent-1',
});

const isSaving = ref(false);

watch(
  () => props.agent,
  (newAgent) => {
    if (newAgent) {
      form.value = {
        displayName: newAgent.displayName || newAgent.modelName,
        role: newAgent.role || 'Assistant AOC',
        systemPrompt: newAgent.systemPrompt || '',
        avatarSprite: newAgent.avatarSprite || 'agent-1',
      };
    }
  },
  { immediate: true }
);

function applyPreset(preset: (typeof rolePresets)[0]) {
  form.value.role = preset.role;
  form.value.systemPrompt = preset.prompt;
}

function save() {
  if (!props.agent) return;
  isSaving.value = true;
  emit('save', {
    id: props.agent.id,
    data: { ...form.value },
  });
  isSaving.value = false;
  emit('close');
}
</script>
