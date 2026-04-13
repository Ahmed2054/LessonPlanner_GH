import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  View, 
  ActivityIndicator, 
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Text
} from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { 
  initDatabase, 
  importCurriculumFromCSV, 
  getAllGrades,
  getSubjectsByGrade,
  getIndicatorsBySubjectAndGrade,
  saveLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  deleteAllHistory,
  getSavedPlans,
  getSetting,
  setSetting,
  getSubjects,
  deleteSubject,
  updateSubjectName,
  deleteAllCurricula,
  factoryReset,
  getCurriculumBySubject,
  getTemplateSubjectNames,
  restoreTemplateSubjects
} from './src/services/database';
import { generateLessonPlan, regeneratePhase, generateNote, generateQuestions, testConnection } from './src/services/ai';
import { generatePDFFromPlan, openPDF, downloadFile } from './src/services/pdf';
import { checkForAppUpdate, downloadAndInstallUpdate, getCurrentVersionInfo } from './src/services/updates';

import { COLORS } from './src/theme/colors';
import { styles } from './src/theme/styles';

// Screens
import AILoader from './src/components/AILoader';
import CreateScreen from './src/screens/CreateScreen';
import CurriculumScreen from './src/screens/CurriculumScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function MainContent() {
  const [activeTab, setActiveTab] = useState('Create'); 

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initing, setIniting] = useState(true);
  const [aiModel, setAiModel] = useState('deepseek-chat'); // Default model
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [regeneratingPhaseIndex, setRegeneratingPhaseIndex] = useState(null);
  const [isNavigatingHistory, setIsNavigatingHistory] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState({ title: "AI is Thinking...", subtitle: "Writing your professional lesson plan" });
  const abortControllerRef = useRef(null);
  const prevGradeRef = useRef('');
  const prevSubjectIdRef = useRef(null);
  const currentVersionInfo = getCurrentVersionInfo();
  const lastPromptedUpdateRef = useRef(null);

  // Subjects
  const [subjects, setSubjects] = useState([]);
  const [restoreSubjectNames] = useState(() => getTemplateSubjectNames());
  const [selectedRestoreSubjects, setSelectedRestoreSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [allGrades, setAllGrades] = useState([]);
  const [gradeSubjects, setGradeSubjects] = useState([]);
  const [importSubjectName, setImportSubjectName] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectTribe, setEditSubjectTribe] = useState('');

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [week, setWeek] = useState('1');
  const [classSize, setClassSize] = useState('40');
  const [lessonDuration, setLessonDuration] = useState('60 mins');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [indicators, setIndicators] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [editablePlan, setEditablePlan] = useState(null);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);
  const [history, setHistory] = useState([]);

  // Initialization
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();


        const savedModel = await getSetting('ai_model');
        if (savedModel) setAiModel(savedModel);
        
        const currentSubjects = await getSubjects();
        setSubjects(currentSubjects);
        
        const gradesList = await getAllGrades();
        setAllGrades(gradesList);
        
        await loadHistory();
      } catch (err) {
        console.error("Init Error", err);
        Alert.alert("Startup Error", "Failed to initialize database: " + err.message);
      } finally {
        setIsNavigatingHistory(false);
        setIniting(false);
      }
    };
    init();
  }, []);

  const insets = useSafeAreaInsets();

  const loadHistory = async () => {
    const plans = await getSavedPlans();
    setHistory(plans);
  };

  const refreshSubjects = async () => {
    const updated = await getSubjects();
    setSubjects(updated);
  };
  const handleRestoreDefaults = async () => {
    if (selectedRestoreSubjects.length === 0) {
      return Alert.alert("Select Subjects", "Tick at least one subject to restore.");
    }

    const subjectLabel = selectedRestoreSubjects.length === 1
      ? selectedRestoreSubjects[0]
      : `${selectedRestoreSubjects.length} selected subjects`;

    Alert.alert("Restore Selected Subjects", `This will restore ${subjectLabel} from the app bundle. Continue?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes, Restore", onPress: async () => {
        setLoadingMessage({ title: "Restoring...", subtitle: "Importing bundled subjects" });
        setLoading(true);
        try {
          await initDatabase();
          const restoredCount = await restoreTemplateSubjects(selectedRestoreSubjects, true);
          await refreshSubjects();
          setAllGrades(await getAllGrades());
          Alert.alert("Success", `${restoredCount} subject${restoredCount === 1 ? '' : 's'} restored.`);
        } catch (e) {
          Alert.alert("Error", e.message);
        } finally {
          setLoading(false);
        }
      }}
    ]);
  };

  const handleToggleRestoreSubject = (name) => {
    setSelectedRestoreSubjects((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name].sort((a, b) => a.localeCompare(b))
    );
  };

  const handleSelectAllRestoreSubjects = () => {
    setSelectedRestoreSubjects([...restoreSubjectNames]);
  };

  const handleClearRestoreSubjects = () => {
    setSelectedRestoreSubjects([]);
  };

  const restoredTemplateSubjects = restoreSubjectNames.filter((name) =>
    subjects.some((subject) => subject.name === name && (subject.indicator_count || 0) > 0)
  );

  const handleModelChange = async (model) => {
    try {
      await setSetting('ai_model', model);
      setAiModel(model);
    } catch (e) {
      console.error("Failed to save model", e);
    }
  };

  const handleTestConnection = async () => {
    setLoadingMessage({ title: "Connecting...", subtitle: "Testing DeepSeek API status" });
    setLoading(true);
    try {
      const ok = await testConnection(null);
      if (ok) Alert.alert("Connection Success", "Successfully connected to DeepSeek AI.");
    } catch (e) {
      Alert.alert("Connection Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckForUpdate = async () => {
    setLoadingMessage({ title: "Checking for updates...", subtitle: "Comparing your app with GitHub release info" });
    setLoading(true);

    try {
      const result = await checkForAppUpdate();

      if (!result.hasUpdate) {
        Alert.alert("No Update Available", `You are using the latest version (${result.currentVersion.version}).`);
        return;
      }

      const releaseNotes = result.remoteManifest.notes ? `\n\nWhat is new:\n${result.remoteManifest.notes}` : '';

      Alert.alert(
        "Update Available",
        `Current version: ${result.currentVersion.version}\nNew version: ${result.remoteManifest.version}${releaseNotes}`,
        [
          { text: "Later", style: "cancel" },
          {
            text: "Download & Install",
            onPress: async () => {
              setLoadingMessage({ title: "Downloading update...", subtitle: "Preparing the APK for installation" });
              setLoading(true);

              try {
                await downloadAndInstallUpdate(result.remoteManifest, (progress) => {
                  const percent = Math.round(progress * 100);
                  setLoadingMessage({
                    title: "Downloading update...",
                    subtitle: `Downloading APK: ${percent}%`
                  });
                });
              } catch (downloadError) {
                Alert.alert("Update Failed", downloadError.message);
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Update Check Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const promptForAvailableUpdate = useCallback((result) => {
    const remoteVersion = result?.remoteManifest?.version;

    if (!remoteVersion || lastPromptedUpdateRef.current === remoteVersion) {
      return;
    }

    lastPromptedUpdateRef.current = remoteVersion;

    const releaseNotes = result.remoteManifest.notes ? `\n\nWhat is new:\n${result.remoteManifest.notes}` : '';

    Alert.alert(
      "New Update Available",
      `Current version: ${result.currentVersion.version}\nNew version: ${remoteVersion}${releaseNotes}`,
      [
        { text: "Later", style: "cancel" },
        {
          text: "Update Now",
          onPress: async () => {
            setLoadingMessage({ title: "Downloading update...", subtitle: "Preparing the APK for installation" });
            setLoading(true);

            try {
              await downloadAndInstallUpdate(result.remoteManifest, (progress) => {
                const percent = Math.round(progress * 100);
                setLoadingMessage({
                  title: "Downloading update...",
                  subtitle: `Downloading APK: ${percent}%`
                });
              });
            } catch (downloadError) {
              Alert.alert("Update Failed", downloadError.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }, []);

  const checkForUpdatesSilently = useCallback(async () => {
    try {
      const result = await checkForAppUpdate();

      if (result.hasUpdate) {
        promptForAvailableUpdate(result);
      }
    } catch (error) {
      console.log("Silent update check skipped:", error.message);
    }
  }, [promptForAvailableUpdate]);

  useEffect(() => {
    if (initing) return;

    checkForUpdatesSilently();
  }, [initing, checkForUpdatesSilently]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForUpdatesSilently();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkForUpdatesSilently]);



  const handleFullReset = () => {
    Alert.alert("Reset Setup", "Are you sure you want to clear all your current setup and start over?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Yes, Reset", 
        style: "destructive", 
        onPress: () => {
          setStep(1);
          setSelectedGrade(null);
          setSelectedSubjectId(null);
          setSelectedIndicator(null);
          setGeneratedPlan(null);
          setEditablePlan(null);
          setEditingPlanId(null);
          setWeek("");
          setDate(new Date().toISOString().split('T')[0]);
        }
      }
    ]);
  };

  const handleRefreshAll = async () => {
    if (loading || refreshing) return;
    setRefreshing(true);
    setLoadingMessage({ title: "Synchronizing...", subtitle: "Refreshing your curriculum data" });
    setLoading(true);
    try {
      const subs = await getSubjects();
      setSubjects(subs);
      const g = await getAllGrades();
      setAllGrades(g);
      await loadHistory();

      setStep(1);
      setGeneratedPlan(null);
      setEditablePlan(null);
      setEditingPlanId(null);
      setActiveTab('Create');
      setSelectedGrade('');
      setSelectedSubjectId(null);
      setIndicators([]);
      setSelectedIndicator(null);


    } catch (e) {
      Alert.alert("Refresh Error", "Could not reload data: " + e.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleDeleteSubject = (id, name) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the curriculum for "${name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await deleteSubject(id);
            const updated = await getSubjects();
            setSubjects(updated);
            if (selectedSubjectId === id) setSelectedSubjectId(null);
          }
        }
      ]
    );
  };

  const handleRenameSubject = async (id) => {
    if (!editSubjectName.trim()) return Alert.alert("Required", "Please enter a subject name.");
    try {
      await updateSubjectName(id, editSubjectName, editSubjectTribe);
      const updated = await getSubjects();
      setSubjects(updated);
      setEditingSubjectId(null);
      setEditSubjectName('');
      setEditSubjectTribe('');
      Alert.alert("Success", "Subject updated successfully.");
    } catch (e) {
      Alert.alert("Error", "Could not update subject.");
    }
  };
  
  const handleClearAllCurricula = async () => {
    Alert.alert(
      "Confirm Delete All",
      "Are you sure you want to delete ALL curriculum data? This cannot be undone, but your saved lesson plans will NOT be affected.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All Curricula", 
          style: "destructive", 
          onPress: async () => {
            setLoadingMessage({ title: "Deleting...", subtitle: "Removing all curriculum data" });
            setLoading(true);
            try {
              await deleteAllCurricula();
              setSubjects([]);
              setAllGrades([]);
              setSelectedGrade('');
              setSelectedSubjectId(null);
              Alert.alert("Success", "All curriculum data has been deleted.");
            } catch (e) {
              Alert.alert("Error", "Could not delete all curriculum.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleFactoryReset = async () => {
    Alert.alert(
      "Factory Reset",
      "Are you sure you want to delete ALL curricula, lesson plans, and other data? This will NOT delete your API Key.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset All", 
          style: "destructive", 
          onPress: async () => {
            setLoadingMessage({ title: "Resetting...", subtitle: "Performing factory reset" });
            setLoading(true);
            try {
              await factoryReset();
              setSubjects([]);
              setAllGrades([]);
              setHistory([]);
              setSelectedGrade('');
              setSelectedSubjectId(null);
              Alert.alert("Success", "Application has been reset.");
            } catch (e) {
              Alert.alert("Error", "Could not perform factory reset.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleImport = async () => {
    try {
      let fileToUse = importFile;
      if (!fileToUse) {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['text/csv', 'text/comma-separated-values', '*/*'],
          copyToCacheDirectory: true
        });
        if (result.canceled) return false;
        fileToUse = result.assets[0];
        setImportFile(fileToUse);
      }
      if (!importSubjectName.trim()) {
        Alert.alert("File Selected", "Great! Now please enter a name for this subject to complete the import.");
        return false;
      }
      setLoadingMessage({ title: "Importing...", subtitle: "Processing curriculum file" });
      setLoading(true);
      await initDatabase();
      const csvText = await new File(fileToUse.uri).text();
      const count = await importCurriculumFromCSV(csvText, importSubjectName);
      const updatedSubjects = await getSubjects();
      setSubjects(updatedSubjects);
      const updatedGrades = await getAllGrades();
      setAllGrades(updatedGrades);
      setImportSubjectName('');
      setImportFile(null);
      Alert.alert("Success", `Curriculum imported!\nRows found: ${count}`);
      return true;
    } catch (e) {
      Alert.alert("Error", "Could not import curriculum data: " + e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };



  // Selectors logic
  useEffect(() => {
    if (selectedGrade) {
      getSubjectsByGrade(selectedGrade).then(setGradeSubjects);
      // Only clear child selections if the Grade actually changed and we aren't loading from history
      if (!isNavigatingHistory && prevGradeRef.current !== selectedGrade) {
        setSelectedSubjectId(null);
        setIndicators([]);
        setSelectedIndicator(null);
      }
      prevGradeRef.current = selectedGrade;
    }
  }, [selectedGrade, isNavigatingHistory]);

  useEffect(() => {
    if (selectedGrade && selectedSubjectId) {
      getIndicatorsBySubjectAndGrade(selectedSubjectId, selectedGrade).then(setIndicators);
      // Only clear child selection if Subject actually changed and we aren't loading from history
      if (!isNavigatingHistory && prevSubjectIdRef.current !== selectedSubjectId) {
        setSelectedIndicator(null);
      }
      prevSubjectIdRef.current = selectedSubjectId;
    }
  }, [selectedSubjectId, selectedGrade, isNavigatingHistory]);



  const handleGenerate = async (generationType = 'Lesson Plan', config = null) => {
    // if (!apiKey) return Alert.alert("Required", "Please go to Settings and save your DeepSeek API key.");
    if (!selectedIndicator) return Alert.alert("Required", "Please select an indicator.");
    const selectedSubjectNode = subjects.find(s => s.id === selectedSubjectId);
    
    let subtitleContext = "Writing your professional lesson plan";
    if (generationType === 'Note') subtitleContext = "Writing comprehensive lesson notes";
    if (generationType === 'Questions') subtitleContext = "Generating assessment questions";

    setLoadingMessage({ title: "AI is Thinking...", subtitle: subtitleContext });
    setLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const subjectNameForPlan = selectedSubjectNode?.actual_name || selectedSubjectNode?.name || 'Subject';
      const aiData = {
        date, week, subject_name: subjectNameForPlan,
        class_size: classSize, duration: lessonDuration, grade: selectedGrade,
        strand: selectedIndicator.strand, sub_strand: selectedIndicator.sub_strand,
        indicator_code: selectedIndicator.indicator_code, indicator_description: selectedIndicator.indicator_description,
        content_standard: selectedIndicator.content_standard || selectedIndicator.standard || '',
        exemplars: selectedIndicator.exemplars || selectedIndicator.exemplar || '',
        core_competencies: selectedIndicator.core_competencies || selectedIndicator.core_competency || '',
        tribe: selectedSubjectNode?.tribe || ''
      };

      let planString = "";
      if (generationType === 'Lesson Plan') {
        planString = await generateLessonPlan(null, aiData, abortControllerRef.current.signal, aiModel);
      } else if (generationType === 'Note') {
        planString = await generateNote(null, aiData, abortControllerRef.current.signal, aiModel);
      } else if (generationType === 'Questions') {
        planString = await generateQuestions(null, aiData, config, abortControllerRef.current.signal, aiModel);
      }

      setGeneratedPlan(planString);
      try {
        const parsed = JSON.parse(planString);
        if (parsed.header) parsed.header.subject = subjectNameForPlan;
        parsed.plan_type = generationType;
        setEditablePlan(parsed);
      } catch (e) {
        console.error("JSON Parse Error:", e, planString);
        setEditablePlan(null); 
        // If it's not valid JSON, we still move to step 3 so the user can see the raw output
      }
      setStep(3);
    } catch (e) {
      if (!abortControllerRef.current?.signal.aborted) Alert.alert("Generation Failed", e.message);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => abortControllerRef.current?.abort();

  const handleRegenerateSinglePhase = async (index, phaseName) => {
    // if (!apiKey) return Alert.alert("Required", "API Key is missing.");
    setLoadingMessage({ title: "AI is Working...", subtitle: `Regenerating ${phaseName}` });
    setRegeneratingPhaseIndex(index);
    const selectedSubjectNode = subjects.find(s => s.id === selectedSubjectId);
    abortControllerRef.current = new AbortController();
    try {
      const subjectNameForPlan = selectedSubjectNode?.actual_name || selectedSubjectNode?.name || 'Subject';
      const resultString = await regeneratePhase(null, {
        subject_name: subjectNameForPlan,
        grade: selectedGrade,
        strand: selectedIndicator?.strand || '',
        sub_strand: selectedIndicator?.sub_strand || '',
        indicator_code: selectedIndicator?.indicator_code || '',
        indicator_description: selectedIndicator?.indicator_description || '',
        content_standard: selectedIndicator?.content_standard || '',
        exemplars: selectedIndicator?.exemplars || '',
        core_competencies: selectedIndicator?.core_competencies || '',
        tribe: selectedSubjectNode?.tribe || ''
      }, phaseName, abortControllerRef.current.signal, aiModel);
      const newPhaseData = JSON.parse(resultString);
      const updatedPlan = { ...editablePlan };
      updatedPlan.phases[index].activities = newPhaseData.activities;
      updatedPlan.phases[index].resources = newPhaseData.resources;
      setEditablePlan(updatedPlan);
    } catch (e) {
      if (!abortControllerRef.current?.signal.aborted) Alert.alert("Regeneration Error", e.message);
    } finally {
      setRegeneratingPhaseIndex(null);
      abortControllerRef.current = null;
    }
  };

  const handleExportSubject = async (subjectId, name) => {
    try {
      setLoadingMessage({ title: "Exporting...", subtitle: "Generating CSV file" });
      setLoading(true);
      const data = await getCurriculumBySubject(subjectId);
      if (!data || data.length === 0) return Alert.alert("Empty", "No curriculum data found for this subject.");
      
      const csv = Papa.unparse(data);
      const fileName = `${name.replace(/\s+/g, '_')}_Curriculum.csv`;
      const fileUri = `${Paths.document.uri}${fileName}`;
      
      await LegacyFileSystem.writeAsStringAsync(fileUri, csv, { encoding: LegacyFileSystem.EncodingType.UTF8 });
      
      const { Sharing } = require('expo-sharing'); // Dynamic require for safety? No, usually fine to import.
      const isAvailable = await require('expo-sharing').isAvailableAsync();
      if (isAvailable) {
        await require('expo-sharing').shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (e) {
      console.error("Export Error", e);
      Alert.alert("Export Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = (id) => {
    Alert.alert("Delete Plan", "Are you sure you want to delete this plan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteLessonPlan(id); await loadHistory(); } }
    ]);
  };

  const handleClearAllHistory = async () => {
    Alert.alert(
      "Confirm Clear History",
      "Are you sure you want to delete ALL saved lesson plans? This cannot be undone, but your curriculum data will NOT be affected.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All History", 
          style: "destructive", 
          onPress: async () => {
            setLoadingMessage({ title: "Clearing...", subtitle: "Deleting all saved plans" });
            setLoading(true);
            try {
              await deleteAllHistory();
              setHistory([]);
              setGeneratedPlan(null);
              setEditablePlan(null);
              setEditingPlanId(null);
              Alert.alert("Success", "All history has been cleared.");
            } catch (e) {
              Alert.alert("Error", "Could not clear history: " + e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSavePlan = async () => {
    setLoadingMessage({ title: "Saving Plan...", subtitle: "Storing your lesson safely" });
    setLoading(true);
    try {
      let finalPlanJson = editablePlan ? JSON.stringify(editablePlan) : generatedPlan;
      const pdfUri = await generatePDFFromPlan(finalPlanJson);
      const planData = {
        date, week, 
        indicator_code: selectedIndicator?.indicator_code || JSON.parse(finalPlanJson).header.indicator.split(' ')[0].replace(':', ''), 
        content: finalPlanJson, 
        pdf_uri: pdfUri,
        plan_type: editablePlan?.plan_type || 'Lesson Plan'
      };
      if (editingPlanId) await updateLessonPlan(editingPlanId, planData);
      else await saveLessonPlan(planData);
      Alert.alert("Success", "Lesson plan saved.");
      await loadHistory();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlan = async (item) => {
    setLoading(true);
    setIsNavigatingHistory(true);
    try {
      const content = JSON.parse(item.content);
      const header = content.header;
      setDate(item.date);
      setWeek(item.week);
      setClassSize(header.classSize || '40');
      setLessonDuration(header.duration || '60 mins');
      setSelectedGrade(header.class);
      
      const gradeFilteredSubjects = await getSubjectsByGrade(header.class);
      setGradeSubjects(gradeFilteredSubjects);
      
      const sub = gradeFilteredSubjects.find(s => s.actual_name === header.subject || s.name === header.subject);
      const subId = sub ? sub.id : null;
      setSelectedSubjectId(subId);

      if (subId && header.class) {
        const inds = await getIndicatorsBySubjectAndGrade(subId, header.class);
        setIndicators(inds);
        const targetInd = inds.find(i => i.indicator_code === item.indicator_code);
        if (targetInd) {
          setSelectedIndicator(targetInd);
        } else {
          // Fallback to searching by code string from header if direct match fails
          const fallbackCode = header.indicator.split(':')[0].trim();
          const fbInd = inds.find(i => i.indicator_code === fallbackCode);
          setSelectedIndicator(fbInd || null);
        }
      }
      setGeneratedPlan(item.content);
      setEditablePlan(content);
      setEditingPlanId(item.id);
      setActiveTab('Create');
      setStep(3);
    } catch (e) {
      Alert.alert("Error", "Could not reload data.");
    } finally {
      setTimeout(() => { setIsNavigatingHistory(false); setLoading(false); }, 500);
    }
  };

  const handleSharePDF = async (item) => {
    setLoadingMessage({ title: "Preparing...", subtitle: "Preparing file for sharing" });
    setLoading(true);
    try {
      let uri = item.pdf_uri;
      if (!uri) {
        uri = await generatePDFFromPlan(item.content);
      }
      const data = JSON.parse(item.content);
      const name = `Week${item.week.trim()}_${data.header.subject.trim().replace(/\s+/g, '')}.pdf`;
      setLoading(false); // Hide before opening system share
      await downloadFile(uri, name, 'application/pdf');
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", e.message);
    }
  };

  const handleOpenPDF = async () => {
    setLoadingMessage({ title: "Opening Preview...", subtitle: "Generating document" });
    setLoading(true);
    try {
      let finalPlanJson = editablePlan ? JSON.stringify(editablePlan) : generatedPlan;
      const pdfUri = await generatePDFFromPlan(finalPlanJson);
      const data = JSON.parse(finalPlanJson);
      const name = `Week${data.header.week.trim()}_${data.header.class.trim().replace(/\s+/g, '')}_${data.header.subject.trim().replace(/\s+/g, '')}`;
      setLoading(false); // Hide before opening system preview
      await openPDF(pdfUri, name);
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", e.message);
    }
  };

  const handleDownloadPDF = async () => {
    setLoadingMessage({ title: "Downloading...", subtitle: "Saving PDF to device" });
    setLoading(true);
    try {
      let finalPlanJson = editablePlan ? JSON.stringify(editablePlan) : generatedPlan;
      const uri = await generatePDFFromPlan(finalPlanJson);
      const data = JSON.parse(finalPlanJson);
      const name = `Week${data.header.week.trim()}_${data.header.subject.trim().replace(/\s+/g, '')}.pdf`;
      setLoading(false); // Hide before opening system download
      await downloadFile(uri, name, 'application/pdf');
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", e.message);
    }
  };


  const updatePhaseField = (index, field, value) => {
    const updated = { ...editablePlan };
    updated.phases[index][field] = value;
    setEditablePlan(updated);
  };

  const insertTag = (index, field, startTag, endTag = '') => {
    const currentVal = editablePlan.phases[index][field];
    const newVal = currentVal + startTag + endTag;
    updatePhaseField(index, field, newVal);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true 
      });
      if (!result.canceled) setImportFile(result.assets[0]);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  if (initing) return (
    <View style={[styles.centered, { backgroundColor: '#fff' }]}>
      <Ionicons name="heart" size={60} color={COLORS.primary} style={{ transform: [{ scale: 1.2 }] }} />
      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
    
      <View style={styles.header}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Lesson Planner GH</Text>
          <Text style={styles.headerSubtitle}>Professional Assistant</Text>
        </View>
        <TouchableOpacity 
          style={{ position: 'absolute', right: 20, opacity: (loading || refreshing) ? 0.3 : 1 }} 
          onPress={handleRefreshAll}
          disabled={loading || refreshing}
        >
          {refreshing ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="refresh" size={24} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.scroll, { flex: 1 }]}>
          {activeTab === 'Create' && (
            <CreateScreen 
              step={step} setStep={setStep} loading={loading} allGrades={allGrades}
              date={date} setDate={setDate} week={week} setWeek={setWeek} classSize={classSize} setClassSize={setClassSize}
              lessonDuration={lessonDuration} setLessonDuration={setLessonDuration}
              selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} gradeSubjects={gradeSubjects}
              selectedSubjectId={selectedSubjectId} setSelectedSubjectId={setSelectedSubjectId}
              indicators={indicators} selectedIndicator={selectedIndicator} setSelectedIndicator={setSelectedIndicator}
              handleStop={handleStop} handleGenerate={handleGenerate} editingPlanId={editingPlanId}
              editablePlan={editablePlan} generatedPlan={generatedPlan} regeneratingPhaseIndex={regeneratingPhaseIndex}
              editingPhaseIndex={editingPhaseIndex} setEditingPhaseIndex={setEditingPhaseIndex}
              handleRegenerateSinglePhase={handleRegenerateSinglePhase} updatePhaseField={updatePhaseField} insertTag={insertTag}
              handleSavePlan={handleSavePlan} handleOpenPDF={handleOpenPDF} handleDownloadPDF={handleDownloadPDF} 
              setActiveTab={setActiveTab} handleFullReset={handleFullReset}
            />
          )}
          {activeTab === 'History' && (
            <HistoryScreen 
              history={history} 
              loading={loading} 
              handleLoadPlan={handleLoadPlan} 
              handleDeletePlan={handleDeletePlan}
              navigateToCreate={() => setActiveTab('Create')}
              handleSharePDF={handleSharePDF}
              onClearAll={handleClearAllHistory}
            />
          )}
          {activeTab === 'Curriculum' && (
            <CurriculumScreen 
              subjects={subjects} loading={loading} allGrades={allGrades} showImportModal={showImportModal}
              setShowImportModal={setShowImportModal} handleDeleteSubject={handleDeleteSubject}
              editingSubjectId={editingSubjectId} setEditingSubjectId={setEditingSubjectId} 
              handleRenameSubject={handleRenameSubject} editSubjectName={editSubjectName} setEditSubjectName={setEditSubjectName}
              editSubjectTribe={editSubjectTribe} setEditSubjectTribe={setEditSubjectTribe}
              handleImport={handleImport} importSubjectName={importSubjectName}
              setImportSubjectName={setImportSubjectName} importFile={importFile} setImportFile={setImportFile}
              onPickDocument={handlePickDocument} handleClearAllCurricula={handleClearAllCurricula}
              onExportSubject={handleExportSubject}
              refreshSubjects={refreshSubjects}
            />
          )}
          {activeTab === 'Settings' && (
            <SettingsScreen 
              aiModel={aiModel}
              handleModelChange={handleModelChange}
              handleTestConnection={handleTestConnection}
              handleCheckForUpdate={handleCheckForUpdate}
              handleRestoreDefaults={handleRestoreDefaults}
              restoreSubjectNames={restoreSubjectNames}
              restoredTemplateSubjects={restoredTemplateSubjects}
              selectedRestoreSubjects={selectedRestoreSubjects}
              handleToggleRestoreSubject={handleToggleRestoreSubject}
              handleSelectAllRestoreSubjects={handleSelectAllRestoreSubjects}
              handleClearRestoreSubjects={handleClearRestoreSubjects}
              handleFactoryReset={handleFactoryReset} 
              loading={loading}
              currentVersionLabel={`${currentVersionInfo.version} (${currentVersionInfo.versionCode})`}
              updateConfigReady={!currentVersionInfo.updateManifestUrl.includes('YOUR_GITHUB')}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Tabs */}
      <View style={[styles.bottomTabs, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {[
          { id: 'Create', icon: 'create-outline' },
          { id: 'History', icon: 'time-outline' },
          { id: 'Curriculum', icon: 'library-outline' },
          { id: 'Settings', icon: 'settings-outline' }
        ].map(tab => (
          <TouchableOpacity 
            key={tab.id}
            style={[styles.bottomTab, activeTab === tab.id && styles.activeBottomTab]}
            onPress={() => { setActiveTab(tab.id); if (tab.id === 'Create' && !editingPlanId) setStep(1); }}
          >
            <Ionicons 
              name={activeTab === tab.id ? tab.icon.replace('-outline', '') : tab.icon} 
              size={22} 
              color={activeTab === tab.id ? COLORS.primary : COLORS.dark} 
            />
            <Text style={[styles.bottomTabText, activeTab === tab.id && styles.activeBottomTabText]}>{tab.id}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Global AI Loader */}
    {loading && (
      <AILoader 
        onCancel={abortControllerRef.current ? handleStop : null} 
        title={loadingMessage.title}
        subtitle={loadingMessage.subtitle}
      />
    )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <MainContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
