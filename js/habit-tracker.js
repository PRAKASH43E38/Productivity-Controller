// habit-tracker.js — Habit tracking with dynamic grid heatmaps and streak counters

function toggleHabit(habitIndex, done) {
  const todayStr = Storage.today();
  const key = `habit_${habitIndex}`;
  
  Storage.mergeDate('px_habits', todayStr, { [key]: done });
  
  // Update accountability check-in
  updateAccountability('habits');
  
  // Recalculate daily score
  const scoreData = calcDailyScore(todayStr);
  Storage.mergeDate('px_scores', todayStr, scoreData);

  renderHabitTrackerPage();
}

// Interactive monthly heatmap generator
function renderHabitHeatmap(habitIndex) {
  const container = document.createElement('div');
  container.className = 'heatmap-grid';
  
  const key = `habit_${habitIndex}`;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  
  // Get number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get first day of the month to pad columns if we want to align to weekdays
  // Let's align to Monday (1) or Sunday (0)
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1...
  
  // Render column headers for weekdays (S, M, T, W, T, F, S)
  const daysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  daysShort.forEach(dName => {
    const lbl = document.createElement('div');
    lbl.className = 'heatmap-day-label';
    lbl.textContent = dName;
    container.appendChild(lbl);
  });
  
  // Pad the grid with empty cells before the first day of the month
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'heatmap-cell';
    emptyCell.style.opacity = '0';
    emptyCell.style.pointerEvents = 'none';
    container.appendChild(emptyCell);
  }
  
  const settings = Storage.get('px_settings') || DEFAULT_SETTINGS;
  const regDate = settings.startDate;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const habitsData = Storage.getDate('px_habits', dateStr);
    const done = habitsData[key] === true;
    
    const cell = document.createElement('div');
    cell.className = `heatmap-cell ${done ? 'done' : 'empty'}`;
    
    // Nice tooltip
    let statusText = done ? 'Completed' : 'Not Done';
    if (dateStr > Storage.today()) {
      statusText = 'Future date';
      cell.style.opacity = '0.3';
    } else if (dateStr < regDate) {
      statusText = 'Before Registration';
      cell.style.opacity = '0.3';
    }
    cell.title = `${dateStr}: ${statusText}`;
    
    // Toggle habits on heatmap click (only for past/current days after registration)
    if (dateStr <= Storage.today() && dateStr >= regDate) {
      cell.addEventListener('click', () => {
        const habitsForDay = Storage.getDate('px_habits', dateStr);
        const nextState = !(habitsForDay[key] === true);
        
        Storage.mergeDate('px_habits', dateStr, { [key]: nextState });
        
        if (dateStr === Storage.today()) {
          updateAccountability('habits');
        }
        
        // Update score
        const scoreData = calcDailyScore(dateStr);
        Storage.mergeDate('px_scores', dateStr, scoreData);
        
        renderHabitTrackerPage();
      });
    }
    
    container.appendChild(cell);
  }
  
  return container;
}

// Calculate details for a habit (streak, percentage)
function calculateHabitStats(habitIndex) {
  const key = `habit_${habitIndex}`;
  const today = new Date();
  
  let currentStreak = 0;
  let maxStreak = 0;
  let completions30 = 0;
  
  // Calculate over past 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayHabits = Storage.getDate('px_habits', dateStr);
    
    if (dayHabits[key] === true) {
      completions30++;
    }
  }

  // Calculate current streak (backwards from today)
  let checkDate = new Date(today);
  // If today isn't done yet, check if yesterday was done to preserve streak
  const todayHabits = Storage.getDate('px_habits', today.toISOString().split('T')[0]);
  if (todayHabits[key] !== true) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayHabits = Storage.getDate('px_habits', dateStr);
    
    if (dayHabits[key] === true) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    
    // Break loop safety
    if (currentStreak > 365) break;
  }

  // Calculate max streak (all time)
  let tempStreak = 0;
  const pxHabits = Storage.get('px_habits') || {};
  
  // Sort dates ascending
  const dates = Object.keys(pxHabits).sort();
  dates.forEach(dStr => {
    if (pxHabits[dStr][key] === true) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  return {
    completionRate: Math.round((completions30 / 30) * 100),
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak)
  };
}

function renderHabitTrackerPage() {
  const todayStr = Storage.today();
  const todayHabits = Storage.getDate('px_habits', todayStr);
  const totalHabits = HABITS.length;
  
  // Total completions overall
  const habitsPct = getHabitsAvg30();

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Habit Tracker</h1>
        <p>Maintain consistent streaks and build professional discipline</p>
      </div>
      <div>
        <span class="badge badge-accent">30-Day Average: ${habitsPct}%</span>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="card mb-4" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
      <div>
        <span class="stat-label">Consistency Score</span>
        <h3 class="stat-value accent" style="font-size: 28px; margin-top: 6px;">${habitsPct}%</h3>
      </div>
      <div>
        <span class="stat-label">Active Habits</span>
        <h3 class="stat-value" style="font-size: 28px; margin-top: 6px;">${totalHabits}</h3>
      </div>
      <div>
        <span class="stat-label">Today Completed</span>
        <h3 class="stat-value" style="font-size: 28px; margin-top: 6px;">
          ${HABITS.filter((_, i) => todayHabits[`habit_${i}`] === true).length} / ${totalHabits}
        </h3>
      </div>
    </div>

    <div class="card mb-4">
      <p style="font-size: 13px; color: var(--text-secondary); text-align: center;">
        <span style="color: var(--accent); font-weight: bold;">Tip:</span> Click any cell in a habit's calendar grid to toggle completion for that specific day.
      </p>
    </div>

    <!-- Habits Grid list -->
    <div class="habits-grid" id="habits-container">
      <!-- Habit cards rendered dynamically -->
    </div>
  `;

  // Render cards dynamically
  const container = document.getElementById('habits-container');
  if (container) {
    HABITS.forEach((habit, index) => {
      const stats = calculateHabitStats(index);
      const isTodayDone = todayHabits[`habit_${index}`] === true;
      
      const card = document.createElement('div');
      card.className = 'card habit-card';
      
      card.innerHTML = `
        <div class="habit-header">
          <div class="habit-details">
            <h3>${habit}</h3>
            <p>Streak: ${stats.currentStreak} days (Max: ${stats.maxStreak})</p>
          </div>
          <div>
            <input type="checkbox" class="task-checkbox" id="habit-chk-${index}" 
              ${isTodayDone ? 'checked' : ''} 
              onchange="toggleHabit(${index}, this.checked)">
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-info">
            <span>30-Day Completion Rate</span>
            <span>${stats.completionRate}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${stats.completionRate}%"></div>
          </div>
        </div>

        <div style="margin-top: 10px;">
          <span class="stat-label" style="font-size: 11px; display: block; margin-bottom: 6px;">Calendar Heatmap</span>
          <!-- Heatmap gets appended here -->
          <div class="heatmap-wrapper" id="heatmap-holder-${index}"></div>
        </div>
      `;
      
      container.appendChild(card);
      
      // Mount the heatmap
      const heatmapHolder = document.getElementById(`heatmap-holder-${index}`);
      if (heatmapHolder) {
        heatmapHolder.appendChild(renderHabitHeatmap(index));
      }
    });
  }
}
