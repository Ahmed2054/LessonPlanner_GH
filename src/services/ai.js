import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_API_KEY = 'sk-4397c4e3ac554d729e3ab9b1af493731';

const getHeaders = (apiKey) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey?.trim() || DEFAULT_API_KEY}`
});

const getTribeContext = (tribe) => {
    return tribe ? `\n\nCULTURAL CONTEXT: This lesson is for the "${tribe}" ethnic group/language. Ensure all examples, cultural references, and linguistic nuances specifically reflect "${tribe}" culture and traditions accurately.` : '';
};

const cleanJsonString = (str) => {
    if (!str) return '';
    let clean = str.trim();
    
    // 0. Remove reasoning tags if present (for deepseek-reasoner)
    clean = clean.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // 1. Attempt to extract JSON from markdown code blocks
    const codeBlockMatch = clean.match(/```json\s?([\s\S]*?)```/) || clean.match(/```([\s\S]*?)```/);
    if (codeBlockMatch) {
        clean = codeBlockMatch[1].trim();
    } else {
        // 2. Fallback: find the first '{' and last '}'
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            clean = clean.substring(firstBrace, lastBrace + 1).trim();
        }
    }
    
    // 3. Fix unescaped newlines inside JSON string values
    // This regex finds content between " " and replaces literal newlines with spaces
    // to prevent JSON.parse from failing on multiline strings.
    try {
        clean = clean.replace(/"([^"]*)"/g, (match, contents) => {
            return '"' + contents.replace(/\n/g, '\\n').replace(/\r/g, '') + '"';
        });
    } catch (e) {
        console.warn("JSON pre-processing failed:", e);
    }
    
    // 4. Final sanitization: remove potential trailing junk text
    if (clean.endsWith('}') === false && clean.includes('}')) {
        clean = clean.substring(0, clean.lastIndexOf('}') + 1);
    }
    
    return clean;
};

export const testConnection = async (apiKey) => {
    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: "deepseek-chat",
                messages: [
                    { role: "user", content: "hi" }
                ],
                max_tokens: 1
            },
            {
                headers: getHeaders(apiKey),
                timeout: 10000
            }
        );
        return response.status === 200;
    } catch (error) {
        console.error("Test Connection Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message || "Connection failed");
    }
};

export const generateLessonPlan = async (apiKey, data, signal, model = 'deepseek-chat') => {
    const prompt = `
        Prepare a professional, concise lesson plan following this EXACT header structure and a table for the activities. 
        STRICT CONSTRAINT: The entire generated content must fit comfortably on a maximum of two (2) A4 pages when printed. Avoid repetition and be direct.
        
        HEADER DETAILS:
        Date: ${data.date}
        Week: ${data.week}
        Subject: ${data.subject_name}
        Duration: ${data.duration}
        Strand: ${data.strand}
        Class: ${data.grade}
        Class Size: ${data.class_size}
        Sub Strand: ${data.sub_strand}
        Content Standard: ${data.content_standard}
        Indicator: ${data.indicator_code}: ${data.indicator_description}
        Lesson: [Insert Lesson Number/Title]
        Performance Indicator: [Provide specific performance indicator based on ${data.indicator_description}]
        Core Competencies: ${data.core_competencies}
        Keywords: [Identify 3-5 keywords]

        ACTIVITY TABLE:
        Generate a 3-column table with the following headers:
        1. Phase/Duration
        2. Learners Activities (Following exemplars: ${data.exemplars}. MUST BE BRIEF AND CONCISE. Use HTML formatting for clarity: <b>bold</b>, <i>italic</i>, <ul><li>bullet points</li></ul>, <ol><li>numbered lists</li></ol>.)
        3. Resources (List specific tools/materials using HTML formatting)

        PHASES TO INCLUDE IN TABLE:
        - PHASE 1: STARTER. Focus strictly on brief activities to either review learners' previous knowledge or prepare the learners' brain for the lesson. ***STRICT REQUIREMENT: MUST BE EXTREMELY BRIEF (MAXIMUM 3 BULLET POINTS, MINIMAL WORDING)***. Avoid long explanations.
        - PHASE 2: NEW LEARNING. Core teaching activities presented as a well-standardized, professional, and chronological presentation. GROUP the presentation into distinct activities (e.g., <b>Activity 1</b>, <b>Activity 2</b>, <b>Activity 3</b>). Within each activity, briefly define, list, state, or provide examples so any teacher can understand and deliver the lesson professionally. Avoid excessive wording and unnecessary filler. End this phase with exactly three (3) specific questions for the learners, titled '<b>Questions</b>'.
        - PHASE 3: REFLECTION. Summarize and consolidate the lesson. ***MUST BE EXTREMELY BRIEF AND CONCISE (Maximum 2-3 bullet points)***.
        
        DURATION CONSTRAINT:
        The total duration is ${data.duration}. Calculate and allocate the time for each phase proportionally so they sum up to ${data.duration} (Example: ~15% for Starter, ~70% for New Learning, ~15% for Reflection). Use clear duration strings like '10 mins' or '5 mins' in the JSON output.

        - Core Competencies: Show ONLY the acronyms/abbreviations (e.g., CC, CI, PLW) and NOT the full meanings. Keep this extremely brief.
        - Lesson: Describe the actual lesson topic/name but DO NOT include any lesson numbers (e.g., omit 'Lesson 1', 'Lesson 2').

        IMPORTANT: DO NOT include the phase name (e.g., 'PHASE 1', 'Starter', 'New Learning') inside the "activities" or "resources" fields. These will be added by the UI automatically.

        Return the result as a raw JSON object (with no Markdown formatting) with the following structure:
        {
            "header": { 
                "date": "...", 
                "week": "${data.week}", 
                "subject": "${data.subject_name}", // CRITICAL: Use "${data.subject_name}" EXACTLY. Do NOT change it.
                "duration": "...", 
                "strand": "${data.strand}", 
                "class": "${data.grade}", 
                "classSize": "${data.class_size}", 
                "subStrand": "${data.sub_strand}", 
                "contentStandard": "${data.content_standard || 'N/A'}", // MANDATORY: Use ${data.content_standard} exactly.
                "indicator": "${data.indicator_code}: ${data.indicator_description}", 
                "lesson": "...", // Describe the lesson topic clearly but DO NOT include lesson numbers like 'Lesson 1'.
                "performanceIndicator": "...", 
                "coreCompetencies": "${data.core_competencies}", 
                "keywords": "..." 
            },
            "phases": [
                { "name": "PHASE 1: STARTER", "duration": "[Calculate duration strings, e.g., '10 mins']", "activities": "...", "resources": "..." },
                { "name": "PHASE 2: NEW LEARNING", "duration": "[Calculate duration strings, e.g., '40 mins']", "activities": "...", "resources": "..." },
                { "name": "PHASE 3: REFLECTION", "duration": "[Calculate duration strings, e.g., '10 mins']", "activities": "...", "resources": "..." }
            ]
        }
        ${getTribeContext(data.tribe)}
    `;

    try {
        const isChat = model === 'deepseek-chat';
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: model,
                messages: [
                    { role: "system", content: "You are a professional teacher assistant. Always output a valid JSON object. Do not include any text before or after the JSON. Ensure no newlines exist inside JSON string values; use space or \\n instead." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 4000,
                ...(isChat ? { response_format: { type: 'json_object' }, temperature: 0.7 } : {})
            },
            {
                headers: getHeaders(apiKey),
                timeout: 60000,
                signal: signal
            }
        );

        return cleanJsonString(response.data.choices[0].message.content);
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Generation cancelled");
        }
        console.error("DeepSeek API Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to generate lesson plan");
    }
};

export const regeneratePhase = async (apiKey, data, phaseName, signal, model = 'deepseek-chat') => {
    const prompt = `
        As a professional teacher assistant, regenerate ONLY the activities and resources for the following phase of a lesson plan:
        Phase: ${phaseName}
        
        CONTEXT:
        Subject: ${data.subject_name}
        Grade: ${data.grade}
        Indicator: ${data.indicator_code}: ${data.indicator_description}
        Content Standard: ${data.content_standard}
        Exemplars: ${data.exemplars}
        Core Competencies: ${data.core_competencies}

        REQUIREMENTS:
        - Must follow the exemplars provided but remain brief and direct.
        - Use HTML formatting for clarity: <b>bold</b>, <i>italic</i>, <ul><li>bullet points</li></ul>.
        - DO NOT include the phase name (e.g., 'PHASE 1', 'Starter') inside the activities or resources field.
        - The activities should correspond strictly to the phase's standard purpose (Starter, New Learning, or Reflection).
        - If it is 'PHASE 1: STARTER', focus strictly on brief activities to either review learners' previous knowledge or prepare the learners' brain for the lesson. It MUST be extremely brief with minimal wording (Maximum 3 bullet points).
        - If it is 'PHASE 2: NEW LEARNING', it MUST be a well-standardized, professional, and chronological presentation. GROUP it into distinct activities (e.g., <b>Activity 1</b>, <b>Activity 2</b>, etc.). Within each activity, briefly define, list, state, or provide examples where necessary so the lesson is easy to follow. End with '<b>Questions</b>' and 3 specific questions for learners.
        
        Return the result as a raw JSON object (with no Markdown formatting) with this structure:
        {
            "activities": "...",
            "resources": "..."
        }
        ${getTribeContext(data.tribe)}
    `;

    try {
        const isChat = model === 'deepseek-chat';
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: model,
                messages: [
                    { role: "system", content: "You are a professional teacher assistant. Always output a valid JSON object. Do not include any text before or after the JSON." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 2000,
                ...(isChat ? { response_format: { type: 'json_object' }, temperature: 0.8 } : {})
            },
            {
                headers: getHeaders(apiKey),
                timeout: 60000,
                signal: signal
            }
        );

        return cleanJsonString(response.data.choices[0].message.content);
    } catch (error) {
        if (axios.isCancel(error)) {
            throw new Error("Regeneration cancelled");
        }
        console.error("Regenerate Phase Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to regenerate phase");
    }
};

export const generateNote = async (apiKey, data, signal, model = 'deepseek-chat') => {
    const prompt = `
        Prepare a comprehensive, well-structured lesson note for a teacher.
        
        HEADER DETAILS:
        Date: ${data.date}
        Week: ${data.week}
        Subject: ${data.subject_name}
        Duration: ${data.duration}
        Class: ${data.grade}
        Strand: ${data.strand}
        Sub Strand: ${data.sub_strand}
        Indicator: ${data.indicator_code}: ${data.indicator_description}
        Content Standard: ${data.content_standard}
        Core Competencies: ${data.core_competencies}

        REQUIREMENTS:
        - The note MUST comprehensively cover the topic based on the Indicator and provided Exemplars (${data.exemplars}).
        - Use HTML formatting for clarity: <b>bold</b>, <i>italic</i>, <ul><li>bullet points</li></ul>, <ol><li>numbered lists</li></ol>, and <p>paragraphs</p>.
        - Do not include the phase tables. Simply write the complete note content.
        - Ensure definitions, examples, and detailed explanations are provided.

        Return the result as a raw JSON object (no Markdown formatting) with this exact structure:
        {
            "type": "Note",
            "header": { 
                "date": "...", "week": "${data.week}", "subject": "${data.subject_name}", 
                "duration": "${data.duration}", "strand": "${data.strand}", "class": "${data.grade}", 
                "classSize": "${data.class_size}", "subStrand": "${data.sub_strand}", 
                "contentStandard": "${data.content_standard || 'N/A'}", 
                "indicator": "${data.indicator_code}: ${data.indicator_description}", 
                "lesson": "...", "performanceIndicator": "...", 
                "coreCompetencies": "${data.core_competencies}", "keywords": "..." 
            },
            "noteContent": "..."
        }
        ${getTribeContext(data.tribe)}
    `;

    try {
        const isChat = model === 'deepseek-chat';
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: model,
                messages: [
                    { role: "system", content: "You are a professional teacher assistant. Always output a valid JSON object as requested. Do not include any text before or after the JSON. Ensure no newlines exist inside JSON string values; use space or \\n instead." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 6000,
                ...(isChat ? { response_format: { type: 'json_object' }, temperature: 0.7 } : {})
            },
            {
                headers: getHeaders(apiKey),
                timeout: 120000,
                signal: signal
            }
        );
        return cleanJsonString(response.data.choices[0].message.content);
    } catch (error) {
        if (axios.isCancel(error)) throw new Error("Generation cancelled");
        console.error("Generate Note Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to generate note");
    }
};

export const generateQuestions = async (apiKey, data, questionConfig, signal, model = 'deepseek-chat') => {
    const types = questionConfig.types || ['Multiple Choice'];
    const count = questionConfig.count || '5';
    const typeStr = types.join(' and ');
    
    const prompt = `
        Prepare an assessment for this topic.
        
        HEADER DETAILS:
        Date: ${data.date}
        Week: ${data.week}
        Subject: ${data.subject_name}
        Duration: ${data.duration}
        Class: ${data.grade}
        Strand: ${data.strand}
        Indicator: ${data.indicator_code}: ${data.indicator_description}

        REQUIREMENTS:
        - Generate exactly ${count} questions covering the topic indicator.
        - Ensure the questions encompass the following types: ${typeStr}.
        - Format the questions beautifully using HTML (e.g., <ol><li> for list of questions, <b> for emphasis).
        - Format the answers beautifully using HTML in a completely separate section.
        - Do NOT include markdown code blocks around your JSON. Return purely valid JSON data.

        Return the result as a raw JSON object with this exact structure:
        {
            "type": "Questions",
            "header": { 
                "date": "...", "week": "${data.week}", "subject": "${data.subject_name}", 
                "duration": "${data.duration}", "strand": "${data.strand}", "class": "${data.grade}", 
                "classSize": "${data.class_size}", "subStrand": "${data.sub_strand}", 
                "contentStandard": "${data.content_standard || 'N/A'}", 
                "indicator": "${data.indicator_code}: ${data.indicator_description}", 
                "lesson": "...", "performanceIndicator": "...", 
                "coreCompetencies": "${data.core_competencies}", "keywords": "..." 
            },
            "questionsContent": "<ol><li>...</li></ol>",
            "answersContent": "<ol><li>...</li></ol>"
        }
        ${getTribeContext(data.tribe)}
    `;

    try {
        const isChat = model === 'deepseek-chat';
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: model,
                messages: [
                    { role: "system", content: "You are an expert assessment creator. Always output a valid JSON object as requested. Do not include any text before or after the JSON. Ensure no newlines exist inside JSON string values; use space or \\n instead." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 5000,
                ...(isChat ? { response_format: { type: 'json_object' }, temperature: 0.7 } : {})
            },
            {
                headers: getHeaders(apiKey),
                timeout: 90000,
                signal: signal
            }
        );
        return cleanJsonString(response.data.choices[0].message.content);
    } catch (error) {
        if (axios.isCancel(error)) throw new Error("Generation cancelled");
        console.error("Generate Questions Error:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message || "Failed to generate questions");
    }
};
