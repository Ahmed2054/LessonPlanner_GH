import * as SQLite from 'expo-sqlite';
import Papa from 'papaparse';

import { CURRICULUM_TEMPLATES } from '../data/templates';

let dbPromise = null;
let _db = null;

const shouldRecoverDatabase = (error) => {
    const message = error?.message || '';
    return message.includes('NativeDatabase.prepareAsync') || message.includes('java.lang.NullPointerException');
};

const resetDbConnection = async () => {
    if (_db) {
        try {
            await _db.closeAsync();
        } catch (closeError) {
            console.warn('Failed to close stale database connection:', closeError);
        }
    }
    _db = null;
    dbPromise = null;
};

const callDbMethod = async (db, method, sql, params = []) => {
    if (!params || params.length === 0) {
        return await db[method](sql);
    }
    return await db[method](sql, params);
};

const withDbRetry = async (operation) => {
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        const db = await initDatabase();

        try {
            return await operation(db);
        } catch (error) {
            lastError = error;

            if (!shouldRecoverDatabase(error) || attempt === 2) {
                throw error;
            }

            console.warn(`Recovering from stale SQLite connection (attempt ${attempt + 1}/2)...`);
            await resetDbConnection();
        }
    }

    throw lastError;
};

const execDb = async (sql) => withDbRetry((db) => db.execAsync(sql));
const runDb = async (sql, params = []) => withDbRetry((db) => callDbMethod(db, 'runAsync', sql, params));
const getFirstDb = async (sql, params = []) => withDbRetry((db) => callDbMethod(db, 'getFirstAsync', sql, params));
const getAllDb = async (sql, params = []) => withDbRetry((db) => callDbMethod(db, 'getAllAsync', sql, params));

const getDb = async () => {
    if (!_db) {
        await initDatabase();
    }
    if (!_db) {
        throw new Error('Database is not available. Please restart the app and try again.');
    }
    return _db;
};

export const initDatabase = async () => {
    if (_db) return _db;
    if (dbPromise) {
        await dbPromise;
        if (!_db) {
            throw new Error('Database initialization failed.');
        }
        return _db;
    }

    dbPromise = (async () => {
        const db = await SQLite.openDatabaseAsync('lesson_plans.db');
        if (!db) {
            throw new Error('Could not open the local database.');
        }

        await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                actual_name TEXT,
                tribe TEXT
            );
            CREATE TABLE IF NOT EXISTS curriculum (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id INTEGER,
                grade TEXT,
                strand TEXT,
                sub_strand TEXT,
                content_standard TEXT,
                indicator_code TEXT,
                indicator_description TEXT,
                exemplars TEXT,
                core_competencies TEXT,
                FOREIGN KEY (subject_id) REFERENCES subjects (id)
            );
            CREATE TABLE IF NOT EXISTS saved_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                week TEXT,
                indicator_code TEXT,
                content TEXT,
                pdf_uri TEXT,
                plan_type TEXT DEFAULT 'Lesson Plan',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);

        try {
            const schema = await db.getAllAsync("SELECT sql FROM sqlite_master WHERE name='curriculum' AND type='table'");
            if (schema && schema[0] && schema[0].sql.toLowerCase().includes('unique') && schema[0].sql.toLowerCase().includes('indicator_code')) {
                console.log("Migrating curriculum table to remove UNIQUE constraint...");
                await db.execAsync(`
                    ALTER TABLE curriculum RENAME TO curriculum_old;
                    CREATE TABLE curriculum (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        subject_id INTEGER,
                        grade TEXT,
                        strand TEXT,
                        sub_strand TEXT,
                        content_standard TEXT,
                        indicator_code TEXT,
                        indicator_description TEXT,
                        exemplars TEXT,
                        core_competencies TEXT,
                        FOREIGN KEY (subject_id) REFERENCES subjects (id)
                    );
                    INSERT INTO curriculum (id, subject_id, grade, strand, sub_strand, content_standard, indicator_code, indicator_description, exemplars, core_competencies)
                    SELECT id, subject_id, grade, strand, sub_strand, content_standard, indicator_code, indicator_description, exemplars, core_competencies FROM curriculum_old;
                    DROP TABLE curriculum_old;
                `);
                console.log("Migration complete.");
            }
            
            // Ensure plan_type exists in saved_plans
            const plansSchema = await db.getAllAsync("PRAGMA table_info(saved_plans)");
            const hasPlanType = plansSchema.some(c => c.name === 'plan_type');
            if (!hasPlanType) {
                console.log("Adding plan_type column to saved_plans...");
                await db.execAsync("ALTER TABLE saved_plans ADD COLUMN plan_type TEXT DEFAULT 'Lesson Plan';");
            }

            // Ensure tribe exists in subjects
            const subjectsSchema = await db.getAllAsync("PRAGMA table_info(subjects)");
            const hasTribe = subjectsSchema.some(c => c.name === 'tribe');
            if (!hasTribe) {
                console.log("Adding tribe column to subjects...");
                await db.execAsync("ALTER TABLE subjects ADD COLUMN tribe TEXT;");
            }

        } catch(e) {
            console.error("Migration or Init check failed", e);
        }

        _db = db;
        return _db;
    })();

    try {
        return await dbPromise;
    } catch (error) {
        _db = null;
        throw error;
    } finally {
        dbPromise = null;
    }
};

export const getTemplateSubjectNames = () => {
    return Object.keys(CURRICULUM_TEMPLATES).sort((a, b) => a.localeCompare(b));
};

export const restoreTemplateSubjects = async (subjectNames = [], force = false) => {
    try {
        const namesToRestore = subjectNames
            .filter((name) => typeof name === 'string' && CURRICULUM_TEMPLATES[name])
            .sort((a, b) => a.localeCompare(b));

        if (namesToRestore.length === 0) {
            return 0;
        }

        const importedVersion = await getSetting('templates_version');
        const currentVersion = '1.1'; // Increment this if you update the CSVs
        let restoredCount = 0;

        console.log("Starting selective template restore...");

        for (const name of namesToRestore) {
            const subject = await getFirstDb('SELECT id FROM subjects WHERE name = ?', [name]);
            let hasData = false;

            if (subject) {
                const count = await getFirstDb('SELECT COUNT(*) as count FROM curriculum WHERE subject_id = ?', [subject.id]);
                hasData = count.count > 0;
            }

            if (!hasData || force || importedVersion !== currentVersion) {
                console.log(`Restoring subject: ${name}`);
                await importCurriculumFromCSV(CURRICULUM_TEMPLATES[name], name);
                restoredCount++;
            }
        }

        await setSetting('templates_version', currentVersion);
        console.log("Selective restore complete.");
        return restoredCount;
    } catch (e) {
        console.error("Selective restore failed:", e);
        throw e;
    }
};

export const autoImportTemplates = async (force = false) => {
    const importedVersion = await getSetting('templates_version');
    const currentVersion = '1.1'; // Increment this if you update the CSVs

    if (!force && importedVersion === currentVersion) {
        console.log("Templates already up to date.");
        return 0;
    }

    console.log("Starting auto-import of templates...");
    return await restoreTemplateSubjects(getTemplateSubjectNames(), force);
};

export const setSetting = async (key, value) => {
    return await runDb('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};

export const getSetting = async (key) => {
    const result = await getFirstDb('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : null;
};

export const deleteSetting = async (key) => {
    return await runDb('DELETE FROM settings WHERE key = ?', [key]);
};

export const getSubjects = async () => {
    return await getAllDb(`
        SELECT s.*, (SELECT COUNT(*) FROM curriculum WHERE subject_id = s.id) as indicator_count 
        FROM subjects s 
        ORDER BY s.name
    `);
};

export const addSubject = async (name) => {
    return await runDb('INSERT OR IGNORE INTO subjects (name) VALUES (?)', [name]);
};

export const importCurriculumFromCSV = async (csvText, subjectName) => {
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: 'greedy',
            delimitersToGuess: [",", ";", "\t", "|"],
            complete: async (results) => {
                try {
                    const cleanHeaders = (row) => {
                        const cleaned = {};
                        Object.keys(row).forEach(key => {
                            const cleanKey = key.replace(/^[^\w]+/, '').trim().toLowerCase().replace(/[\s-]/g, '_');
                            cleaned[cleanKey] = row[key] ? row[key].toString().trim() : '';
                        });
                        return cleaned;
                    };

                    let importCount = 0;
                    let lastGrade = "";
                    let lastStrand = "";
                    let lastSubStrand = "";
                    let lastContentStandard = "";

                    await withDbRetry(async (db) => {
                        await db.withExclusiveTransactionAsync(async (txn) => {
                            await callDbMethod(txn, 'runAsync', 'INSERT OR IGNORE INTO subjects (name) VALUES (?)', [subjectName]);
                            const subject = await callDbMethod(txn, 'getFirstAsync', 'SELECT id FROM subjects WHERE name = ?', [subjectName]);
                            const subjectId = subject?.id;

                            if (!subjectId) {
                                throw new Error(`Subject "${subjectName}" could not be created.`);
                            }

                            await callDbMethod(txn, 'runAsync', 'UPDATE subjects SET actual_name = ? WHERE id = ?', [subjectName, subjectId]);
                            await callDbMethod(txn, 'runAsync', 'DELETE FROM curriculum WHERE subject_id = ?', [subjectId]);

                            for (const rawRow of results.data) {
                                const row = cleanHeaders(rawRow);
                                
                                // Extract current values
                                const currentGrade = (row.grade || row.class || row.level || row.grade_level || '').trim();
                                const currentStrand = (row.strand || row.strands || row.topic || row.topics || '').trim();
                                const currentSubStrand = (row.sub_strand || row.substrand || row.sub_strands || row.substrands || row.sub_topic || row.subtopic || '').trim();
                                const currentContentStandard = (row.content_standard || row.content_standards || row.contentstandard || row.contentstandards || row.standard || row.standards || '').trim();
                                
                                const indicatorCode = (row.indicator_code || row.code || row.indicator || row.indicator_no || row.indicator_number || row.id || row.sn || row.s_n || row.no || row.indicator_id || '').trim();
                                const indicatorDesc = (row.indicator_description || row.description || row.indicator_desc || row.learning_indicator || row.content || row.objective || row.learning_outcome || row.item || '').trim();

                                // Update trackers if these have values
                                if (currentGrade && currentGrade.toLowerCase() !== 'grade' && currentGrade.toLowerCase() !== 'class') lastGrade = currentGrade;
                                if (currentStrand && currentStrand.toLowerCase() !== 'strand' && currentStrand.toLowerCase() !== 'topic' && currentStrand.toLowerCase() !== 'domain') lastStrand = currentStrand;
                                if (currentSubStrand && currentSubStrand.toLowerCase() !== 'sub-strand' && currentSubStrand.toLowerCase() !== 'sub-topic' && currentSubStrand.toLowerCase() !== 'substrand') lastSubStrand = currentSubStrand;
                                if (currentContentStandard && currentContentStandard.toLowerCase() !== 'content standard' && currentContentStandard.toLowerCase() !== 'standard') lastContentStandard = currentContentStandard;

                                // Skip header rows
                                if (currentGrade.toLowerCase() === 'grade' || currentGrade.toLowerCase() === 'class') continue;
                                
                                // IF we have a description but no code, we should still import it!
                                if (!indicatorCode && !indicatorDesc) continue;

                                const finalCode = indicatorCode || `(No Code - ${importCount + 1})`;
                                const finalDesc = indicatorDesc || "(No Description)";

                                // Use trackers for missing values (merged cell handling)
                                const finalGrade = lastGrade;
                                const finalStrand = lastStrand;
                                const finalSubStrand = lastSubStrand;
                                const finalContentStandard = lastContentStandard;

                                if (!finalGrade) continue;

                                await callDbMethod(
                                    txn,
                                    'runAsync',
                                    "INSERT INTO curriculum (subject_id, grade, strand, sub_strand, content_standard, indicator_code, indicator_description, exemplars, core_competencies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                    [
                                        subjectId,
                                        finalGrade,
                                        finalStrand,
                                        finalSubStrand,
                                        finalContentStandard,
                                        finalCode,
                                        finalDesc,
                                        (row.exemplars || row.examplars || row.exemplar || row.examplar || row.examples || row.activity || row.activities || '').trim(),
                                        (row.core_competencies || row.core_competency || row.competencies || row.competency || row.skills || row.competence || '').trim()
                                    ]
                                );
                                importCount++;
                            }
                        });
                    });

                    console.log(`Import successful. Rows: ${importCount}`);
                    resolve(importCount);
                } catch (e) {
                    console.error("Import loop error:", e);
                    reject(e);
                }
            },
            error: (error) => reject(error)
        });
    });
};

export const getAllGrades = async () => {
    return await getAllDb("SELECT DISTINCT TRIM(grade) as grade FROM curriculum WHERE grade IS NOT NULL AND grade != '' ORDER BY grade");
};

export const getSubjectsByGrade = async (grade) => {
    if (!grade) return [];
    const db = await getDb();
    return await db.getAllAsync(`
        SELECT DISTINCT s.* 
        FROM subjects s 
        JOIN curriculum c ON s.id = c.subject_id 
        WHERE TRIM(c.grade) = ? 
        ORDER BY s.name`, [grade.trim()]);
};

export const getGrades = async (subjectId) => {
    if (!subjectId) return [];
    const db = await getDb();
    return await db.getAllAsync('SELECT DISTINCT TRIM(grade) as grade FROM curriculum WHERE subject_id = ? ORDER BY grade', [subjectId]);
};

export const getStrands = async (subjectId, grade) => {
    if (!subjectId || !grade) return [];
    const db = await getDb();
    return await db.getAllAsync('SELECT DISTINCT TRIM(strand) as strand FROM curriculum WHERE subject_id = ? AND TRIM(grade) = ? ORDER BY strand', [subjectId, grade.trim()]);
};

export const getSubStrands = async (subjectId, grade, strand) => {
    if (!subjectId || !grade || !strand) return [];
    const db = await getDb();
    return await db.getAllAsync('SELECT DISTINCT TRIM(sub_strand) as sub_strand FROM curriculum WHERE subject_id = ? AND TRIM(grade) = ? AND TRIM(strand) = ? ORDER BY sub_strand', [subjectId, grade.trim(), strand.trim()]);
};

export const getContentStandards = async (subjectId, grade, strand, subStrand) => {
    if (!subjectId || !grade || !strand || !subStrand) return [];
    const db = await getDb();
    return await db.getAllAsync('SELECT DISTINCT TRIM(content_standard) as content_standard FROM curriculum WHERE subject_id = ? AND TRIM(grade) = ? AND TRIM(strand) = ? AND TRIM(sub_strand) = ? ORDER BY content_standard', [subjectId, grade.trim(), strand.trim(), subStrand.trim()]);
};

export const getIndicators = async (subjectId, grade, strand, subStrand, contentStandard) => {
    if (!subjectId || !grade || !strand || !subStrand || !contentStandard) return [];
    const db = await getDb();
    const results = await db.getAllAsync('SELECT * FROM curriculum WHERE subject_id = ? AND TRIM(grade) = ? AND TRIM(strand) = ? AND TRIM(sub_strand) = ? AND TRIM(content_standard) = ?', [subjectId, grade.trim(), strand.trim(), subStrand.trim(), contentStandard.trim()]);
    
    // Natural sort in JS
    return results.sort((a, b) => {
        return (a.indicator_code || '').localeCompare(b.indicator_code || '', undefined, { numeric: true, sensitivity: 'base' });
    });
};

export const getIndicatorsBySubjectAndGrade = async (subjectId, grade) => {
    if (!subjectId || !grade) return [];
    const db = await getDb();
    const results = await db.getAllAsync('SELECT * FROM curriculum WHERE subject_id = ? AND TRIM(grade) = ?', [subjectId, grade.trim()]);
    
    // Natural sort in JS
    return results.sort((a, b) => {
        return (a.indicator_code || '').localeCompare(b.indicator_code || '', undefined, { numeric: true, sensitivity: 'base' });
    });
};
export const getIndicatorDetails = async (subjectId, indicatorCode) => {
    if (!subjectId || !indicatorCode) return null;
    const db = await getDb();
    const result = await db.getFirstAsync(
        'SELECT * FROM curriculum WHERE subject_id = ? AND TRIM(indicator_code) = TRIM(?)',
        [subjectId, indicatorCode]
    );
    if (result) {
        return {
            ...result,
            content_standard: result.content_standard || result.standard || result.contentstandard || '',
            standard: result.content_standard || result.standard || result.contentstandard || ''
        };
    }
    return null;
};
export const saveLessonPlan = async (plan) => {
    const db = await getDb();
    return await db.runAsync(
        'INSERT INTO saved_plans (date, week, indicator_code, content, pdf_uri, plan_type) VALUES (?, ?, ?, ?, ?, ?)',
        [plan.date, plan.week, plan.indicator_code, plan.content, plan.pdf_uri, plan.plan_type || 'Lesson Plan']
    );
};

export const getSavedPlans = async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM saved_plans ORDER BY created_at DESC');
};

export const deleteSubject = async (subjectId) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM curriculum WHERE subject_id = ?', [subjectId]);
    await db.runAsync('DELETE FROM subjects WHERE id = ?', [subjectId]);
};

export const updateSubjectName = async (subjectId, newName, tribe = null) => {
    const db = await getDb();
    return await db.runAsync('UPDATE subjects SET name = ?, tribe = ? WHERE id = ?', [newName, tribe, subjectId]);
};

export const deleteAllCurricula = async () => {
    const db = await getDb();
    await db.execAsync('DELETE FROM curriculum; DELETE FROM subjects;');
};

export const deleteAllHistory = async () => {
    const db = await getDb();
    await db.execAsync('DELETE FROM saved_plans;');
};

export const factoryReset = async () => {
    const db = await getDb();
    await db.execAsync(`
        DELETE FROM curriculum;
        DELETE FROM subjects;
        DELETE FROM saved_plans;
    `);
};

export const deleteLessonPlan = async (id) => {
    const db = await getDb();
    return await db.runAsync('DELETE FROM saved_plans WHERE id = ?', [id]);
};

export const updateLessonPlan = async (id, plan) => {
    const db = await getDb();
    return await db.runAsync(
        'UPDATE saved_plans SET date = ?, week = ?, indicator_code = ?, content = ?, pdf_uri = ?, plan_type = ? WHERE id = ?',
        [plan.date, plan.week, plan.indicator_code, plan.content, plan.pdf_uri, plan.plan_type || 'Lesson Plan', id]
    );
};

export const getCurriculumBySubject = async (subjectId) => {
    const db = await getDb();
    return await db.getAllAsync(`
        SELECT s.actual_name AS subject, c.id, c.grade, c.strand, c.sub_strand, c.content_standard, 
               c.indicator_code, c.indicator_description, c.exemplars, c.core_competencies 
        FROM curriculum c 
        JOIN subjects s ON c.subject_id = s.id 
        WHERE c.subject_id = ?
    `, [subjectId]);
};

export const deleteCurriculumRow = async (id) => {
    const db = await getDb();
    return await db.runAsync('DELETE FROM curriculum WHERE id = ?', [id]);
};

export const updateCurriculumRow = async (id, data) => {
    const db = await getDb();
    const sql = `
        UPDATE curriculum 
        SET grade = ?, strand = ?, sub_strand = ?, content_standard = ?, 
            indicator_code = ?, indicator_description = ?, exemplars = ?, core_competencies = ?
        WHERE id = ?
    `;
    const params = [
        data.grade, data.strand, data.sub_strand, data.content_standard,
        data.indicator_code, data.indicator_description, data.exemplars, data.core_competencies,
        id
    ];
    return await db.runAsync(sql, params);
};

export const addCurriculumRow = async (subjectId, data) => {
    const db = await getDb();
    const sql = `
        INSERT INTO curriculum 
        (subject_id, grade, strand, sub_strand, content_standard, indicator_code, indicator_description, exemplars, core_competencies) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        subjectId, data.grade, data.strand, data.sub_strand, data.content_standard,
        data.indicator_code, data.indicator_description, data.exemplars, data.core_competencies
    ];
    return await db.runAsync(sql, params);
};
