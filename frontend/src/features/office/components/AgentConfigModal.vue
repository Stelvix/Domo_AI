<template>
  <Dialog :open="isOpen && !!agent" @update:open="val => { if (!val) $emit('close'); }">
    <div v-if="agent" class="space-y-4">
      <!-- Dialog Header -->
      <div class="flex items-center space-x-3 pb-3 border-b border-border">
        <PixelAvatar :sprite-id="form.avatarSprite" :status="agent.status" :size="38" />
        <div class="truncate">
          <h3 class="text-sm font-bold font-mono text-foreground truncate">
            Configurer {{ form.displayName || agent.modelName }}
          </h3>
          <p class="text-[11px] text-muted-foreground font-mono truncate">{{ agent.modelName }}</p>
        </div>
      </div>

      <!-- Dialog Body -->
      <div class="space-y-4 text-xs font-mono max-h-[60vh] overflow-y-auto pr-1">
        <!-- Avatar Style Selection -->
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

        <!-- Display Name -->
        <div>
          <label class="block text-xs font-bold text-foreground mb-1.5">Nom d'affichage</label>
          <Input
            v-model="form.displayName"
            placeholder="Ex: Lead Développeur IA"
          />
        </div>

        <!-- Role & Presets -->
        <div>
          <label class="block text-xs font-bold text-foreground mb-1.5">Rôle Métier Attribué</label>
          <Input
            v-model="form.role"
            placeholder="Ex: Lead Développeur Full-Stack"
            class="mb-2"
          />

          <!-- Quick Presets -->
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

        <!-- Custom System Prompt -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-bold text-foreground">Prompt Système Injecté</label>
            <span class="text-[10px] text-muted-foreground">Injecté à chaque requête</span>
          </div>
          <Textarea
            v-model="form.systemPrompt"
            rows="4"
            placeholder="Instructions de comportement pour ce LLM..."
            class="resize-none text-xs leading-relaxed"
          />
          <p class="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
            Ce prompt s'ajoute au rôle système global de l'AOC injecté par le backend.
          </p>
        </div>

        <!-- Position dans la grille pixel art -->
        <div>
          <label class="block text-xs font-bold text-foreground mb-1.5">Position dans l'open-space</label>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-muted-foreground mr-1">X</span>
              <Input
                v-model.number="form.positionX"
                type="number"
                min="0"
                max="63"
                class="w-20"
              />
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-muted-foreground mr-1">Y</span>
              <Input
                v-model.number="form.positionY"
                type="number"
                min="0"
                max="63"
                class="w-20"
              />
            </div>
            <span class="text-[10px] text-muted-foreground">
              (la grille fait 4 colonnes - glissez-déposez plutôt :)
            </span>
          </div>
        </div>

        <!-- Suppression de l'agent -->
        <div class="pt-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            class="w-full text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            <Trash2 :size="13" class="mr-1.5" />
            {{ isDeleting ? 'Suppression...' : 'Retirer cet agent du bureau' }}
          </Button>
        </div>
      </div>

      <!-- Dialog Footer -->
      <div class="pt-3 border-t border-border flex items-center justify-end space-x-2">
        <Button variant="ghost" size="sm" @click="$emit('close')">
          Annuler
        </Button>
        <Button variant="default" size="sm" :loading="isSaving" @click="save">
          Enregistrer
        </Button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import Dialog from '@/components/ui/Dialog.vue';
import Input from '@/components/ui/Input.vue';
import Textarea from '@/components/ui/Textarea.vue';
import Button from '@/components/ui/Button.vue';
import PixelAvatar from './PixelAvatar.vue';
import type { Agent, UpdateAgentPayload } from '@/types/agent';

const props = defineProps<{
  isOpen: boolean;
  agent: Agent | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { id: string; data: UpdateAgentPayload }, done: (success: boolean) => void): void;
  (e: 'delete', id: string, done: (success: boolean) => void): void;
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
  positionX: 0,
  positionY: 0,
});

const isSaving = ref(false);
const isDeleting = ref(false);

watch(
  () => props.agent,
  (newAgent) => {
    if (newAgent) {
      form.value = {
        displayName: newAgent.displayName || newAgent.modelName,
        role: newAgent.role || 'Assistant AOC',
        systemPrompt: newAgent.systemPrompt || '',
        avatarSprite: newAgent.avatarSprite || 'agent-1',
        positionX: newAgent.positionX ?? 0,
        positionY: newAgent.positionY ?? 0,
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
  if (!props.agent || isSaving.value) return;
  isSaving.value = true;

  emit(
    'save',
    {
      id: props.agent.id,
      data: { ...form.value },
    },
    (success: boolean) => {
      isSaving.value = false;
      if (success) emit('close');
    }
  );
}

function confirmDelete() {
  if (!props.agent || isDeleting.value) return;
  isDeleting.value = true;

  emit('delete', props.agent.id, (success: boolean) => {
    isDeleting.value = false;
    if (success) emit('close');
  });
}
</script>
