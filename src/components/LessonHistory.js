import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { styles } from '../theme/styles';

const LessonHistory = ({
  history,
  handleLoadPlan,
  handleDeletePlan,
  handleSharePDF,
  navigateToCreate,
  onClearAll
}) => {
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('Lesson Plan');

  const filteredHistory = React.useMemo(() => {
    return history.filter(item => {
      let type = 'Lesson Plan';
      if (item.plan_type) {
        type = item.plan_type;
      } else {
        try {
          const parsed = JSON.parse(item.content);
          if (parsed.type === 'Note') type = 'Note';
          else if (parsed.type === 'Questions') type = 'Questions';
        } catch (e) { }
      }
      return type === activeTab;
    });
  }, [history, activeTab]);

  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE) || 1;
  const currentItems = filteredHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts.replace(' ', 'T') + 'Z');
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderRightActions = (item) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: '100%', paddingLeft: 10 }}>
      <TouchableOpacity
        style={[styles.actionBtnIcon, { backgroundColor: '#e3f2fd' }]}
        onPress={() => handleSharePDF(item)}
      >
        <Ionicons name="share-social-outline" size={20} color={COLORS.accent} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtnIcon, { backgroundColor: '#ffebee', marginRight: 10 }]}
        onPress={() => handleDeletePlan(item.id)}
      >
        <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  const groupHistoryByDate = (items) => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    items.forEach(item => {
      const itemDate = new Date(item.created_at.replace(' ', 'T') + 'Z');
      const startOfDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

      let groupKey = "OLDER";
      if (startOfDay.getTime() === today.getTime()) groupKey = "TODAY";
      else if (startOfDay.getTime() === yesterday.getTime()) groupKey = "YESTERDAY";
      else if (startOfDay.getTime() > lastWeek.getTime()) groupKey = "LAST 7 DAYS";

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });

    const sortedKeys = ["TODAY", "YESTERDAY", "LAST 7 DAYS", "OLDER"].filter(k => groups[k]);
    return sortedKeys.map(k => ({ title: k, items: groups[k] }));
  };

  const groupedItems = React.useMemo(() => groupHistoryByDate(currentItems), [currentItems]);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <View style={styles.modernTopRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.modernTopRowTitle}>Lesson History</Text>
          <Text style={styles.modernItemSubtitle}>Your saved generations</Text>
        </View>
        {filteredHistory.length > 0 && (
          <Text style={styles.pageIndicator}>Pg {currentPage}/{totalPages}</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15, gap: 10 }}>
        {['Lesson Plan', 'Note', 'Questions'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.pill,
              activeTab === tab && styles.pillActive,
              { paddingHorizontal: 16 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.pillText, activeTab === tab && styles.pillTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 5 }}>
        {filteredHistory.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
            <Ionicons name="document-text-outline" size={80} color="#ddd" />
            <Text style={[styles.emptyText, { marginTop: 15, fontSize: 16 }]}>No saved {activeTab.toLowerCase()}s yet.</Text>
            <TouchableOpacity style={[styles.primaryBtn, { paddingHorizontal: 25 }]} onPress={navigateToCreate}>
              <Text style={styles.btnText}>Create your first plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
              <Text style={styles.subTitle}>SAVED</Text>
              <TouchableOpacity
                style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ffebee', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                onPress={onClearAll}
              >
                <Ionicons name="trash-outline" size={16} color="#c62828" />
                <Text style={{ color: '#c62828', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>CLEAR ALL</Text>
              </TouchableOpacity>
            </View>
            {groupedItems.map((group, groupIdx) => (
              <View key={group.title} style={[styles.historyGroup, groupIdx > 0 && { marginTop: 5 }]}>
                <Text style={styles.historyGroupTitle}>{group.title}</Text>
                {group.items.map(item => {
                  let subjectName = "Lesson Plan";
                  try {
                    const content = JSON.parse(item.content);
                    subjectName = content?.header?.subject || 'Lesson Plan';
                  } catch (e) { }

                  return (
                    <View key={item.id} style={{ marginBottom: 12 }}>
                      <Swipeable renderRightActions={() => renderRightActions(item)}>
                        <TouchableOpacity
                          style={styles.modernItemContainer}
                          onPress={() => handleLoadPlan(item)}
                        >
                          <View style={styles.modernItemHeader}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.historySubjectText}>{subjectName}</Text>
                              <View style={[styles.row, { marginTop: 6, flexWrap: 'wrap' }]}>
                                <Text style={styles.historyIndicatorText}>{item.indicator_code}</Text>
                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', marginHorizontal: 8 }} />
                                <Text style={[styles.historyIndicatorText, { color: COLORS.accent }]}>Week {item.week || 'N/A'}</Text>
                              </View>
                              <Text style={[styles.modernItemSubtitle, { marginTop: 8 }]}>Saved at {formatTime(item.created_at)}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                          </View>
                        </TouchableOpacity>
                      </Swipeable>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {totalPages > 1 && (
        <View style={[styles.paginationRow, {
          backgroundColor: COLORS.white,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          marginTop: 0
        }]}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled, { paddingVertical: 6, paddingHorizontal: 10 }]}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? '#ccc' : COLORS.primary} />
            <Text style={[styles.pageBtnText, { fontSize: 12 }, currentPage === 1 && { color: '#ccc' }]}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.pageCircles}>
            {[...Array(totalPages)].map((_, i) => (
              <View key={i} style={[styles.pageCircle, (i + 1) === currentPage && styles.pageCircleActive]} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled, { paddingVertical: 6, paddingHorizontal: 10 }]}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.pageBtnText, { fontSize: 12 }, currentPage === totalPages && { color: '#ccc' }]}>Next</Text>
            <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? '#ccc' : COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default LessonHistory;
