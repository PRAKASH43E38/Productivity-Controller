// router.js — hash-based navigation for single page application (SPA)

const Router = {
  routes: {},
  
  register(hash, fn) {
    this.routes[hash] = fn;
  },
  
  navigate(hash) {
    window.location.hash = hash;
  },
  
  render(hash) {
    const activeHash = hash || '#dashboard';
    const page = this.routes[activeHash] || this.routes['#dashboard'];
    
    const appEl = document.getElementById('app');
    if (appEl) {
      appEl.innerHTML = '';
      if (page) {
        try {
          page();
        } catch (error) {
          console.error(`Error rendering page for hash: ${activeHash}`, error);
          appEl.innerHTML = `
            <div class="card error-card">
              <h3>Navigation Error</h3>
              <p>An error occurred while rendering the page: <code>${error.message}</code></p>
              <button onclick="Router.navigate('#dashboard')" class="btn btn-primary">Back to Dashboard</button>
            </div>
          `;
        }
      }
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(el => {
      const route = el.getAttribute('data-route');
      el.classList.toggle('active', route === activeHash);
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  
  init() {
    window.addEventListener('hashchange', () => this.render(window.location.hash));
    this.render(window.location.hash || '#dashboard');
  }
};
