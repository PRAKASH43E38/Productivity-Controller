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
  const tasksList = Storage.get('px_daily_tasks_list') || DAILY_TASKS;
  const totalTasks = Object.values(tasksList).flat().length;
  
  let completedCount = 0;
  Object.values(tasksList).flat().forEach(taskId => {
    if (dayTasks[taskId] === true) completedCount++;
  });
  
  const pct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  
  const progressFill = document.getElementById('planner-progress-fill');
  const progressText = document.getElementById('planner-progress-text');
  
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${pct}% (${completedCount}/${totalTasks} tasks completed)`;

  // Update classes for task elements
  Object.values(tasksList).flat().forEach((taskId) => {
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

function addCustomTask(category) {
  const inputEl = document.getElementById(`add-task-input-${category}`);
  if (!inputEl) return;
  const taskName = inputEl.value.trim();
  if (!taskName) return;
  
  const tasksList = Storage.get('px_daily_tasks_list') || JSON.parse(JSON.stringify(DAILY_TASKS));
  if (!tasksList[category]) {
    tasksList[category] = [];
  }
  
  // Check if it already exists in this category
  if (tasksList[category].includes(taskName)) {
    alert("Task already exists in this category!");
    return;
  }
  
  tasksList[category].push(taskName);
  Storage.set('px_daily_tasks_list', tasksList);
  
  // Clear input and reload page
  inputEl.value = '';
  renderDailyPlannerPage();
}

function deleteCustomTask(category, taskName) {
  if (!confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
    return;
  }
  
  const tasksList = Storage.get('px_daily_tasks_list') || JSON.parse(JSON.stringify(DAILY_TASKS));
  if (!tasksList[category]) return;
  
  tasksList[category] = tasksList[category].filter(t => t !== taskName);
  Storage.set('px_daily_tasks_list', tasksList);
  
  // Clean up any completion state for this task
  const dayTasks = Storage.getDate('px_daily_tasks', plannerDate);
  if (dayTasks[taskName] !== undefined) {
    delete dayTasks[taskName];
    Storage.setDate('px_daily_tasks', plannerDate, dayTasks);
  }
  
  // Recalculate daily score
  const scoreData = calcDailyScore(plannerDate);
  Storage.mergeDate('px_scores', plannerDate, scoreData);

  renderDailyPlannerPage();
}

function renderDailyPlannerPage() {
  const todayStr = Storage.today();
  const dayTasks = Storage.getDate('px_daily_tasks', plannerDate);
  const tasksList = Storage.get('px_daily_tasks_list') || DAILY_TASKS;
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
          ${(tasksList.morning || []).map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()" style="position: relative; padding-right: 32px;">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
                <span class="delete-task-btn" onclick="event.stopPropagation(); deleteCustomTask('morning', '${task.replace(/'/g, "\\'")}')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #ff4a4a; font-size: 16px; font-weight: bold; opacity: 0.5; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">&times;</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="add-task-form" style="display: flex; gap: 8px; margin-top: 12px; padding: 0 4px;">
          <input type="text" id="add-task-input-morning" placeholder="Add morning task..." class="form-control" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(0,0,0,0.2); color: var(--text);">
          <button onclick="addCustomTask('morning')" class="btn btn-primary" style="padding: 4px 10px; font-size: 14px; border-radius: 4px; font-weight: bold; line-height: 1;">+</button>
        </div>
      </div>

      <!-- Syllabus Study Tasks -->
      <div class="card task-list-container">
        <h3>Syllabus Practice</h3>
        <div class="task-items">
          ${(tasksList.learning || []).map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()" style="position: relative; padding-right: 32px;">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
                <span class="delete-task-btn" onclick="event.stopPropagation(); deleteCustomTask('learning', '${task.replace(/'/g, "\\'")}')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #ff4a4a; font-size: 16px; font-weight: bold; opacity: 0.5; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">&times;</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="add-task-form" style="display: flex; gap: 8px; margin-top: 12px; padding: 0 4px;">
          <input type="text" id="add-task-input-learning" placeholder="Add study task..." class="form-control" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(0,0,0,0.2); color: var(--text);">
          <button onclick="addCustomTask('learning')" class="btn btn-primary" style="padding: 4px 10px; font-size: 14px; border-radius: 4px; font-weight: bold; line-height: 1;">+</button>
        </div>
      </div>

      <!-- Projects and Github Updates -->
      <div class="card task-list-container">
        <h3>Portfolio Projects</h3>
        <div class="task-items">
          ${(tasksList.projects || []).map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()" style="position: relative; padding-right: 32px;">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
                <span class="delete-task-btn" onclick="event.stopPropagation(); deleteCustomTask('projects', '${task.replace(/'/g, "\\'")}')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #ff4a4a; font-size: 16px; font-weight: bold; opacity: 0.5; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">&times;</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="add-task-form" style="display: flex; gap: 8px; margin-top: 12px; padding: 0 4px;">
          <input type="text" id="add-task-input-projects" placeholder="Add project task..." class="form-control" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(0,0,0,0.2); color: var(--text);">
          <button onclick="addCustomTask('projects')" class="btn btn-primary" style="padding: 4px 10px; font-size: 14px; border-radius: 4px; font-weight: bold; line-height: 1;">+</button>
        </div>
      </div>

      <!-- Reading and Communication -->
      <div class="card task-list-container">
        <h3>Career Prep</h3>
        <div class="task-items">
          ${(tasksList.other || []).map(task => {
            const cleanId = task.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
            const isDone = dayTasks[task] === true;
            return `
              <div class="task-item ${isDone ? 'completed' : ''}" id="task-card-${cleanId}" onclick="document.getElementById('check-${cleanId}').click()" style="position: relative; padding-right: 32px;">
                <input type="checkbox" id="check-${cleanId}" class="task-checkbox" 
                  ${isDone ? 'checked' : ''} 
                  onclick="event.stopPropagation(); toggleTask('${task}', this.checked)">
                <span class="task-label">${task}</span>
                <span class="delete-task-btn" onclick="event.stopPropagation(); deleteCustomTask('other', '${task.replace(/'/g, "\\'")}')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #ff4a4a; font-size: 16px; font-weight: bold; opacity: 0.5; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">&times;</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="add-task-form" style="display: flex; gap: 8px; margin-top: 12px; padding: 0 4px;">
          <input type="text" id="add-task-input-other" placeholder="Add prep task..." class="form-control" style="flex: 1; padding: 6px 10px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(0,0,0,0.2); color: var(--text);">
          <button onclick="addCustomTask('other')" class="btn btn-primary" style="padding: 4px 10px; font-size: 14px; border-radius: 4px; font-weight: bold; line-height: 1;">+</button>
        </div>
      </div>

    </div>
  `;

  // Render current states
  renderPlannerProgress();
}
