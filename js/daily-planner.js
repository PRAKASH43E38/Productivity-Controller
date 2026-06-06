// daily-planner.js — Daily planner controller with calendar navigation and task groups

let plannerDate = Storage.today();

function prevDay() {
  const d = new Date(plannerDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  plannerDate = d.toISOString().split('T')[0];
  renderDailyPlannerPage();
}

function nextDay() {
  const d = new Date(plannerDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const today = Storage.today();
  if (d.toISOString().split('T')[0] <= today) {
    plannerDate = d.toISOString().split('T')[0];
    renderDailyPlannerPage();
  }
}

function toggleTask(taskId, done) {
  Storage.mergeDate('px_daily_tasks', plannerDate, { [taskId]: done });
  
  // Update accountability if editing today's tasks
  if (plannerDate === Storage.today()) {
    updateAccountability('planner');
  }
  
  // Recalculate daily score
  const scoreData = calcDailyScore(plannerDate);
  Storage.mergeDate('px_scores', plannerDate, scoreData);

  renderPlannerProgress();
}

function renderPlannerProgress() {
  const dayTasks = Storage.getDate('px_daily_tasks', plannerDate);
  const totalTasks = Object.values(DAILY_TASKS).flat().length;
  
  let completedCount = 0;
  Object.values(DAILY_TASKS).flat().forEach(taskId => {
    if (dayTasks[taskId] === true) completedCount++;
  });
  
  const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  
  const progressFill = document.getElementById('planner-progress-fill');
  const progressText = document.getElementById('planner-progress-text');
  
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${pct}% (${completedCount}/${totalTasks} tasks completed)`;

  // Update classes for task elements
  Object.values(DAILY_TASKS).flat().forEach((taskId) => {
    const el = document.getElementById(`task-card-${taskId.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`);
    if (el) {
      const isDone = dayTasks[taskId] === true;
      el.classList.toggle('completed', isDone);
      const checkbox = el.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = isDone;
    }
  });

  // Re-draw circular today progress indicator if available
  const circularContainer = document.getElementById('planner-day-score-circle');
  if (circularContainer) {
    const scores = calcDailyScore(plannerDate);
    renderCircularProgress(scores.total, 'planner-day-score-circle');
  }
}

function renderDailyPlannerPage() {
  const todayStr = Storage.today();
  const dayTasks = Storage.getDate('px_daily_tasks', plannerDate);
  const isFutureLocked = plannerDate >= todayStr;

  const displayDateText = new Date(plannerDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Daily Planner</h1>
        <p>Stay accountable, organize tasks, and practice daily execution</p>
      </div>
      
      <!-- Day Navigation -->
      <div class="planner-navigation">
        <button onclick="prevDay()" class="btn btn-secondary">&laquo; Prev Day</button>
        <span class="planner-date-display">${displayDateText} ${plannerDate === todayStr ? '<span class="badge badge-accent">TODAY</span>' : ''}</span>
        <button onclick="nextDay()" class="btn btn-secondary" ${isFutureLocked ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>Next Day &raquo;</button>
      </div>
    </div>

    <!-- Daily Progress summary card -->
    <div class="card mb-4" style="display: grid; grid-template-columns: 3fr 1fr; gap: 20px; align-items: center;">
      <div>
        <h3 class="mb-4" style="font-size: 18px;">Planner Completion Rate</h3>
        <div class="progress-container">
          <div class="progress-info">
            <span id="planner-progress-text">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="planner-progress-fill" style="width: 0%"></div>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <span class="stat-label" style="font-size: 11px; margin-bottom: 4px;">DAILY SCORE</span>
        <div id="planner-day-score-circle"></div>
      </div>
    </div>

    <!-- Task Groups Grid -->
    <div class="planner-grid">
      
      <!-- Morning Routine -->
      <div class="card task-list-container">
        <h3>Morning Accountability</h3>
        <div class="task-items">
          ${DAILY_TASKS.morning.map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Syllabus Study Tasks -->
      <div class="card task-list-container">
        <h3>Syllabus Practice</h3>
        <div class="task-items">
          ${DAILY_TASKS.learning.map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Projects and Github Updates -->
      <div class="card task-list-container">
        <h3>Portfolio Projects</h3>
        <div class="task-items">
          ${DAILY_TASKS.projects.map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Reading and Communication -->
      <div class="card task-list-container">
        <h3>Career Prep</h3>
        <div class="task-items">
          ${DAILY_TASKS.other.map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  // Render current states
  renderPlannerProgress();
}
