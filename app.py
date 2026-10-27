import os
import io
import shutil
import uuid
import zipfile
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from database import init_db, get_db_connection

init_db()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

app = FastAPI(
    title="Agile LMS",
    description="Minimalistic LMS with Study Material & Notes Management",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

@app.get("/api/courses")
def get_courses():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, COUNT(s.id) as materials_count 
        FROM courses c 
        LEFT JOIN study_materials s ON c.id = s.course_id 
        GROUP BY c.id 
        ORDER BY c.code ASC
    """)
    courses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"status": "success", "data": courses}

@app.post("/api/courses")
def create_course(
    code: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    description: Optional[str] = Form(None)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO courses (code, name, category, description) VALUES (?, ?, ?, ?)",
            (code.strip().upper(), name.strip(), category.strip(), description.strip() if description else None)
        )
        conn.commit()
        course_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Course code may already exist: {str(e)}")
    conn.close()
    return {"status": "success", "message": "Course created successfully", "course_id": course_id}

@app.get("/api/notes")
def get_study_materials(
    q: Optional[str] = Query(None),
    course_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    sort_by: str = Query("newest")
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT s.*, c.name as course_name, c.code as course_code, c.category as course_category
        FROM study_materials s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE 1=1
    """
    params = []

    if course_id:
        query += " AND s.course_id = ?"
        params.append(course_id)
    
    if category and category.lower() != "all":
        query += " AND LOWER(c.category) = LOWER(?)"
        params.append(category)

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query += " AND (s.title LIKE ? OR s.description LIKE ? OR s.tags LIKE ? OR s.module LIKE ?)"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    if sort_by == "oldest":
        query += " ORDER BY s.uploaded_at ASC"
    elif sort_by == "title":
        query += " ORDER BY s.title COLLATE NOCASE ASC"
    elif sort_by == "size":
        query += " ORDER BY s.file_size DESC"
    elif sort_by == "downloads":
        query += " ORDER BY s.downloads DESC"
    else:
        query += " ORDER BY s.uploaded_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    materials = []
    for row in rows:
        item = dict(row)
        item["formatted_size"] = format_file_size(item["file_size"])
        item["tags_list"] = [t.strip() for t in item["tags"].split(",") if t.strip()] if item.get("tags") else []
        materials.append(item)

    conn.close()
    return {"status": "success", "count": len(materials), "data": materials}

@app.post("/api/notes/upload")
async def upload_study_material(
    file: UploadFile = File(...),
    title: str = Form(...),
    course_id: Optional[int] = Form(None),
    module: Optional[str] = Form("General"),
    description: Optional[str] = Form(""),
    tags: Optional[str] = Form(""),
    uploader: Optional[str] = Form("Instructor")
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    original_filename = file.filename
    unique_filename = f"{uuid.uuid4().hex[:10]}_{original_filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    file_size = os.path.getsize(file_path)
    file_type = file.content_type or "application/octet-stream"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO study_materials 
        (title, course_id, module, description, tags, filename, original_filename, file_path, file_size, file_type, uploader)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title.strip(),
        course_id,
        module.strip() if module else "General",
        description.strip() if description else "",
        tags.strip() if tags else "",
        unique_filename,
        original_filename,
        file_path,
        file_size,
        file_type,
        uploader.strip() if uploader else "Instructor"
    ))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {
        "status": "success",
        "message": "Study material uploaded successfully!",
        "id": new_id,
        "filename": original_filename,
        "size": format_file_size(file_size)
    }

@app.get("/api/notes/download-all")
def download_all_materials_zip():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_materials")
    materials = cursor.fetchall()
    
    if not materials:
        conn.close()
        raise HTTPException(status_code=404, detail="No study materials available to download")

    cursor.execute("UPDATE study_materials SET downloads = downloads + 1")
    conn.commit()
    conn.close()

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for m in materials:
            fpath = m["file_path"]
            if os.path.exists(fpath):
                zip_file.write(fpath, arcname=m["original_filename"])

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="all_study_materials.zip"'}
    )

@app.get("/api/notes/{material_id}")
def get_note_detail(material_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, c.name as course_name, c.code as course_code, c.category as course_category
        FROM study_materials s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE s.id = ?
    """, (material_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Study material not found")
        
    item = dict(row)
    item["formatted_size"] = format_file_size(item["file_size"])
    item["tags_list"] = [t.strip() for t in item["tags"].split(",") if t.strip()] if item.get("tags") else []
    return {"status": "success", "data": item}

@app.get("/api/notes/{material_id}/download")
def download_note(material_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM study_materials WHERE id = ?", (material_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Study material not found")
        
    cursor.execute("UPDATE study_materials SET downloads = downloads + 1 WHERE id = ?", (material_id,))
    conn.commit()
    conn.close()

    file_path = row["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file missing from server storage")

    return FileResponse(
        path=file_path,
        filename=row["original_filename"],
        media_type=row["file_type"] or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{row["original_filename"]}"'}
    )

@app.get("/api/courses/{course_id}/download-all")
def download_course_notes_zip(course_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses WHERE id = ?", (course_id,))
    course = cursor.fetchone()
    if not course:
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")
        
    cursor.execute("SELECT * FROM study_materials WHERE course_id = ?", (course_id,))
    materials = cursor.fetchall()

    if not materials:
        conn.close()
        raise HTTPException(status_code=404, detail="No materials found for this course")

    cursor.execute("UPDATE study_materials SET downloads = downloads + 1 WHERE course_id = ?", (course_id,))
    conn.commit()
    conn.close()

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for m in materials:
            fpath = m["file_path"]
            if os.path.exists(fpath):
                zip_file.write(fpath, arcname=m["original_filename"])

    zip_buffer.seek(0)
    filename = f"{course['code']}_materials.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/notes/{material_id}/preview")
def preview_note(material_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, c.name as course_name, c.code as course_code, c.category as course_category
        FROM study_materials s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE s.id = ?
    """, (material_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Study material not found")

    file_path = row["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server")

    text_extensions = [".txt", ".md", ".py", ".json", ".js", ".html", ".css", ".csv", ".sql", ".log"]
    ext = os.path.splitext(row["original_filename"])[1].lower()

    if ext in text_extensions or "text" in row["file_type"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(100000)
            words = len(content.split())
            lines = len(content.splitlines())
            read_time = max(1, round(words / 200))
            return {
                "status": "success",
                "preview_type": "text",
                "extension": ext,
                "content": content,
                "title": row["title"],
                "original_filename": row["original_filename"],
                "course_code": row["course_code"],
                "course_name": row["course_name"],
                "module": row["module"],
                "uploader": row["uploader"],
                "formatted_size": format_file_size(row["file_size"]),
                "word_count": words,
                "line_count": lines,
                "reading_time": read_time
            }
        except Exception as e:
            return {
                "status": "error",
                "preview_type": "binary",
                "message": f"Could not read as text: {str(e)}"
            }
    elif ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]:
        return FileResponse(path=file_path, media_type=row["file_type"])
    elif ext == ".pdf":
        return FileResponse(path=file_path, media_type="application/pdf", headers={"Content-Disposition": "inline"})
    else:
        return {
            "status": "success",
            "preview_type": "binary",
            "message": f"Preview not directly supported for {ext} files. Please download to view.",
            "title": row["title"],
            "original_filename": row["original_filename"],
            "formatted_size": format_file_size(row["file_size"])
        }

@app.get("/api/notes/{material_id}/view")
def view_note_detail(material_id: int):
    return preview_note(material_id)

@app.delete("/api/notes/{material_id}")
def delete_note(material_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM study_materials WHERE id = ?", (material_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Study material not found")

    file_path = row["file_path"]
    cursor.execute("DELETE FROM study_materials WHERE id = ?", (material_id,))
    conn.commit()
    conn.close()

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    return {"status": "success", "message": "Study material deleted successfully"}

@app.get("/api/stats")
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM study_materials")
    total_notes = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM courses")
    total_courses = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(downloads), 0) FROM study_materials")
    total_downloads = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(file_size), 0) FROM study_materials")
    total_bytes = cursor.fetchone()[0]

    cursor.execute("""
        SELECT c.category, COUNT(s.id) as count
        FROM courses c
        LEFT JOIN study_materials s ON c.id = s.course_id
        GROUP BY c.category
    """)
    categories = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "status": "success",
        "data": {
            "total_notes": total_notes,
            "total_courses": total_courses,
            "total_downloads": total_downloads,
            "total_storage": format_file_size(total_bytes),
            "categories": categories
        }
    }

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Agile LMS</h1>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
