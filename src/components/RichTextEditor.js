import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { htmlToMarkdown } from '../utils/markdownHelpers';

/**
 * RichTextEditor
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean multi-line TextInput.  When text is selected, a formatting bar
 * appears BELOW the TextInput (never above/near cursor, so it never
 * conflicts with Android's native Cut/Copy/Paste popup).
 *
 * Users can ALSO type markdown directly:
 *   **bold**   _italic_   __underline__   • bullet   1. list
 * ─────────────────────────────────────────────────────────────────────────────
 */

const RichTextEditor = ({
  value,
  onChangeText,
  minHeight = 120,
  placeholder = 'Type here…',
}) => {
  const [localText, setLocalText]     = useState(() => htmlToMarkdown(value || ''));
  const [selection, setSelection]     = useState({ start: 0, end: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync if parent value changes externally (e.g. phase regeneration)
  const prevValueRef = useRef(value);
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    const md = htmlToMarkdown(value || '');
    if (md !== localText) setLocalText(md);
  }

  // Fade the bar in or out
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: hasSelection ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [hasSelection]);

  const handleTextChange = useCallback((text) => {
    setLocalText(text);
    onChangeText(text);
  }, [onChangeText]);

  const handleSelectionChange = (e) => {
    const sel = e.nativeEvent.selection;
    setSelection(sel);
    setHasSelection(sel.start !== sel.end);
  };

  // Wrap selected text with markdown markers
  const applyFormat = (open, close) => {
    const { start, end } = selection;
    const before   = localText.slice(0, start);
    const selected = localText.slice(start, end);
    const after    = localText.slice(end);
    const newText  = before + open + selected + close + after;
    setLocalText(newText);
    onChangeText(newText);
    setHasSelection(false);
  };

  // Insert a prefix at the start of the line that contains the cursor
  const insertLinePrefix = (prefix) => {
    const { start } = selection;
    const before    = localText.slice(0, start);
    const after     = localText.slice(start);
    const lastNL    = before.lastIndexOf('\n');
    const lineStart = lastNL === -1 ? 0 : lastNL + 1;
    const lineHead  = localText.slice(0, lineStart);
    const lineRest  = localText.slice(lineStart, start);
    const newText   = lineHead + prefix + lineRest + after;
    setLocalText(newText);
    onChangeText(newText);
    setHasSelection(false);
  };

  const FORMATS = [
    { label: 'Bold',      labelStyle: { fontWeight: '800' },              action: () => applyFormat('**', '**') },
    { label: 'Italic',    labelStyle: { fontStyle: 'italic' },            action: () => applyFormat('_', '_')   },
    { label: 'Underline', labelStyle: { textDecorationLine: 'underline' }, action: () => applyFormat('__', '__') },
    { label: '• Bullet',  labelStyle: {},                                  action: () => insertLinePrefix('• ')  },
    { label: '1. List',   labelStyle: {},                                  action: () => insertLinePrefix('1. ') },
  ];

  return (
    <View>
      {/* ── TextInput comes FIRST ────────────────────────────────────────── */}
      <TextInput
        style={[styles.input, { minHeight }]}
        multiline
        textAlignVertical="top"
        value={localText}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        scrollEnabled={false}
        // On iOS, hide the native popup so only our bar shows
        contextMenuHidden={Platform.OS === 'ios'}
      />

      {/* ── Formatting bar — rendered BELOW input, never near the cursor ── */}
      {/* This avoids any spatial conflict with Android's native Cut/Copy/   */}
      {/* Paste toolbar which appears above or near the selected text.        */}
      <Animated.View
        style={[styles.fmtBar, { opacity: fadeAnim }]}
        pointerEvents={hasSelection ? 'auto' : 'none'}
      >
        <Text style={styles.fmtLabel}>Format:</Text>
        {FORMATS.map(({ label, labelStyle, action }, i) => (
          <React.Fragment key={label}>
            {i > 0 && <View style={styles.divider} />}
            <TouchableOpacity style={styles.fmtBtn} onPress={action} activeOpacity={0.6}>
              <Text style={[styles.fmtBtnText, labelStyle]}>{label}</Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </Animated.View>

      {/* ── Hint text ────────────────────────────────────────────────────── */}
      <Text style={styles.hint}>
        Select text to format  ·  or type{' '}
        <Text style={{ fontWeight: '800' }}>**bold**</Text>
        {'  '}
        <Text style={{ fontStyle: 'italic' }}>_italic_</Text>
        {'  '}
        <Text style={{ textDecorationLine: 'underline' }}>__underline__</Text>
        {'  '}• bullet
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e5e8',
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    color: '#1a1a2e',
  },
  // Bar rendered below the TextInput — spatially separate from the native popup
  fmtBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 2,
  },
  fmtLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    marginRight: 4,
    letterSpacing: 0.5,
  },
  fmtBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
  },
  fmtBtnText: {
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 1,
  },
  hint: {
    fontSize: 10,
    color: '#aab0be',
    marginTop: 5,
    marginLeft: 2,
    lineHeight: 15,
  },
});

export default RichTextEditor;
