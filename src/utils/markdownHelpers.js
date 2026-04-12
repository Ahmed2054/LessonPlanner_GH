/**
 * markdownHelpers.js
 * Utilities for converting between HTML (AI output / PDF) and Markdown (editor display).
 *
 * Markdown conventions used in-app:
 *   **text**   → bold
 *   _text_     → italic
 *   __text__   → underline
 *   • text     → bullet list item (preceded by \n)
 *   \n         → line break
 */

// ─── HTML → Markdown (used when entering edit mode) ──────────────────────────
export function htmlToMarkdown(html) {
  if (!html) return '';
  return html
    // Block elements first
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(ul|ol)\s*>/gi, '')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `\n• ${inner.trim()}`)
    // Inline formatting
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '_$1_')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '_$1_')
    .replace(/<u>([\s\S]*?)<\/u>/gi, '__$1__')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Strip anything remaining
    .replace(/<[^>]+>/g, '')
    // Clean up excess blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Markdown → HTML (used for preview & PDF) ────────────────────────────────
export function markdownToHtml(md) {
  if (!md) return '';
  return md
    // Inline formatting (order matters: __ before _)
    .replace(/\*\*([\s\S]*?)\*\*/g, '<b>$1</b>')
    .replace(/__([\s\S]*?)__/g, '<u>$1</u>')
    .replace(/_([\s\S]*?)_/g, '<i>$1</i>')
    // Bullet lines → <li>
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>');
}
