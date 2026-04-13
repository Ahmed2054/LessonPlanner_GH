import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/colors';
import LessonPlanPreview from '../components/LessonPlanPreview';

function DropdownField({ placeholder, value, onPress, disabled = false }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.input,
          {
            minHeight: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text style={{ flex: 1, fontSize: 15, color: value ? COLORS.dark : '#bbb', fontWeight: value ? '600' : '400' }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#888" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Step Header Component ──────────────────────────────────────────
function StepHeader({ number, label, color = COLORS.primary, onBack, onForward, forwardDisabled, rightContent, style }) {
  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: '#f5f5f5',
              justifyContent: 'center', alignItems: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.dark} />
          </TouchableOpacity>
        )}
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: color,
          justifyContent: 'center', alignItems: 'center',
          marginRight: 10,
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 5,
        }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{number}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.dark, opacity: 0.4, letterSpacing: 1.5, textTransform: 'uppercase' }}>Step {number}</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.dark, letterSpacing: 0.2 }}>{label}</Text>
        </View>
      </View>
      {rightContent}
      {onForward && !forwardDisabled && (
        <TouchableOpacity
          onPress={onForward}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: color + '18',
            justifyContent: 'center', alignItems: 'center',
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Section Label ──────────────────────────────────────────────────
function SectionLabel({ icon, label }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 10 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: COLORS.accent + '20',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 8,
      }}>
        <Ionicons name={icon} size={15} color={COLORS.accent} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function SetupGroup({ icon, title, subtitle, tint, children }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: tint + '22',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: tint + '18',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
          }}
        >
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.dark }}>{title}</Text>
          <Text style={{ fontSize: 11, color: '#7b8794', marginTop: 2 }}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

// ─── Meta Chip ──────────────────────────────────────────────────────
function MetaChip({ label, value }) {
  return (
    <View style={{ backgroundColor: COLORS.light, borderRadius: 10, padding: 10, minWidth: '45%', flex: 1, marginRight: 8, marginBottom: 8 }}>
      <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.accent, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.dark }}>{value || '—'}</Text>
    </View>
  );
}

export default function CreateScreen({
  step,
  setStep,
  loading,
  allGrades,

  date, setDate,
  week, setWeek,
  classSize, setClassSize,
  lessonDuration, setLessonDuration,
  selectedGrade, setSelectedGrade,
  gradeSubjects,
  selectedSubjectId, setSelectedSubjectId,
  indicators,
  selectedIndicator, setSelectedIndicator,
  handleStop,
  handleGenerate,
  editingPlanId,
  editablePlan,
  generatedPlan,
  regeneratingPhaseIndex,
  editingPhaseIndex,
  setEditingPhaseIndex,
  handleRegenerateSinglePhase,
  updatePhaseField,
  handleSavePlan,
  handleOpenPDF,
  handleDownloadPDF,
  setActiveTab,
  handleFullReset
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingIndicator, setViewingIndicator] = useState(null);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Generation Options Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState('Lesson Plan'); // 'Lesson Plan', 'Note', 'Questions'
  const [questionConfig, setQuestionConfig] = useState({ types: ['Multiple Choice'], count: '5' });

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      setDate(formatted);
      if (Platform.OS === 'android') setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Select Date';
    try {
      const [y, m, d] = dateStr.split('-');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    } catch (e) {
      return dateStr;
    }
  };

  // ── Page header breadcrumb bar ────────────────────────────────────
  const stepColors = [COLORS.primary, COLORS.accent, COLORS.success];
  const stepLabels = ['Setup', 'Indicator', 'Preview'];

  return (
    <View style={styles.container}>

      {/* ── Top breadcrumb progress bar ──────────────────────────── */}
      <View style={[styles.modernTopRow, { margin: 15, marginBottom: 5 }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.modernTopRowTitle}>
            Creator
          </Text>
          <Text style={styles.modernItemSubtitle} numberOfLines={1}>
            {selectedGrade || selectedSubjectId ?
              `${selectedGrade || ''}${selectedGrade && selectedSubjectId ? ' · ' : ''}${selectedSubjectId ? (gradeSubjects.find(s => s.id === selectedSubjectId)?.actual_name || gradeSubjects.find(s => s.id === selectedSubjectId)?.name || '') : ''}`
              : 'Craft your lesson plan'}
          </Text>
        </View>
        {/* Navigation & Step dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {step > 1 && (
            <TouchableOpacity 
              onPress={() => setStep(step - 1)}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: '#f5f5f5',
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.dark} />
            </TouchableOpacity>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {[1, 2, 3].map(s => (
              <View
                key={s}
                style={{
                  width: s === step ? 22 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: s === step ? stepColors[s - 1] : (s < step ? stepColors[s - 1] + '60' : '#e0e0e0'),
                  marginHorizontal: 2,
                }}
              />
            ))}
          </View>

          {step < 3 && (
            <TouchableOpacity 
              onPress={() => setStep(step + 1)}
              disabled={(step === 1 && !selectedSubjectId) || (step === 2 && !selectedIndicator)}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: ((step === 1 && !selectedSubjectId) || (step === 2 && !selectedIndicator)) ? '#f0f0f0' : stepColors[step - 1] + '20',
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Ionicons 
                name="chevron-forward" 
                size={18} 
                color={((step === 1 && !selectedSubjectId) || (step === 2 && !selectedIndicator)) ? '#ccc' : stepColors[step - 1]} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* ══════════════════════════════════════════════════════════
          STEP 1 — Setup
      ══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={styles.modernItemContainer}>
            <StepHeader
              number="1"
              label="Setup"
              color={COLORS.primary}
            />

            {allGrades.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="alert-circle-outline" size={40} color={COLORS.primary} style={{ marginBottom: 10 }} />
                <Text style={[styles.helpText, { textAlign: 'center', marginBottom: 12 }]}>
                  No curriculum data found. Please import a curriculum first.
                </Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 0, paddingHorizontal: 24 }]}
                  onPress={() => setActiveTab('Curriculum')}
                >
                  <Text style={styles.btnText}>Go to Curriculum Tab</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* API key warning */}


                <SetupGroup
                  icon="calendar-outline"
                  title="Lesson Details"
                  subtitle="Set the core information for this lesson"
                  tint={COLORS.primary}
                >
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.label}>Date</Text>
                      <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={15} color="#aaa" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 15, color: date ? COLORS.dark : '#bbb', fontWeight: date ? '600' : '400' }}>
                          {formatDateDisplay(date)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.label}>Week</Text>
                      <TextInput style={styles.input} value={week} onChangeText={setWeek} keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor="#ccc" />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.label}>Class Size</Text>
                      <TextInput style={styles.input} value={classSize} onChangeText={setClassSize} keyboardType="numeric" placeholder="e.g. 30" placeholderTextColor="#ccc" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.label}>Duration</Text>
                      <TextInput style={styles.input} value={lessonDuration} onChangeText={setLessonDuration} placeholder="e.g. 60 mins" placeholderTextColor="#ccc" />
                    </View>
                  </View>
                </SetupGroup>

                <SetupGroup
                  icon="school-outline"
                  title="Select Class"
                  subtitle="Choose the grade you want to plan for"
                  tint={COLORS.accent}
                >
                  <DropdownField
                    placeholder="Choose a class"
                    value={selectedGrade}
                    onPress={() => setShowGradeDropdown(true)}
                  />
                </SetupGroup>

                <SetupGroup
                  icon="book-outline"
                  title="Select Subject"
                  subtitle={selectedGrade ? 'Pick a subject available for the selected class' : 'Choose a class first to load subjects'}
                  tint={COLORS.success}
                >
                  <DropdownField
                    placeholder={
                      selectedGrade
                        ? (gradeSubjects.length ? 'Choose a subject' : 'No subjects available')
                        : 'Choose a class first'
                    }
                    value={gradeSubjects.find(s => s.id === selectedSubjectId)?.actual_name || gradeSubjects.find(s => s.id === selectedSubjectId)?.name || ''}
                    onPress={() => setShowSubjectDropdown(true)}
                    disabled={!selectedGrade || !gradeSubjects.length}
                  />

                  {selectedGrade ? (
                    selectedSubjectId ? (
                      <TouchableOpacity
                        style={[styles.primaryBtn, { marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                        onPress={() => setStep(2)}
                      >
                        <Text style={styles.btnText}>Next: Select Indicator</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.helpText, { marginTop: 4 }]}>Select a subject to continue.</Text>
                    )
                  ) : (
                    <Text style={[styles.helpText, { marginTop: 4 }]}>Select a class to see subjects.</Text>
                  )}
                </SetupGroup>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 2 — Select Indicator (fixed layout, not inside outer scroll)
      ══════════════════════════════════════════════════════════ */}
      {step === 2 && (() => {
        const codeCounts = {};
        indicators.forEach(i => { const c = i.indicator_code || ''; if (c) codeCounts[c] = (codeCounts[c] || 0) + 1; });
        const dupeCount = indicators.filter(i => codeCounts[i.indicator_code || ''] > 1).length;
        const duplicateCodes = new Set(Object.keys(codeCounts).filter(c => codeCounts[c] > 1));

        return (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>

            {/* ── Step Header & Search ───────────────────── */}
            <View style={[styles.modernItemContainer, { marginBottom: 8, gap: 12 }]}>
              <StepHeader
                number="2"
                label="Select Indicator"
                color={COLORS.accent}
                style={{ marginBottom: 0, paddingBottom: 0, borderBottomWidth: 0 }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.searchContainer, { flex: 1 }]}>
                <Ionicons name="search" size={16} color="#bbb" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: COLORS.dark }}
                  placeholder="Search indicators…"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#ccc"
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={17} color="#bbb" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: loading ? COLORS.danger : (selectedIndicator ? COLORS.primary : '#e0e0e0'),
                  paddingVertical: 11, paddingHorizontal: 16,
                  borderRadius: 12,
                  flexDirection: 'row', alignItems: 'center',
                  opacity: (!selectedIndicator) && !loading ? 0.6 : 1,
                }}
                onPress={loading ? handleStop : () => {
                  if (editingPlanId) {
                    handleGenerate(editablePlan?.plan_type || 'Lesson Plan', questionConfig);
                  } else {
                    setShowGenerateModal(true);
                  }
                }}
                disabled={!loading && (!selectedIndicator)}
              >
                <Ionicons
                  name={loading ? 'stop-circle-outline' : (editingPlanId ? 'refresh-outline' : 'flash-outline')}
                  size={16}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  {loading ? 'Stop' : (editingPlanId ? 'Regen' : 'Generate')}
                </Text>
              </TouchableOpacity>
            </View>
            </View>

            {/* ── Indicator Count ──────────────────────────────── */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.dark, opacity: 0.5, marginBottom: 8, paddingHorizontal: 2 }}>
              {indicators.length} indicator{indicators.length !== 1 ? 's' : ''}
              {dupeCount > 0 && ` · ${dupeCount} shared`}
            </Text>

            {/* ── Scrollable Indicator List ─────────────────────── */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ flex: 1 }}
            >
              {indicators
                .filter(ind => {
                  const q = searchQuery.toLowerCase();
                  return (
                    (ind.indicator_code || '').toLowerCase().includes(q) ||
                    (ind.indicator_description || '').toLowerCase().includes(q) ||
                    (ind.strand && ind.strand.toLowerCase().includes(q))
                  );
                })
                .map(ind => {
                  const isDuplicate = duplicateCodes.has(ind.indicator_code);
                  const isActive = selectedIndicator?.id === ind.id;
                  return (
                    <TouchableOpacity
                      key={ind.id}
                      style={[{
                        padding: 14,
                        borderRadius: 12,
                        backgroundColor: isActive ? COLORS.primary + '0d' : (isDuplicate ? COLORS.accent + '0d' : COLORS.light),
                        marginBottom: 8,
                        borderWidth: 1.5,
                        borderColor: isActive ? COLORS.primary : (isDuplicate ? COLORS.accent + '60' : '#e8eaed'),
                      }]}
                      onPress={() => setSelectedIndicator(ind)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontWeight: '800', color: isActive ? COLORS.primary : COLORS.dark, fontSize: 15 }}>
                            {ind.indicator_code}
                          </Text>
                          {isDuplicate && (
                            <View style={{ backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginLeft: 8 }}>
                              <Text style={{ fontSize: 8, color: '#fff', fontWeight: '800', letterSpacing: 0.5 }}>SHARED</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={{ padding: 6, marginRight: 4, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}
                            onPress={(e) => { e.stopPropagation(); setViewingIndicator(ind); }}
                          >
                            <Ionicons name="eye-outline" size={15} color={COLORS.accent} />
                          </TouchableOpacity>
                          <View style={{
                            width: 22, height: 22, borderRadius: 11,
                            borderWidth: 2, borderColor: isActive ? COLORS.primary : '#ccc',
                            backgroundColor: isActive ? COLORS.primary : 'transparent',
                            justifyContent: 'center', alignItems: 'center',
                          }}>
                            {isActive && <Ionicons name="checkmark" size={13} color="#fff" />}
                          </View>
                        </View>
                      </View>

                      <Text style={{ fontSize: 13, color: COLORS.dark, opacity: 0.75, marginTop: 6, lineHeight: 18 }} numberOfLines={3}>
                        {ind.indicator_description}
                      </Text>

                      {ind.strand && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          <Ionicons name="git-branch-outline" size={11} color="#bbb" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 10, color: COLORS.dark, opacity: 0.45, fontWeight: '600' }}>
                            {ind.strand}{ind.sub_strand ? ` › ${ind.sub_strand}` : ''}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════
            STEP 3 — Preview & Edit
        ══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ gap: 14 }}>

            {/* ── Header Card ──────────────────────────────────── */}
            <View style={[styles.modernItemContainer]}>
              <StepHeader
                number="3"
                label="Preview & Edit"
                color={COLORS.success}
                rightContent={
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleGenerate(editablePlan?.plan_type || 'Lesson Plan')}
                      disabled={loading}
                      style={{
                        width: 38, height: 38, borderRadius: 12,
                        backgroundColor: COLORS.accent + '14',
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 1, borderColor: COLORS.accent + '25',
                        opacity: loading ? 0.4 : 1,
                      }}
                    >
                      <Ionicons name="refresh-outline" size={18} color={COLORS.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleFullReset}
                      style={{
                        width: 38, height: 38, borderRadius: 12,
                        backgroundColor: COLORS.danger + '10',
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 1, borderColor: COLORS.danger + '20',
                      }}
                    >
                      <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                }
              />

              {/* ── Selected Indicator Summary ──────────────────── */}
              {selectedIndicator && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: COLORS.primary + '08',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: COLORS.primary + '18',
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 10,
                    backgroundColor: COLORS.primary + '15',
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <Ionicons name="bookmark" size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                      Indicator
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 2 }}>
                      {selectedIndicator.indicator_code}
                    </Text>
                    {selectedIndicator.strand && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="git-branch-outline" size={10} color={COLORS.accent} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 11, color: COLORS.accent, fontWeight: '600' }} numberOfLines={1}>
                          {selectedIndicator.strand}{selectedIndicator.sub_strand ? ` › ${selectedIndicator.sub_strand}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                </View>
              )}
            </View>

            {/* ── Metadata Card ─────────────────────────────────── */}
            <View style={[styles.modernItemContainer]}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: COLORS.accent + '18',
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: 8,
                  }}>
                    <Ionicons name="information-circle-outline" size={15} color={COLORS.accent} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    Lesson Info
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingMetadata(!editingMetadata)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: editingMetadata ? COLORS.success + '15' : COLORS.light,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: editingMetadata ? COLORS.success + '30' : '#e8eaed',
                  }}
                >
                  <Ionicons
                    name={editingMetadata ? 'checkmark' : 'create-outline'}
                    size={14}
                    color={editingMetadata ? COLORS.success : COLORS.accent}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: editingMetadata ? COLORS.success : COLORS.accent,
                  }}>
                    {editingMetadata ? 'Done' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              {editingMetadata ? (
                <View style={{ gap: 12 }}>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.label}>Date</Text>
                      <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={15} color={COLORS.accent} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 15, color: COLORS.dark, fontWeight: '600' }}>{formatDateDisplay(date)}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.label}>Week</Text>
                      <TextInput style={styles.input} value={week} onChangeText={setWeek} keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor="#ccc" />
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.label}>Class Size</Text>
                      <TextInput style={styles.input} value={classSize} onChangeText={setClassSize} keyboardType="numeric" placeholder="e.g. 30" placeholderTextColor="#ccc" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.label}>Duration</Text>
                      <TextInput style={styles.input} value={lessonDuration} onChangeText={setLessonDuration} placeholder="e.g. 60 mins" placeholderTextColor="#ccc" />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { icon: 'calendar-outline', label: 'Date', value: formatDateDisplay(date), color: COLORS.primary },
                    { icon: 'layers-outline', label: 'Week', value: week, color: COLORS.accent },
                    { icon: 'people-outline', label: 'Class Size', value: classSize, color: '#8b5cf6' },
                    { icon: 'time-outline', label: 'Duration', value: lessonDuration, color: COLORS.success },
                  ].map((item) => (
                    <View key={item.label} style={{
                      flex: 1,
                      minWidth: '45%',
                      backgroundColor: item.color + '08',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: item.color + '15',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{
                          width: 24, height: 24, borderRadius: 7,
                          backgroundColor: item.color + '18',
                          justifyContent: 'center', alignItems: 'center',
                          marginRight: 6,
                        }}>
                          <Ionicons name={item.icon} size={13} color={item.color} />
                        </View>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: item.color, letterSpacing: 1, textTransform: 'uppercase' }}>
                          {item.label}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.dark, marginLeft: 30 }}>
                        {item.value || '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Plan Content ───────────────────────────────────── */}
            <LessonPlanPreview
              editablePlan={editablePlan}
              generatedPlan={generatedPlan}
              regeneratingPhaseIndex={regeneratingPhaseIndex}
              editingPhaseIndex={editingPhaseIndex}
              setEditingPhaseIndex={setEditingPhaseIndex}
              handleRegenerateSinglePhase={handleRegenerateSinglePhase}
              updatePhaseField={updatePhaseField}
            />

            {/* ── Actions Card ──────────────────────────────────── */}
            <View style={[styles.modernItemContainer]}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: COLORS.primary + '18',
                  justifyContent: 'center', alignItems: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name="flash-outline" size={15} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.dark, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Actions
                </Text>
              </View>

              {/* Primary Action - Save */}
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 16,
                  borderRadius: 14,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: COLORS.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={handleSavePlan}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={19} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 }}>Save</Text>
              </TouchableOpacity>

              {/* Secondary Actions Row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Preview */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.accent + '10',
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: COLORS.accent + '25',
                    gap: 4,
                  }}
                  onPress={handleOpenPDF}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: COLORS.accent + '18',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <Ionicons name="eye-outline" size={19} color={COLORS.accent} />
                  </View>
                  <Text style={{ color: COLORS.accent, fontWeight: '700', fontSize: 12 }}>Preview</Text>
                </TouchableOpacity>

                {/* PDF Download */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.success + '10',
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: COLORS.success + '25',
                    gap: 4,
                  }}
                  onPress={handleDownloadPDF}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: COLORS.success + '18',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <Ionicons name="document-outline" size={19} color={COLORS.success} />
                  </View>
                  <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 12 }}>PDF</Text>
                </TouchableOpacity>


              </View>
            </View>

          </View>
        </ScrollView>
      )}


      {/* ── Indicator Detail Modal ─────────────────────────────── */}
      <Modal visible={!!viewingIndicator} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24, borderRadius: 22 }]}>
            <View style={[styles.cardHeader, { marginBottom: 18 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Curriculum Detail</Text>
              <TouchableOpacity
                onPress={() => setViewingIndicator(null)}
                style={{ backgroundColor: COLORS.light, borderRadius: 20, padding: 6 }}
              >
                <Ionicons name="close" size={22} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            {viewingIndicator && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  {[
                    { label: 'Indicator Code', value: viewingIndicator.indicator_code, large: true },
                    { label: 'Description', value: viewingIndicator.indicator_description },
                    { label: 'Strand', value: viewingIndicator.strand },
                    { label: 'Sub-Strand', value: viewingIndicator.sub_strand },
                    { label: 'Content Standard', value: viewingIndicator.content_standard || viewingIndicator.standard || viewingIndicator.contentStandard || 'N/A' },
                  ].map(({ label, value, large }) => (
                    <View key={label} style={{ backgroundColor: COLORS.light, borderRadius: 12, padding: 12 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>{label}</Text>
                      <Text style={{ fontSize: large ? 18 : 14, fontWeight: large ? '800' : '500', color: COLORS.dark, lineHeight: 22 }}>{value}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 24, flexDirection: 'row', justifyContent: 'center' }]}
                  onPress={() => {
                    setSelectedIndicator(viewingIndicator);
                    setViewingIndicator(null);
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Select this Indicator</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showGradeDropdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20, borderRadius: 22, maxHeight: '70%' }]}>
            <View style={[styles.cardHeader, { marginBottom: 14 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Select Class</Text>
              <TouchableOpacity
                onPress={() => setShowGradeDropdown(false)}
                style={{ backgroundColor: COLORS.light, borderRadius: 20, padding: 6 }}
              >
                <Ionicons name="close" size={22} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {allGrades.map((g) => (
                <TouchableOpacity
                  key={g.grade}
                  onPress={() => {
                    setSelectedGrade(g.grade);
                    setShowGradeDropdown(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: selectedGrade === g.grade ? COLORS.primary + '14' : COLORS.light,
                    borderWidth: 1,
                    borderColor: selectedGrade === g.grade ? COLORS.primary + '45' : '#eceff3',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: selectedGrade === g.grade ? '700' : '500', color: COLORS.dark }}>
                    {g.grade}
                  </Text>
                  {selectedGrade === g.grade ? <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSubjectDropdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20, borderRadius: 22, maxHeight: '70%' }]}>
            <View style={[styles.cardHeader, { marginBottom: 14 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Select Subject</Text>
              <TouchableOpacity
                onPress={() => setShowSubjectDropdown(false)}
                style={{ backgroundColor: COLORS.light, borderRadius: 20, padding: 6 }}
              >
                <Ionicons name="close" size={22} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {gradeSubjects.map((subject) => {
                const label = subject.actual_name || subject.name;
                const isSelected = selectedSubjectId === subject.id;
                return (
                  <TouchableOpacity
                    key={subject.id}
                    onPress={() => {
                      setSelectedSubjectId(subject.id);
                      setShowSubjectDropdown(false);
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      marginBottom: 8,
                      backgroundColor: isSelected ? COLORS.primary + '14' : COLORS.light,
                      borderWidth: 1,
                      borderColor: isSelected ? COLORS.primary + '45' : '#eceff3',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: isSelected ? '700' : '500', color: COLORS.dark }}>
                      {label}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Generate Options Modal ─────────────────────────────── */}
      <Modal visible={showGenerateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24, borderRadius: 22 }]}>
            <View style={[styles.cardHeader, { marginBottom: 18 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Generate Options</Text>
              <TouchableOpacity
                onPress={() => setShowGenerateModal(false)}
                style={{ backgroundColor: COLORS.light, borderRadius: 20, padding: 6 }}
              >
                <Ionicons name="close" size={22} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { marginBottom: 10 }]}>Select Output Type:</Text>

              {/* Type Pills */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {['Lesson Plan', 'Note', 'Questions'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pill,
                      generateType === type && styles.pillActive,
                      { paddingHorizontal: 16 }
                    ]}
                    onPress={() => setGenerateType(type)}
                  >
                    <Text style={[styles.pillText, generateType === type && styles.pillTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Questions Config */}
              {generateType === 'Questions' && (
                <View style={{ backgroundColor: COLORS.light, padding: 15, borderRadius: 12, marginBottom: 20 }}>
                  <Text style={[styles.label, { marginBottom: 8 }]}>Question Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {['Multiple Choice', 'True/False', 'Fill-in', 'Theory'].map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.pill,
                          { backgroundColor: '#fff', marginRight: 8 },
                          questionConfig.types.includes(t) && { backgroundColor: COLORS.primary }
                        ]}
                        onPress={() => {
                          let newTypes = [...questionConfig.types];
                          if (newTypes.includes(t)) {
                            newTypes = newTypes.filter(type => type !== t);
                            if (newTypes.length === 0) newTypes = [t]; // At least 1 required
                          } else {
                            newTypes.push(t);
                          }
                          setQuestionConfig({ ...questionConfig, types: newTypes });
                        }}
                      >
                        <Text style={[styles.pillText, questionConfig.types.includes(t) && { color: '#fff' }]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.label, { marginBottom: 8 }]}>Number of Questions</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: '#fff' }]}
                    value={questionConfig.count}
                    onChangeText={(val) => setQuestionConfig({ ...questionConfig, count: val })}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { flexDirection: 'row', justifyContent: 'center' }]}
                onPress={() => {
                  setShowGenerateModal(false);
                  handleGenerate(generateType, generateType === 'Questions' ? questionConfig : null);
                }}
              >
                <Ionicons name="flash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Generate {generateType}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={date ? new Date(date) : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </View>
  );
}
