import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Encodage Base64 (UTF-8 safe) utilisé pour transporter le code source d'un
 * bloc de code jusqu'au bouton "Copier" via un encodage HTML robuste.
 */
function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

/**
 * Échappement HTML des textes injectés dans le HTML généré.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renderer personnalisé : chaque bloc de code est encadré par une barre
 * contenant le langage et un bouton de copie (délégation d'événement).
 */
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = (lang || '').trim().split(/\s+/)[0] || 'text';
      const encoded = toBase64(text);

      return [
        `<div class="aoc-code">`,
        `<div class="aoc-code__bar">`,
        `<span class="aoc-code__lang">${escapeHtml(language)}</span>`,
        `<button type="button" class="aoc-code__copy" data-code="${encoded}">Copier</button>`,
        `</div>`,
        `<pre class="aoc-code__pre"><code>${escapeHtml(text)}</code></pre>`,
        `</div>`,
      ].join('');
    },
  },
});

/**
 * Convertit une réponse Markdown en HTML sécurisé (anti-XSS).
 */
export function renderMarkdown(source: string): string {
  if (!source) return '';

  const rawHtml = marked.parse(source, { async: false }) as string;

  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'form', 'input', 'iframe', 'object', 'embed'],
  });
}

/**
 * Décode un contenu Base64 (payload des boutons de copie).
 */
export function fromBase64(encoded: string): string {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}
