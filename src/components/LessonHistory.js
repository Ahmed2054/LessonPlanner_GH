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
  handleShareMultiplePDF,
  navigateToCreate,
  onClearAll
}) => {
  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('Lesson Plan');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const filterTabs = [
    { label: 'Lesson Plan', icon: 'reader-outline', activeColor: '#1d4ed8', activeBg: '#dbeafe' },
    { label: 'Note', icon: 'document-text-outline', activeColor: '#7c3aed', activeBg: '#ede9fe' },
    { label: 'Questions', icon: 'help-circle-outline', activeColor: '#047857', activeBg: '#d1fae5' }
  ];
  const activeFilterTheme = filterTabs.find((tab) => tab.label === activeTab) || filterTabs[0];

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
  const selectedItems = filteredHistory.filter((item) => selectedIds.includes(item.id));

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectionMode(false);
    setSelectedIds([]);
  }, [activeTab]);

  React.useEffect(() => {
    setSelectedIds((current) => current.filter((id) => history.some((item) => item.id === id)));
  }, [history]);

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

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current);
    setSelectedIds([]);
  };

  const handleToggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredHistory.map((item) => item.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return;
    handleShareMultiplePDF(selectedItems);
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <View style={styles.modernTopRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.modernTopRowTitle}>Lesson History</Text>
          <Text style={[styles.modernItemSubtitle, { marginTop: 2, fontSize: 12 }]}>Saved generations</Text>
        </View>
        {filteredHistory.length > 0 && (
          <Text style={styles.pageIndicator}>Pg {currentPage}/{totalPages}</Text>
        )}
      </View>

      {filteredHistory.length > 0 && (
        <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
          {!selectionMode ? (
            <TouchableOpacity
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#e8f0fe',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6
              }}
              onPress={toggleSelectionMode}
            >
              <Ionicons name="checkbox-outline" size={15} color={COLORS.primary} style={{ marginRight: 5 }} />
              <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: '700' }}>Select Multiple</Text>
            </TouchableOpacity>
          ) : (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#dbeafe'
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: COLORS.dark, fontSize: 12, fontWeight: '700' }}>
                  {selectedItems.length} selected
                </Text>
                <TouchableOpacity onPress={toggleSelectionMode}>
                  <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: '700' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#eef2ff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
                  onPress={handleSelectAllFiltered}
                >
                  <Text style={{ color: '#3949ab', fontSize: 11, fontWeight: '700' }}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#fff3e0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
                  onPress={handleClearSelection}
                >
                  <Text style={{ color: '#ef6c00', fontSize: 11, fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: selectedItems.length > 0 ? '#e8f5e9' : '#eceff1',
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 6
                  }}
                  onPress={handleExportSelected}
                  disabled={selectedItems.length === 0}
                >
                  <Text style={{
                    color: selectedItems.length > 0 ? '#2e7d32' : '#90a4ae',
                    fontSize: 11,
                    fontWeight: '700'
                  }}>
                    Export One PDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{
        marginHorizontal: 12,
        marginBottom: 10,
        backgroundColor: '#f8fafc',
        borderRadius: 18,
        padding: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0'
      }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 10,
                backgroundColor: activeTab === tab.label ? tab.activeBg : 'transparent',
                borderWidth: activeTab === tab.label ? 1 : 0,
                borderColor: activeTab === tab.label ? tab.activeColor : 'transparent'
              }
            ]}
            onPress={() => setActiveTab(tab.label)}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={activeTab === tab.label ? tab.activeColor : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text style={{
              fontSize: 11,
              fontWeight: activeTab === tab.label ? '800' : '700',
              color: activeTab === tab.label ? tab.activeColor : '#64748b'
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 6 }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 6 }}>
              <Text style={[styles.subTitle, { fontSize: 12 }]}>SAVED</Text>
              <TouchableOpacity
                style={{ paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#ffebee', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                onPress={onClearAll}
              >
                <Ionicons name="trash-outline" size={14} color="#c62828" />
                <Text style={{ color: '#c62828', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>CLEAR ALL</Text>
              </TouchableOpacity>
            </View>
            {groupedItems.map((group, groupIdx) => (
              <View key={group.title} style={[styles.historyGroup, { marginBottom: 12 }, groupIdx > 0 && { marginTop: 2 }]}>
                <Text style={[styles.historyGroupTitle, { marginBottom: 6, fontSize: 11 }]}>{group.title}</Text>
                {group.items.map(item => {
                  let subjectName = "Lesson Plan";
                  try {
                    const content = JSON.parse(item.content);
                    subjectName = content?.header?.subject || 'Lesson Plan';
                  } catch (e) { }

                  return (
                    <View key={item.id} style={{ marginBottom: 8 }}>
                      <Swipeable
                        enabled={!selectionMode}
                        renderRightActions={() => renderRightActions(item)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.modernItemContainer,
                            {
                              padding: 0,
                              borderRadius: 16,
                              minHeight: 0,
                              overflow: 'hidden',
                              borderWidth: 1,
                              borderColor: activeFilterTheme.activeBg
                            },
                            selectionMode && selectedIds.includes(item.id) && {
                              borderWidth: 1.5,
                              borderColor: activeFilterTheme.activeColor,
                              backgroundColor: activeFilterTheme.activeBg
                            }
                          ]}
                          onPress={() => selectionMode ? handleToggleSelected(item.id) : handleLoadPlan(item)}
                        >
                          <View style={{ flexDirection: 'row' }}>
                            <View style={{ width: 6, backgroundColor: activeFilterTheme.activeColor }} />
                            <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 11 }}>
                              <View style={[styles.modernItemHeader, { alignItems: 'flex-start' }]}>
                                {selectionMode && (
                                  <Ionicons
                                    name={selectedIds.includes(item.id) ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color={selectedIds.includes(item.id) ? activeFilterTheme.activeColor : '#94a3b8'}
                                    style={{ marginRight: 8, marginTop: 1 }}
                                  />
                                )}
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                                    <View style={{
                                      backgroundColor: activeFilterTheme.activeBg,
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 999,
                                      marginRight: 8,
                                      marginBottom: 4
                                    }}>
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: activeFilterTheme.activeColor, textTransform: 'uppercase' }}>
                                        {activeTab}
                                      </Text>
                                    </View>
                                    <View style={{
                                      backgroundColor: activeFilterTheme.activeBg,
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 999,
                                      marginBottom: 4
                                    }}>
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: activeFilterTheme.activeColor }}>
                                        Week {item.week || 'N/A'}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text
                                    style={[styles.historySubjectText, { fontSize: 14.5, marginBottom: 5 }]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                  >
                                    {subjectName}
                                  </Text>
                                  <View style={[styles.row, { marginTop: 1, flexWrap: 'wrap', alignItems: 'center' }]}>
                                    <Text
                                      style={[styles.historyIndicatorText, { marginTop: 0, fontSize: 10.5, color: activeFilterTheme.activeColor }]}
                                      numberOfLines={1}
                                    >
                                      {item.indicator_code}
                                    </Text>
                                  </View>
                                  <Text style={[styles.modernItemSubtitle, { marginTop: 5, fontSize: 11 }]}>Saved at {formatTime(item.created_at)}</Text>
                                </View>
                                {!selectionMode && (
                                  <View style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 17,
                                    backgroundColor: activeFilterTheme.activeBg,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Ionicons name="chevron-forward" size={18} color={activeFilterTheme.activeColor} />
                                  </View>
                                )}
                              </View>
                            </View>
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
