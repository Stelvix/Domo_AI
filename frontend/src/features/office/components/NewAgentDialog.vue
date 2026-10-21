<template>
  <Dialog :open="open" @update:open="val => { if (!val) $emit('close'); }">
    <div class="space-y-4">
      <!-- Dialog Header -->
      <div class="flex items-center space-x-3 pb-3 border-b border-border">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/10 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
          <UserPlus :size="18" />
        </div>
        <div class="truncate">
          <h3 class="text-sm font-bold font-mono text-foreground truncate">Nouvel assistant</h3>
          <p class="text-[11px] text-muted-foreground font-mono truncate">
            Installez un modèle Ollama sur un bureau de l'open-space
          </p>
        </div>
      </div>

      <!-- Dialog Body -->
      <div class="space-y-4 text-xs font-mono max-h-[62vh] overflow-y-auto pr-1">
        <!-- Chargement des modèles -->
        <div v-if="isLoadingModels" class="flex items-center gap-2 py-6 justify-center text-muted-foreground">
          <Loader2 :size="16" class="animate-spin" />
          <span>Analyse des modèles Ollama...</span>
        </div>

        <!-- Ollama indisponible -->
        <div
          v-else-if="modelsError"
          class="flex items-start gap-2 p-3 rounded-xl bg-destructive/15 border border-destructive/40 text-destructive-foreground text-[11px]"
        >
          <AlertTriangle :size="14" class="shrink-0 mt-0.5" />
          <span>{{ modelsError }}</span>
        </div>

        <template v-else>
          <!-- Sélection du modèle -->
          <div>
            <label class="block text-xs font-bold text-foreground mb-1.5">
              Modèle Ollama <span class="text-destructive">*</span>
            </label>
            <select
              v-model="form.modelName"
              class="w-full h-9 rounded-lg border border-input bg-background/60 px-3 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            >
              <option value="" disabled>-- Sélectionnez un modèle installé --</option>
              <option v-for="model in availableModels" :key="model.name" :value="model.name">
                {{ model.name }}{{ model.details?.parameter_size ? ` (${model.details.parameter_size})` : '' }}
              </option>
            </select>
            <p class="mt-1.5 text-[10px] text-muted-foreground">
              Seuls les modèles installés localement et non encore affectés sont proposés.
              <span v-if="assignedCount > 0" class="text-amber-400/80">
                ({{ assignedCount }} déjà en poste{{ assignedCount > 1 ? 's' : '' }})
              </span>
            </p>
            <p v-if="models.length === 0" class="mt-1.5 text-[10px] text-amber-400/80">
              Aucun modèle installé. Lancez <code class="px-1 rounded bg-muted">ollama pull llama3</code>.
            </p>
          </div>

          <!-- Nom d'affichage -->
          <div>
            <label class="block text-xs font-bold text-foreground mb-1.5">Nom d'affichage</label>
            <Input
              v-model="form.displayName"
              placeholder="Ex: Lead Développeur IA"
            />
          </div>

          <!-- Rôle métier -->
          <div>
            <label class="block text-xs font-bold text-foreground mb-1.5">Rôle Métier Attribué</label>
            <Input v-model="form.role" placeholder="Ex: Lead Développeur Full-Stack" class="mb-2" />
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="preset in rolePresets"
                :key="preset.name"
                type="button"
                class="px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-[10px] text-secondary-foreground border border-border/80 transition-colors"
                @click="applyPreset(preset)"
              >
                + {{ preset.name }}
              </button>
            </div>
          </div>

          <!-- Sprite -->
          <div>
            <label class="block text-xs font-bold text-foreground mb-2">Sprite Pixel Art</label>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="sId in spriteOptions"
                :key="sId"
                type="button"
                class="p-2 rounded-xl border flex flex-col items-center justify-center transition-all"
                :class="[
                  form.avatarSprite === sId
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-background/50 hover:border-primary/50',
                ]"
                @click="form.avatarSprite = sId"
              >
                <PixelAvatar :sprite-id="sId" :size="30" />
              </button>
            </div>
          </div>

          <!-- Prompt système -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-foreground">Prompt Système</label>
              <span class="text-[10px] text-muted-foreground">Optionnel</span>
            </div>
            <Textarea
              v-model="form.systemPrompt"
              rows="3"
              placeholder="Instructions de comportement pour ce LLM..."
              class="resize-none text-xs leading-relaxed"
            />
            <p class="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
              S'il est vide, un prompt par défaut est généré à partir du rôle choisi.
            </p>
          </div>
        </template>
      </div>

      <!-- Dialog Footer -->
      <div class="pt-3 border-t border-border flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" @click="$emit('close')">Annuler</Button>
        <Button
          variant="default"
          size="sm"
          :loading="isSaving"
          :disabled="!form.modelName || isLoadingModels"
          @click="save"
        >
          <UserPlus :size="13" class="mr-1.5" />
          Installer l'assistant
        </Button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { UserPlus, Loader2, AlertTriangle } from 'lucide-vue-next';
import Dialog from '@/components/ui/Dialog.vue';
import Input from '@/components/ui/Input.vue';
import Textarea from '@/components/ui/Textarea.vue';
import Button from '@/components/ui/Button.vue';
import PixelAvatar from './PixelAvatar.vue';
import { ollamaApi, type OllamaModel } from '../services/ollama.api';
import type { CreateAgentPayload } from '@/types/agent';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', payload: CreateAgentPayload, done: (success: boolean) => void): void;
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
    name: 'Rédacteur',
    role: 'Rédacteur Technique & Documentaire',
    prompt: 'Tu es un rédacteur technique expert. Produis des contenus clairs, structurés et optimisés pour le référencement.',
  },
  {
    name: 'Superviseur AOC',
    role: 'Superviseur Général AOC',
    prompt: 'Tu es le superviseur central de l\'Agent Operations Center. Coordonne les requêtes et synthétise les réponses avec clarté.',
  },
];

const form = ref<CreateAgentPayload>({
  modelName: '',
  displayName: '',
  role: '',
  systemPrompt: '',
  avatarSprite: 'agent-1',
});

const models = ref<OllamaModel[]>([]);
const isLoadingModels = ref(false);
const modelsError = ref<string | null>(null);
const isSaving = ref(false);

const availableModels = computed(() => models.value.filter((model) => !model.isAssigned));
const assignedCount = computed(() => models.value.filter((model) => model.isAssigned).length);

/**
 * Charge la liste des modèles Ollama à l'ouverture de la modale.
 */
async function loadModels() {
  isLoadingModels.value = true;
  modelsError.value = null;

  try {
    models.value = await ollamaApi.fetchModels();
  } catch (err: any) {
    models.value = [];
    modelsError.value =
      err.message ||
      'Impossible de récupérer les modèles Ollama. Vérifiez que le service est démarré.';
  } finally {
    isLoadingModels.value = false;
  }
}

function applyPreset(preset: (typeof rolePresets)[0]) {
  form.value.role = preset.role;
  form.value.systemPrompt = preset.prompt;
}

function save() {
  if (!form.value.modelName || isSaving.value) return;
  isSaving.value = true;

  emit('create', { ...form.value }, (success: boolean) => {
    isSaving.value = false;
    if (success) {
      emit('close');
    }
  });
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;

    form.value = {
      modelName: '',
      displayName: '',
      role: '',
      systemPrompt: '',
      avatarSprite: 'agent-1',
    };

    await loadModels();
  },
  { immediate: true }
);
</script>
