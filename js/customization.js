/* DoodleCraft — Customization Panel */
window.DC = window.DC || {};

DC.Customization = {
  colors: [
    '#1A1510', '#FFFFFF', '#740001', '#AE0001', '#1A472A', '#2a623d',
    '#0E1A40', '#222F5B', '#ECB939', '#D3A625', '#C0C0C0', '#808080',
    '#000000', '#5c0000', '#11321d', '#0a1330', '#eeb111', '#5d5d5d',
    '#f4ecd8', '#dfcdb0', '#8b7556', '#4a3e30', '#2d251d', '#130d06'
  ],

  stickers: [
    'img:images/harry_sticker_1777102259714.png',
    'img:images/hermione_sticker_1777102279849.png',
    'img:images/ron_sticker_1777102323126.png',
    'img:images/snape_sticker_1777102386855.png',
    '⚡', '🦉', '🧙', '🪄', '🏰', '🧹', '📜', '🔮', '🐍', '🦁',
    '🦅', '🦡', '🚂', '🕯️', '🕸️', '✨', '💎', '🌙', '🐾', '🏆'
  ],

  bgStyles: [
    { id: 'white', label: 'White', preview: '#fff' },
    { id: 'grid', label: 'Grid', preview: 'grid' },
    { id: 'dots', label: 'Dots', preview: 'dots' },
    { id: 'lines', label: 'Lines', preview: 'lines' },
  ],

  init(engine) {
    this.engine = engine;
    this.panel = document.getElementById('editor-panel');
    this.render();
  },

  render() {
    const s = this.engine.settings;
    this.panel.innerHTML = `
      <!-- Colors -->
      <div class="panel-section">
        <div class="panel-section-title">Color</div>
        <div class="color-palette" id="color-palette">
          ${this.colors.map(c => `<div class="color-swatch${s.color === c ? ' active' : ''}" data-color="${c}" style="background:${c};${c === '#FFFFFF' ? 'border:1.5px solid #ddd' : ''}"></div>`).join('')}
        </div>
        <div class="color-custom">
          <input type="color" id="custom-color" value="${s.color}">
          <span style="font-size:0.85rem;color:var(--text-secondary);font-weight:700" id="color-hex">${s.color}</span>
        </div>
      </div>

      <!-- Stroke Size -->
      <div class="panel-section">
        <div class="panel-section-title">Stroke</div>
        <div class="slider-group">
          <div class="slider-label">
            <span>Size</span>
            <span class="slider-value" id="size-value">${s.size}px</span>
          </div>
          <input type="range" id="stroke-size" min="1" max="50" value="${s.size}">
        </div>
        <div class="slider-group" style="margin-top:12px">
          <div class="slider-label">
            <span>Opacity</span>
            <span class="slider-value" id="opacity-value">${Math.round(s.opacity * 100)}%</span>
          </div>
          <input type="range" id="stroke-opacity" min="5" max="100" value="${Math.round(s.opacity * 100)}">
        </div>
        <div class="stroke-preview" id="stroke-preview">
          <div class="stroke-preview-line" style="width:60%;height:${Math.min(s.size, 30)}px;background:${s.color};opacity:${s.opacity};border-radius:9999px"></div>
        </div>
      </div>

      <!-- Pattern -->
      <div class="panel-section">
        <div class="panel-section-title">Pattern</div>
        <div class="pattern-grid">
          <button class="pattern-btn${s.pattern === 'solid' ? ' active' : ''}" data-pattern="solid" data-tooltip="Solid">━</button>
          <button class="pattern-btn${s.pattern === 'dashed' ? ' active' : ''}" data-pattern="dashed" data-tooltip="Dashed">╌╌</button>
          <button class="pattern-btn${s.pattern === 'dotted' ? ' active' : ''}" data-pattern="dotted" data-tooltip="Dotted">···</button>
          <button class="pattern-btn${s.pattern === 'rainbow' ? ' active' : ''}" data-pattern="rainbow" data-tooltip="Rainbow">🌈</button>
        </div>
      </div>

      <!-- Background -->
      <div class="panel-section">
        <div class="panel-section-title">Background</div>
        <div class="bg-style-grid">
          ${this.bgStyles.map(bg => `<button class="bg-style-btn${s.bgStyle === bg.id ? ' active' : ''}" data-bg="${bg.id}" data-tooltip="${bg.label}"><span style="font-size:0.65rem">${bg.label}</span></button>`).join('')}
        </div>
      </div>

      <!-- Stickers -->
      <div class="panel-section">
        <div class="panel-section-title">Stickers</div>
        <div class="sticker-grid" style="display:flex; flex-wrap:wrap; gap:8px;">
          ${this.stickers.map(s => {
            if (s.startsWith('img:')) {
              return `<button class="sticker-btn" data-sticker="${s}" style="width:50px; height:50px; padding:2px;"><img src="${s.replace('img:', '')}" style="width:100%;height:100%;object-fit:cover;pointer-events:none;border-radius:8px;"></button>`;
            }
            return `<button class="sticker-btn" data-sticker="${s}">${s}</button>`;
          }).join('')}
        </div>
      </div>
    `;
    this._bindEvents();
  },

  _bindEvents() {
    const engine = this.engine;

    // Color swatches
    this.panel.querySelectorAll('.color-swatch').forEach(el => {
      el.addEventListener('click', () => {
        const color = el.dataset.color;
        this.updateColorUI(color);
        engine.updateSetting('color', color);
        document.getElementById('custom-color').value = color;
      });
    });

    // Custom color
    document.getElementById('custom-color').addEventListener('input', (e) => {
      this.updateColorUI(e.target.value);
      engine.updateSetting('color', e.target.value);
    });

    // Stroke size
    document.getElementById('stroke-size').addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      engine.updateSetting('size', v);
      document.getElementById('size-value').textContent = v + 'px';
      this._updatePreview();
    });

    // Opacity
    document.getElementById('stroke-opacity').addEventListener('input', (e) => {
      const v = parseInt(e.target.value) / 100;
      engine.updateSetting('opacity', v);
      document.getElementById('opacity-value').textContent = Math.round(v * 100) + '%';
      this._updatePreview();
    });

    // Pattern
    this.panel.querySelectorAll('.pattern-btn').forEach(el => {
      el.addEventListener('click', () => {
        this.panel.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        engine.updateSetting('pattern', el.dataset.pattern);
      });
    });

    // Background style
    this.panel.querySelectorAll('.bg-style-btn').forEach(el => {
      el.addEventListener('click', () => {
        this.panel.querySelectorAll('.bg-style-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        engine.updateSetting('bgStyle', el.dataset.bg);
      });
    });

    // Stickers
    this.panel.querySelectorAll('.sticker-btn').forEach(el => {
      el.addEventListener('click', () => {
        const sticker = el.dataset.sticker;
        engine.addSticker(sticker);
        DC.App.showToast('Sticker added! You can drag it around.', 'success');
      });
    });
  },

  updateColorUI(color) {
    this.panel.querySelectorAll('.color-swatch').forEach(el => {
      el.classList.toggle('active', el.dataset.color === color);
    });
    const hex = document.getElementById('color-hex');
    if (hex) hex.textContent = color;
    const picker = document.getElementById('custom-color');
    if (picker) picker.value = color;
    this._updatePreview();
  },

  _updatePreview() {
    const s = this.engine.settings;
    const preview = document.getElementById('stroke-preview');
    if (!preview) return;
    const line = preview.querySelector('.stroke-preview-line');
    if (line) {
      line.style.height = Math.min(s.size, 30) + 'px';
      line.style.background = s.color;
      line.style.opacity = s.opacity;
    }
  }
};
