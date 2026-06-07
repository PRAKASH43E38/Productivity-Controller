// storage.js — complete CRUD layer with MongoDB sync support

const Storage = {
  cache: {},

  get: (key) => {
    if (Storage.cache[key] !== undefined) {
      return Storage.cache[key];
    }
    try {
      const localVal = localStorage.getItem(key);
      if (localVal !== null) {
        Storage.cache[key] = JSON.parse(localVal);
        return Storage.cache[key];
      }
      return null;
    } catch (e) {
      console.error(`Error parsing key: ${key}`, e);
      return null;
    }
  },
  
  set: (key, val) => {
    Storage.cache[key] = val;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error(`Error writing to localStorage for key: ${key}`, e);
    }
    
    // Asynchronously save to server only if not running from a local file
    if (window.location.protocol !== 'file:') {
      fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value: val })
      }).catch(err => {
        console.warn(`Background sync failed for key ${key}:`, err);
      });
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

  loadFromServer: async () => {
    const isLocalFile = window.location.protocol === 'file:';
    let loadedFromDB = false;
    
    if (!isLocalFile) {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            Object.keys(result.data).forEach(key => {
              Storage.cache[key] = result.data[key];
              try {
                localStorage.setItem(key, JSON.stringify(result.data[key]));
              } catch (e) {
                console.warn(`Local storage write failed for ${key}:`, e);
              }
            });
            console.log('Loaded all keys from database successfully.');
            loadedFromDB = true;
          }
        }
      } catch (e) {
        console.warn('Failed to sync from database server:', e);
      }
    }
    
    // Fallback if database failed or running locally from file
    if (!loadedFromDB) {
      console.log('Falling back to local storage data...');
      const keys = ['px_daily_tasks', 'px_habits', 'px_topics', 'px_projects',
                    'px_codetantra', 'px_weekly_reviews', 'px_scores',
                    'px_accountability', 'px_settings', 'px_daily_tasks_list'];
      keys.forEach(k => {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            Storage.cache[k] = JSON.parse(val);
          }
        } catch (err) {
          Storage.cache[k] = null;
        }
      });
    }
    
    // Setup defaults if any key is missing
    Storage.initDefaults();
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

    // Initialize customizable daily tasks list if empty
    if (!Storage.get('px_daily_tasks_list')) {
      Storage.set('px_daily_tasks_list', DAILY_TASKS);
    }
  }
};
