import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { styles } from '../theme/styles';
import { getCurriculumBySubject, deleteCurriculumRow, updateCurriculumRow, addCurriculumRow } from '../services/database';

export default function IndicatorListManager({ subject, onBack }) {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingIndicator, setViewingIndicator] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    grade: '', strand: '', sub_strand: '', content_standard: '',
    indicator_code: '', indicator_description: '', exemplars: '', core_competencies: ''
  });

  useEffect(() => {
    loadIndicators();
  }, [subject]);

  const loadIndicators = async () => {
    setLoading(true);
    try {
      const data = await getCurriculumBySubject(subject.id);
      setIndicators(data);
    } catch (e) {
      Alert.alert("Error", "Could not load indicators.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Indicator", "Are you sure you want to delete this specific indicator row?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteCurriculumRow(id);
          loadIndicators();
      }}
    ]);
  };

  const handleEdit = (ind) => {
    setFormData({
      grade: ind.grade,
      strand: ind.strand,
      sub_strand: ind.sub_strand,
      content_standard: ind.content_standard,
      indicator_code: ind.indicator_code,
      indicator_description: ind.indicator_description,
      exemplars: ind.exemplars,
      core_competencies: ind.core_competencies
    });
    setEditingIndicator(ind);
  };

  const handleAddNew = () => {
    setFormData({
      grade: '', strand: '', sub_strand: '', content_standard: '',
      indicator_code: '', indicator_description: '', exemplars: '', core_competencies: ''
    });
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.grade || !formData.indicator_code || !formData.indicator_description) {
      return Alert.alert("Required", "Grade, Indicator Code, and Description are mandatory.");
    }

    try {
      if (editingIndicator) {
        await updateCurriculumRow(editingIndicator.id, formData);
      } else {
        await addCurriculumRow(subject.id, formData);
      }
      setEditingIndicator(null);
      setIsAdding(false);
      loadIndicators();
    } catch (e) {
      Alert.alert("Error", "Could not save changes.");
    }
  };

  const filteredIndicators = indicators.filter(ind => 
    ind.indicator_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ind.indicator_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ind.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && indicators.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.light }}>
      {/* Small Header */}
      <View style={[styles.modernTopRow, { paddingBottom: 10 }]}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 15 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.modernTopRowTitle} numberOfLines={1}>{subject.name}</Text>
          <Text style={styles.modernItemSubtitle}>
            {searchQuery 
              ? `${filteredIndicators.length} of ${indicators.length} Matches Found` 
              : `${indicators.length} Rows Available`}
          </Text>
        </View>
        <TouchableOpacity 
          style={{ backgroundColor: COLORS.primary, padding: 8, borderRadius: 8 }}
          onPress={handleAddNew}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* SearchBar */}
      <View style={{ paddingHorizontal: 15, marginBottom: 10 }}>
        <View style={[styles.modernItemContainer, { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15 }]}>
          <Ionicons name="search" size={18} color="#999" style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Search indicators or grades..." 
            placeholderTextColor="#ccc"
            style={{ flex: 1, fontSize: 14 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}>
        {filteredIndicators.map(ind => (
          <View key={ind.id} style={[styles.modernItemContainer, { marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                    <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{ind.grade}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.primary }}>{ind.indicator_code}</Text>
                </View>
                <Text style={{ fontSize: 14, color: COLORS.dark }} numberOfLines={3}>{ind.indicator_description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <Text style={{ fontSize: 11, color: '#666', flex: 1 }}>{ind.strand} &gt; {ind.sub_strand}</Text>
                </View>
              </View>
              <View style={{ marginLeft: 10, justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => setViewingIndicator(ind)} style={{ padding: 8, backgroundColor: '#f0f4ff', borderRadius: 8, marginBottom: 8 }}>
                  <Ionicons name="eye-outline" size={18} color={COLORS.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEdit(ind)} style={{ padding: 8, backgroundColor: '#f0f4ff', borderRadius: 8, marginBottom: 8 }}>
                  <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(ind.id)} style={{ padding: 8, backgroundColor: '#ffebee', borderRadius: 8 }}>
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {filteredIndicators.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#999' }}>No matching indicators found.</Text>
          </View>
        )}
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={!!viewingIndicator} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            {viewingIndicator && (
                <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <View style={{ backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 10 }}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>{viewingIndicator.grade}</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>{viewingIndicator.indicator_code}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#666' }}>{viewingIndicator.strand} › {viewingIndicator.sub_strand}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setViewingIndicator(null)} style={{ padding: 5 }}>
                        <Ionicons name="close-circle" size={28} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={[styles.label, { color: COLORS.primary }]}>Description</Text>
                    <Text style={{ fontSize: 15, color: COLORS.dark, marginBottom: 20, lineHeight: 22 }}>{viewingIndicator.indicator_description}</Text>

                    <Text style={[styles.label, { color: COLORS.accent }]}>Content Standard</Text>
                    <Text style={{ fontSize: 14, color: COLORS.dark, marginBottom: 20 }}>{viewingIndicator.content_standard || 'N/A'}</Text>

                    <View style={{ backgroundColor: '#f0f9ff', padding: 15, borderRadius: 12, marginBottom: 15 }}>
                        <Text style={[styles.label, { color: COLORS.accent, marginTop: 0 }]}>Exemplars (Activities)</Text>
                        <Text style={{ fontSize: 14, color: COLORS.dark, lineHeight: 20 }}>{viewingIndicator.exemplars || 'No exemplars provided for this indicator.'}</Text>
                    </View>

                    <View style={{ backgroundColor: '#f0fdf4', padding: 15, borderRadius: 12, marginBottom: 15 }}>
                        <Text style={[styles.label, { color: COLORS.success, marginTop: 0 }]}>Core Competencies</Text>
                        <Text style={{ fontSize: 14, color: COLORS.dark, lineHeight: 20 }}>{viewingIndicator.core_competencies || 'No competencies listed.'}</Text>
                    </View>
                </ScrollView>

                <TouchableOpacity 
                    style={[styles.primaryBtn, { marginTop: 15 }]} 
                    onPress={() => {
                        const ind = viewingIndicator;
                        setViewingIndicator(null);
                        handleEdit(ind);
                    }}
                >
                    <Text style={styles.btnText}>Edit Row Details</Text>
                </TouchableOpacity>
                </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={!!editingIndicator || isAdding} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <Text style={styles.sectionTitle}>{isAdding ? 'Add New Row' : 'Edit Indicator'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginTop: 10 }}>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Grade/Level *</Text>
                        <TextInput style={styles.input} value={formData.grade} onChangeText={v => setFormData({...formData, grade: v})} placeholder="B7" placeholderTextColor="#ccc" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Indicator Code *</Text>
                        <TextInput style={styles.input} value={formData.indicator_code} onChangeText={v => setFormData({...formData, indicator_code: v})} placeholder="B7.1.1.1.1" placeholderTextColor="#ccc" />
                    </View>
                </View>

                <Text style={styles.label}>Indicator Description *</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  value={formData.indicator_description} 
                  onChangeText={v => setFormData({...formData, indicator_description: v})} 
                  placeholder="Describe the learning objective..." 
                  placeholderTextColor="#ccc"
                />

                <Text style={styles.label}>Strand</Text>
                <TextInput style={styles.input} value={formData.strand} onChangeText={v => setFormData({...formData, strand: v})} placeholderTextColor="#ccc" />

                <Text style={styles.label}>Sub-Strand</Text>
                <TextInput style={styles.input} value={formData.sub_strand} onChangeText={v => setFormData({...formData, sub_strand: v})} placeholderTextColor="#ccc" />

                <Text style={styles.label}>Content Standard</Text>
                <TextInput style={styles.input} value={formData.content_standard} onChangeText={v => setFormData({...formData, content_standard: v})} placeholderTextColor="#ccc" />

                <Text style={styles.label}>Exemplars (Activities)</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                  multiline 
                  value={formData.exemplars} 
                  onChangeText={v => setFormData({...formData, exemplars: v})} 
                  placeholderTextColor="#ccc"
                />

                <Text style={styles.label}>Core Competencies</Text>
                <TextInput style={styles.input} value={formData.core_competencies} onChangeText={v => setFormData({...formData, core_competencies: v})} placeholderTextColor="#ccc" />
              </View>
            </ScrollView>

            <View style={[styles.row, { marginTop: 20 }]}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginRight: 10, backgroundColor: COLORS.success }]} onPress={handleSave}>
                <Text style={styles.btnText}>Save Row</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => { setEditingIndicator(null); setIsAdding(false); }}>
                <Text style={styles.btnTextDark}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
