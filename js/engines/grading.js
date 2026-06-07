// grading.js — Grading and placement readiness formulas

// Subject progress calculation
function getSubjectPct(subjectId) {
  const topics = Storage.get('px_topics') || {};
  const subject = ROADMAP[subjectId];
  if (!subject || !subject.topics || subject.topics.length === 0) return 0;
  
  const completed = subject.topics.filter((_, i) => topics[`${subjectId}_${i}`] === true).length;
  return Math.round((completed / subject.topics.length) * 100);
}

// Average percentage across all learning subjects
function getLearningPct() {
  const subjects = Object.keys(ROADMAP);
  if (subjects.length === 0) return 0;
  
  const total = subjects.reduce((sum, id) => sum + getSubjectPct(id), 0);
  return Math.round(total / subjects.length);
}

// Project completion percentage (completed / total)
function getProjectsPct() {
  const projects = Storage.get('px_projects') || [];
  if (projects.length === 0) return 0;
  
  const completed = projects.filter(p => p.status === 'Completed').length;
  return Math.round((completed / projects.length) * 100);
}

// Average habit completion rate over the last 30 days
function getHabitsAvg30() {
  const today = new Date();
  let totalPctSum = 0;
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayHabits = Storage.getDate('px_habits', dateStr);
    
    let doneCount = 0;
    for (let hIdx = 0; hIdx < HABITS.length; hIdx++) {
      if (dayHabits[`habit_${hIdx}`] === true) {
        doneCount++;
      }
    }
    const dayPct = HABITS.length > 0 ? (doneCount / HABITS.length) * 100 : 0;
    totalPctSum += dayPct;
  }
  
  return Math.round(totalPctSum / 30);
}

const getHabitsLast30 = getHabitsAvg30; // Alias

// CodeTantra completion percentage
function getCodeTantraPct() {
  const ct = Storage.get('px_codetantra');
  return ct ? (ct.current || 0) : 0;
}

// Main placement readiness formula
function getPlacementScore() {
  const learning = getLearningPct();       // avg of all subjects
  const projects = getProjectsPct();       // completed/total
  const habits = getHabitsAvg30();         // avg daily completion %
  const codetantra = getCodeTantraPct();   // current value
  const accountability = getAccScore();    // avg last 30 days
  
  return Math.round((learning + projects + habits + codetantra + accountability) / 5);
}

// Complete report cards grading engine
function calculateGrade() {
  const learning = getLearningPct();
  const projects = getProjectsPct();
  const habits = getHabitsAvg30();
  const ct = getCodeTantraPct();
  const accountability = getAccScore();

  const final = (learning + projects + habits + ct + accountability) / 5;

  const grade =
    final >= 95 ? 'A+' :
    final >= 85 ? 'A'  :
    final >= 75 ? 'B'  :
    final >= 65 ? 'C'  :
    final >= 50 ? 'D'  : 'F';

  return {
    final: Math.round(final),
    grade,
    learning,
    projects,
    habits,
    codetantra: ct,
    accountability
  };
}

function calcDailyScore(date = Storage.today()) {
  const tasks = Storage.getDate('px_daily_tasks', date);
  const habits = Storage.getDate('px_habits', date);
  const ct = Storage.get('px_codetantra');
  const tasksList = Storage.get('px_daily_tasks_list') || DAILY_TASKS;

  // Learning score - dynamic
  const learningTasks = tasksList.learning || [];
  const learningDone = learningTasks.filter(taskLabel => tasks[taskLabel] === true).length;
  const learning = learningTasks.length > 0 ? Math.round((learningDone / learningTasks.length) * 20) : 0;

  // Projects score - dynamic
  const projectTasks = tasksList.projects || [];
  const projectTasksOnly = projectTasks.filter(task => !task.toLowerCase().includes('github'));
  const projectDone = projectTasksOnly.filter(task => tasks[task] === true).length;
  const projects = projectTasksOnly.length > 0 ? Math.round((projectDone / projectTasksOnly.length) * 20) : 0;

  // GitHub contribution score - dynamic
  const githubTasks = projectTasks.filter(task => task.toLowerCase().includes('github'));
  const githubDone = githubTasks.some(task => tasks[task] === true) || tasks['GitHub Update'] === true;
  const github = githubDone ? 20 : 0;

  const ctUpdatedToday = (ct?.history || []).some(h => h.date === date);
  const codetantra = ctUpdatedToday ? 20 : 0;

  const habitsDone = HABITS.filter((_, i) => habits[`habit_${i}`] === true).length;
  const habitsScore = HABITS.length > 0 ? Math.round((habitsDone / HABITS.length) * 20) : 0;

  const total = learning + projects + github + codetantra + habitsScore;
  return { learning, projects, github, codetantra, habits: habitsScore, total };
}

function renderCircularProgress(pct, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const r = 54, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  container.innerHTML = `
    <svg width="120" height="120" viewBox="0 0 120 120" style="display: block; margin: 0 auto;">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="rgba(0,255,136,0.08)" stroke-width="8"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="#00ff88" stroke-width="8"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"
        style="transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);"/>
      <text x="${cx}" y="${cy - 4}" text-anchor="middle"
        dominant-baseline="central"
        fill="#00ff88" font-size="20" font-family="monospace"
        font-weight="bold">${pct}</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle"
        fill="#666" font-size="9" font-family="monospace">/ 100</text>
    </svg>`;
}

