import React, { useState } from 'react';
import { View } from 'react-native';
import SubjectManager from '../components/SubjectManager';
import IndicatorListManager from '../components/IndicatorListManager';

export default function CurriculumScreen({ 
  subjects, 
  loading, 
  allGrades, 
  showImportModal, 
  setShowImportModal, 
  handleDeleteSubject, 
  editingSubjectId, 
  setEditingSubjectId, 
  handleRenameSubject, 
  editSubjectName, 
  setEditSubjectName, 
  editSubjectTribe,
  setEditSubjectTribe,
  handleImport, 
  importSubjectName, 
  setImportSubjectName, 
  importFile, 
  setImportFile,
  handlePickDocument,
  handleClearAllCurricula,
  onExportSubject,
  refreshSubjects
}) {
  const [selectedSubject, setSelectedSubject] = useState(null);

  if (selectedSubject) {
    return (
      <IndicatorListManager 
        subject={selectedSubject} 
        onBack={() => {
          setSelectedSubject(null);
          refreshSubjects(); 
        }} 
      />
    );
  }

  return (
    <SubjectManager 
      subjects={subjects}
      loading={loading}
      allGrades={allGrades}
      showImportModal={showImportModal}
      setShowImportModal={setShowImportModal}
      handleDeleteSubject={handleDeleteSubject}
      editingSubjectId={editingSubjectId}
      setEditingSubjectId={setEditingSubjectId}
      handleUpdateSubject={handleRenameSubject}
      editSubjectName={editSubjectName}
      setEditSubjectName={setEditSubjectName}
      editSubjectTribe={editSubjectTribe}
      setEditSubjectTribe={setEditSubjectTribe}
      handleImport={handleImport}
      importSubjectName={importSubjectName}
      setImportSubjectName={setImportSubjectName}
      importFile={importFile}
      setImportFile={setImportFile}
      onPickDocument={handlePickDocument}
      onClearAll={handleClearAllCurricula}
      onExportSubject={onExportSubject}
      onSelectSubject={setSelectedSubject}
    />
  );
}
