<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <div class="space-y-4">
      <!-- Dialog Header -->
      <div class="flex items-center justify-between pr-8">
        <div>
          <h3 class="text-sm font-bold font-mono text-foreground">Installer l'application</h3>
          <p class="text-[11px] text-muted-foreground font-mono mt-0.5">
            Scannez ce QR code avec votre téléphone pour installer la PWA.
          </p>
        </div>
        <Badge variant="neon" class="text-[9px] px-1.5 py-0 shrink-0">PWA</Badge>
      </div>

      <!-- QR Code -->
      <div class="flex flex-col items-center gap-3">
        <div class="relative p-3 rounded-2xl bg-white shadow-[0_0_30px_rgba(56,189,248,0.15)]">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="QR code d'installation de l'application"
            class="w-48 h-48 sm:w-56 sm:h-56 block"
          />
          <div
            v-else
            class="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-slate-400 text-[10px] font-mono"
          >
            Génération du QR code...
          </div>
        </div>

        <!-- URL cliquable -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 border border-border font-mono text-[11px] text-foreground hover:border-primary transition-colors max-w-full"
          title="Copier le lien"
          @click="copyUrl"
        >
          <Link2 :size="13" class="shrink-0 text-primary" />
          <span class="truncate">{{ installUrl || 'URL indisponible' }}</span>
          <Check v-if="copied" :size="13" class="shrink-0 text-emerald-400" />
          <Copy v-else :size="13" class="shrink-0 text-muted-foreground" />
        </button>
      </div>

      <!-- Avertissement localhost -->
      <div
        v-if="isLocalhostOnly"
        class="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono"
      >
        <AlertTriangle :size="14" class="shrink-0 mt-0.5" />
        <span>
          L'application est servie sur <code class="px-1 rounded bg-amber-500/15">localhost</code> :
          cette adresse est inaccessible depuis votre téléphone. Le QR code ci-dessus
          pointe automatiquement vers votre adresse IP réseau local.
        </span>
      </div>

      <!-- Avertissement mode développement -->
      <div
        v-if="isDevServer"
        class="flex items-start gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[11px] font-mono"
      >
        <Info :size="14" class="shrink-0 mt-0.5" />
        <span>
          Vous consultez le serveur de développement Vite : le Service Worker n'y est pas
          actif. Pour une installation PWA complète, utilisez la build de production
          conteneurisée (<code class="px-1 rounded bg-sky-500/15">docker compose up -d</code>).
        </span>
      </div>

      <!-- Instructions par plateforme -->
      <div class="space-y-2">
        <div
          v-for="guide in guides"
          :key="guide.title"
          class="p-3 rounded-xl bg-background/50 border border-border/70"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <component :is="guide.icon" :size="14" class="text-primary" />
            <span class="text-[11px] font-bold font-mono text-foreground">{{ guide.title }}</span>
          </div>
          <ol class="space-y-1 pl-5 list-decimal text-[11px] font-mono text-muted-foreground">
            <li v-for="(step, index) in guide.steps" :key="index">{{ step }}</li>
          </ol>
        </div>
      </div>

      <!-- Adresse IP brute (aide au débogage) -->
      <div v-if="networkAddresses.length > 0" class="pt-2 border-t border-border/60">
        <p class="text-[10px] font-mono text-muted-foreground mb-1">Interfaces réseau détectées :</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="address in networkAddresses"
            :key="address.address"
            class="px-2 py-0.5 rounded bg-secondary/60 border border-border/70 text-[10px] font-mono text-secondary-foreground"
          >
            {{ address.interface }} : {{ address.address }}
          </span>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import QRCode from 'qrcode';
import {
  Smartphone,
  Apple,
  Monitor,
  Link2,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-vue-next';
import Dialog from '@/components/ui/Dialog.vue';
import Badge from '@/components/ui/Badge.vue';
import { systemApi, type NetworkAddress } from '../services/install.api';

const props = defineProps<{
  open: boolean;
}>();

defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const qrDataUrl = ref<string | null>(null);
const copied = ref(false);
const networkAddresses = ref<NetworkAddress[]>([]);
const backendPrimaryIp = ref<string | null>(null);
const backendPort = ref<number | null>(null);

const isLocalhost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';

/**
 * URL d'installation : on remplace uniquement le nom d'hôte par l'adresse IP
 * LAN (accessible depuis le téléphone) en conservant le port courant, qui est
 * celui où la PWA est réellement servie (5173 en dev Vite, 3001 en prod Docker).
 */
const installUrl = computed(() => {
  const current = window.location;
  const currentPort = current.port || (current.protocol === 'https:' ? '443' : '80');
  const host = isLocalhost(current.hostname)
    ? backendPrimaryIp.value || current.hostname
    : current.hostname;

  return `${current.protocol}//${host}:${currentPort}/`;
});

const isLocalhostOnly = computed(() => isLocalhost(window.location.hostname));

/**
 * Vrai lorsque la page courante est servie par le serveur de développement
 * Vite (port différent du backend) : le Service Worker n'y est pas actif,
 * l'installation PWA n'est donc possible que sur la build de production.
 */
const isDevServer = computed(() => {
  if (!backendPort.value) return false;
  const currentPort = Number(window.location.port || 80);
  return currentPort !== backendPort.value;
});

const guides = [
  {
    title: 'iPhone / iPad (Safari)',
    icon: Apple,
    steps: [
      'Ouvrez le lien scanné dans Safari',
      'Appuyez sur le bouton "Partager" (icône carré avec flèche vers le haut)',
      'Choisissez "Sur l\'écran d\'accueil"',
      'Validez avec "Ajouter" : l\'icône AOC apparaît sur votre écran',
    ],
  },
  {
    title: 'Android (Chrome)',
    icon: Smartphone,
    steps: [
      'Ouvrez le lien scanné dans Chrome',
      'Menu ⋮ puis "Installer l\'application" (ou "Ajouter à l\'écran d\'accueil")',
      'Confirmez l\'installation',
    ],
  },
  {
    title: 'Ordinateur (Chrome / Edge)',
    icon: Monitor,
    steps: [
      'Ouvrez l\'application dans Chrome ou Edge',
      'Cliquez sur l\'icône d\'installation dans la barre d\'adresse',
      'Confirmez : l\'application s\'ouvre en fenêtre autonome',
    ],
  },
];

/**
 * Génère le QR code à partir de l'URL d'installation.
 */
async function generateQrCode() {
  try {
    qrDataUrl.value = await QRCode.toDataURL(installUrl.value, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (error) {
    console.error('[InstallPwaDialog] Génération du QR code impossible :', error);
    qrDataUrl.value = null;
  }
}

async function copyUrl() {
  if (!installUrl.value) return;
  try {
    await navigator.clipboard.writeText(installUrl.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
  } catch {
    // Presse-papiers indisponible : on ignore.
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;

    try {
      const info = await systemApi.fetchNetworkInfo();
      networkAddresses.value = info.addresses;
      backendPrimaryIp.value = info.primary;
      backendPort.value = info.port;
    } catch (error) {
      console.error('[InstallPwaDialog] Informations réseau indisponibles :', error);
    }
  },
  { immediate: true }
);

// Le QR code est régénéré dès que l'URL d'installation change (IP LAN résolue).
watch(installUrl, generateQrCode, { immediate: true });
</script>
