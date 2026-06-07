// main.js — Application entry point, router registration, and lifecycle management

function updateSidebarProfile() {
  const settings = Storage.get('px_settings');
  if (!settings) return;
  
  const nameEl = document.getElementById('user-display-name');
  const avatarEl = document.getElementById('user-avatar-initials');
  
  if (nameEl) {
    nameEl.textContent = settings.name || "ML Candidate";
  }
  
  if (avatarEl && settings.name) {
    const initials = settings.name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    avatarEl.textContent = initials || "ML";
  }
}

function toggleMobileClass() {
  const width = window.innerWidth;
  document.body.classList.toggle('is-mobile', width < 768);
  document.body.classList.toggle('is-tablet', width >= 768 && width < 1024);
  document.body.classList.toggle('is-desktop', width >= 1024);
}

window.addEventListener('resize', toggleMobileClass);

// Global initialization
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize screen size class flags
  toggleMobileClass();

  // 2. Initialize storage from database
  await Storage.loadFromServer();
  
  // 3. Synchronize sidebar profile
  updateSidebarProfile();
  
  // 4. Register route callbacks
  Router.register('#dashboard', renderDashboardPage);
  Router.register('#planner', renderDailyPlannerPage);
  Router.register('#habits', renderHabitTrackerPage);
  Router.register('#learning', renderLearningTrackerPage);
  Router.register('#projects', renderProjectTrackerPage);
  Router.register('#codetantra', renderCodeTantraPage);
  Router.register('#review', renderWeeklyReviewPage);
  Router.register('#analytics', renderAnalyticsPage);
  Router.register('#mission', renderMissionControlPage);
  
  // 5. Fire up routing engine
  Router.init();
});
