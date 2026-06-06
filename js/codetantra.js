// codetantra.js — CodeTantra view controller showing milestones and histories

const MILESTONES = [
  { pct: 40, label: "Foundation", desc: "Basic Python constructs, operations, and control structures" },
  { pct: 55, label: "Intermediate", desc: "Lists, Sets, Dictionaries, and functional coding styles" },
  { pct: 80, label: "Advanced", desc: "Object-oriented structures, exceptions, files, and libraries" },
  { pct: 100, label: "Complete", desc: "Virtual envs, custom modules, iterators, and code quality" }
];

function submitCodeTantraProgress(e) {
  e.preventDefault();
  
  const pctInput = document.getElementById('ct-progress-input');
  if (!pctInput) return;
  
  let newPct = parseFloat(pctInput.value);
  if (isNaN(newPct) || newPct < 0 || newPct > 100) {
    alert("Please enter a valid percentage between 0 and 100");
    return;
  }
  
  // Format to 1 decimal place or integer
  newPct = Math.round(newPct * 10) / 10;

  const ct = Storage.get('px_codetantra') || { current: 0, history: [] };
  
  // Push to history
  ct.history.push({ date: Storage.today(), value: newPct });
  ct.current = newPct;
  Storage.set('px_codetantra', ct);
  
  // Check-in module accountability
  updateAccountability('codetantra');
  
  // Recalculate daily score
  const todayStr = Storage.today();
  const scoreData = calcDailyScore(todayStr);
  Storage.mergeDate('px_scores', todayStr, scoreData);
  
  pctInput.value = '';
  renderCodeTantraPage();
}

function renderCodeTantraPage() {
  const ct = Storage.get('px_codetantra') || { current: 0, history: [] };
  const currentPct = ct.current || 0;

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>CodeTantra Tracker</h1>
        <p>Log your official academic platform completion and syllabus milestones</p>
      </div>
      <div>
        <span class="badge badge-accent">Current: ${currentPct}%</span>
      </div>
    </div>

    <div class="codetantra-tracker">
      
      <!-- Left side: Current progress & log form -->
      <div class="card codetantra-panel">
        <h4 class="stat-label" style="font-size: 14px; text-transform: uppercase;">Official Completion</h4>
        <div id="ct-circular-progress-holder"></div>
        
        <form onsubmit="submitCodeTantraProgress(event)" style="width: 100%; margin-top: 16px;">
          <div class="form-group">
            <label for="ct-progress-input">Log New Completion (%)</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" id="ct-progress-input" class="form-control" 
                placeholder="e.g. 42.5" min="0" max="100" step="0.1" required>
              <button type="submit" class="btn btn-primary">Update</button>
            </div>
          </div>
        </form>
      </div>

      <!-- Right side: Milestones & History -->
      <div style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Milestones list -->
        <div class="card">
          <div class="card-title">Syllabus Milestones</div>
          <div class="milestones-list">
            ${MILESTONES.map(m => {
              const reached = currentPct >= m.pct;
              return `
                <div class="milestone-item ${reached ? 'reached' : ''}">
                  <div class="milestone-label">
                    <span class="milestone-name">${m.label} (${m.pct}%)</span>
                    <span class="milestone-desc">${m.desc}</span>
                  </div>
                  <span class="milestone-pct">${reached ? '&#10004;' : 'Locked'}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- History table -->
        <div class="card codetantra-history-card">
          <div class="card-title">Log History</div>
          <div style="max-height: 250px; overflow-y: auto;">
            <table class="codetantra-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Completions %</th>
                  <th>Progress delta</th>
                </tr>
              </thead>
              <tbody>
                ${ct.history.length === 0 ? `
                  <tr>
                    <td colspan="3" style="text-align: center; color: var(--text-muted); font-size: 13px;">No updates logged yet.</td>
                  </tr>
                ` : [...ct.history].reverse().map((item, idx, arr) => {
                  // Calculate delta if possible
                  let deltaStr = '-';
                  if (idx < arr.length - 1) {
                    const prevVal = arr[idx + 1].value;
                    const diff = item.value - prevVal;
                    const sign = diff >= 0 ? '+' : '';
                    deltaStr = `<span style="color: ${diff >= 0 ? 'var(--accent)' : 'var(--red)'}">${sign}${diff.toFixed(1)}%</span>`;
                  }
                  return `
                    <tr>
                      <td>${item.date}</td>
                      <td><strong>${item.value}%</strong></td>
                      <td>${deltaStr}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;

  // Draw circular progress indicator
  renderCircularProgress(currentPct, 'ct-circular-progress-holder');
}
