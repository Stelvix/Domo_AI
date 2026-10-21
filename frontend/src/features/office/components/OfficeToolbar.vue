<template>
  <header class="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 py-3 shadow-md">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
      <!-- Left: Logo AOC & Navigation Tabs -->
      <div class="flex items-center justify-between w-full md:w-auto space-x-4">
        <!-- Logo Hologramme AOC -->
        <div class="flex items-center space-x-2.5 cursor-pointer" @click="$emit('update:activeTab', 'office')">
          <div class="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono text-xs shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            AOC
            <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-mono font-bold text-sm tracking-wider text-slate-100">PIXEL OFFICE</span>
              <Badge variant="neon" class="text-[9px] px-1.5 py-0">v1.0</Badge>
            </div>
            <p class="text-[10px] text-muted-foreground font-mono hidden sm:block">Agent Operations Center • Local LLMs</p>
          </div>
        </div>

        <!-- Mode Switcher Tabs (Bureau / Moniteur) -->
        <TabsList class="h-8">
          <TabsTrigger
            value="office"
            class="h-7 text-[11px] px-2.5"
            :class="{ 'bg-background text-primary shadow-sm': activeTab === 'office' }"
            @click="$emit('update:activeTab', 'office')"
          >
            <LayoutGrid :size="12" class="mr-1.5" />
            <span>Bureau</span>
          </TabsTrigger>
          <TabsTrigger
            value="monitor"
            class="h-7 text-[11px] px-2.5"
            :class="{ 'bg-background text-primary shadow-sm': activeTab === 'monitor' }"
            @click="$emit('update:activeTab', 'monitor')"
          >
            <BarChart2 :size="12" class="mr-1.5" />
            <span>Moniteur HUD</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Right: Command Palette, Status & Sync Action -->
      <div class="flex items-center space-x-2 w-full md:w-auto justify-end">
        <!-- Command Palette Trigger Button (Cmd + K) -->
        <Button
          variant="outline"
          size="sm"
          class="hidden sm:inline-flex text-muted-foreground hover:text-foreground font-mono text-xs h-8 px-3"
          @click="$emit('openCommandMenu')"
        >
          <Search :size="13" class="mr-2 text-muted-foreground" />
          <span>Recherche rapide...</span>
          <kbd class="ml-2 pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <!-- Ollama Connection Status Badge -->
        <Badge
          :variant="isOllamaConnected ? 'success' : 'warning'"
          class="h-8 px-2.5 text-xs font-mono"
        >
          <span
            class="w-2 h-2 rounded-full mr-1.5"
            :class="isOllamaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
          ></span>
          <span>{{ isOllamaConnected ? `${onlineCount} en ligne` : 'Ollama Hors-ligne' }}</span>
        </Badge>

        <!-- Sync Button with Spinner -->
        <Button
          variant="default"
          size="sm"
          :disabled="isSyncing"
          class="h-8 px-3"
          @click="$emit('sync')"
        >
          <RefreshCw :size="13" class="mr-1.5" :class="{ 'animate-spin': isSyncing }" />
          <span>{{ isSyncing ? 'Scan...' : 'Sync' }}</span>
        </Button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { LayoutGrid, BarChart2, Search, RefreshCw } from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';
import Badge from '@/components/ui/Badge.vue';
import TabsList from '@/components/ui/TabsList.vue';
import TabsTrigger from '@/components/ui/TabsTrigger.vue';

defineProps<{
  isOllamaConnected: boolean;
  onlineCount: number;
  totalCount: number;
  isSyncing: boolean;
  activeTab: 'office' | 'monitor';
}>();

defineEmits<{
  (e: 'sync'): void;
  (e: 'update:activeTab', tab: 'office' | 'monitor'): void;
  (e: 'openCommandMenu'): void;
}>();
</script>
