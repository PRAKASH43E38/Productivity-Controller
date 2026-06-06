// storage.js — complete CRUD layer with defaults initialization

const Storage = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {
      console.error(`Error parsing key: ${key}`, e);
      return null;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error writing key: ${key}`, e);
    }
  },
  update: (key, fn) => Storage.set(key, fn(Storage.get(key))),
  getDate: (key, date) => (Storage.get(key) || {})[date] || {},
  setDate: (key, date, val) => Storage.update(key, d => ({ ...(d || {}), [date]: val })),
  mergeDate: (key, date, val) => Storage.setDate(key, date, { ...Storage.getDate(key, date), ...val }),
  
  today: () => {
    // Return local date string YYYY-MM-DD
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  },

  initDefaults: () => {
    // Initialize settings if empty
    if (!Storage.get('px_settings')) {
      Storage.set('px_settings', DEFAULT_SETTINGS);
    }

    // Initialize projects if empty
    if (!Storage.get('px_projects')) {
      Storage.set('px_projects', DEFAULT_PROJECTS);
    }

    // Initialize codetantra if empty
    if (!Storage.get('px_codetantra')) {
      Storage.set('px_codetantra', { current: 0, history: [] });
    }

    // Initialize topics if empty
    if (!Storage.get('px_topics')) {
      Storage.set('px_topics', {});
    }

    // Initialize daily tasks if empty
    if (!Storage.get('px_daily_tasks')) {
      Storage.set('px_daily_tasks', {});
    }

    // Initialize habits if empty
    if (!Storage.get('px_habits')) {
      Storage.set('px_habits', {});
    }

    // Initialize weekly reviews if empty
    if (!Storage.get('px_weekly_reviews')) {
      Storage.set('px_weekly_reviews', {});
    }

    // Initialize accountability if empty
    if (!Storage.get('px_accountability')) {
      Storage.set('px_accountability', {});
    }

    // Initialize scores if empty
    if (!Storage.get('px_scores')) {
      Storage.set('px_scores', {});
    }
  }
};
