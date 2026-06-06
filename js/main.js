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

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize local storage defaults
  Storage.initDefaults();
  
  // 2. Synchronize sidebar profile
  updateSidebarProfile();
  
  // 3. Register route callbacks
  Router.register('#dashboard', renderDashboardPage);
  Router.register('#planner', renderDailyPlannerPage);
  Router.register('#habits', renderHabitTrackerPage);
  Router.register('#learning', renderLearningTrackerPage);
  Router.register('#projects', renderProjectTrackerPage);
  Router.register('#codetantra', renderCodeTantraPage);
  Router.register('#review', renderWeeklyReviewPage);
  Router.register('#analytics', renderAnalyticsPage);
  Router.register('#mission', renderMissionControlPage);
  
  // 4. Fire up routing engine
  Router.init();
});
