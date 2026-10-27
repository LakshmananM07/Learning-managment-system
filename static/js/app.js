const state = {
  materials: [],
  courses: [],
  stats: {},
  filters: {
    category: 'all',
    course_id: '',
    query: '',
    sort_by: 'newest'
  },
  viewMode: 'grid',
  currentPreviewNote: null,
  fontSize: 13.5
};

const elements = {
  statTotalNotes: document.getElementById('statTotalNotes'),
  statTotalCourses: document.getElementById('statTotalCourses'),
  statTotalDownloads: document.getElementById('statTotalDownloads'),
  statTotalStorage: document.getElementById('statTotalStorage'),
  
  viewNotesNavBtn: document.getElementById('viewNotesNavBtn'),
  notesSection: document.getElementById('notesSection'),
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  categoryPills: document.getElementById('categoryPills'),
  courseSelectFilter: document.getElementById('courseSelectFilter'),
  sortBySelect: document.getElementById('sortBySelect'),
  itemsCounter: document.getElementById('itemsCounter'),
  viewGridBtn: document.getElementById('viewGridBtn'),
  viewListBtn: document.getElementById('viewListBtn'),
  
  materialsGrid: document.getElementById('materialsGrid'),
  materialsListView: document.getElementById('materialsListView'),
  materialsTableBody: document.getElementById('materialsTableBody'),
  emptyState: document.getElementById('emptyState'),
  emptyUploadBtn: document.getElementById('emptyUploadBtn'),

  uploadModal: document.getElementById('uploadModal'),
  openUploadModalBtn: document.getElementById('openUploadModalBtn'),
  closeUploadModalBtn: document.getElementById('closeUploadModalBtn'),
  cancelUploadBtn: document.getElementById('cancelUploadBtn'),
  submitUploadBtn: document.getElementById('submitUploadBtn'),
  uploadForm: document.getElementById('uploadForm'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  selectedFileBadge: document.getElementById('selectedFileBadge'),
  selectedFileName: document.getElementById('selectedFileName'),
  selectedFileSize: document.getElementById('selectedFileSize'),
  materialTitle: document.getElementById('materialTitle'),
  materialCourse: document.getElementById('materialCourse'),
  uploadProgressContainer: document.getElementById('uploadProgressContainer'),
  uploadProgressBar: document.getElementById('uploadProgressBar'),
  uploadPercent: document.getElementById('uploadPercent'),

  courseModal: document.getElementById('courseModal'),
  openCourseModalBtn: document.getElementById('openCourseModalBtn'),
  closeCourseModalBtn: document.getElementById('closeCourseModalBtn'),
  cancelCourseBtn: document.getElementById('cancelCourseBtn'),
  submitCourseBtn: document.getElementById('submitCourseBtn'),
  courseForm: document.getElementById('courseForm'),

  previewModal: document.getElementById('previewModal'),
  previewModalContainer: document.getElementById('previewModalContainer'),
  closePreviewModalBtn: document.getElementById('closePreviewModalBtn'),
  previewTitle: document.getElementById('previewTitle'),
  previewMeta: document.getElementById('previewMeta'),
  previewBadgeType: document.getElementById('previewBadgeType'),
  previewCourseCode: document.getElementById('previewCourseCode'),
  previewModule: document.getElementById('previewModule'),
  previewContentText: document.getElementById('previewContentText'),
  previewIframe: document.getElementById('previewIframe'),
  previewBinaryCard: document.getElementById('previewBinaryCard'),
  binaryDocTitle: document.getElementById('binaryDocTitle'),
  binaryDocMsg: document.getElementById('binaryDocMsg'),
  binaryDownloadBtn: document.getElementById('binaryDownloadBtn'),
  fontDecBtn: document.getElementById('fontDecBtn'),
  fontIncBtn: document.getElementById('fontIncBtn'),
  fullscreenModalBtn: document.getElementById('fullscreenModalBtn'),
  copyPreviewBtn: document.getElementById('copyPreviewBtn'),
  downloadFromPreviewBtn: document.getElementById('downloadFromPreviewBtn'),

  toastContainer: document.getElementById('toastContainer')
};

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadCourses();
  loadStats();
  loadMaterials();
});

function initEventListeners() {
  if (elements.viewNotesNavBtn) {
    elements.viewNotesNavBtn.addEventListener('click', () => {
      if (elements.notesSection) {
        elements.notesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  let searchTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    elements.searchClearBtn.style.display = val ? 'block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.query = val;
      loadMaterials();
    }, 280);
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.searchClearBtn.style.display = 'none';
    state.filters.query = '';
    loadMaterials();
    elements.searchInput.focus();
  });

  elements.categoryPills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;
    document.querySelectorAll('.category-pills .pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filters.category = btn.getAttribute('data-category');
    loadMaterials();
  });

  elements.courseSelectFilter.addEventListener('change', (e) => {
    state.filters.course_id = e.target.value;
    loadMaterials();
  });

  elements.sortBySelect.addEventListener('change', (e) => {
    state.filters.sort_by = e.target.value;
    loadMaterials();
  });

  elements.viewGridBtn.addEventListener('click', () => switchViewMode('grid'));
  elements.viewListBtn.addEventListener('click', () => switchViewMode('list'));

  elements.openUploadModalBtn.addEventListener('click', () => openModal(elements.uploadModal));
  elements.closeUploadModalBtn.addEventListener('click', () => closeModal(elements.uploadModal));
  elements.cancelUploadBtn.addEventListener('click', () => closeModal(elements.uploadModal));
  elements.emptyUploadBtn.addEventListener('click', () => openModal(elements.uploadModal));

  elements.openCourseModalBtn.addEventListener('click', () => openModal(elements.courseModal));
  elements.closeCourseModalBtn.addEventListener('click', () => closeModal(elements.courseModal));
  elements.cancelCourseBtn.addEventListener('click', () => closeModal(elements.courseModal));

  elements.closePreviewModalBtn.addEventListener('click', () => closeModal(elements.previewModal));

  if (elements.fontIncBtn) {
    elements.fontIncBtn.addEventListener('click', () => {
      if (state.fontSize < 24) {
        state.fontSize += 1.5;
        elements.previewContentText.style.fontSize = `${state.fontSize}px`;
      }
    });
  }

  if (elements.fontDecBtn) {
    elements.fontDecBtn.addEventListener('click', () => {
      if (state.fontSize > 10.5) {
        state.fontSize -= 1.5;
        elements.previewContentText.style.fontSize = `${state.fontSize}px`;
      }
    });
  }

  if (elements.fullscreenModalBtn) {
    elements.fullscreenModalBtn.addEventListener('click', () => {
      elements.previewModalContainer.classList.toggle('fullscreen');
      const isFull = elements.previewModalContainer.classList.contains('fullscreen');
      elements.fullscreenModalBtn.textContent = isFull ? '✕' : '⛶';
    });
  }

  [elements.uploadModal, elements.courseModal, elements.previewModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(elements.uploadModal);
      closeModal(elements.courseModal);
      closeModal(elements.previewModal);
    } else if (e.key === '/' && document.activeElement !== elements.searchInput) {
      e.preventDefault();
      elements.searchInput.focus();
    }
  });

  setupDropzone();
  elements.submitUploadBtn.addEventListener('click', handleUploadSubmit);
  elements.submitCourseBtn.addEventListener('click', handleCourseSubmit);

  elements.copyPreviewBtn.addEventListener('click', () => {
    if (elements.previewContentText.innerText) {
      navigator.clipboard.writeText(elements.previewContentText.innerText);
      showToast('Study notes content copied to clipboard', 'info');
    }
  });
}

function switchViewMode(mode) {
  state.viewMode = mode;
  if (mode === 'grid') {
    elements.viewGridBtn.classList.add('active');
    elements.viewListBtn.classList.remove('active');
    elements.materialsGrid.style.display = 'grid';
    elements.materialsListView.style.display = 'none';
  } else {
    elements.viewListBtn.classList.add('active');
    elements.viewGridBtn.classList.remove('active');
    elements.materialsGrid.style.display = 'none';
    elements.materialsListView.style.display = 'block';
  }
}

function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
  if (modal === elements.previewModal && elements.previewModalContainer) {
    elements.previewModalContainer.classList.remove('fullscreen');
    if (elements.fullscreenModalBtn) elements.fullscreenModalBtn.textContent = '⛶';
  }
}

function setupDropzone() {
  const { dropzone, fileInput } = elements;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });
}

function handleFileSelected(file) {
  elements.selectedFileBadge.style.display = 'flex';
  elements.selectedFileName.textContent = file.name;
  elements.selectedFileSize.textContent = formatBytes(file.size);

  if (!elements.materialTitle.value) {
    const rawName = file.name.replace(/\.[^/.]+$/, "");
    elements.materialTitle.value = rawName.replace(/[-_]/g, ' ');
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (json.status === 'success') {
      const data = json.data;
      elements.statTotalNotes.textContent = data.total_notes;
      elements.statTotalCourses.textContent = data.total_courses;
      elements.statTotalDownloads.textContent = data.total_downloads;
      elements.statTotalStorage.textContent = data.total_storage;
    }
  } catch (err) {}
}

async function loadCourses() {
  try {
    const res = await fetch('/api/courses');
    const json = await res.json();
    if (json.status === 'success') {
      state.courses = json.data;
      renderCourseOptions(json.data);
    }
  } catch (err) {}
}

function renderCourseOptions(courses) {
  const filterSelect = elements.courseSelectFilter;
  filterSelect.innerHTML = '<option value="">All Courses</option>';
  
  const modalSelect = elements.materialCourse;
  modalSelect.innerHTML = '<option value="">Select Course...</option>';

  courses.forEach(c => {
    const optFilter = document.createElement('option');
    optFilter.value = c.id;
    optFilter.textContent = `${c.code}: ${c.name} (${c.materials_count || 0})`;
    filterSelect.appendChild(optFilter);

    const optModal = document.createElement('option');
    optModal.value = c.id;
    optModal.textContent = `${c.code} - ${c.name}`;
    modalSelect.appendChild(optModal);
  });
}

async function loadMaterials() {
  elements.itemsCounter.textContent = 'Updating...';
  
  const params = new URLSearchParams();
  if (state.filters.query) params.append('q', state.filters.query);
  if (state.filters.course_id) params.append('course_id', state.filters.course_id);
  if (state.filters.category && state.filters.category !== 'all') params.append('category', state.filters.category);
  if (state.filters.sort_by) params.append('sort_by', state.filters.sort_by);

  try {
    const res = await fetch(`/api/notes?${params.toString()}`);
    const json = await res.json();

    if (json.status === 'success') {
      state.materials = json.data;
      elements.itemsCounter.textContent = `${json.count} study material${json.count === 1 ? '' : 's'}`;
      renderMaterials(json.data);
    }
  } catch (err) {
    elements.itemsCounter.textContent = 'Error loading';
    showToast('Failed to load study materials.', 'error');
  }
}

function renderMaterials(items) {
  const { materialsGrid, materialsTableBody, emptyState } = elements;

  if (items.length === 0) {
    materialsGrid.style.display = 'none';
    elements.materialsListView.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  if (state.viewMode === 'grid') {
    materialsGrid.style.display = 'grid';
    elements.materialsListView.style.display = 'none';
  } else {
    materialsGrid.style.display = 'none';
    elements.materialsListView.style.display = 'block';
  }

  materialsGrid.innerHTML = items.map(item => {
    const iconMeta = getFileTypeInfo(item.original_filename);
    const tagsHtml = item.tags_list.map(t => `<span class="tag-badge" onclick="filterByTag('${escapeHtml(t)}')">#${escapeHtml(t)}</span>`).join('');
    const courseCode = item.course_code ? `<span class="course-code-pill">${escapeHtml(item.course_code)}</span>` : '';
    const moduleText = item.module ? `<span class="module-pill">${escapeHtml(item.module)}</span>` : '';
    const formattedDate = formatDate(item.uploaded_at);

    return `
      <div class="material-card" data-id="${item.id}">
        <div>
          <div class="card-top">
            <div class="file-type-icon">${iconMeta.icon}</div>
            <div class="card-meta-top">
              <div>${courseCode} ${moduleText}</div>
              <h3 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h3>
            </div>
          </div>

          <p class="card-description">${escapeHtml(item.description || '')}</p>

          <div class="card-tags">
            ${tagsHtml}
          </div>
        </div>

        <div class="card-footer">
          <div class="file-info">
            <span class="file-info-item">💾 ${item.formatted_size}</span>
            <span class="file-info-item">📥 ${item.downloads}</span>
            <span class="file-info-item">${formattedDate}</span>
          </div>

          <div class="card-actions" style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-view-notes" onclick="previewNote(${item.id})" title="View Notes & Display Material">
              <span>📖</span>
              <span>View Notes</span>
            </button>
            <button class="btn-action download" onclick="downloadNote(${item.id})" title="Download Material">📥</button>
            <button class="btn-action delete" onclick="deleteNote(${item.id}, '${escapeHtml(item.title)}')" title="Delete Material">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  materialsTableBody.innerHTML = items.map(item => {
    const iconMeta = getFileTypeInfo(item.original_filename);
    const courseCode = item.course_code ? `<span class="course-code-pill">${escapeHtml(item.course_code)}</span>` : '';
    const formattedDate = formatDate(item.uploaded_at);

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="file-type-icon" style="width: 32px; height: 32px; font-size: 11px;">${iconMeta.icon}</div>
            <div>
              <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(item.title)}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${courseCode} ${escapeHtml(item.original_filename)}</div>
            </div>
          </div>
        </td>
        <td><span style="font-size: 13px; color: var(--text-muted);">${escapeHtml(item.module || 'General')}</span></td>
        <td><span style="font-size: 13px; color: var(--text-muted);">${escapeHtml(item.uploader || 'Instructor')}</span></td>
        <td><span style="font-size: 13px; font-family: var(--font-mono);">${item.formatted_size}</span></td>
        <td><span style="font-size: 13px; font-weight: 600;">${item.downloads}</span></td>
        <td><span style="font-size: 12px; color: var(--text-dim);">${formattedDate}</span></td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            <button class="btn-view-notes" style="padding: 4px 10px; font-size: 11.5px;" onclick="previewNote(${item.id})">
              <span>📖</span>
              <span>View</span>
            </button>
            <button class="btn-action download" onclick="downloadNote(${item.id})" title="Download Material">📥</button>
            <button class="btn-action delete" onclick="deleteNote(${item.id}, '${escapeHtml(item.title)}')" title="Delete Material">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.filterByTag = function(tag) {
  elements.searchInput.value = tag;
  elements.searchClearBtn.style.display = 'block';
  state.filters.query = tag;
  loadMaterials();
};

function handleUploadSubmit() {
  const file = elements.fileInput.files[0];
  const title = elements.materialTitle.value.trim();
  const courseId = elements.materialCourse.value;

  if (!file) {
    showToast('Please select a file to upload.', 'error');
    return;
  }
  if (!title) {
    showToast('Please enter a title for the document.', 'error');
    elements.materialTitle.focus();
    return;
  }
  if (!courseId) {
    showToast('Please select a course.', 'error');
    elements.materialCourse.focus();
    return;
  }

  const formData = new FormData(elements.uploadForm);

  elements.uploadProgressContainer.style.display = 'block';
  elements.uploadProgressBar.style.width = '0%';
  elements.uploadPercent.textContent = '0%';
  elements.submitUploadBtn.disabled = true;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/notes/upload', true);

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      elements.uploadProgressBar.style.width = percent + '%';
      elements.uploadPercent.textContent = percent + '%';
    }
  };

  xhr.onload = () => {
    elements.submitUploadBtn.disabled = false;
    elements.uploadProgressContainer.style.display = 'none';

    if (xhr.status >= 200 && xhr.status < 300) {
      showToast('Study material uploaded successfully.', 'success');
      elements.uploadForm.reset();
      elements.selectedFileBadge.style.display = 'none';
      closeModal(elements.uploadModal);
      loadMaterials();
      loadStats();
    } else {
      let errMsg = 'Upload failed.';
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.detail) errMsg = res.detail;
      } catch (e) {}
      showToast(errMsg, 'error');
    }
  };

  xhr.onerror = () => {
    elements.submitUploadBtn.disabled = false;
    elements.uploadProgressContainer.style.display = 'none';
    showToast('Network error during upload.', 'error');
  };

  xhr.send(formData);
}

async function handleCourseSubmit() {
  const code = elements.courseForm.code.value.trim();
  const name = elements.courseForm.name.value.trim();
  const category = elements.courseForm.category.value.trim();

  if (!code || !name || !category) {
    showToast('Please fill out Course Code, Title, and Category.', 'error');
    return;
  }

  const formData = new FormData(elements.courseForm);

  try {
    elements.submitCourseBtn.disabled = true;
    const res = await fetch('/api/courses', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    elements.submitCourseBtn.disabled = false;

    if (res.ok) {
      showToast(`Course ${code} created successfully.`, 'success');
      elements.courseForm.reset();
      closeModal(elements.courseModal);
      await loadCourses();
      loadStats();
    } else {
      showToast(json.detail || 'Failed to create course.', 'error');
    }
  } catch (err) {
    elements.submitCourseBtn.disabled = false;
    showToast('Failed to create course: ' + err.message, 'error');
  }
}

window.downloadNote = function(id) {
  const downloadUrl = `/api/notes/${id}/download`;
  window.open(downloadUrl, '_blank');
  
  setTimeout(() => {
    loadStats();
    loadMaterials();
  }, 1000);
};

window.previewNote = async function(id) {
  try {
    elements.previewTitle.textContent = 'Loading study material...';
    elements.previewMeta.innerHTML = '';
    elements.previewContentText.style.display = 'block';
    elements.previewContentText.textContent = 'Fetching and rendering note contents...';
    elements.previewIframe.style.display = 'none';
    elements.previewBinaryCard.style.display = 'none';
    elements.downloadFromPreviewBtn.href = `/api/notes/${id}/download`;
    elements.binaryDownloadBtn.href = `/api/notes/${id}/download`;
    elements.previewContentText.style.fontSize = `${state.fontSize}px`;
    
    openModal(elements.previewModal);

    const res = await fetch(`/api/notes/${id}/view`);
    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const json = await res.json();
      if (json.status === 'success' && json.preview_type === 'text') {
        elements.previewTitle.textContent = json.title;
        elements.previewBadgeType.textContent = (json.extension || 'TEXT').toUpperCase().replace('.', '');
        elements.previewCourseCode.textContent = json.course_code || 'General';
        elements.previewModule.textContent = json.module || 'General';
        
        elements.previewMeta.innerHTML = `
          <span class="preview-stat-badge">⏱️ ${json.reading_time || 1} min read</span>
          <span class="preview-stat-badge">📝 ${json.word_count || 0} words</span>
          <span class="preview-stat-badge">📄 ${json.line_count || 0} lines</span>
          <span class="preview-stat-badge">💾 ${json.formatted_size || ''}</span>
          <span class="preview-stat-badge">👤 ${escapeHtml(json.uploader || 'Instructor')}</span>
        `;
        
        elements.previewContentText.style.display = 'block';
        elements.previewIframe.style.display = 'none';
        elements.previewBinaryCard.style.display = 'none';
        elements.previewContentText.textContent = json.content || '';
      } else if (json.status === 'success' && json.preview_type === 'binary') {
        elements.previewTitle.textContent = json.title;
        elements.previewBadgeType.textContent = 'BINARY';
        elements.previewContentText.style.display = 'none';
        elements.previewIframe.style.display = 'none';
        elements.previewBinaryCard.style.display = 'flex';
        elements.binaryDocTitle.textContent = json.title;
        elements.binaryDocMsg.textContent = json.message || 'This material format can be opened directly after download.';
      } else {
        elements.previewContentText.textContent = json.message || 'No content preview available.';
      }
    } else if (contentType && (contentType.includes("pdf") || contentType.includes("image"))) {
      elements.previewTitle.textContent = 'Document Viewer';
      elements.previewBadgeType.textContent = contentType.includes("pdf") ? 'PDF' : 'IMAGE';
      elements.previewContentText.style.display = 'none';
      elements.previewBinaryCard.style.display = 'none';
      elements.previewIframe.style.display = 'block';
      elements.previewIframe.src = `/api/notes/${id}/view`;
    }
  } catch (err) {
    elements.previewContentText.textContent = 'Error loading material: ' + err.message;
  }
};

window.deleteNote = async function(id, title) {
  if (!confirm(`Delete "${title}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok) {
      showToast('Study material deleted.', 'info');
      loadMaterials();
      loadStats();
    } else {
      showToast(json.detail || 'Could not delete material.', 'error');
    }
  } catch (err) {
    showToast('Error deleting material: ' + err.message, 'error');
  }
};

function getFileTypeInfo(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  
  if (ext === 'pdf') {
    return { icon: 'PDF' };
  } else if (['md', 'markdown'].includes(ext)) {
    return { icon: 'MD' };
  } else if (['py', 'js', 'ts', 'java', 'cpp', 'c', 'cs', 'html', 'css', 'sql', 'json'].includes(ext)) {
    return { icon: '</>' };
  } else if (['doc', 'docx', 'rtf'].includes(ext)) {
    return { icon: 'DOC' };
  } else if (['ppt', 'pptx'].includes(ext)) {
    return { icon: 'PPT' };
  } else if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
    return { icon: 'ZIP' };
  } else if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
    return { icon: 'IMG' };
  }
  return { icon: 'FILE' };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
