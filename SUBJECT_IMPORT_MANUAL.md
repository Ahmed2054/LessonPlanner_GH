# Subject Curriculum Import Manual

This guide explains how to manage and import subject curriculum data for the Lesson Planner app.

## 1. Automatic Bundled Subjects
The app comes with several pre-loaded subjects located in the `templates/` folder. These are automatically imported into the app upon first installation.

### Current Bundled Subjects:
- JHS Career Technology
- JHS Computing
- JHS Creative Arts Design
- JHS English Language
- JHS Ghanaian Language
- JHS Mathematics
- JHS Religious Moral Education
- JHS Science
- JHS Social Studies

### How to update Bundled Subjects:
1.  Add or replace CSV files in the `templates/` folder at the root of the project.
2.  **Naming Rule**: The filename of the CSV (e.g., `New Subject.csv`) will be the name displayed on the subject card in the app.
3.  Run the generation script from your terminal:
    ```bash
    node generate_templates.js
    ```
4.  This updates `src/data/templates.js` with the new data.
5.  To trigger a re-import on existing installations, increment the `currentVersion` constant in `src/services/database.js` (e.g., change `'1.0'` to `'1.1'`).

---

## 2. In-App Manual Import
Users can also import their own CSV files directly through the app UI.

### Procedure:
1.  Go to the **Curriculum** tab.
2.  Tap the **+ Import CSV** button.
3.  Enter the **Subject Name** (this is what will appear on the card).
4.  Tap **Select CSV File** and choose your file.
5.  Tap **Complete Import**.

---

## 3. CSV File Requirements
For a successful import, your CSV must follow this structure:

### Required Headers (in any order):
The importer is flexible and looks for these keywords in your headers:
- `subject` (optional, used for internal identification)
- `grade` (also accepts: `class`, `level`)
- `strand` (also accepts: `topic`, `domain`)
- `sub_strand` (also accepts: `substrand`, `sub_topic`)
- `content_standard` (also accepts: `standard`)
- `indicator_code` (also accepts: `code`, `id`, `sn`)
- `indicator_description` (also accepts: `description`, `objective`)
- `exemplars` (also accepts: `activity`, `examples`)
- `core_competencies` (also accepts: `competencies`, `skills`)

### Critical Formatting Rules:
- **Merged Cells**: If a Grade or Strand spans multiple rows in Excel, export it as a CSV where the first row has the label and subsequent rows are empty. The importer will automatically "fill down" the values.
- **Header Rows**: The importer ignores rows where the content matches typical header names (e.g., a row that says "Grade" in the grade column).
- **Empty Rows**: Completely empty rows are skipped.

---

## 4. Subject Management
- **Edit**: Swipe a subject card to the left to see the **Edit** (pencil) icon. You can rename the subject or add a **Tribe/Ethnic Group** context (especially useful for Ghanaian Language).
- **Export**: Use the **Share** icon in the swipe menu to export any subject's curriculum back to a CSV file.
- **Delete**: Use the **Trash** icon to remove a specific subject, or use **CLEAR ALL** at the top to wipe all curriculum data.
