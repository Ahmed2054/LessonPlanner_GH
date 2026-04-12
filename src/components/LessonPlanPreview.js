import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import SimpleHTMLView from './SimpleHTMLView';
import RichTextEditor from './RichTextEditor';

// Color palette for phase accent cycling
const PHASE_COLORS = [COLORS.primary, COLORS.accent, '#8b5cf6', COLORS.success, '#f59e0b'];
// Icons assigned per common phase name patterns
const getPhaseIcon = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('starter') || n.includes('intro') || n.includes('warm')) return 'flash-outline';
  if (n.includes('new learning') || n.includes('main') || n.includes('core') || n.includes('presentation')) return 'bulb-outline';
  if (n.includes('activit') || n.includes('practice') || n.includes('application')) return 'construct-outline';
  if (n.includes('closure') || n.includes('plenary') || n.includes('conclusion') || n.includes('reflect')) return 'flag-outline';
  if (n.includes('assess') || n.includes('evaluat')) return 'clipboard-outline';
  return 'layers-outline';
};

const LessonPlanPreview = ({
  editablePlan,
  generatedPlan,
  regeneratingPhaseIndex,
  editingPhaseIndex,
  setEditingPhaseIndex,
  handleRegenerateSinglePhase,
  updatePhaseField,
}) => {
  // ── Raw text fallback (no structured plan yet) ──────────────────
  if (!editablePlan) {
    return (
      <View style={styles.rawTextContainer}>
        <Text style={styles.rawText}>{generatedPlan}</Text>
      </View>
    );
  }

  // ── Note content layout ─────────────────────────────────────────
  if (editablePlan.noteContent) {
    return (
      <View>
        <View style={styles.noteCard}>
          <View style={styles.noteLabelRow}>
            <View style={[styles.noteLabelIcon, { backgroundColor: COLORS.accent + '15' }]}>
              <Ionicons name="document-text-outline" size={14} color={COLORS.accent} />
            </View>
            <Text style={[styles.noteLabelText, { color: COLORS.accent }]}>Note</Text>
          </View>
          <SimpleHTMLView html={editablePlan.noteContent} />
        </View>
      </View>
    );
  }

  // ── Questions content layout ────────────────────────────────────
  if (editablePlan.questionsContent) {
    return (
      <View>
        <View style={styles.noteCard}>
          <View style={styles.noteLabelRow}>
            <View style={[styles.noteLabelIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="help-circle-outline" size={14} color={COLORS.primary} />
            </View>
            <Text style={[styles.noteLabelText, { color: COLORS.primary }]}>Questions</Text>
          </View>
          <SimpleHTMLView html={editablePlan.questionsContent} />
        </View>
        <View style={[styles.noteCard, { marginTop: 10 }]}>
          <View style={styles.noteLabelRow}>
            <View style={[styles.noteLabelIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
            </View>
            <Text style={[styles.noteLabelText, { color: COLORS.success }]}>Answers</Text>
          </View>
          <SimpleHTMLView html={editablePlan.answersContent} />
        </View>
      </View>
    );
  }

  // ── Phased lesson plan layout ───────────────────────────────────
  return (
    <View>
      {editablePlan.phases?.map((p, idx) => {
        const isEditing = editingPhaseIndex === idx;
        const isRegenerating = regeneratingPhaseIndex === idx;
        const phaseColor = PHASE_COLORS[idx % PHASE_COLORS.length];
        const phaseIcon = getPhaseIcon(p.name);

        return (
          <View key={idx} style={[styles.phaseCard, { borderLeftColor: phaseColor }]}>
            {/* ── Phase header ─────────────────────────────────── */}
            <View style={styles.phaseHeaderRow}>
              <View style={styles.phaseHeaderLeft}>
                <View style={[styles.phaseNumberBadge, { backgroundColor: phaseColor + '15' }]}>
                  <Ionicons name={phaseIcon} size={15} color={phaseColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.phaseName, { color: phaseColor }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={11} color={COLORS.dark + '80'} style={{ marginRight: 3 }} />
                    <Text style={styles.durationText}>{p.duration}</Text>
                  </View>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.phaseActions}>
                <TouchableOpacity
                  onPress={() => handleRegenerateSinglePhase(idx, p.name)}
                  style={[styles.phaseActionBtn, {
                    backgroundColor: COLORS.accent + '10',
                    borderColor: COLORS.accent + '25',
                  }]}
                  disabled={regeneratingPhaseIndex !== null}
                  activeOpacity={0.7}
                >
                  {isRegenerating
                    ? <ActivityIndicator size="small" color={COLORS.accent} />
                    : <Ionicons name="refresh-outline" size={16} color={COLORS.accent} />}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingPhaseIndex(isEditing ? null : idx)}
                  style={[styles.phaseActionBtn, {
                    backgroundColor: isEditing ? COLORS.success + '12' : phaseColor + '10',
                    borderColor: isEditing ? COLORS.success + '30' : phaseColor + '25',
                  }]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isEditing ? 'checkmark' : 'create-outline'}
                    size={16}
                    color={isEditing ? COLORS.success : phaseColor}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Phase content ────────────────────────────────── */}
            {isEditing ? (
              <View style={styles.editContainer}>
                <View>
                  <View style={styles.editFieldLabel}>
                    <Ionicons name="list-outline" size={12} color={COLORS.accent} style={{ marginRight: 5 }} />
                    <Text style={[styles.fieldLabel, { color: COLORS.accent }]}>Activities</Text>
                  </View>
                  <RichTextEditor
                    value={p.activities}
                    onChangeText={(val) => updatePhaseField(idx, 'activities', val)}
                    minHeight={130}
                    placeholder="Describe the activities for this phase..."
                  />
                </View>
                <View>
                  <View style={styles.editFieldLabel}>
                    <Ionicons name="cube-outline" size={12} color="#8b5cf6" style={{ marginRight: 5 }} />
                    <Text style={[styles.fieldLabel, { color: '#8b5cf6' }]}>Resources</Text>
                  </View>
                  <RichTextEditor
                    value={p.resources}
                    onChangeText={(val) => updatePhaseField(idx, 'resources', val)}
                    minHeight={70}
                    placeholder="List any resources needed..."
                  />
                </View>
              </View>
            ) : (
              <View style={styles.phaseContentView}>
                {/* Activities */}
                <View style={styles.activitiesBlock}>
                  <SimpleHTMLView html={p.activities} />
                </View>

                {/* Resources */}
                {p.resources ? (
                  <View style={styles.resourcesBlock}>
                    <View style={styles.resourcesLabelRow}>
                      <View style={styles.resourcesIcon}>
                        <Ionicons name="cube-outline" size={11} color="#8b5cf6" />
                      </View>
                      <Text style={styles.resourcesLabel}>Resources</Text>
                    </View>
                    <SimpleHTMLView html={p.resources} style={{ fontSize: 12 }} />
                  </View>
                ) : null}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Raw text fallback ──────────────────────────────────────────
  rawTextContainer: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 16,
  },
  rawText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.dark,
  },

  // ── Note / Questions card ─────────────────────────────────────
  noteCard: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 14,
  },
  noteLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteLabelIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  noteLabelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Phase card ────────────────────────────────────────────────
  phaseCard: {
    backgroundColor: '#fafbfc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#eef0f3',
  },

  // ── Phase header ──────────────────────────────────────────────
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  phaseNumberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  phaseName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dark,
    opacity: 0.5,
  },

  // ── Phase action buttons ──────────────────────────────────────
  phaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // ── Phase content — view mode ─────────────────────────────────
  phaseContentView: {
    marginTop: 2,
  },
  activitiesBlock: {
    paddingLeft: 2,
  },
  resourcesBlock: {
    marginTop: 10,
    backgroundColor: '#f3f0ff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ece8ff',
  },
  resourcesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resourcesIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#8b5cf6' + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  resourcesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8b5cf6',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Phase content — edit mode ─────────────────────────────────
  editContainer: {
    marginTop: 6,
    gap: 14,
  },
  editFieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export default LessonPlanPreview;
