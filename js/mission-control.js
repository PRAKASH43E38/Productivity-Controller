// mission-control.js — System Settings, JSON Backup/Restores, and Accountability Heatmaps

function saveSettings(e) {
  e.preventDefault();
  
  const name = document.getElementById('settings-name').value.trim();
  const startDate = document.getElementById('settings-start-date').value;
  const targetDate = document.getElementById('settings-target-date').value;
  const mission = document.getElementById('settings-mission').value.trim();

  if (!name || !startDate || !targetDate || !mission) {
    alert("Please fill in all setting fields.");
    return;
  }

  const settings = { name, startDate, targetDate, mission };
  Storage.set('px_settings', settings);

  // Update sidebar elements
  updateSidebarProfile();

  alert("System parameters updated successfully!");
  renderMissionControlPage();
}

function handleBackupImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      // Basic keys validation
      const keys = ['px_daily_tasks', 'px_habits', 'px_topics', 'px_projects',
                    'px_codetantra', 'px_weekly_reviews', 'px_scores',
                    'px_accountability', 'px_settings'];
      
      let validKeysCount = 0;
      keys.forEach(k => {
        if (data[k] !== undefined) {
          Storage.set(k, data[k]);
          validKeysCount++;
        }
      });

      if (validKeysCount > 0) {
        updateSidebarProfile();
        alert("System restore completed successfully! Refreshing dashboard...");
        Router.navigate('#dashboard');
      } else {
        alert("Invalid backup file: Format mismatch.");
      }
    } catch (err) {
      alert("Error parsing backup JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

async function triggerReset() {
  if (confirm("🚨 WARNING: Are you sure you want to hard reset ALL your data? This will clear all topic checkmarks, habits history, projects, and weekly retrospectives. This action is IRREVERSIBLE.")) {
    localStorage.clear();
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to reset backend database:', e);
    }
    // Reload database and update cache/defaults
    await Storage.loadFromServer();
    updateSidebarProfile();
    alert("System database has been reset to default values.");
    Router.navigate('#dashboard');
  }
}

function exportData() {
  const keys = ['px_daily_tasks', 'px_habits', 'px_topics', 'px_projects',
                'px_codetantra', 'px_weekly_reviews', 'px_scores',
                'px_accountability', 'px_settings'];
  const backup = {};
  keys.forEach(k => backup[k] = Storage.get(k));

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productivex_backup_${Storage.today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderMissionControlPage() {
  const settings = Storage.get('px_settings') || DEFAULT_SETTINGS;
  const todayStr = Storage.today();
  
  // Calculate daily score details
  const scores = calcDailyScore(todayStr);

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Mission Control</h1>
        <p>Manage career configurations, data backups, and view long-term logs</p>
      </div>
      <div>
        <button onclick="exportData()" class="btn btn-secondary">Export Backup JSON</button>
      </div>
    </div>

    <div class="mission-control-layout">
      
      <!-- Left side: Today's score & Settings -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Score card breakdown -->
        <div class="card daily-score-card">
          <div class="card-title" style="width: 100%; text-align: left;">
            <span>Daily Score Breakdown</span>
            <span class="value" style="font-family: var(--font);">${scores.total} / 100</span>
          </div>
          
          <div id="mc-circular-score-holder" class="mb-4"></div>
          
          <div class="scores-breakdown">
            <div class="score-breakdown-row">
              <span class="score-breakdown-label">Syllabus Study (tasks checked-in)</span>
              <span class="score-breakdown-val">${scores.learning} / 20</span>
            </div>
            <div class="score-breakdown-row">
              <span class="score-breakdown-label">Project Development (task checked-in)</span>
              <span class="score-breakdown-val">${scores.projects} / 20</span>
            </div>
            <div class="score-breakdown-row">
              <span class="score-breakdown-label">GitHub Contribution (task checked-in)</span>
              <span class="score-breakdown-val">${scores.github} / 20</span>
            </div>
            <div class="score-breakdown-row">
              <span class="score-breakdown-label">CodeTantra Syllabus update (today)</span>
              <span class="score-breakdown-val">${scores.codetantra} / 20</span>
            </div>
            <div class="score-breakdown-row">
              <span class="score-breakdown-label">Discipline Habits (rate completed)</span>
              <span class="score-breakdown-val">${scores.habits} / 20</span>
            </div>
          </div>
        </div>

        <!-- Career Target parameters form -->
        <div class="card">
          <div class="card-title">Career Configurations</div>
          <form onsubmit="saveSettings(event)">
            
            <div class="form-group">
              <label for="settings-name">Candidate Full Name</label>
              <input type="text" id="settings-name" class="form-control" value="${settings.name || ''}" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label for="settings-start-date">Prep Start Date</label>
                <input type="date" id="settings-start-date" class="form-control" value="${settings.startDate || ''}" required>
              </div>
              <div class="form-group">
                <label for="settings-target-date">Target Placement Date</label>
                <input type="date" id="settings-target-date" class="form-control" value="${settings.targetDate || ''}" required>
              </div>
            </div>

            <div class="form-group">
              <label for="settings-mission">Core Career Mission Statement</label>
              <textarea id="settings-mission" class="form-control" rows="3" required>${settings.mission || ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
              <button type="submit" class="btn btn-primary">Update Configuration</button>
            </div>

          </form>
        </div>

      </div>

      <!-- Right side: Accountability Heatmap & Database Consoles -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Contributor Grid Card -->
        <div class="card">
          <div class="card-title">Yearly Accountability Heatmap</div>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
            Hover cells to see module milestones. Click any cell to view the logs details for that specific day.
          </p>
          <div id="annual-heatmap-grid-holder">
            <!-- Loaded dynamically from accountability.js -->
          </div>
        </div>

        <!-- Database console: Import / Reset Backup -->
        <div class="card">
          <div class="card-title">System Console & Data Backup</div>
          
          <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 10px;">
            <div>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">Restore database from a local JSON backup file:</p>
              <input type="file" id="backup-file-selector" accept=".json" style="display: none;" onchange="handleBackupImport(event)">
              <button onclick="document.getElementById('backup-file-selector').click()" class="btn btn-secondary" style="width: 100%;">
                Import Backup JSON
              </button>
            </div>

            <div style="border-top: 1px solid rgba(255, 255, 255, 0.04); padding-top: 16px; margin-top: 8px;">
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">Restore application database to default boilerplate state:</p>
              <button onclick="triggerReset()" class="btn btn-danger" style="width: 100%;">
                Hard Reset System
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Draw circular scores progress
  renderCircularProgress(scores.total, 'mc-circular-score-holder');

  // Load and append yearly heatmap
  const heatmapHolder = document.getElementById('annual-heatmap-grid-holder');
  if (heatmapHolder) {
    heatmapHolder.appendChild(renderYearlyHeatmap());
  }
}
