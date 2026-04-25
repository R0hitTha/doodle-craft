/* DoodleCraft — Canvas Engine */
window.DC = window.DC || {};

DC.CanvasEngine = class {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'canvas-wrapper';
    this.container.appendChild(this.wrapper);

    // Create layered canvases
    this.bgCanvas = this._createCanvas('bg-canvas');
    this.drawCanvas = this._createCanvas('draw-canvas');
    this.previewCanvas = this._createCanvas('preview-canvas');

    this.ctx = this.drawCanvas.getContext('2d', { willReadFrequently: true });
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.bgCtx = this.bgCanvas.getContext('2d');

    // State
    this.isDrawing = false;
    this.points = [];
    this.undoStack = [];
    this.redoStack = [];
    this.dpr = window.devicePixelRatio || 1;

    // Canvas size
    this.canvasWidth = 900;
    this.canvasHeight = 600;

    // Settings
    this.settings = DC.Storage.getSettings();
    this.currentDoodleId = null;

    this._setupCanvases();
    this._setupEvents();
    this.drawBackground();
    this.saveState();
  }

  _createCanvas(id) {
    const c = document.createElement('canvas');
    c.id = id;
    this.wrapper.appendChild(c);
    return c;
  }

  _setupCanvases() {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const dpr = this.dpr;

    [this.bgCanvas, this.drawCanvas, this.previewCanvas].forEach(c => {
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
    });

    this.ctx.scale(dpr, dpr);
    this.previewCtx.scale(dpr, dpr);
    this.bgCtx.scale(dpr, dpr);

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.previewCtx.lineCap = 'round';
    this.previewCtx.lineJoin = 'round';
  }

  _setupEvents() {
    const pc = this.previewCanvas;

    // Mouse events
    pc.addEventListener('mousedown', e => this._onStart(e));
    pc.addEventListener('mousemove', e => this._onMove(e));
    pc.addEventListener('mouseup', e => this._onEnd(e));
    pc.addEventListener('mouseleave', e => this._onEnd(e));

    // Touch events
    pc.addEventListener('touchstart', e => { e.preventDefault(); this._onStart(e.touches[0]); }, { passive: false });
    pc.addEventListener('touchmove', e => { e.preventDefault(); this._onMove(e.touches[0]); }, { passive: false });
    pc.addEventListener('touchend', e => this._onEnd(e));
    pc.addEventListener('touchcancel', e => this._onEnd(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo(); else this.undo();
      }
    });
  }

  _getPos(e) {
    const rect = this.previewCanvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvasWidth / rect.width),
      y: (e.clientY - rect.top) * (this.canvasHeight / rect.height)
    };
  }

  _onStart(e) {
    const pos = this._getPos(e);
    this.isDrawing = true;
    this.points = [pos];

    const tool = DC.Tools.getTool(this.settings.tool);
    if (tool && tool.onStart) {
      tool.onStart(this, pos);
    }
  }

  _onMove(e) {
    if (!this.isDrawing) return;
    const pos = this._getPos(e);
    this.points.push(pos);

    const tool = DC.Tools.getTool(this.settings.tool);
    if (tool && tool.onMove) {
      tool.onMove(this, pos, this.points);
    }
  }

  _onEnd(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const tool = DC.Tools.getTool(this.settings.tool);
    if (tool && tool.onEnd) {
      tool.onEnd(this, this.points);
    }

    this.clearPreview();
    this.saveState();
    this.points = [];
  }

  // ── Drawing Utilities ──
  applyBrushSettings(ctx) {
    ctx.strokeStyle = this.settings.color;
    ctx.fillStyle = this.settings.color;
    ctx.lineWidth = this.settings.size;
    ctx.globalAlpha = this.settings.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.settings.pattern === 'dashed') {
      ctx.setLineDash([this.settings.size * 2, this.settings.size * 2]);
    } else if (this.settings.pattern === 'dotted') {
      ctx.setLineDash([2, this.settings.size * 2]);
    } else {
      ctx.setLineDash([]);
    }
  }

  drawSmoothLine(ctx, points) {
    if (points.length < 2) {
      // Draw a dot
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, this.settings.size / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  clearPreview() {
    this.previewCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  // ── Undo / Redo ──
  saveState() {
    const data = this.ctx.getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    this.undoStack.push(data);
    this.redoStack = [];
    if (this.undoStack.length > 40) this.undoStack.shift();
    this._updateUndoButtons();
  }

  undo() {
    if (this.undoStack.length <= 1) return;
    this.redoStack.push(this.undoStack.pop());
    const state = this.undoStack[this.undoStack.length - 1];
    this.ctx.putImageData(state, 0, 0);
    this._updateUndoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.ctx.putImageData(state, 0, 0);
    this._updateUndoButtons();
  }

  _updateUndoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = this.undoStack.length <= 1;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
  }

  // ── Clear ──
  clear() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.wrapper.querySelectorAll('.movable-sticker').forEach(s => s.remove());
    this.saveState();
  }

  // ── Background ──
  drawBackground() {
    const ctx = this.bgCtx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    ctx.clearRect(0, 0, w, h);

    const style = this.settings.bgStyle || 'white';

    if (style === 'white' || style === 'transparent') {
      ctx.fillStyle = style === 'transparent' ? 'rgba(0,0,0,0)' : '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      if (style === 'transparent') {
        // Checkerboard
        const sz = 10;
        for (let y = 0; y < h; y += sz) {
          for (let x = 0; x < w; x += sz) {
            ctx.fillStyle = ((x / sz + y / sz) % 2 === 0) ? '#f0f0f0' : '#ffffff';
            ctx.fillRect(x, y, sz, sz);
          }
        }
      }
    } else if (style === 'grid') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    } else if (style === 'dots') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let x = 10; x < w; x += 20) {
        for (let y = 10; y < h; y += 20) {
          ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (style === 'lines') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      for (let y = 0; y <= h; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }
  }

  // ── Export ──
  toDataURL(type = 'image/png', quality = 0.92) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.drawCanvas.width;
    exportCanvas.height = this.drawCanvas.height;
    const ectx = exportCanvas.getContext('2d');
    ectx.drawImage(this.bgCanvas, 0, 0);
    ectx.drawImage(this.drawCanvas, 0, 0);
    this._drawStickersToCanvas(ectx, exportCanvas.width, exportCanvas.height);
    return exportCanvas.toDataURL(type, quality);
  }

  toBlob(callback, type = 'image/png', quality = 0.92) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.drawCanvas.width;
    exportCanvas.height = this.drawCanvas.height;
    const ectx = exportCanvas.getContext('2d');
    ectx.drawImage(this.bgCanvas, 0, 0);
    ectx.drawImage(this.drawCanvas, 0, 0);
    this._drawStickersToCanvas(ectx, exportCanvas.width, exportCanvas.height);
    exportCanvas.toBlob(callback, type, quality);
  }

  // ── Thumbnail ──
  getThumbnail(size = 200) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size * (this.canvasHeight / this.canvasWidth);
    const tctx = c.getContext('2d');
    tctx.drawImage(this.bgCanvas, 0, 0, c.width, c.height);
    tctx.drawImage(this.drawCanvas, 0, 0, c.width, c.height);
    this._drawStickersToCanvas(tctx, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  }

  // ── Load existing doodle ──
  loadFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.drawImage(img, 0, 0, this.canvasWidth, this.canvasHeight);
      this.wrapper.querySelectorAll('.movable-sticker').forEach(s => s.remove());
      this.saveState();
    };
    img.src = dataURL;
  }

  // ── Resize handler ──
  fitToContainer() {
    const rect = this.container.getBoundingClientRect();
    const padding = 40;
    const maxW = rect.width - padding;
    const maxH = rect.height - padding;
    const ratio = this.canvasWidth / this.canvasHeight;

    let displayW, displayH;
    if (maxW / maxH > ratio) {
      displayH = maxH;
      displayW = maxH * ratio;
    } else {
      displayW = maxW;
      displayH = maxW / ratio;
    }

    this.wrapper.style.width = displayW + 'px';
    this.wrapper.style.height = displayH + 'px';

    [this.bgCanvas, this.drawCanvas, this.previewCanvas].forEach(c => {
      c.style.width = displayW + 'px';
      c.style.height = displayH + 'px';
    });
  }

  // ── Stickers ──
  // ── Stickers ──
  addSticker(text) {
    const sticker = document.createElement('div');
    sticker.className = 'movable-sticker';
    sticker.dataset.stickerText = text;
    sticker.style.position = 'absolute';
    sticker.style.left = '50%';
    sticker.style.top = '50%';
    sticker.style.transform = 'translate(-50%, -50%)';
    sticker.style.fontSize = '48px';
    sticker.style.lineHeight = '1';
    sticker.style.cursor = 'move';
    sticker.style.userSelect = 'none';
    sticker.style.zIndex = '10';

    if (text.startsWith('img:')) {
      const img = document.createElement('img');
      img.src = text.replace('img:', '');
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
      sticker.appendChild(img);
    } else {
      const textNode = document.createElement('span');
      textNode.textContent = text;
      textNode.style.pointerEvents = 'none';
      sticker.appendChild(textNode);
    }

    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '-8px';
    closeBtn.style.right = '-8px';
    closeBtn.style.background = '#FF6B6B';
    closeBtn.style.color = 'white';
    closeBtn.style.width = '24px';
    closeBtn.style.height = '24px';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.fontFamily = 'sans-serif';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    closeBtn.style.border = '2px solid white';
    closeBtn.style.zIndex = '11';
    
    // Add hover effect for close button
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.transform = 'scale(1.1)');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.transform = 'scale(1)');

    sticker.appendChild(closeBtn);

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const onDown = (e) => {
      if (e.target === closeBtn) return;
      isDragging = true;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const rect = sticker.getBoundingClientRect();
      const wrapperRect = this.wrapper.getBoundingClientRect();
      
      initialLeft = rect.left - wrapperRect.left + rect.width / 2;
      initialTop = rect.top - wrapperRect.top + rect.height / 2;
      
      this.wrapper.appendChild(sticker);
      e.stopPropagation();
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      const newLeftPx = initialLeft + dx;
      const newTopPx = initialTop + dy;
      
      const percentX = (newLeftPx / this.wrapper.offsetWidth) * 100;
      const percentY = (newTopPx / this.wrapper.offsetHeight) * 100;

      sticker.style.left = percentX + '%';
      sticker.style.top = percentY + '%';
      e.preventDefault();
    };

    const onUp = () => {
      isDragging = false;
    };

    const winMove = (e) => onMove(e);
    const winUp = (e) => onUp();

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sticker.remove();
      window.removeEventListener('mousemove', winMove);
      window.removeEventListener('touchmove', winMove);
      window.removeEventListener('mouseup', winUp);
      window.removeEventListener('touchend', winUp);
    });

    sticker.addEventListener('mousedown', onDown);
    sticker.addEventListener('touchstart', onDown, { passive: false });
    
    window.addEventListener('mousemove', winMove);
    window.addEventListener('touchmove', winMove, { passive: false });
    window.addEventListener('mouseup', winUp);
    window.addEventListener('touchend', winUp);

    this.wrapper.appendChild(sticker);
  }

  _drawStickersToCanvas(ctx, targetWidth, targetHeight) {
    const stickers = this.wrapper.querySelectorAll('.movable-sticker');
    if (stickers.length === 0) return;
    
    const rect = this.wrapper.getBoundingClientRect();
    const scaleX = targetWidth / rect.width;
    const scaleY = targetHeight / rect.height;

    stickers.forEach(s => {
      const sRect = s.getBoundingClientRect();
      const cx = (sRect.left - rect.left + sRect.width / 2) * scaleX;
      const cy = (sRect.top - rect.top + sRect.height / 2) * scaleY;
      
      if (s.dataset.stickerText && s.dataset.stickerText.startsWith('img:')) {
        const imgEl = s.querySelector('img');
        if (imgEl && imgEl.complete) {
          const w = 100 * scaleX;
          const h = 100 * scaleY;
          ctx.drawImage(imgEl, cx - w / 2, cy - h / 2, w, h);
        }
      } else {
        const fontSize = 48 * scaleY;
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.dataset.stickerText, cx, cy);
      }
    });
  }

  // ── Update setting ──
  updateSetting(key, value) {
    this.settings[key] = value;
    DC.Storage.saveSettings(this.settings);
    if (key === 'bgStyle') this.drawBackground();
  }
};
