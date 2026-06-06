// dashboard.js — View controller for the main Dashboard page

function renderDashboardPage() {
  const settings = Storage.get('px_settings') || DEFAULT_SETTINGS;
  const todayStr = Storage.today();
  
  // Calculate days remaining
  const targetDate = new Date(settings.targetDate + 'T00:00:00');
  const todayDate = new Date(todayStr + 'T00:00:00');
  const msDiff = targetDate.getTime() - todayDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  
  // Calculate total duration for progress
  const startDate = new Date(settings.startDate + 'T00:00:00');
  const totalDays = Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, totalDays - daysRemaining);
  const timeProgressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  // Compute metrics
  const learningPct = getLearningPct();
  const habitsPct = getHabitsAvg30();
  const accScore = getAccountabilityAvg30();
  const placementScore = getPlacementScore();
  const codetantra = getCodeTantraPct();
  
  // Projects info
  const projects = Storage.get('px_projects') || [];
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalProjects = projects.length;

  // Generate AI missions
  const missions = generateMissions();

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Dashboard</h1>
        <p>Command center for your ML Career Preparation</p>
      </div>
      <div>
        <button onclick="Router.navigate('#planner')" class="btn btn-primary">
          Check daily planner
        </button>
      </div>
    </div>

    <!-- Mission Countdown Banner -->
    <div class="card mission-banner">
      <div class="mission-banner-header">
        <div class="mission-headline">
          <span class="badge badge-accent">ACTIVE MISSION</span>
          <h2 class="mt-4">${settings.mission || "Become placement ready"}</h2>
          <p>Target Placement Date: ${settings.targetDate}</p>
        </div>
        <div class="mission-banner-days">
          <div class="days-counter">${daysRemaining}</div>
          <div class="days-label">DAYS REMAINING</div>
        </div>
      </div>
      <div class="progress-container">
        <div class="progress-info">
          <span>Timeline Progress</span>
          <span>${timeProgressPct}% elapsed (${daysElapsed}/${totalDays} days)</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${timeProgressPct}%"></div>
        </div>
      </div>
    </div>

    <!-- High-level Metric Stats Grid -->
    <div class="stats-grid">
      <div class="card stat-card">
        <span class="stat-label">Technical Progress</span>
        <span class="stat-value">${learningPct}%</span>
        <div class="progress-bar" style="margin-bottom: 8px;">
          <div class="progress-fill" style="width: ${learningPct}%"></div>
        </div>
        <span class="stat-desc">Syllabus Completion Rate</span>
      </div>
      
      <div class="card stat-card">
        <span class="stat-label">Habit Consistency</span>
        <span class="stat-value">${habitsPct}%</span>
        <div class="progress-bar" style="margin-bottom: 8px;">
          <div class="progress-fill" style="width: ${habitsPct}%"></div>
        </div>
        <span class="stat-desc">Average completion (30 days)</span>
      </div>
      
      <div class="card stat-card">
        <span class="stat-label">Accountability Score</span>
        <span class="stat-value">${accScore}%</span>
        <div class="progress-bar" style="margin-bottom: 8px;">
          <div class="progress-fill" style="width: ${accScore}%"></div>
        </div>
        <span class="stat-desc">Daily logging consistency</span>
      </div>

      <div class="card stat-card" style="border-color: var(--accent);">
        <span class="stat-label" style="color: var(--accent);">Placement Readiness</span>
        <span class="stat-value accent">${placementScore}%</span>
        <div class="progress-bar" style="margin-bottom: 8px; background: rgba(0,255,136,0.12);">
          <div class="progress-fill" style="width: ${placementScore}%;"></div>
        </div>
        <span class="stat-desc" style="color: var(--accent);">Target for interview calls: 80%+</span>
      </div>
    </div>

    <!-- Main Section: Grid & Sidebar -->
    <div class="dashboard-sections-grid">
      
      <!-- Left side: Roadmap progress -->
      <div class="learning-roadmap-card">
        <div class="card" style="height: 100%;">
          <div class="card-title">
            <span>Syllabus Roadmap Modules</span>
            <span class="value">${learningPct}%</span>
          </div>
          <div class="subject-grid" id="subject-cards-container">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>

      <!-- Right side: Quick stats & Missions -->
      <div class="quick-stats-widget">
        <!-- Today's Score circle container -->
        <div class="card" style="display: flex; flex-direction: column; align-items: center; text-align: center;">
          <h4 class="mb-4" style="font-size: 14px; text-transform: uppercase; font-family: var(--font); color: var(--text-secondary);">Today's Score</h4>
          <div id="today-score-circle-dashboard"></div>
          <span class="stat-desc mt-4">Complete habits & learning targets to raise today's score!</span>
        </div>

        <!-- AI suggested actions -->
        <div class="card">
          <div class="card-title">
            <span>AI Mission Guidance</span>
          </div>
          <div class="ai-missions-container">
            <div class="mission-category">
              <h4>Today's Next Steps</h4>
              <ul class="missions-list">
                ${missions.today.map(m => `
                  <li class="mission-item-row">
                    <span class="mission-bullet">&raquo;</span>
                    <span>${m}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            
            <div class="mission-category">
              <h4>Weekly Core Tasks</h4>
              <ul class="missions-list">
                ${missions.week.map(m => `
                  <li class="mission-item-row">
                    <span class="mission-bullet">&raquo;</span>
                    <span>${m}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Quick Numerical Stats -->
        <div class="card">
          <div class="card-title">Quick Stats</div>
          <div class="quick-stat-item">
            <span class="quick-stat-label">Projects Completed</span>
            <span class="quick-stat-val">${completedProjects} / ${totalProjects}</span>
          </div>
          <div class="quick-stat-item">
            <span class="quick-stat-label">CodeTantra Progress</span>
            <span class="quick-stat-val">${codetantra}%</span>
          </div>
          <div class="quick-stat-item">
            <span class="quick-stat-label">Academic Grade</span>
            <span class="quick-stat-val" id="dashboard-grade-display">Calculating...</span>
          </div>
        </div>

      </div>

    </div>
  `;

  // Render Subject Cards dynamically
  const subjectContainer = document.getElementById('subject-cards-container');
  if (subjectContainer) {
    Object.entries(ROADMAP).forEach(([subjectId, subject]) => {
      const subjectPct = getSubjectPct(subjectId);
      const card = document.createElement('div');
      card.className = 'subject-card';
      card.onclick = () => {
        // Navigate to the learning tracker and store selected subject in global scope
        window.selectedSubjectId = subjectId;
        Router.navigate('#learning');
      };
      
      card.innerHTML = `
        <div class="subject-header">
          <div class="subject-name">${subject.label}</div>
          <div class="subject-pct">${subjectPct}%</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${subjectPct}%"></div>
        </div>
      `;
      subjectContainer.appendChild(card);
    });
  }

  // Calculate and display today's progress score in circular progress bar
  const todayScores = calcDailyScore(todayStr);
  renderCircularProgress(todayScores.total, 'today-score-circle-dashboard');

  // Display grade
  const gradeInfo = calculateGrade();
  const gradeDisplay = document.getElementById('dashboard-grade-display');
  if (gradeDisplay) {
    gradeDisplay.innerHTML = `<span class="badge ${gradeInfo.grade === 'F' ? 'badge-red' : 'badge-accent'}">${gradeInfo.grade}</span> (${gradeInfo.final}%)`;
  }
}
