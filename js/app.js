/* DoodleCraft — Main Application */
window.DC = window.DC || {};

DC.App = {
  engine: null,
  currentPage: 'home',

  init() {
    this.applyTheme();
    this.setupNav();
    this.setupRouter();
    this.setupThemeToggle();
    this.setupScrollReveal();
    this.handleRoute();
  },

  // ── Theme ──
  applyTheme() {
    // Enforce dark mode for Harry Potter theme
    document.body.classList.add('dark-mode');
    DC.Storage.setTheme('dark');
    this.updateThemeIcon();
  },

  setupThemeToggle() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      DC.Storage.setTheme(isDark ? 'dark' : 'light');
      this.updateThemeIcon();
    });
  },

  updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    // Hide theme toggle since we are forcing dark magical theme
    if (btn) btn.style.display = 'none';
  },

  // ── Navigation ──
  setupNav() {
    // Brand click -> home
    document.querySelector('.nav-brand')?.addEventListener('click', () => {
      window.location.hash = '#home';
    });
  },

  setupRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const page = hash.split('/')[0];
    this.navigateTo(page);
  },

  navigateTo(page) {
    const validPages = ['home', 'editor', 'gallery', 'profile', 'games'];
    if (!validPages.includes(page)) page = 'home';

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      target.classList.add('page-enter');
      setTimeout(() => target.classList.remove('page-enter'), 500);
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === page);
    });

    // Initialize page-specific content
    if (page === 'editor' && !this.engine) {
      this.initEditor();
    }
    if (page === 'editor' && this.engine) {
      setTimeout(() => this.engine.fitToContainer(), 100);
    }
    if (page === 'gallery') {
      DC.Gallery.init();
    }
    if (page === 'profile') {
      this.initProfile();
    }

    this.currentPage = page;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ── Editor ──
  initEditor() {
    const container = document.getElementById('canvas-container');
    if (!container || this.engine) return;

    this.engine = new DC.CanvasEngine('canvas-container');
    this.engine.fitToContainer();

    // Setup toolbar
    this.renderToolbar();

    // Setup customization panel
    DC.Customization.init(this.engine);

    // Setup topbar buttons
    this.setupEditorButtons();

    // Resize handler
    window.addEventListener('resize', () => {
      if (this.engine) this.engine.fitToContainer();
    });

    // Keyboard shortcuts for tools
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const shortcuts = { p: 'pen', b: 'brush', e: 'eraser', l: 'line', r: 'rectangle', c: 'circle', a: 'arrow', t: 'text', f: 'fill', i: 'eyedropper' };
      if (shortcuts[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
        this.setActiveTool(shortcuts[e.key.toLowerCase()]);
      }
    });
  },

  renderToolbar() {
    const toolbar = document.getElementById('editor-toolbar');
    if (!toolbar) return;

    toolbar.innerHTML = DC.Tools.toolList.map(tool => {
      if (tool.separator) return '<div class="tool-separator"></div>';
      const isActive = this.engine.settings.tool === tool.id;
      return `<button class="tool-btn${isActive ? ' active' : ''}" data-tool="${tool.id}" data-tooltip="${tool.name} (${tool.shortcut})">${tool.icon}</button>`;
    }).join('');

    toolbar.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setActiveTool(btn.dataset.tool);
      });
    });
  },

  setActiveTool(toolId) {
    if (!this.engine) return;
    this.engine.updateSetting('tool', toolId);
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolId);
    });

    // Update cursor
    const container = document.querySelector('.editor-canvas-container');
    if (container) {
      container.style.cursor = toolId === 'text' ? 'text' :
                               toolId === 'fill' ? 'crosshair' :
                               toolId === 'eyedropper' ? 'crosshair' :
                               toolId === 'eraser' ? 'cell' : 'crosshair';
    }
  },

  setupEditorButtons() {
    document.getElementById('btn-undo')?.addEventListener('click', () => this.engine?.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.engine?.redo());
    document.getElementById('btn-clear')?.addEventListener('click', () => {
      if (confirm('Clear the entire canvas?')) this.engine?.clear();
    });
    document.getElementById('btn-save')?.addEventListener('click', () => DC.Export.save(this.engine));
    document.getElementById('btn-download')?.addEventListener('click', () => DC.Export.showDownloadModal(this.engine));
    document.getElementById('btn-share')?.addEventListener('click', () => DC.Export.share(this.engine));

    // Panel toggle for mobile
    document.getElementById('btn-panel-toggle')?.addEventListener('click', () => {
      document.getElementById('editor-panel')?.classList.toggle('open');
    });
  },

  // ── Profile ──
  initProfile() {
    const profile = DC.Storage.getProfile();
    const doodles = DC.Storage.getDoodles();

    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) {
      nameInput.value = profile.name;
      nameInput.addEventListener('change', () => {
        profile.name = nameInput.value;
        DC.Storage.saveProfile(profile);
      });
    }

    const avatar = document.getElementById('profile-avatar');
    if (avatar) {
      avatar.textContent = profile.avatarEmoji || '🎨';
      avatar.style.background = `linear-gradient(135deg, ${profile.avatarColor || '#FF6B9D'}33, ${profile.avatarColor || '#FF6B9D'}66)`;
    }

    const countEl = document.getElementById('doodle-count');
    if (countEl) countEl.textContent = doodles.length;

    const storageEl = document.getElementById('storage-used');
    if (storageEl) storageEl.textContent = DC.Storage.getUsageKB() + ' KB';

    // Render profile gallery
    const profileGrid = document.getElementById('profile-gallery');
    if (profileGrid && doodles.length > 0) {
      profileGrid.innerHTML = '<h3 style="margin-bottom:16px">Your Recent Work</h3>' +
        '<div class="gallery-grid">' +
        doodles.slice(0, 6).map(d => `
          <div class="gallery-card" onclick="DC.Gallery.viewDoodle('${d.id}')">
            <div class="gallery-card-image">
              <img src="${d.thumbnail}" alt="${d.title}" loading="lazy">
            </div>
            <div class="gallery-card-info">
              <div class="gallery-card-title">${d.title}</div>
            </div>
          </div>
        `).join('') +
        '</div>';
    }
  },

  // ── Modal ──
  openModal() {
    document.getElementById('modal-overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    document.getElementById('modal-overlay')?.classList.remove('active');
    document.body.style.overflow = '';
  },

  // ── Toast ──
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ── Scroll Reveal ──
  setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
};

// ── Initialize on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  DC.App.init();

  // Modal close events
  document.getElementById('modal-close')?.addEventListener('click', () => DC.App.closeModal());
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') DC.App.closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') DC.App.closeModal();
  });
});
