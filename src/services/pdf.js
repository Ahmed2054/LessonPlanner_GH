import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FileSystem from 'expo-file-system/legacy';

const cleanMarkdown = (text) => {
    if (!text) return '';
    // Order matters: __ before _, ** before *
    let cleaned = text
        .replace(/\*\*([\s\S]*?)\*\*/g, '<b>$1</b>')           // **bold**
        .replace(/__([\s\S]*?)__/g, '<u>$1</u>')                // __underline__
        .replace(/_([\s\S]*?)_/g, '<i>$1</i>')                  // _italic_
        .replace(/^• (.+)$/gm, '<li>$1</li>')                   // • bullet lines → <li>
        .replace(/^[\s]*[-*][\s]+(.*)/gm, '<li>$1</li>')        // - or * bullets → <li>
        .replace(/\n/g, '<br/>');                                // newlines
    return cleaned;
};

const formatDatePDF = (dateStr) => {
    if (!dateStr) return '';
    try {
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
};

const getTitleStr = (data) => (
    data.type === 'Note' || data.plan_type === 'Note' ? 'LESSON NOTE' :
    data.type === 'Questions' || data.plan_type === 'Questions' ? 'ASSESSMENT QUESTIONS' :
    'LESSON PLAN RECORD'
);

const buildBodyContent = (data) => {
    if (data.type === 'Note' || data.plan_type === 'Note' || data.noteContent) {
        return `
            <div style="margin-top: 15px; font-size: 11pt; line-height: 1.6; padding-left: 5px; padding-right: 5px;">
                ${cleanMarkdown(data.noteContent)}
            </div>
        `;
    }

    if (data.type === 'Questions' || data.plan_type === 'Questions' || data.questionsContent) {
        return `
            <div style="margin-top: 15px; font-size: 11pt; line-height: 1.6; padding-left: 5px; padding-right: 5px;">
                <h3 style="margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Questions</h3>
                ${cleanMarkdown(data.questionsContent)}
                <h3 style="margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Answers</h3>
                ${cleanMarkdown(data.answersContent)}
            </div>
        `;
    }

    return `
        <table style="margin-top: 15px;">
            <thead>
                <tr>
                    <th style="width: 15%;">PHASE</th>
                    <th style="width: 65%;">LEARNING ACTIVITIES</th>
                    <th style="width: 20%;">RESOURCES</th>
                </tr>
            </thead>
            <tbody>
                ${(data.phases || []).map((p) => `
                    <tr>
                        <td><span class="phase-title">${p.name || p.phase}</span><br/>(${p.duration})</td>
                        <td>${cleanMarkdown(p.activities)}</td>
                        <td class="resources-cell">${cleanMarkdown(p.resources)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

const buildPlanSectionHtml = (data) => {
    const header = data.header || {};
    const titleStr = getTitleStr(data);
    const bodyContent = buildBodyContent(data);

    return `
        <section class="plan-section">
            <div class="main-container">
                <div class="main-title">${titleStr}</div>
                
                <div class="header-grid">
                    <div class="header-item" style="grid-column: span 7;"><span class="header-label">Date:</span> <span class="header-value">${formatDatePDF(header.date)}</span></div>
                    <div class="header-item" style="grid-column: span 6;"><span class="header-label">Week:</span> <span class="header-value">${header.week || 'N/A'}</span></div>
                    <div class="header-item" style="grid-column: span 7;"><span class="header-label">Duration:</span> <span class="header-value">${header.duration || 'N/A'}</span></div>

                    <div class="header-item" style="grid-column: span 7;"><span class="header-label">Subject:</span> <span class="header-value">${header.subject || 'N/A'}</span></div>
                    <div class="header-item" style="grid-column: span 6;"><span class="header-label">Class:</span> <span class="header-value">${header.class || 'N/A'}</span></div>
                    <div class="header-item" style="grid-column: span 7;"><span class="header-label">Class Size:</span> <span class="header-value">${header.classSize || header.class_size || 'N/A'}</span></div>

                    <div class="header-item" style="grid-column: span 10;"><span class="header-label">Strand:</span> <span class="header-value">${header.strand || 'N/A'}</span></div>
                    <div class="header-item" style="grid-column: span 10;"><span class="header-label">Sub Strand:</span> <span class="header-value">${header.subStrand || header.sub_strand || 'N/A'}</span></div>
                    
                    <div class="header-full"><span class="header-label">Content Standard:</span> <span class="header-value">${header.contentStandard || header.content_standard || 'N/A'}</span></div>
                    
                    <div class="header-split-60 header-stacked"><div class="header-label">Indicator:</div><div class="header-value">${header.indicator || 'N/A'}</div></div>
                    <div class="header-split-40 header-stacked"><div class="header-label">Lesson:</div><div class="header-value">${header.lesson || 'N/A'}</div></div>
                    
                    <div class="header-split-70 header-stacked"><div class="header-label">Performance Indicator:</div><div class="header-value">${header.performanceIndicator || header.performance_indicator || 'N/A'}</div></div>
                    <div class="header-split-30 header-stacked"><div class="header-label">Core Competencies:</div><div class="header-value">${header.coreCompetencies || header.core_competencies || 'N/A'}</div></div>
                    <div class="header-full"><span class="header-label">Keywords:</span> <span class="header-value">${header.keywords || 'N/A'}</span></div>
                </div>

                ${bodyContent}
            </div>
        </section>
    `;
};

const buildPdfHtml = (plans) => {
    const sections = plans.map(buildPlanSectionHtml).join('');

    return `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    * { 
                        box-sizing: border-box; 
                        -webkit-print-color-adjust: exact; 
                    }
                    html, body { 
                        margin: 0; 
                        padding: 0; 
                        width: 210mm;
                        height: 100%;
                        background-color: #fff;
                    }
                    @media print {
                        body { width: 210mm; }
                    }
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        line-height: 1.5; 
                        color: #000; 
                        font-size: 10pt; 
                    }
                    .main-container {
                        width: 100%;
                        max-width: 210mm;
                        margin: 0;
                        padding: 10mm;
                    }
                    .plan-section {
                        page-break-after: always;
                    }
                    .plan-section:last-child {
                        page-break-after: auto;
                    }
                    .header-grid { 
                        display: grid;
                        grid-template-columns: repeat(20, 1fr);
                        border-top: 1px solid #000;
                        border-left: 1px solid #000;
                        margin-bottom: 0;
                        width: 100%;
                    }
                    .header-item { 
                        grid-column: span 10;
                        border-right: 1px solid #000;
                        border-bottom: 1px solid #000;
                        padding: 4px 6px; 
                        display: flex;
                        align-items: flex-start;
                        min-height: 28px;
                    }
                    .header-full { 
                        grid-column: span 20;
                        border-right: 1px solid #000;
                        border-bottom: 1px solid #000;
                        padding: 4px 6px; 
                        display: flex;
                        flex-direction: row;
                        align-items: flex-start;
                        min-height: 28px;
                    }
                    .header-split-60 {
                        grid-column: span 12;
                        border-right: 1px solid #000;
                        border-bottom: 1px solid #000;
                        padding: 4px 6px; 
                        display: flex;
                        align-items: flex-start;
                    }
                    .header-split-40 {
                        grid-column: span 8;
                        border-right: 1px solid #000;
                        border-bottom: 1px solid #000;
                        padding: 4px 6px; 
                        display: flex;
                        align-items: flex-start;
                    }
                    .header-split-70 {
                        grid-column: span 14;
                        border-right: 1px solid #000;
                        border-bottom: 1px solid #000;
                        padding: 4px 6px; 
                        display: flex;
                        align-items: flex-start;
                    }
                    .header-split-30 {
                        grid-column: span 6;
                        border-right: 1px solid #000;
                        border-bottom: 1px solid #000;
                        padding: 4px 6px; 
                        display: flex;
                        align-items: flex-start;
                    }
                    .header-label { 
                        font-weight: bold; 
                        margin-right: 8px; 
                        font-size: 8.2pt; 
                        text-transform: uppercase; 
                        flex-shrink: 0;
                        line-height: 1.5;
                        margin-top: 1px;
                    }
                    .header-value { 
                        flex: 1; 
                        font-size: 9.5pt;
                        line-height: 1.5;
                        word-wrap: break-word;
                    }
                    .header-stacked {
                        display: block !important;
                    }
                    .header-stacked .header-label {
                        display: block;
                        margin-bottom: 2px;
                        width: 100%;
                        flex-shrink: unset;
                    }
                    .header-stacked .header-value {
                        display: block;
                        width: 100%;
                        flex: unset;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        table-layout: fixed; 
                        border: 1px solid #000;
                    }
                    th { 
                        background-color: #f2f2f2; 
                        border: 1px solid #000; 
                        padding: 5px; 
                        text-align: left; 
                        font-size: 9pt; 
                        text-transform: uppercase; 
                    }
                    td { 
                        border: 1px solid #000; 
                        padding: 5px 5px 5px 8px; 
                        vertical-align: top; 
                        font-size: 9.5pt; 
                        word-wrap: break-word; 
                        line-height: 1.5;
                    }
                    td.resources-cell {
                        padding: 3px 2px 3px 4px !important;
                    }
                    .resources-cell ul, .resources-cell ol {
                        padding-left: 15px;
                        margin: 0;
                    }
                    .phase-title { font-weight: bold; }
                    .main-title { text-align: center; font-size: 14pt; margin-bottom: 10mm; font-weight: bold; }
                    .activities-list { margin: 0; padding-left: 15px; }
                    .activities-list li { margin-bottom: 0px; line-height: 1.25; }
                    td p { margin: 2px 0; padding: 0; }
                    td ul, td ol { margin: 4px 0; }
                </style>
            </head>
            <body>
                ${sections}
            </body>
        </html>
    `;
};

const printHtmlToPdf = async (html) => {
    const { uri } = await Print.printToFileAsync({
        html,
        base64: false
    });
    return uri;
};

export const generatePDFFromPlan = async (planJson) => {
    const data = JSON.parse(planJson);
    const html = buildPdfHtml([data]);
    return printHtmlToPdf(html);
};

export const generatePDFFromPlans = async (planJsonList = []) => {
    if (!Array.isArray(planJsonList) || planJsonList.length === 0) {
        throw new Error('Select at least one saved lesson plan to export.');
    }

    const plans = planJsonList.map((planJson) => JSON.parse(planJson));
    const html = buildPdfHtml(plans);
    return printHtmlToPdf(html);
};

export const sharePDF = async (uri, fileNameBase = "LessonPlan") => {
    try {
        const safeName = fileNameBase.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
        const newUri = FileSystem.cacheDirectory + `${safeName}.pdf`;
        await FileSystem.copyAsync({ from: uri, to: newUri });

        await Sharing.shareAsync(newUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Lesson Plan',
            UTI: 'com.adobe.pdf'
        });
    } catch (e) {
        console.error("Sharing error", e);
        await Sharing.shareAsync(uri);
    }
};

export const openPDF = async (uri, fileNameBase = "LessonPlan") => {
    try {
        const safeName = fileNameBase.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
        const newUri = FileSystem.cacheDirectory + `${safeName}.pdf`;

        // Ensure destination is clean
        const info = await FileSystem.getInfoAsync(newUri);
        if (info.exists) {
            await FileSystem.deleteAsync(newUri);
        }

        await FileSystem.copyAsync({ from: uri, to: newUri });

        if (Platform.OS === 'android') {
            const contentUri = await FileSystem.getContentUriAsync(newUri);
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: contentUri,
                flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                type: 'application/pdf',
            });
        } else {
            // iOS handles PDF open/preview perfectly with shareAsync
            await Sharing.shareAsync(newUri, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf'
            });
        }
    } catch (e) {
        console.error("Open PDF error", e);
        // Fallback to basic sharing if specialized opening fails
        await sharePDF(uri, fileNameBase);
    }
};

// ─── Download-folder preference cache ──────────────────────────────────────
const PREFS_FILE = FileSystem.documentDirectory + '.app_prefs.json';

const _loadPrefs = async () => {
    try {
        const info = await FileSystem.getInfoAsync(PREFS_FILE);
        if (!info.exists) return {};
        return JSON.parse(await FileSystem.readAsStringAsync(PREFS_FILE));
    } catch { return {}; }
};

const _savePrefs = async (update) => {
    try {
        const current = await _loadPrefs();
        await FileSystem.writeAsStringAsync(PREFS_FILE, JSON.stringify({ ...current, ...update }));
    } catch {}
};

const _writeToDir = async (directoryUri, uri, fileName, mimeType) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const destUri = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, fileName, mimeType);
    await FileSystem.writeAsStringAsync(destUri, base64, { encoding: FileSystem.EncodingType.Base64 });
};

/**
 * downloadFile
 * ─────────────────────────────────────────────────────────────────────────────
 * Android: saves directly to the cached download folder URI (silent).
 *   • First run  → prompts the user to pick their Downloads folder once,
 *                  stores the URI, and downloads immediately.
 *   • Every subsequent run → uses stored URI, no dialog, instant download.
 *   • If stored permission expires → clears cache, re-prompts once.
 * iOS: uses the system share sheet (standard iOS behaviour).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const downloadFile = async (uri, fileName, mimeType) => {
    try {
        if (Platform.OS === 'android') {
            const prefs = await _loadPrefs();

            // ── Try the cached directory URI (no dialog) ─────────────────────
            if (prefs.downloadDirUri) {
                try {
                    await _writeToDir(prefs.downloadDirUri, uri, fileName, mimeType);
                    Alert.alert('✓ Downloaded', `"${fileName}" has been saved to your Downloads folder.`);
                    return;
                } catch {
                    // Permission likely revoked — clear it and fall through to re-prompt
                    await _savePrefs({ downloadDirUri: null });
                }
            }

            // ── First time (or after permission revoke): pick folder once ────
            Alert.alert(
                'Select Downloads Folder',
                'Please select the folder where files should be saved.\n\nYou will only be asked this once — future downloads will be instant.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Choose Folder',
                        onPress: async () => {
                            try {
                                const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                                if (result.granted) {
                                    // Cache the URI for all future downloads
                                    await _savePrefs({ downloadDirUri: result.directoryUri });
                                    await _writeToDir(result.directoryUri, uri, fileName, mimeType);
                                    Alert.alert('✓ Downloaded', `"${fileName}" saved. Future downloads will be instant.`);
                                }
                            } catch (e) {
                                Alert.alert('Error', 'Could not save file. Please try again.');
                            }
                        },
                    },
                ]
            );
        } else {
            // iOS — standard share / save sheet
            await Sharing.shareAsync(uri);
        }
    } catch (e) {
        console.error('Download error', e);
        await Sharing.shareAsync(uri);
    }
};
