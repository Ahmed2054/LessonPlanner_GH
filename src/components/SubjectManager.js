import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { styles } from '../theme/styles';

const SubjectManager = ({
  subjects,
  loading,
  allGrades,
  showImportModal,
  setShowImportModal,
  importSubjectName,
  setImportSubjectName,
  importFile,
  onPickDocument,
  setImportFile,
  handleImport,
  handleImportSample,
  editingSubjectId,
  setEditingSubjectId,
  editSubjectName,
  setEditSubjectName,
  editSubjectTribe,
  setEditSubjectTribe,
  handleUpdateSubject,
  handleDeleteSubject,
  handleFactoryReset,
  onClearAll,
  onExportSubject,
  onSelectSubject
}) => {
  const subjectInputRef = useRef(null);

  useEffect(() => {
    if (importFile && !importSubjectName.trim() && subjectInputRef.current) {
      setTimeout(() => subjectInputRef.current.focus(), 100);
    }
  }, [importFile]);

  const renderRightActions = (subject) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: '100%', paddingLeft: 10 }}>
      <TouchableOpacity
        style={[styles.actionBtnIcon, { backgroundColor: '#e3f2fd' }]}
        onPress={() => {
          setEditingSubjectId(subject.id);
          setEditSubjectName(subject.name);
          setEditSubjectTribe(subject.tribe || '');
        }}
      >
        <MaterialIcons name="edit" size={20} color="#1565c0" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtnIcon, { backgroundColor: '#fff8e1' }]}
        onPress={() => {
          setImportSubjectName(subject.name);
          setShowImportModal(true);
        }}
      >
        <MaterialIcons name="file-upload" size={20} color="#ff8f00" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtnIcon, { backgroundColor: '#e8f5e9' }]}
        onPress={() => onExportSubject(subject.id, subject.name)}
      >
        <Ionicons name="share-social-outline" size={20} color="#2e7d32" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtnIcon, { backgroundColor: '#ffebee', marginRight: 10 }]}
        onPress={() => handleDeleteSubject(subject.id, subject.name)}
      >
        <MaterialIcons name="delete-outline" size={20} color="#c62828" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <View style={styles.modernTopRow}>
        <View style={{ flex: 1, paddingRight: 15 }}>
          <Text style={styles.modernTopRowTitle}>Curriculum</Text>
          <Text style={styles.modernItemSubtitle}>{subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'} Imported</Text>
        </View>
        <TouchableOpacity 
          style={[styles.primaryBtn, { marginTop: 0, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, elevation: 2 }]} 
          onPress={() => setShowImportModal(true)}
          disabled={loading}
        >
          <Text style={styles.btnText}>+ Import CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
            <Text style={styles.subTitle}>IMPORTED SUBJECTS</Text>
          {subjects.length > 0 && (
              <TouchableOpacity 
                style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ffebee', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }} 
                onPress={onClearAll}
                disabled={loading}
              >
                <Ionicons name="trash-outline" size={16} color="#c62828" />
                <Text style={{color: '#c62828', fontSize: 10, fontWeight: 'bold', marginLeft: 4}}>CLEAR ALL</Text>
              </TouchableOpacity>
          )}
        </View>
        
        {subjects.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <Ionicons name="folder-open-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No curriculum data imported yet.</Text>
          </View>
        ) : (
          subjects.map(subject => (
            <View key={subject.id} style={{ marginBottom: 12 }}>
              {editingSubjectId === subject.id ? (
                <View style={[styles.modernItemContainer]}>
                  <Text style={[styles.label, { marginTop: 0, marginBottom: 5 }]}>Subject Name</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    value={editSubjectName}
                    onChangeText={setEditSubjectName}
                    autoFocus
                  />
                  
                  {editSubjectName.toLowerCase().includes('ghanaian language') && (
                    <>
                      <Text style={[styles.label, { marginTop: 0, marginBottom: 5 }]}>Ethnic Group / Tribe</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 15 }]}
                        value={editSubjectTribe}
                        onChangeText={setEditSubjectTribe}
                        placeholder="e.g. Asante Twi, Fante, Ga, Ewe"
                        placeholderTextColor="#ccc"
                      />
                    </>
                  )}

                  <View style={styles.row}>
                    <TouchableOpacity onPress={() => handleUpdateSubject(subject.id)} style={[styles.primaryBtn, { flex: 1, marginTop: 0, marginRight: 8, backgroundColor: COLORS.success }]}>
                        <Text style={styles.btnText}>Update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingSubjectId(null)} style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}>
                        <Text style={styles.btnTextDark}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Swipeable renderRightActions={() => renderRightActions(subject)}>
                  <TouchableOpacity 
                    style={[
                      styles.modernItemContainer,
                      {
                        padding: 0,
                        overflow: 'hidden',
                        borderRadius: 16,
                        borderColor: '#dbeafe',
                        borderWidth: 1
                      }
                    ]}
                    onPress={() => onSelectSubject(subject)}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ width: 6, backgroundColor: '#2563eb' }} />
                      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13 }}>
                        <View style={[styles.modernItemHeader, { alignItems: 'flex-start' }]}>
                          <View style={{ flex: 1, paddingRight: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                              <View style={{
                                backgroundColor: '#dbeafe',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 999,
                                marginRight: 8,
                                marginBottom: 4
                              }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' }}>
                                  Subject
                                </Text>
                              </View>
                              {subject.tribe ? (
                                <View style={{
                                  backgroundColor: '#ecfeff',
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 999,
                                  marginBottom: 4
                                }}>
                                  <Text style={{ fontSize: 10, color: '#0f766e', fontWeight: '800', textTransform: 'uppercase' }}>
                                    {subject.tribe}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={[styles.modernItemTitle, { fontSize: 17, marginBottom: 6 }]}>{subject.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                              <View style={{
                                backgroundColor: '#eff6ff',
                                borderRadius: 999,
                                paddingHorizontal: 9,
                                paddingVertical: 5,
                                marginRight: 8,
                                marginBottom: 4
                              }}>
                                <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: '700' }}>
                                  {subject.indicator_count || 0} indicators
                                </Text>
                              </View>
                              <Text style={[styles.modernItemSubtitle, { fontSize: 11, marginTop: 0 }]}>
                                Tap to manage curriculum rows
                              </Text>
                            </View>
                          </View>
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: '#eff6ff',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Ionicons name="chevron-forward" size={20} color="#2563eb" />
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Import Curriculum Data</Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>CSV REQUIREMENTS</Text>
              <Text style={styles.infoText}>File must include these headers in order:</Text>
              <Text style={styles.infoList}>• subject, grade, strand, sub_strand, indicator_code, indicator_description, content_standard, exemplars, core_competencies</Text>
            </View>

            <Text style={styles.label}>Subject Name</Text>
            <TextInput
              ref={subjectInputRef}
              style={styles.input}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#ccc"
              value={importSubjectName}
              onChangeText={setImportSubjectName}
            />

            {!importFile ? (
              <TouchableOpacity style={[styles.importBtn, { backgroundColor: '#f0f4ff', borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.accent }]} onPress={handleImport}>
                <MaterialIcons name="file-upload" size={32} color={COLORS.accent} />
                <Text style={[styles.btnText, { color: COLORS.accent, marginTop: 10 }]}>Select CSV File</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.selectedFileInfo}>
                <Text style={styles.selectedFileText} numberOfLines={1}>📎 {importFile.name}</Text>
                <TouchableOpacity onPress={() => setImportFile(null)}>
                  <Text style={{ color: COLORS.danger, fontWeight: 'bold', fontSize: 12 }}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.importBtn, { width: '100%', backgroundColor: importFile && importSubjectName.trim() ? COLORS.success : COLORS.accent }]}
                onPress={handleImport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.btnText}>
                    {importFile ? 'Complete Import' : 'Select CSV'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => setShowImportModal(false)}>
              <Text style={styles.btnTextDark}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default SubjectManager;
