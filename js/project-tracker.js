// project-tracker.js — Project details, links, and ZIP upload metadata parser

let activeEditingProjectId = null;

function renderProjectTrackerPage() {
  const projects = Storage.get('px_projects') || [];
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalProjects = projects.length;
  const avgProgress = totalProjects > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjects)
    : 0;

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Project Tracker</h1>
        <p>Build real-world ML projects and establish a strong portfolio</p>
      </div>
      <div>
        <span class="badge badge-accent">Portfolio Progress: ${avgProgress}%</span>
      </div>
    </div>

    <!-- Projects stats dashboard card -->
    <div class="card mb-4" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
      <div>
        <span class="stat-label">Total Projects</span>
        <h3 class="stat-value" style="font-size: 28px; margin-top: 6px;">${totalProjects}</h3>
      </div>
      <div>
        <span class="stat-label">Completed</span>
        <h3 class="stat-value accent" style="font-size: 28px; margin-top: 6px;">${completedProjects}</h3>
      </div>
      <div>
        <span class="stat-label">Average Progress</span>
        <h3 class="stat-value" style="font-size: 28px; margin-top: 6px;">${avgProgress}%</h3>
      </div>
    </div>

    <!-- Project List Grid -->
    <div class="projects-grid" id="project-cards-list-holder">
      <!-- Projects list generated dynamically -->
    </div>
  `;

  const listHolder = document.getElementById('project-cards-list-holder');
  if (listHolder) {
    projects.forEach(project => {
      // Determine status badge class
      let badgeClass = 'badge-neutral';
      if (project.status === 'Completed') badgeClass = 'badge-accent';
      else if (project.status === 'In Progress') badgeClass = 'badge-yellow';

      const card = document.createElement('div');
      card.className = 'card project-card';
      
      // Calculate formatted dates
      const datesRange = project.startDate 
        ? `${project.startDate} to ${project.endDate || 'Present'}`
        : 'Timeline not set';

      card.innerHTML = `
        <div class="project-title-section">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="project-name-txt">${project.name}</span>
            <span class="badge ${badgeClass}">${project.status}</span>
          </div>
          <p class="project-desc-txt mt-4">${project.notes || 'No notes added yet. Click edit to details.'}</p>
        </div>

        <div class="project-meta-item">
          <span class="project-meta-label">Progress</span>
          <div class="progress-container" style="margin-top: 0;">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${project.progress || 0}%"></div>
            </div>
            <span class="project-meta-val" style="font-size: 11px; margin-top: 4px; display: block;">${project.progress || 0}% Complete</span>
          </div>
        </div>

        <div class="project-meta-item">
          <span class="project-meta-label">Dates & Zip Asset</span>
          <span class="project-meta-val" style="font-size: 11px;">${datesRange}</span>
          ${project.zipMetadata ? `
            <div class="mt-4" style="font-size: 10px; color: var(--accent); font-family: var(--font);">
              📦 ${project.zipMetadata.name} (${Math.round(project.zipMetadata.size / 1024)} KB)
            </div>
          ` : ''}
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="project-links">
            <a href="${project.github || '#'}" class="project-link-btn ${project.github ? '' : 'inactive'}" target="_blank" onclick="if(!this.getAttribute('href') || this.getAttribute('href')==='#') { event.preventDefault(); alert('Please set GitHub URL by clicking Edit'); }">GitHub</a>
            <a href="${project.linkedin || '#'}" class="project-link-btn ${project.linkedin ? '' : 'inactive'}" target="_blank" onclick="if(!this.getAttribute('href') || this.getAttribute('href')==='#') { event.preventDefault(); alert('Please set LinkedIn URL by clicking Edit'); }">LinkedIn</a>
          </div>
          <button onclick="openProjectEditModal(${project.id})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; width: 100%;">
            Edit Details
          </button>
        </div>
      `;
      
      listHolder.appendChild(card);
    });
  }
}

function openProjectEditModal(projectId) {
  const projects = Storage.get('px_projects') || [];
  const project = projects.find(p => p.id === projectId);
  if (!project) return;
  
  activeEditingProjectId = projectId;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'project-edit-modal-overlay';
  overlay.onclick = () => overlay.remove();
  
  const modal = document.createElement('div');
  modal.className = 'modal-content card';
  modal.style.maxWidth = '600px';
  modal.onclick = (e) => e.stopPropagation();
  
  modal.innerHTML = `
    <div class="modal-header">
      <h3>Edit: ${project.name}</h3>
      <button class="modal-close-btn" onclick="document.getElementById('project-edit-modal-overlay').remove()">&times;</button>
    </div>
    <div class="modal-body">
      <form id="project-edit-form" onsubmit="saveProjectEdits(event)">
        
        <div class="form-group">
          <label for="edit-proj-status">Development Status</label>
          <select id="edit-proj-status" class="form-control" onchange="onStatusSelectChange(this.value)">
            <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
            <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-proj-progress">Project Progress (%): <span id="progress-val-lbl" style="color: var(--accent); font-family: var(--font); font-weight: bold;">${project.progress || 0}%</span></label>
          <input type="range" id="edit-proj-progress" min="0" max="100" class="form-control" style="padding: 0; background: transparent; height: 16px;" value="${project.progress || 0}" oninput="document.getElementById('progress-val-lbl').textContent = this.value + '%'">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label for="edit-proj-start">Start Date</label>
            <input type="date" id="edit-proj-start" class="form-control" value="${project.startDate || ''}">
          </div>
          <div class="form-group">
            <label for="edit-proj-end">End Date</label>
            <input type="date" id="edit-proj-end" class="form-control" value="${project.endDate || ''}">
          </div>
        </div>

        <div class="form-group">
          <label for="edit-proj-notes">Project Notes / EDA Objectives</label>
          <textarea id="edit-proj-notes" class="form-control" rows="3">${project.notes || ''}</textarea>
        </div>

        <div class="form-group">
          <label for="edit-proj-github">GitHub Repository Link</label>
          <input type="url" id="edit-proj-github" class="form-control" placeholder="https://github.com/..." value="${project.github || ''}">
        </div>

        <div class="form-group">
          <label for="edit-proj-linkedin">LinkedIn Writeup Link</label>
          <input type="url" id="edit-proj-linkedin" class="form-control" placeholder="https://linkedin.com/in/..." value="${project.linkedin || ''}">
        </div>

        <!-- Drag & Drop Zone -->
        <div class="form-group">
          <label>Project ZIP Archive Attachment (Metadata Reading Only)</label>
          <div id="zip-dropzone" class="upload-dropzone" 
            ondragover="event.preventDefault(); this.style.borderColor='var(--accent)';" 
            ondragleave="this.style.borderColor='var(--border)';"
            ondrop="handleZipDrop(event)">
            <div>📁</div>
            <p id="zip-dropzone-text">Drag & Drop project submission ZIP file here, or click to upload</p>
            <input type="file" id="zip-file-input" accept=".zip" style="display: none;" onchange="handleZipSelect(this)">
            <div id="selected-zip-info" class="mt-4" style="font-size: 11px; font-family: var(--font); color: var(--accent); display: none;"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('project-edit-modal-overlay').remove()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>

      </form>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Setup click triggers file input on dropzone click
  const dropzone = document.getElementById('zip-dropzone');
  const fileInput = document.getElementById('zip-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
  }

  // Pre-populate zip details if already exists
  if (project.zipMetadata) {
    displayZipMetadata(project.zipMetadata);
  }
}

// Adjust progress slider depending on selected status
function onStatusSelectChange(status) {
  const progressSlider = document.getElementById('edit-proj-progress');
  const progressLbl = document.getElementById('progress-val-lbl');
  
  if (status === 'Completed' && progressSlider) {
    progressSlider.value = 100;
    if (progressLbl) progressLbl.textContent = '100%';
  } else if (status === 'Not Started' && progressSlider) {
    progressSlider.value = 0;
    if (progressLbl) progressLbl.textContent = '0%';
  }
}

// Global reference to holds current uploaded metadata
let tempZipMetadata = null;

function displayZipMetadata(metadata) {
  const textEl = document.getElementById('zip-dropzone-text');
  const infoEl = document.getElementById('selected-zip-info');
  
  if (textEl && infoEl) {
    textEl.innerHTML = "File selected successfully!";
    infoEl.style.display = 'block';
    infoEl.innerHTML = `
      File: <strong>${metadata.name}</strong><br>
      Size: <strong>${Math.round(metadata.size / 1024)} KB</strong><br>
      Modified: <strong>${metadata.lastModified}</strong>
    `;
  }
}

function handleZipDrop(e) {
  e.preventDefault();
  const dropzone = document.getElementById('zip-dropzone');
  if (dropzone) dropzone.style.borderColor = 'var(--border)';
  
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.name.endsWith('.zip')) {
      tempZipMetadata = {
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString().split('T')[0]
      };
      displayZipMetadata(tempZipMetadata);
    } else {
      alert("Only .zip files are accepted!");
    }
  }
}

function handleZipSelect(input) {
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    if (file.name.endsWith('.zip')) {
      tempZipMetadata = {
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString().split('T')[0]
      };
      displayZipMetadata(tempZipMetadata);
    } else {
      alert("Only .zip files are accepted!");
    }
  }
}

function saveProjectEdits(e) {
  e.preventDefault();
  
  const status = document.getElementById('edit-proj-status').value;
  const progress = parseInt(document.getElementById('edit-proj-progress').value, 10);
  const startDate = document.getElementById('edit-proj-start').value;
  const endDate = document.getElementById('edit-proj-end').value;
  const notes = document.getElementById('edit-proj-notes').value;
  const github = document.getElementById('edit-proj-github').value;
  const linkedin = document.getElementById('edit-proj-linkedin').value;

  const fields = { status, progress, startDate, endDate, notes, github, linkedin };
  
  // Attach ZIP if uploaded in this session
  if (tempZipMetadata) {
    fields.zipMetadata = tempZipMetadata;
    tempZipMetadata = null; // clear cache
  }

  // Update in localStorage
  const projects = Storage.get('px_projects') || [];
  const updated = projects.map(p => {
    if (p.id === activeEditingProjectId) {
      return { ...p, ...fields };
    }
    return p;
  });
  Storage.set('px_projects', updated);

  // Check-in module accountability
  updateAccountability('projects');

  // Recalculate daily score
  const todayStr = Storage.today();
  const scoreData = calcDailyScore(todayStr);
  Storage.mergeDate('px_scores', todayStr, scoreData);

  // Close modal
  const modalOverlay = document.getElementById('project-edit-modal-overlay');
  if (modalOverlay) modalOverlay.remove();
  
  renderProjectTrackerPage();
}
