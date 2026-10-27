import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lms.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        course_id INTEGER,
        module TEXT DEFAULT 'General',
        description TEXT,
        tags TEXT,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_type TEXT NOT NULL,
        uploader TEXT DEFAULT 'Instructor',
        downloads INTEGER DEFAULT 0,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL
    )
    """)
    
    cursor.execute("SELECT COUNT(*) FROM courses")
    if cursor.fetchone()[0] == 0:
        sample_courses = [
            ("CS101", "Introduction to Computer Science", "Computer Science", "Foundations of computation, algorithms, and logic."),
            ("SWE301", "Agile Software Engineering", "Software Engineering", "Agile methodologies, Scrum, Sprint planning, and CI/CD."),
            ("DATA201", "Data Structures & Algorithms", "Computer Science", "Trees, Graphs, Sorting, Dynamic Programming."),
            ("AI401", "Machine Learning Foundations", "Artificial Intelligence", "Supervised, unsupervised learning, neural networks, and model evaluation."),
            ("MATH150", "Discrete Mathematics", "Mathematics", "Logic, set theory, combinatorics, and graph theory.")
        ]
        cursor.executemany(
            "INSERT INTO courses (code, name, category, description) VALUES (?, ?, ?, ?)",
            sample_courses
        )

    cursor.execute("SELECT COUNT(*) FROM study_materials")
    if cursor.fetchone()[0] == 0:
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        sample_files = [
            {
                "title": "Agile Scrum Master Guide & Sprint Artifacts",
                "course_code": "SWE301",
                "module": "Sprint Ceremonies",
                "description": "Comprehensive guide covering User Stories, Backlog Grooming, Velocity Estimation, and Retrospectives.",
                "tags": "Agile,Scrum,Sprint,Engineering",
                "filename": "agile_scrum_guide.md",
                "original_filename": "Agile_Scrum_Guide.md",
                "file_type": "text/markdown",
                "uploader": "Prof. Alan Vance",
                "content": """# Agile Scrum Master Guide & Sprint Artifacts
## 1. Core Agile Principles
- Individuals and interactions over processes and tools
- Working software over comprehensive documentation
- Customer collaboration over contract negotiation
- Responding to change over following a plan

## 2. Key Scrum Ceremonies
1. Sprint Planning: Define sprint goal and select user stories from product backlog.
2. Daily Standup (15 mins): What did you do yesterday? What will you do today? Any blockers?
3. Sprint Review: Showcase working increments to stakeholders.
4. Sprint Retrospective: Continuous team improvement, action items.

## 3. Definition of Done (DoD)
- Code written, peer-reviewed, and merged to main branch.
- Automated unit and integration tests passing.
- Deployment to staging verified.
- Documentation updated.
"""
            },
            {
                "title": "Big-O Cheatsheet & Asymptotic Complexity",
                "course_code": "DATA201",
                "module": "Algorithm Analysis",
                "description": "Quick reference for time and space complexities of Common Data Structures and Sorting algorithms.",
                "tags": "Algorithms,Complexity,Big-O,DataStructures",
                "filename": "big_o_complexity.txt",
                "original_filename": "Big_O_Complexity_Summary.txt",
                "file_type": "text/plain",
                "uploader": "Dr. Sarah Chen",
                "content": """BIG-O COMPLEXITY CHEATSHEET
=============================================================
Data Structure Operations:
- Array: Access O(1), Search O(n), Insert O(n), Delete O(n)
- Hash Table: Access O(1)*, Search O(1)*, Insert O(1)*, Delete O(1)*
- Binary Search Tree: Access O(log n), Search O(log n), Insert O(log n)
- Red-Black Tree: Access O(log n), Search O(log n), Insert O(log n)

Sorting Complexities:
- QuickSort: Best O(n log n), Average O(n log n), Worst O(n^2)
- MergeSort: Best O(n log n), Average O(n log n), Worst O(n^2)
- HeapSort: Best O(n log n), Average O(n log n), Worst O(n log n)
"""
            },
            {
                "title": "Neural Networks & Backpropagation Math",
                "course_code": "AI401",
                "module": "Deep Learning",
                "description": "Step-by-step calculus derivations for gradient descent, matrix calculus, and activation functions.",
                "tags": "AI,DeepLearning,Math,Calculus",
                "filename": "neural_nets_backprop.md",
                "original_filename": "Neural_Nets_Backprop_Notes.md",
                "file_type": "text/markdown",
                "uploader": "Dr. Elena Rostova",
                "content": """# Neural Networks & Backpropagation Notes
## Activation Functions
- Sigmoid: range (0, 1)
- ReLU: solves vanishing gradient in positive domain
- Softmax: For multiclass classification probability distributions

## Loss Functions
- Binary Cross Entropy
- Categorical Cross Entropy
"""
            }
        ]

        for s in sample_files:
            file_disk_path = os.path.join(upload_dir, s["filename"])
            with open(file_disk_path, "w", encoding="utf-8") as f:
                f.write(s["content"])
            
            size = os.path.getsize(file_disk_path)
            
            cursor.execute("SELECT id FROM courses WHERE code = ?", (s["course_code"],))
            c_row = cursor.fetchone()
            course_id = c_row[0] if c_row else None
            
            cursor.execute("""
            INSERT INTO study_materials 
            (title, course_id, module, description, tags, filename, original_filename, file_path, file_size, file_type, uploader, downloads)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                s["title"],
                course_id,
                s["module"],
                s["description"],
                s["tags"],
                s["filename"],
                s["original_filename"],
                file_disk_path,
                size,
                s["file_type"],
                s["uploader"],
                14
            ))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
