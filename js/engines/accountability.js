// accountability.js — Accountability engine for daily check-ins and heatmaps

const ACC_COLORS = {
  0: '#000000',   // Black — 0% modules checked
  1: '#103010',   // Very dark green
  2: '#1b521b',   // Dark green
  3: '#2d802d',   // Medium green
  4: '#4cb34c',   // Green
  5: '#7cff8a'    // Light green — 100% perfect day
};

function calcAccountabilityScore(date) {
  const acc = Storage.getDate('px_accountability', date);
  return ['planner', 'habits', 'learning', 'projects', 'codetantra']
    .filter(k => acc[k] === true).length; // 0–5
}

function updateAccountability(module) {
  Storage.mergeDate('px_accountability', Storage.today(), { [module]: true });
}

// Calculate average accountability score over the last 30 days as a percentage (0-100)
function getAccountabilityAvg30() {
  const today = new Date();
  let totalScore = 0;
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    totalScore += calcAccountabilityScore(dateStr); // returns 0-5
  }
  
  // Max score for 30 days is 30 * 5 = 150
  return Math.round((totalScore / 150) * 100);
}

// Alias for formula compatibility
const getAccScore = getAccountabilityAvg30;

function renderYearlyHeatmap() {
  const container = document.createElement('div');
  container.className = 'yearly-heatmap-wrapper';
  
  // Headers for days of the week (column labels)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const today = new Date();
  
  // To align with a grid of weeks, we start exactly 364 days ago (52 weeks)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  
  // Shift start date to the nearest Sunday to keep grid columns aligned nicely
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);
  
  const gridContainer = document.createElement('div');
  gridContainer.className = 'yearly-heatmap-grid';
  
  const settings = Storage.get('px_settings') || DEFAULT_SETTINGS;
  const registrationDate = settings.startDate;
  
  const cells = [];
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const score = calcAccountabilityScore(dateStr);
    
    // Determine color. If date is before user registration date, make it neutral (#141414)
    // If it's after registration date but has 0 score, it is red (did not show up)
    // If it is in the future, make it neutral (#111111)
    let color = '#141414';
    if (dateStr >= registrationDate && dateStr <= Storage.today()) {
      color = ACC_COLORS[score] || '#141414';
    } else if (dateStr > Storage.today()) {
      color = '#111111';
    }
    
    cells.push({ date: dateStr, score, color });
  }

  // Generate grid layout (53 columns of 7 rows)
  cells.forEach(({ date, score, color }) => {
    const cell = document.createElement('div');
    cell.className = 'year-cell';
    cell.style.background = color;
    
    // Nice status text for tooltip
    let statusText = 'No session';
    if (date >= registrationDate && date <= Storage.today()) {
      statusText = `${score}/5 modules completed`;
    }
    
    cell.title = `${date}: ${statusText}`;
    cell.dataset.date = date;
    
    // Interactive element: click to view that day's log summary
    cell.addEventListener('click', () => {
      showDayDetailModal(date);
    });
    
    gridContainer.appendChild(cell);
  });

  // Assemble the widget
  container.appendChild(gridContainer);
  
  // Add legend
  const legend = document.createElement('div');
  legend.className = 'heatmap-legend';
  legend.innerHTML = `
    <span>Less</span>
    <div class="legend-box" style="background: #141414" title="Not Registered"></div>
    <div class="legend-box" style="background: ${ACC_COLORS[0]}" title="Missed (0/5)"></div>
    <div class="legend-box" style="background: ${ACC_COLORS[1]}" title="1/5 Completed"></div>
    <div class="legend-box" style="background: ${ACC_COLORS[2]}" title="2/5 Completed"></div>
    <div class="legend-box" style="background: ${ACC_COLORS[3]}" title="3/5 Completed"></div>
    <div class="legend-box" style="background: ${ACC_COLORS[4]}" title="4/5 Completed"></div>
    <div class="legend-box" style="background: ${ACC_COLORS[5]}" title="Perfect Day (5/5)"></div>
    <span>More</span>
  `;
  container.appendChild(legend);

  return container;
}

// Show a modal with summary of activities for a clicked day in the heatmap
function showDayDetailModal(date) {
  const tasks = Storage.getDate('px_daily_tasks', date);
  const habits = Storage.getDate('px_habits', date);
  const acc = Storage.getDate('px_accountability', date);
  
  // Format habits completed
  const habitsList = HABITS.map((h, i) => {
    const done = habits[`habit_${i}`] || false;
    return `<li><span class="status-indicator ${done ? 'done' : 'missed'}"></span> ${h}</li>`;
  }).join('');

  // Format modules checked-in
  const modulesChecked = ['planner', 'habits', 'learning', 'projects', 'codetantra'].map(m => {
    const checked = acc[m] || false;
    return `<span class="badge ${checked ? 'badge-accent' : 'badge-neutral'}">${m.toUpperCase()}</span>`;
  }).join(' ');

  // Create overlay and modal structure dynamically
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = () => overlay.remove();
  
  const modal = document.createElement('div');
  modal.className = 'modal-content card';
  modal.onclick = (e) => e.stopPropagation(); // prevent closing when clicking inside modal
  
  modal.innerHTML = `
    <div class="modal-header">
      <h3>Activity Log — ${date}</h3>
      <button class="modal-close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="meta-section">
        <h4>Modules Completed:</h4>
        <div class="badge-group">${modulesChecked}</div>
      </div>
      
      <div class="habits-section mt-4">
        <h4>Habit Tracking:</h4>
        <ul class="modal-habits-list">${habitsList}</ul>
      </div>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
