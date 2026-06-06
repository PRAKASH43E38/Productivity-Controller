// analytics.js — Analytics and visualizations utilizing Chart.js

const isMobileViewport = () => window.innerWidth < 768;

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: isMobileViewport() ? 'bottom' : 'top',
      labels: { 
        color: '#909090', 
        font: { family: 'JetBrains Mono', size: 11 } 
      } 
    }
  },
  scales: {
    x: { 
      ticks: { color: '#909090', font: { family: 'JetBrains Mono', size: 10 } }, 
      grid: { color: 'rgba(0, 255, 136, 0.04)' } 
    },
    y: { 
      ticks: { color: '#909090', font: { family: 'JetBrains Mono', size: 10 } }, 
      grid: { color: 'rgba(0, 255, 136, 0.04)' } 
    }
  }
};

function renderAnalyticsPage() {
  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Analytics</h1>
        <p>Quantitative insights on learning velocity and placement readiness</p>
      </div>
      <div>
        <span class="badge badge-accent">Placement Score: ${getPlacementScore()}%</span>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="analytics-grid">
      
      <!-- Horizontal Bar Chart: Placement Dimensions -->
      <div class="card chart-card">
        <div class="card-title">Placement Readiness Metrics (%)</div>
        <div class="canvas-container">
          <canvas id="placement-dimensions-chart"></canvas>
        </div>
      </div>

      <!-- Line Chart: Daily Scores Trend -->
      <div class="card chart-card">
        <div class="card-title">Daily Scores Trend (Last 14 Days)</div>
        <div class="canvas-container">
          <canvas id="daily-scores-trend-chart"></canvas>
        </div>
      </div>

      <!-- Syllabus Breakdown Bar Chart -->
      <div class="card chart-card" style="grid-column: span 2;">
        <div class="card-title">Syllabus Module Completion (%)</div>
        <div class="canvas-container" style="height: 300px;">
          <canvas id="syllabus-breakdown-chart"></canvas>
        </div>
      </div>

    </div>
  `;

  // Initialize and mount charts after DOM renders
  setTimeout(() => {
    try {
      renderPlacementDimensionsChart();
      renderDailyScoresTrendChart();
      renderSyllabusBreakdownChart();
    } catch (err) {
      console.error("Chart rendering error:", err);
    }
  }, 50);
}

function renderPlacementDimensionsChart() {
  const ctx = document.getElementById('placement-dimensions-chart');
  if (!ctx) return;

  const labels = ['Learning', 'Projects', 'Habits', 'CodeTantra', 'Accountability'];
  const data = [
    getLearningPct(), 
    getProjectsPct(), 
    getHabitsAvg30(),
    getCodeTantraPct(),
    getAccountabilityAvg30()
  ];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Current Readiness Score (%)',
        data,
        backgroundColor: 'rgba(0, 255, 136, 0.25)',
        borderColor: '#00ff88',
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: { 
      ...chartDefaults, 
      indexAxis: 'y',
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: { color: '#909090', font: { family: 'JetBrains Mono' } },
          grid: { color: 'rgba(0, 255, 136, 0.04)' }
        },
        y: {
          ticks: { color: '#909090', font: { family: 'JetBrains Mono' } },
          grid: { color: 'rgba(255, 255, 255, 0.01)' }
        }
      }
    }
  });
}

function renderDailyScoresTrendChart() {
  const ctx = document.getElementById('daily-scores-trend-chart');
  if (!ctx) return;

  const today = new Date();
  const dates = [];
  const scores = [];

  // Get past 14 dates and values
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr.substring(5)); // show MM-DD format
    
    // Fetch logged scores, fallback to calculated score
    const savedScores = Storage.getDate('px_scores', dateStr);
    let totalScore = savedScores.total;
    if (totalScore === undefined) {
      totalScore = calcDailyScore(dateStr).total;
    }
    scores.push(totalScore);
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Overall Daily Score (0-100)',
        data: scores,
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.03)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#00ff88',
        pointHoverBackgroundColor: '#fff',
        pointRadius: 3
      }]
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          ticks: { color: '#909090', font: { family: 'JetBrains Mono' } },
          grid: { color: 'rgba(255, 255, 255, 0.01)' }
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#909090', font: { family: 'JetBrains Mono' } },
          grid: { color: 'rgba(0, 255, 136, 0.04)' }
        }
      }
    }
  });
}

function renderSyllabusBreakdownChart() {
  const ctx = document.getElementById('syllabus-breakdown-chart');
  if (!ctx) return;

  const labels = [];
  const data = [];
  const colors = [];

  Object.entries(ROADMAP).forEach(([key, subject]) => {
    labels.push(subject.label);
    const pct = getSubjectPct(key);
    data.push(pct);
    
    // Gradient coloring according to completion
    if (pct >= 80) colors.push('rgba(0, 255, 136, 0.3)'); // Green
    else if (pct >= 40) colors.push('rgba(255, 204, 0, 0.3)'); // Yellow
    else colors.push('rgba(255, 68, 68, 0.3)'); // Red
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Module Completion Rate (%)',
        data,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.3', '1.0')),
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      ...chartDefaults,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#909090', font: { family: 'JetBrains Mono' } },
          grid: { color: 'rgba(255, 255, 255, 0.01)' }
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#909090', font: { family: 'JetBrains Mono' } },
          grid: { color: 'rgba(0, 255, 136, 0.04)' }
        }
      }
    }
  });
}
