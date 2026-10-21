<template>
  <div class="aoc-markdown" @click="handleClick">
    <div v-if="html" v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown, fromBase64 } from '@/lib/markdown';

const props = defineProps<{
  content: string;
}>();

const html = computed(() => renderMarkdown(props.content ?? ''));

/**
 * Délégation d'événement : gère le clic sur les boutons "Copier" des blocs
 * de code sans attacher d'écouteur à chaque nœud DOM.
 */
function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const button = target?.closest('.aoc-code__copy') as HTMLButtonElement | null;
  if (!button) return;

  const encoded = button.dataset.code;
  if (!encoded) return;

  const code = fromBase64(encoded);
  if (!code) return;

  navigator.clipboard?.writeText(code).then(
    () => {
      const previous = button.textContent;
      button.textContent = 'Copié ✓';
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1500);
    },
    () => {
      const previous = button.textContent;
      button.textContent = 'Échec';
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1500);
    }
  );
}
</script>

<style>
/* Styles globaux (non scoped) : le HTML markdown est injecté via v-html */
.aoc-markdown {
  font-size: 12px;
  line-height: 1.7;
  word-break: break-word;
}

.aoc-markdown > *:first-child {
  margin-top: 0;
}
.aoc-markdown > *:last-child {
  margin-bottom: 0;
}

.aoc-markdown p {
  margin: 0 0 0.55em;
  white-space: pre-wrap;
}

.aoc-markdown ul,
.aoc-markdown ol {
  margin: 0 0 0.6em;
  padding-left: 1.15em;
  list-style: disc;
}
.aoc-markdown ol {
  list-style: decimal;
}
.aoc-markdown li {
  margin-bottom: 0.2em;
}

.aoc-markdown h1,
.aoc-markdown h2,
.aoc-markdown h3,
.aoc-markdown h4 {
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  margin: 0.9em 0 0.4em;
  line-height: 1.3;
}
.aoc-markdown h1 {
  font-size: 1.25em;
}
.aoc-markdown h2 {
  font-size: 1.12em;
}
.aoc-markdown h3 {
  font-size: 1.02em;
}

.aoc-markdown a {
  color: #38bdf8;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.aoc-markdown blockquote {
  margin: 0 0 0.6em;
  padding: 0.35em 0.7em;
  border-left: 2px solid rgba(56, 189, 248, 0.5);
  background: rgba(56, 189, 248, 0.06);
  border-radius: 0 4px 4px 0;
  color: rgba(226, 232, 240, 0.85);
}

.aoc-markdown hr {
  border: none;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  margin: 0.8em 0;
}

.aoc-markdown :not(pre) > code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.92em;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 4px;
  padding: 0.1em 0.35em;
  color: #7dd3fc;
}

.aoc-markdown table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 0.6em;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}
.aoc-markdown th,
.aoc-markdown td {
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 0.35em 0.55em;
  text-align: left;
}
.aoc-markdown th {
  background: rgba(148, 163, 184, 0.1);
}

/* Bloc de code avec barre d'outils */
.aoc-code {
  margin: 0 0 0.7em;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.85);
}

.aoc-code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.55rem;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.aoc-code__lang {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
}

.aoc-code__copy {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.15s ease;
}
.aoc-code__copy:hover {
  background: rgba(56, 189, 248, 0.22);
  color: #7dd3fc;
}

.aoc-code__pre {
  margin: 0;
  padding: 0.6rem 0.7rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre;
}
.aoc-code__pre code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}
</style>
