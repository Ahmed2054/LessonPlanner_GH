import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

/**
 * SimpleHTMLView
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a string that may contain:
 *   • HTML tags  : <b>, <i>, <u>, <li>, <br/>, <ul>, <ol>
 *   • Markdown   : **bold**, _italic_, __underline__, • bullet, \n newline
 * Both formats are supported so newly edited (markdown) and AI-generated
 * (HTML) content both render correctly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Token types we understand
const TOKEN_RE = new RegExp(
  [
    // Markdown inline (order matters: __ before _, ** before *)
    /(\*\*[\s\S]*?\*\*)/.source,   // **bold**
    /(__[\s\S]*?__)/.source,        // __underline__
    /(_[\s\S]*?_)/.source,          // _italic_
    // HTML inline
    /(<b>[\s\S]*?<\/b>)/.source,
    /(<strong>[\s\S]*?<\/strong>)/.source,
    /(<i>[\s\S]*?<\/i>)/.source,
    /(<em>[\s\S]*?<\/em>)/.source,
    /(<u>[\s\S]*?<\/u>)/.source,
    /(<li>[\s\S]*?<\/li>)/.source,
    /(<br\/?>)/.source,
    // Bullet line (markdown)
    /(^• .+$)/.source,
  ].join('|'),
  'gim'
);

const strip = (s, open, close) => s.slice(open.length, s.length - close.length);

const SimpleHTMLView = ({ html, style }) => {
  if (!html) return null;

  // Split the string into tokens
  TOKEN_RE.lastIndex = 0;
  const parts = html.split(TOKEN_RE).filter(p => p !== undefined && p !== '');

  return (
    <Text style={[styles.activityText, style]}>
      {parts.map((part, i) => {
        if (!part) return null;
        const lp = part.toLowerCase();

        // ── Markdown bold ──────────────────────────────────────────
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
          return <Text key={i} style={{ fontWeight: 'bold' }}>{strip(part, '**', '**')}</Text>;

        // ── Markdown underline ─────────────────────────────────────
        if (part.startsWith('__') && part.endsWith('__') && part.length > 4)
          return <Text key={i} style={{ textDecorationLine: 'underline' }}>{strip(part, '__', '__')}</Text>;

        // ── Markdown italic ────────────────────────────────────────
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2)
          return <Text key={i} style={{ fontStyle: 'italic' }}>{strip(part, '_', '_')}</Text>;

        // ── HTML bold ──────────────────────────────────────────────
        if (lp.startsWith('<b>') || lp.startsWith('<strong>'))
          return <Text key={i} style={{ fontWeight: 'bold' }}>{part.replace(/<\/?(?:b|strong)>/gi, '')}</Text>;

        // ── HTML italic ────────────────────────────────────────────
        if (lp.startsWith('<i>') || lp.startsWith('<em>'))
          return <Text key={i} style={{ fontStyle: 'italic' }}>{part.replace(/<\/?(?:i|em)>/gi, '')}</Text>;

        // ── HTML underline ─────────────────────────────────────────
        if (lp.startsWith('<u>'))
          return <Text key={i} style={{ textDecorationLine: 'underline' }}>{part.replace(/<\/?u>/gi, '')}</Text>;

        // ── HTML list item ─────────────────────────────────────────
        if (lp.startsWith('<li>'))
          return <Text key={i}>{'\n  \u2022 '}{part.replace(/<\/?li>/gi, '').replace(/<[^>]+>/g, '')}</Text>;

        // ── HTML line break ────────────────────────────────────────
        if (lp.startsWith('<br')) return '\n';

        // ── Markdown bullet line ───────────────────────────────────
        if (part.startsWith('• '))
          return <Text key={i}>{'\n  \u2022 '}{part.slice(2)}</Text>;

        // ── Plain text (strip any remaining unrecognised HTML) ─────
        return part.replace(/<[^>]+>/g, '');
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  activityText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.dark,
    marginTop: 4,
  },
});

export default SimpleHTMLView;
