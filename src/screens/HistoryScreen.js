import React from 'react';
import { View, Text } from 'react-native';
import LessonHistory from '../components/LessonHistory';

export default function HistoryScreen({ 
  history, 
  loading, 
  handleLoadPlan, 
  handleDeletePlan,
  navigateToCreate,
  handleSharePDF,
  onClearAll
}) {
  return (
    <LessonHistory 
      history={history}
      loading={loading}
      handleLoadPlan={handleLoadPlan}
      handleDeletePlan={handleDeletePlan}
      navigateToCreate={navigateToCreate}
      handleSharePDF={handleSharePDF}
      onClearAll={onClearAll}
    />
  );
}
