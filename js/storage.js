/* DoodleCraft — Storage Module */
window.DC = window.DC || {};

DC.Storage = {
  KEYS: {
    DOODLES: 'dc_doodles',
    PROFILE: 'dc_profile',
    SETTINGS: 'dc_settings',
    THEME: 'dc_theme'
  },

  _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch(e) {
      console.warn('Storage full or unavailable:', e);
      return false;
    }
  },

  // ── Doodles ──
  getDoodles() {
    return this._get(this.KEYS.DOODLES) || [];
  },

  saveDoodle(doodle) {
    const doodles = this.getDoodles();
    const existing = doodles.findIndex(d => d.id === doodle.id);
    if (existing >= 0) {
      doodles[existing] = { ...doodles[existing], ...doodle, updatedAt: Date.now() };
    } else {
      doodle.id = doodle.id || this.generateId();
      doodle.createdAt = Date.now();
      doodle.updatedAt = Date.now();
      doodles.unshift(doodle);
    }
    this._set(this.KEYS.DOODLES, doodles);
    return doodle;
  },

  getDoodle(id) {
    return this.getDoodles().find(d => d.id === id) || null;
  },

  deleteDoodle(id) {
    const doodles = this.getDoodles().filter(d => d.id !== id);
    this._set(this.KEYS.DOODLES, doodles);
  },

  // ── Profile ──
  getProfile() {
    return this._get(this.KEYS.PROFILE) || {
      name: 'Doodle Artist',
      avatarColor: '#FF6B9D',
      avatarEmoji: '🎨'
    };
  },

  saveProfile(profile) {
    this._set(this.KEYS.PROFILE, profile);
  },

  // ── Settings ──
  getSettings() {
    return this._get(this.KEYS.SETTINGS) || {
      tool: 'pen',
      color: '#2D2D3A',
      size: 3,
      opacity: 1,
      pattern: 'solid',
      bgStyle: 'white'
    };
  },

  saveSettings(settings) {
    this._set(this.KEYS.SETTINGS, settings);
  },

  // ── Theme ──
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
  },

  // ── Utils ──
  generateId() {
    return 'dc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  },

  formatDate(timestamp) {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  },

  // Get storage usage
  getUsageKB() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('dc_')) {
        total += localStorage[key].length * 2; // UTF-16
      }
    }
    return Math.round(total / 1024);
  }
};
