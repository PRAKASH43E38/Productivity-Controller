// weekly-review.js — Weekly retrospective reviews logger and archive viewer

const REVIEW_QUESTIONS = [
  "What was learned this week?",
  "What projects were completed?",
  "What habits were maintained?",
  "What went wrong?",
  "What should improve next week?"
];

function getWeekKey(dateInput = new Date()) {
  // Safe date parse
  const date = new Date(dateInput);
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function submitWeeklyReview(e) {
  e.preventDefault();
  
  const currentWeek = getWeekKey(new Date());
  const answers = {};
  
  let isValid = true;
  REVIEW_QUESTIONS.forEach((q, idx) => {
    const el = document.getElementById(`review-q-${idx}`);
    if (el) {
      answers[`q${idx + 1}`] = el.value.trim();
      if (!el.value.trim()) {
        isValid = false;
      }
    }
  });

  if (!isValid) {
    alert("Please answer all questions before submitting your weekly review.");
    return;
  }

  const reviews = Storage.get('px_weekly_reviews') || {};
  reviews[currentWeek] = answers;
  Storage.set('px_weekly_reviews', reviews);

  // Clear inputs
  REVIEW_QUESTIONS.forEach((_, idx) => {
    const el = document.getElementById(`review-q-${idx}`);
    if (el) el.value = '';
  });

  alert(`Weekly review for ${currentWeek} logged successfully!`);
  renderWeeklyReviewPage();
}

function showWeeklyReviewDetail(weekKey) {
  const reviews = Storage.get('px_weekly_reviews') || {};
  const review = reviews[weekKey];
  if (!review) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'review-detail-modal-overlay';
  overlay.onclick = () => overlay.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-content card';
  modal.onclick = (e) => e.stopPropagation();

  const bodyContent = REVIEW_QUESTIONS.map((q, idx) => `
    <div class="mb-4">
      <h4 style="font-size: 13px; color: var(--accent); font-family: var(--font); margin-bottom: 4px;">${q}</h4>
      <p style="font-size: 14px; background: var(--bg-secondary); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius); white-space: pre-wrap;">${review[`q${idx + 1}`] || 'Not answered.'}</p>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <h3>Weekly Retrospective — ${weekKey}</h3>
      <button class="modal-close-btn" onclick="document.getElementById('review-detail-modal-overlay').remove()">&times;</button>
    </div>
    <div class="modal-body">
      ${bodyContent}
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function renderWeeklyReviewPage() {
  const currentWeek = getWeekKey(new Date());
  const reviews = Storage.get('px_weekly_reviews') || {};
  
  // Check if current week is already logged
  const isCurrentWeekLogged = !!reviews[currentWeek];

  const appEl = document.getElementById('app');
  appEl.innerHTML = `
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-group">
        <h1>Weekly Review</h1>
        <p>Perform a self-audit at the end of every week to refine your strategy</p>
      </div>
      <div>
        <span class="badge badge-accent">Current Week: ${currentWeek}</span>
      </div>
    </div>

    <div class="review-grid">
      
      <!-- Left side: Log Form -->
      <div class="card review-form-card">
        <div class="card-title">
          <span>Weekly Logger</span>
          ${isCurrentWeekLogged ? '<span class="badge badge-accent">Submitted</span>' : '<span class="badge badge-yellow">Pending</span>'}
        </div>
        
        ${isCurrentWeekLogged ? `
          <div style="text-align: center; padding: 30px; background: rgba(0,255,136,0.02); border: 1px dashed var(--accent); border-radius: var(--radius);">
            <p style="font-size: 15px; font-weight: bold; color: var(--accent);">You have already submitted the retrospective review for ${currentWeek}!</p>
            <p class="mt-4" style="font-size: 13px; color: var(--text-secondary);">You can view it in the Log History on the right or rewrite it below.</p>
            <button onclick="document.getElementById('rewriter-box').style.display='block'; this.style.display='none';" class="btn btn-secondary mt-4">Rewrite Review</button>
          </div>
        ` : ''}

        <div id="rewriter-box" style="display: ${isCurrentWeekLogged ? 'none' : 'block'};">
          <form onsubmit="submitWeeklyReview(event)">
            ${REVIEW_QUESTIONS.map((q, idx) => `
              <div class="form-group review-question">
                <label for="review-q-${idx}">${idx + 1}. ${q}</label>
                <textarea id="review-q-${idx}" class="form-control" rows="2" required placeholder="Write your thoughts..."></textarea>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
              <button type="submit" class="btn btn-primary">Submit Review</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Right side: History Archive -->
      <div class="card review-history-card">
        <div class="card-title">Log History</div>
        <div class="review-history-list">
          ${Object.keys(reviews).length === 0 ? `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">No past weekly reviews found.</div>
          ` : Object.keys(reviews).sort().reverse().map(weekKey => {
            const firstAns = reviews[weekKey].q1 || '';
            const snippet = firstAns.length > 50 ? firstAns.substring(0, 50) + '...' : firstAns;
            return `
              <div class="review-history-item" onclick="showWeeklyReviewDetail('${weekKey}')">
                <div class="review-history-week">${weekKey}</div>
                <div class="review-history-snippet">${snippet || 'Click to view review...'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;
}
