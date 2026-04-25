/* DoodleCraft — Gallery Module */
window.DC = window.DC || {};

DC.Gallery = {
  currentTab: 'my',
  lightboxOpen: false,

  // Sample community doodles for demo
  communitySamples: [
    { id: 'sample1', title: 'Sunset Vibes', author: 'ArtistPro', emoji: '🌅', color: '#FF6B9D', createdAt: Date.now() - 86400000 },
    { id: 'sample2', title: 'Space Cat', author: 'DoodleMaster', emoji: '🐱', color: '#C084FC', createdAt: Date.now() - 172800000 },
    { id: 'sample3', title: 'Rainbow Garden', author: 'ColorQueen', emoji: '🌈', color: '#6BCB77', createdAt: Date.now() - 259200000 },
    { id: 'sample4', title: 'Ocean Dreams', author: 'WaveRider', emoji: '🌊', color: '#67E8F9', createdAt: Date.now() - 345600000 },
    { id: 'sample5', title: 'Pixel Heart', author: 'RetroFan', emoji: '❤️', color: '#FF6B6B', createdAt: Date.now() - 432000000 },
    { id: 'sample6', title: 'Night Sky', author: 'StarGazer', emoji: '🌙', color: '#818CF8', createdAt: Date.now() - 518400000 },
    { id: 'sample7', title: 'Flower Power', author: 'GardenLove', emoji: '🌸', color: '#F472B6', createdAt: Date.now() - 604800000 },
    { id: 'sample8', title: 'Abstract Waves', author: 'ModernArt', emoji: '🎨', color: '#FFA45B', createdAt: Date.now() - 691200000 },
  ],

  init() {
    this.renderTabs();
    this.render();
  },

  renderTabs() {
    const tabs = document.querySelectorAll('.gallery-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.render();
      });
    });
  },

  render() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    if (this.currentTab === 'my') {
      this.renderMyDoodles(grid);
    } else {
      this.renderCommunity(grid);
    }
  },

  renderMyDoodles(grid) {
    const doodles = DC.Storage.getDoodles();

    if (doodles.length === 0) {
      grid.innerHTML = `
        <div class="gallery-empty">
          <div class="gallery-empty-icon">🎨</div>
          <h3>No doodles yet!</h3>
          <p>Start creating your first masterpiece</p>
          <a href="#editor" class="btn btn-primary">Start Doodling ✏️</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = doodles.map((d, i) => `
      <div class="gallery-card anim-slide-up stagger-${Math.min(i + 1, 8)}" data-id="${d.id}">
        <div class="gallery-card-image">
          <img src="${d.thumbnail}" alt="${d.title}" loading="lazy">
          <div class="gallery-card-overlay">
            <button class="overlay-btn" data-action="view" data-id="${d.id}" title="View">👁️</button>
            <button class="overlay-btn" data-action="edit" data-id="${d.id}" title="Edit">✏️</button>
            <button class="overlay-btn" data-action="download" data-id="${d.id}" title="Download">📥</button>
            <button class="overlay-btn" data-action="delete" data-id="${d.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="gallery-card-info">
          <div class="gallery-card-title">${d.title}</div>
          <div class="gallery-card-meta">${DC.Storage.formatDate(d.createdAt)}</div>
        </div>
      </div>
    `).join('');

    this._bindCardEvents(grid);
  },

  renderCommunity(grid) {
    grid.innerHTML = this.communitySamples.map((d, i) => `
      <div class="gallery-card anim-slide-up stagger-${Math.min(i + 1, 8)}" data-id="${d.id}">
        <div class="gallery-card-image" style="background:linear-gradient(135deg, ${d.color}22, ${d.color}44)">
          <div style="font-size:5rem;animation:float 3s ease-in-out infinite;animation-delay:${i * 0.2}s">${d.emoji}</div>
        </div>
        <div class="gallery-card-info">
          <div class="gallery-card-title">${d.title}</div>
          <div class="gallery-card-meta">by ${d.author} · ${DC.Storage.formatDate(d.createdAt)}</div>
        </div>
      </div>
    `).join('');
  },

  _bindCardEvents(grid) {
    grid.querySelectorAll('.overlay-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        switch (action) {
          case 'view':
            this.viewDoodle(id);
            break;
          case 'edit':
            this.editDoodle(id);
            break;
          case 'download':
            this.downloadDoodle(id);
            break;
          case 'delete':
            this.deleteDoodle(id);
            break;
        }
      });
    });

    grid.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', () => {
        this.viewDoodle(card.dataset.id);
      });
    });
  },

  viewDoodle(id) {
    const doodle = DC.Storage.getDoodle(id);
    if (!doodle) return;

    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <h3 style="margin-bottom:16px;font-family:var(--font-display)">${doodle.title}</h3>
      <img src="${doodle.imageData || doodle.thumbnail}" alt="${doodle.title}" style="width:100%;border-radius:var(--radius-md);border:1px solid var(--border)">
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
        <button class="btn btn-primary btn-sm" onclick="DC.Gallery.editDoodle('${id}');DC.App.closeModal()">Edit ✏️</button>
        <button class="btn btn-secondary btn-sm" onclick="DC.Gallery.downloadDoodle('${id}')">Download 📥</button>
      </div>
    `;
    DC.App.openModal();
  },

  editDoodle(id) {
    const doodle = DC.Storage.getDoodle(id);
    if (!doodle) return;
    window.location.hash = '#editor';
    setTimeout(() => {
      if (DC.App.engine) {
        DC.App.engine.currentDoodleId = id;
        DC.App.engine.loadFromDataURL(doodle.imageData || doodle.thumbnail);
        document.getElementById('doodle-title').value = doodle.title;
        DC.App.showToast('Loaded: ' + doodle.title, 'info');
      }
    }, 300);
  },

  downloadDoodle(id) {
    const doodle = DC.Storage.getDoodle(id);
    if (!doodle) return;
    const a = document.createElement('a');
    a.href = doodle.imageData || doodle.thumbnail;
    a.download = (doodle.title || 'doodle').replace(/[^a-zA-Z0-9]/g, '_') + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    DC.App.showToast('Downloaded! 📥', 'success');
  },

  deleteDoodle(id) {
    if (!confirm('Delete this doodle? This cannot be undone.')) return;
    DC.Storage.deleteDoodle(id);
    this.render();
    DC.App.showToast('Doodle deleted', 'info');
  }
};
