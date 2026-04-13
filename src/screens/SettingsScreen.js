import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/colors';

export default function SettingsScreen({ 
  aiModel,
  handleModelChange,
  handleTestConnection,
  handleCheckForUpdate,
  handleRestoreDefaults,
  restoreSubjectNames,
  restoredTemplateSubjects,
  selectedRestoreSubjects,
  handleToggleRestoreSubject,
  handleSelectAllRestoreSubjects,
  handleClearRestoreSubjects,
  handleFactoryReset, 
  loading,
  currentVersionLabel,
  updateConfigReady
}) {
  const [showHowToUse, setShowHowToUse] = useState(false);
  const models = [
    { id: 'deepseek-chat', name: 'Chat', icon: 'chatbubble-outline' },
    { id: 'deepseek-reasoner', name: 'Reasoner', icon: 'bulb-outline' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <View style={styles.modernTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modernTopRowTitle}>Settings</Text>
          <Text style={styles.modernItemSubtitle}>Configure AI model and app data</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 5 }}>
        <View style={{ paddingHorizontal: 5, marginBottom: 15 }}>
          <Text style={styles.subTitle}>APP UPDATES</Text>
        </View>
        <View style={styles.modernItemContainer}>
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: '#e3f2fd', flexDirection: 'row', justifyContent: 'center', height: 48 }]} 
            onPress={handleCheckForUpdate}
            disabled={loading}
          >
            <Ionicons name="cloud-download-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: COLORS.primary }]}>Check for Update</Text>
          </TouchableOpacity>

          <Text style={[styles.helpText, { textAlign: 'left', marginTop: 12, fontSize: 11, opacity: 0.7 }]}>
            Current version: {currentVersionLabel}
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#fff8e1', flexDirection: 'row', justifyContent: 'center', height: 48, marginTop: 14 }]}
            onPress={() => setShowHowToUse(true)}
            disabled={loading}
          >
            <Ionicons name="help-circle-outline" size={20} color="#ef6c00" style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: '#ef6c00' }]}>How to Use This App</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 5, marginBottom: 15, marginTop: 15 }}>
          <Text style={styles.subTitle}>AI CONFIGURATION</Text>
        </View>
        <View style={styles.modernItemContainer}>
          <Text style={[styles.label, { marginBottom: 10 }]}>Select AI Model</Text>
          <View style={{ flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4, marginBottom: 15 }}>
            {models.map(m => (
              <TouchableOpacity 
                key={m.id}
                onPress={() => handleModelChange(m.id)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: aiModel === m.id ? '#fff' : 'transparent',
                  shadowColor: aiModel === m.id ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: aiModel === m.id ? 2 : 0
                }}
              >
                <Ionicons 
                  name={m.icon} 
                  size={18} 
                  color={aiModel === m.id ? COLORS.primary : '#666'} 
                  style={{ marginRight: 6 }}
                />
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: aiModel === m.id ? '600' : '400',
                  color: aiModel === m.id ? COLORS.primary : '#666'
                }}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.helpText, { textAlign: 'left', marginTop: 0, fontSize: 11, fontStyle: 'italic' }]}>
            {aiModel === 'deepseek-chat' 
              ? 'Chat mode is faster and great for standard lesson plans.' 
              : 'Reasoner mode (R1) is thorough and better for complex notes/questions.'}
          </Text>

          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: '#f3e5f5', marginTop: 20, flexDirection: 'row', justifyContent: 'center', height: 48 }]} 
            onPress={handleTestConnection}
            disabled={loading}
          >
            <Ionicons name="pulse-outline" size={20} color="#7b1fa2" style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: '#7b1fa2' }]}>Check AI Connectivity</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 5, marginBottom: 15, marginTop: 15 }}>
          <Text style={styles.subTitle}>DATA MANAGEMENT</Text>
        </View>
        <View style={styles.modernItemContainer}>
          <Text style={[styles.helpText, { textAlign: 'left', marginTop: 15, fontSize: 12 }]}>Tick the default subjects you want to restore.</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 }}>
            <TouchableOpacity onPress={handleSelectAllRestoreSubjects} disabled={loading}>
              <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearRestoreSubjects} disabled={loading}>
              <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '700' }}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, maxHeight: 220 }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {restoreSubjectNames.map((name) => {
                const isSelected = selectedRestoreSubjects.includes(name);
                const isRestored = restoredTemplateSubjects.includes(name);
                return (
                  <TouchableOpacity
                    key={name}
                    onPress={() => handleToggleRestoreSubject(name)}
                    disabled={loading}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: '#eef2f7'
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isSelected ? COLORS.primary : '#94a3b8'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, color: COLORS.dark, fontSize: 13 }}>{name}</Text>
                      {isRestored ? (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#e8f5e9',
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginLeft: 10
                        }}>
                          <Ionicons name="checkmark-circle" size={14} color="#2e7d32" style={{ marginRight: 4 }} />
                          <Text style={{ color: '#2e7d32', fontSize: 11, fontWeight: '700' }}>Restored</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <Text style={[styles.helpText, { textAlign: 'left', marginTop: 10, fontSize: 11, opacity: 0.7 }]}>
            {selectedRestoreSubjects.length} subject{selectedRestoreSubjects.length === 1 ? '' : 's'} selected
          </Text>
          
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: '#e8f5e9', marginTop: 15, flexDirection: 'row', justifyContent: 'center' }]} 
            onPress={handleRestoreDefaults}
            disabled={loading || selectedRestoreSubjects.length === 0}
          >
            <Ionicons name="refresh-circle-outline" size={20} color="#2e7d32" style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: '#2e7d32' }]}>Restore Selected Subjects</Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 20 }} />

          <Text style={[styles.helpText, { textAlign: 'left', marginTop: 0, fontSize: 12 }]}>Permanently delete all imported curriculum data and saved lesson plans from this device.</Text>
          
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: '#ffebee', marginTop: 15, flexDirection: 'row', justifyContent: 'center' }]} 
            onPress={handleFactoryReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} style={{ marginRight: 8 }} />
                <Text style={[styles.btnText, { color: COLORS.danger }]}>Factory Reset (Erase All Data)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 5, marginBottom: 15, marginTop: 20 }}>
          <Text style={styles.subTitle}>ABOUT THIS APP</Text>
        </View>
        <View style={[styles.modernItemContainer, { marginBottom: 15 }]}>
          <Text style={{ fontSize: 13, color: COLORS.dark, lineHeight: 20 }}>
            Lesson Planner GH is a revolutionary professional assistant designed exclusively for Ghanaian teachers. By combining the official NaCCA curriculum with advanced AI models, it enables educators to quickly generate standard lesson plans, comprehensive notes, and assessment questions that adhere strictly to local educational standards.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 5, marginBottom: 15, marginTop: 20 }}>
          <Text style={styles.subTitle}>DEVELOPER</Text>
        </View>
        <View style={[styles.modernItemContainer, { marginBottom: 30, alignItems: 'center' }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark }}>Mr. Ahmed Ofosu</Text>

          
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            {/* Call */}
            <TouchableOpacity 
              style={{ 
                width: 48, height: 48, borderRadius: 24, 
                backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', 
                marginHorizontal: 12, elevation: 2, shadowColor: '#000', 
                shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 
              }}
              onPress={() => Linking.openURL('tel:0553484762')}
            >
              <Ionicons name="call" size={22} color="#2e7d32" />
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity 
              style={{ 
                width: 48, height: 48, borderRadius: 24, 
                backgroundColor: '#dcf8c6', alignItems: 'center', justifyContent: 'center', 
                marginHorizontal: 12, elevation: 2, shadowColor: '#000', 
                shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 
              }}
              onPress={() => Linking.openURL('https://wa.me/233553484762')}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#075e54" />
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity 
              style={{ 
                width: 48, height: 48, borderRadius: 24, 
                backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center', 
                marginHorizontal: 12, elevation: 2, shadowColor: '#000', 
                shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 
              }}
              onPress={() => Linking.openURL('mailto:ofosuahmed@gmail.com')}
            >
              <Ionicons name="mail" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ paddingHorizontal: 5, marginBottom: 15, marginTop: 10 }}>
          <Text style={styles.subTitle}>LEGAL</Text>
        </View>
        <View style={[styles.modernItemContainer, { backgroundColor: '#fff9c4', borderColor: '#fbc02d', borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="warning-outline" size={18} color="#f57f17" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#f57f17', letterSpacing: 0.5 }}>DISCLAIMER</Text>
          </View>
          <Text style={{ fontSize: 12, color: '#5d4037', lineHeight: 18, fontStyle: 'italic' }}>
            This application uses artificial intelligence to assist teachers in generating educational content. While we strive for accuracy, the AI may occasionally produce incorrect or biased information. Users are responsible for reviewing, verifying, and refining all generated content to ensure it aligns with curriculum standards and classroom requirements before use.
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 40, opacity: 0.5 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.dark }}>Version {currentVersionLabel}</Text>
          <Text style={{ fontSize: 10, color: COLORS.dark, marginTop: 4 }}>© 2026 Lesson Planner GH</Text>
        </View>
      </ScrollView>

      <Modal visible={showHowToUse} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24, borderRadius: 22, maxHeight: '82%' }]}>
            <View style={[styles.cardHeader, { marginBottom: 16 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>How to Use This App</Text>
              <TouchableOpacity
                onPress={() => setShowHowToUse(false)}
                style={{ backgroundColor: COLORS.light, borderRadius: 20, padding: 6 }}
              >
                <Ionicons name="close" size={22} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                {[
                  {
                    title: '1. Import Or Restore Curriculum',
                    body: 'Go to the Curriculum tab to import your own CSV file, or go to Settings and restore default subjects already bundled with the app.',
                  },
                  {
                    title: '2. Start A New Plan',
                    body: 'Open the Create page, enter the lesson details, select the class, then choose the subject.',
                  },
                  {
                    title: '3. Choose An Indicator',
                    body: 'Move to Step 2 and pick the exact curriculum indicator you want to teach. You can search if the list is long.',
                  },
                  {
                    title: '4. Generate Content',
                    body: 'Tap Generate to create a lesson plan, note, or questions. The app uses the selected curriculum indicator to guide the output.',
                  },
                  {
                    title: '5. Review And Edit',
                    body: 'Read through the generated content carefully. You can edit sections before saving or exporting.',
                  },
                  {
                    title: '6. Save, Preview, Or Export',
                    body: 'Save the plan for later, preview it as PDF, or download/share it when you are ready.',
                  },
                  {
                    title: '7. Use History',
                    body: 'Visit the History tab to reopen, update, reuse, or share previous lesson plans.',
                  },
                  {
                    title: 'Important Note',
                    body: 'Always review AI-generated content before classroom use to make sure it matches your learners, subject goals, and curriculum expectations.',
                  },
                ].map((item) => (
                  <View
                    key={item.title}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#eef2f7',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.dark, marginBottom: 6 }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, lineHeight: 19, color: '#52606d' }}>
                      {item.body}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 18, flexDirection: 'row', justifyContent: 'center' }]}
                onPress={() => setShowHowToUse(false)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
