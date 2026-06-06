// learning-tracker.js — Interactive learning tracker with subject detail routing

let activeSubjectId = null;

function renderLearningTrackerPage() {
  // If the dashboard set a redirect subject ID, load that subject detail view directly
  if (window.selectedSubjectId) {
    activeSubjectId = window.selectedSubjectId;
    window.selectedSubjectId = null; // clear redirect
  }

  if (activeSubjectId) {
    renderSubjectDetail(activeSubjectId);
  } else {
    renderRoadmapOverview();
  }
}

function renderRoadmapOverview() {
  const learningPct = getLearningPct();
  const appEl = document.getElementById('app');
  
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Learning Roadmap</h1>
        <p>Master technical topics required for AI & Data Science roles</p>
      </div>
      <div>
        <span class="badge badge-accent">Total Progress: ${learningPct}%</span>
      </div>
    </div>

    <!-- Overall progress banner -->
    <div class="card mb-4">
      <div class="card-title">
        <span>Curriculum Mastery</span>
        <span class="value">${learningPct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${learningPct}%"></div>
      </div>
    </div>

    <!-- Subject grid -->
    <div class="subject-grid" id="roadmap-subjects-grid">
      <!-- Subjects cards loaded dynamically -->
    </div>
  `;

  const grid = document.getElementById('roadmap-subjects-grid');
  if (grid) {
    Object.entries(ROADMAP).forEach(([subjectId, subject]) => {
      const subjectPct = getSubjectPct(subjectId);
      const totalTopics = subject.topics.length;
      
      // Count completed topics
      const topicsData = Storage.get('px_topics') || {};
      const completedCount = subject.topics.filter((_, i) => topicsData[`${subjectId}_${i}`] === true).length;
      
      const card = document.createElement('div');
      card.className = 'card subject-card';
      card.style.height = '140px'; // Slightly taller to fit info
      card.onclick = () => {
        activeSubjectId = subjectId;
        renderSubjectDetail(subjectId);
      };
      
      card.innerHTML = `
        <div class="subject-header">
          <div class="subject-name" style="font-size: 16px;">${subject.label}</div>
          <div class="subject-pct">${subjectPct}%</div>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
          ${completedCount} of ${totalTopics} topics mastered
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${subjectPct}%"></div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

function renderSubjectDetail(subjectId) {
  const subject = ROADMAP[subjectId];
  if (!subject) {
    activeSubjectId = null;
    renderRoadmapOverview();
    return;
  }
  
  const subjectPct = getSubjectPct(subjectId);
  const topicsData = Storage.get('px_topics') || {};
  const totalTopics = subject.topics.length;
  const completedCount = subject.topics.filter((_, i) => topicsData[`${subjectId}_${i}`] === true).length;

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Back to Roadmap Navigation -->
    <div class="page-header">
      <div class="learning-back-bar">
        <button onclick="goBackToRoadmap()" class="btn btn-secondary">&laquo; Back to Roadmap</button>
        <div class="page-title-group" style="display: inline-block; margin-left: 16px; vertical-align: middle;">
          <h1 style="font-size: 26px; display: inline-block;">${subject.label} Syllabus</h1>
        </div>
      </div>
      <div>
        <span class="badge badge-accent">${completedCount}/${totalTopics} Mastered</span>
      </div>
    </div>

    <!-- Subject Detail Header Card -->
    <div class="card mb-4 subject-details-card">
      <div class="card-title">
        <span>Syllabus Completion</span>
        <span class="value" id="detail-subject-pct-txt">${subjectPct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="detail-subject-progress-fill" style="width: ${subjectPct}%"></div>
      </div>
    </div>

    <!-- Topics Checkbox List -->
    <div class="card">
      <h3 class="mb-4" style="font-size: 16px; text-transform: uppercase; font-family: var(--font); color: var(--text-secondary);">Topics List</h3>
      <div class="topics-list" id="subject-topics-container">
        <!-- Topics checkbox nodes rendered here -->
      </div>
    </div>
  `;

  const container = document.getElementById('subject-topics-container');
  if (container) {
    subject.topics.forEach((topicName, index) => {
      const isDone = topicsData[`${subjectId}_${index}`] === true;
      const tItem = document.createElement('div');
      tItem.className = `topic-item ${isDone ? 'completed' : ''}`;
      tItem.id = `topic-item-${subjectId}-${index}`;
      tItem.onclick = () => {
        const check = document.getElementById(`topic-chk-${subjectId}-${index}`);
        if (check) check.click();
      };
      
      tItem.innerHTML = `
        <input type="checkbox" class="topic-checkbox" id="topic-chk-${subjectId}-${index}"
          ${isDone ? 'checked' : ''}
          onclick="event.stopPropagation(); toggleTopicDetail('${subjectId}', ${index}, this.checked)">
        <span class="topic-label">${topicName}</span>
      `;
      
      container.appendChild(tItem);
    });
  }
}

function toggleTopicDetail(subjectId, topicIndex, done) {
  const key = `${subjectId}_${topicIndex}`;
  Storage.update('px_topics', t => ({ ...(t || {}), [key]: done }));
  
  // Track check-in
  updateAccountability('learning');
  
  // Save today's score
  const todayStr = Storage.today();
  const scoreData = calcDailyScore(todayStr);
  Storage.mergeDate('px_scores', todayStr, scoreData);

  // Update DOM classes and headers inline for slick transitions
  const itemEl = document.getElementById(`topic-item-${subjectId}-${topicIndex}`);
  if (itemEl) {
    itemEl.classList.toggle('completed', done);
  }
  
  // Refresh stats inline
  const subject = ROADMAP[subjectId];
  const topicsData = Storage.get('px_topics') || {};
  const totalTopics = subject.topics.length;
  const completedCount = subject.topics.filter((_, i) => topicsData[`${subjectId}_${i}`] === true).length;
  const newPct = Math.round((completedCount / totalTopics) * 100);
  
  const pctTxt = document.getElementById('detail-subject-pct-txt');
  const fillEl = document.getElementById('detail-subject-progress-fill');
  
  if (pctTxt) pctTxt.textContent = `${newPct}%`;
  if (fillEl) fillEl.style.width = `${newPct}%`;
}

function goBackToRoadmap() {
  activeSubjectId = null;
  renderRoadmapOverview();
}
