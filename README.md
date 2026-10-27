# AgileLMS - Learning Management System & Study Material Hub

A modern, fast, and responsive Learning Management System (LMS) designed for academic institutions, educators, and students. Features a full study material repository, note uploading, document previewing, multi-subject filtering, and search.

---

## 🌟 Key Features

1. **Upload Notes & Study Material**:
   - Drag-and-drop or file picker upload zone with real-time file size & type detection.
   - Attach metadata: Title, Course / Subject, Module / Chapter, Tags, Description, and Uploader name.
   - Supports PDF, Markdown (`.md`), Word documents (`.docx`), Source Code files, Plain Text, Slides (`.pptx`), and Archives (`.zip`).
   - Real-time progress bar feedback during upload.

2. **In-App Document Preview**:
   - Instant in-browser viewer for Markdown notes, plain text, source code files, and PDFs.
   - One-click copy-to-clipboard for quick study review.

3. **Multi-Criteria Search & Filtering**:
   - Instant search across note titles, descriptions, tags, and chapter modules.
   - Interactive category pills (Computer Science, Software Engineering, AI, Mathematics).
   - Course-specific dropdown filter and dynamic sorting (Newest, Most Downloaded, Title A-Z, File Size).
   - Clickable `#tags` to filter matching study materials instantly.

4. **Repository Analytics & Metrics**:
   - Live counters for total study materials, active courses, total downloads, and storage footprint.
   - Per-course material counters and breakdown.

5. **Grid & List Table Views**:
   - Toggle between visual card grids and compact table views with one click.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Python 3 (FastAPI, Uvicorn, Python-Multipart)
- **Database**: SQLite3 (`lms.db` with indexed courses and study materials tables)
- **Frontend**: Clean Vanilla JavaScript (ES6+), HTML5, and Modern CSS3 (Glassmorphism design system, dark mode, responsive layout)
- **File Storage**: Local filesystem storage in `uploads/` with UUID-prefixed collision-safe naming.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Python installed:
```bash
python --version
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python app.py
```

The application will start at:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/courses` | List all available courses & note counts |
| `POST` | `/api/courses` | Create a new course |
| `GET` | `/api/notes` | Search, filter, and sort study materials |
| `POST` | `/api/notes/upload` | Multipart file upload with metadata |
| `GET` | `/api/notes/{id}` | Get note details |
| `GET` | `/api/notes/{id}/download` | Download file & increment download metric |
| `GET` | `/api/notes/{id}/preview` | In-app document preview payload |
| `DELETE` | `/api/notes/{id}` | Delete study material and associated disk file |
| `GET` | `/api/stats` | Summary statistics and storage analytics |
| `GET` | `/docs` | Interactive Swagger API documentation |
