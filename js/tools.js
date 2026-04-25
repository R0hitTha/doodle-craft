/* DoodleCraft — Drawing Tools */
window.DC = window.DC || {};

DC.Tools = {
  registry: {},

  register(name, tool) {
    this.registry[name] = tool;
  },

  getTool(name) {
    return this.registry[name] || this.registry['pen'];
  },

  getAll() {
    return this.registry;
  }
};

// ── Pen Tool ──
DC.Tools.register('pen', {
  name: 'Pen',
  icon: 'pen',
  onStart(engine, pos) {
    engine.applyBrushSettings(engine.ctx);
    // Draw a dot immediately for visual feedback
    engine.ctx.beginPath();
    engine.ctx.arc(pos.x, pos.y, engine.settings.size / 2, 0, Math.PI * 2);
    engine.ctx.fill();
  },
  onMove(engine, pos, points) {
    engine.applyBrushSettings(engine.ctx);
    const len = points.length;
    if (len < 2) return;
    const p1 = points[len - 2];
    const p2 = points[len - 1];
    engine.ctx.beginPath();
    engine.ctx.moveTo(p1.x, p1.y);
    engine.ctx.lineTo(p2.x, p2.y);
    engine.ctx.stroke();
  },
  onEnd(engine, points) {
    engine.ctx.globalAlpha = 1;
    engine.ctx.setLineDash([]);
  }
});

// ── Brush Tool (variable width) ──
DC.Tools.register('brush', {
  name: 'Brush',
  icon: 'brush',
  onStart(engine, pos) {
    engine.applyBrushSettings(engine.ctx);
    engine.ctx.lineWidth = engine.settings.size * 2;
    // Draw a dot immediately for visual feedback
    engine.ctx.beginPath();
    engine.ctx.arc(pos.x, pos.y, engine.settings.size, 0, Math.PI * 2);
    engine.ctx.fill();
  },
  onMove(engine, pos, points) {
    engine.applyBrushSettings(engine.ctx);
    engine.ctx.lineWidth = engine.settings.size * 2;
    const len = points.length;
    if (len < 2) return;
    // Simulate pressure with speed
    const p1 = points[len - 2];
    const p2 = points[len - 1];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const speed = Math.min(dist / 5, 3);
    const width = Math.max(engine.settings.size * 2 - speed * 2, engine.settings.size * 0.5);
    engine.ctx.lineWidth = width;
    engine.ctx.beginPath();
    engine.ctx.moveTo(p1.x, p1.y);
    engine.ctx.lineTo(p2.x, p2.y);
    engine.ctx.stroke();
  },
  onEnd(engine, points) {
    engine.ctx.globalAlpha = 1;
    engine.ctx.setLineDash([]);
  }
});

// ── Eraser Tool ──
DC.Tools.register('eraser', {
  name: 'Eraser',
  icon: 'eraser',
  onStart(engine, pos) {
    // Erase at click point immediately
    engine.ctx.globalCompositeOperation = 'destination-out';
    engine.ctx.beginPath();
    engine.ctx.arc(pos.x, pos.y, engine.settings.size * 1.5, 0, Math.PI * 2);
    engine.ctx.fill();
    engine.ctx.globalCompositeOperation = 'source-over';
  },
  onMove(engine, pos, points) {
    const len = points.length;
    if (len < 2) return;
    const p1 = points[len - 2];
    const p2 = points[len - 1];
    engine.ctx.globalCompositeOperation = 'destination-out';
    engine.ctx.lineWidth = engine.settings.size * 3;
    engine.ctx.lineCap = 'round';
    engine.ctx.beginPath();
    engine.ctx.moveTo(p1.x, p1.y);
    engine.ctx.lineTo(p2.x, p2.y);
    engine.ctx.stroke();
    engine.ctx.globalCompositeOperation = 'source-over';
  },
  onEnd(engine, points) {
    engine.ctx.globalCompositeOperation = 'source-over';
  }
});

// ── Line Tool ──
DC.Tools.register('line', {
  name: 'Line',
  icon: 'line',
  onStart(engine, pos) {},
  onMove(engine, pos, points) {
    engine.clearPreview();
    engine.applyBrushSettings(engine.previewCtx);
    engine.previewCtx.beginPath();
    engine.previewCtx.moveTo(points[0].x, points[0].y);
    engine.previewCtx.lineTo(pos.x, pos.y);
    engine.previewCtx.stroke();
  },
  onEnd(engine, points) {
    if (points.length < 2) return;
    engine.applyBrushSettings(engine.ctx);
    engine.ctx.beginPath();
    engine.ctx.moveTo(points[0].x, points[0].y);
    engine.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    engine.ctx.stroke();
    engine.ctx.globalAlpha = 1;
    engine.ctx.setLineDash([]);
  }
});

// ── Rectangle Tool ──
DC.Tools.register('rectangle', {
  name: 'Rectangle',
  icon: 'rect',
  onStart(engine, pos) {},
  onMove(engine, pos, points) {
    engine.clearPreview();
    engine.applyBrushSettings(engine.previewCtx);
    const x = Math.min(points[0].x, pos.x);
    const y = Math.min(points[0].y, pos.y);
    const w = Math.abs(pos.x - points[0].x);
    const h = Math.abs(pos.y - points[0].y);
    engine.previewCtx.strokeRect(x, y, w, h);
  },
  onEnd(engine, points) {
    if (points.length < 2) return;
    engine.applyBrushSettings(engine.ctx);
    const last = points[points.length - 1];
    const x = Math.min(points[0].x, last.x);
    const y = Math.min(points[0].y, last.y);
    const w = Math.abs(last.x - points[0].x);
    const h = Math.abs(last.y - points[0].y);
    engine.ctx.strokeRect(x, y, w, h);
    engine.ctx.globalAlpha = 1;
    engine.ctx.setLineDash([]);
  }
});

// ── Circle Tool ──
DC.Tools.register('circle', {
  name: 'Circle',
  icon: 'circle',
  onStart(engine, pos) {},
  onMove(engine, pos, points) {
    engine.clearPreview();
    engine.applyBrushSettings(engine.previewCtx);
    const dx = pos.x - points[0].x;
    const dy = pos.y - points[0].y;
    const radius = Math.hypot(dx, dy);
    engine.previewCtx.beginPath();
    engine.previewCtx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
    engine.previewCtx.stroke();
  },
  onEnd(engine, points) {
    if (points.length < 2) return;
    engine.applyBrushSettings(engine.ctx);
    const last = points[points.length - 1];
    const radius = Math.hypot(last.x - points[0].x, last.y - points[0].y);
    engine.ctx.beginPath();
    engine.ctx.arc(points[0].x, points[0].y, radius, 0, Math.PI * 2);
    engine.ctx.stroke();
    engine.ctx.globalAlpha = 1;
    engine.ctx.setLineDash([]);
  }
});

// ── Arrow Tool ──
DC.Tools.register('arrow', {
  name: 'Arrow',
  icon: 'arrow',
  _drawArrow(ctx, from, to, size) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = Math.max(size * 4, 15);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  },
  onStart(engine, pos) {},
  onMove(engine, pos, points) {
    engine.clearPreview();
    engine.applyBrushSettings(engine.previewCtx);
    this._drawArrow(engine.previewCtx, points[0], pos, engine.settings.size);
  },
  onEnd(engine, points) {
    if (points.length < 2) return;
    engine.applyBrushSettings(engine.ctx);
    this._drawArrow(engine.ctx, points[0], points[points.length - 1], engine.settings.size);
    engine.ctx.globalAlpha = 1;
    engine.ctx.setLineDash([]);
  }
});

// ── Text Tool ──
DC.Tools.register('text', {
  name: 'Text',
  icon: 'text',
  onStart(engine, pos) {
    this._pos = pos;
  },
  onMove() {},
  onEnd(engine, points) {
    const pos = this._pos || points[0];
    const text = prompt('Enter text:');
    if (!text) return;
    engine.ctx.globalAlpha = engine.settings.opacity;
    engine.ctx.fillStyle = engine.settings.color;
    engine.ctx.font = `${Math.max(engine.settings.size * 5, 16)}px Caveat, cursive`;
    engine.ctx.textBaseline = 'top';
    engine.ctx.fillText(text, pos.x, pos.y);
    engine.ctx.globalAlpha = 1;
  }
});

// ── Fill Tool ──
DC.Tools.register('fill', {
  name: 'Fill',
  icon: 'fill',
  onStart(engine, pos) {
    this._floodFill(engine, Math.round(pos.x), Math.round(pos.y));
  },
  onMove() {},
  onEnd() {},
  _floodFill(engine, startX, startY) {
    const w = engine.canvasWidth;
    const h = engine.canvasHeight;
    const dpr = engine.dpr;
    const imgData = engine.ctx.getImageData(0, 0, w * dpr, h * dpr);
    const data = imgData.data;
    const sx = Math.round(startX * dpr);
    const sy = Math.round(startY * dpr);
    const pw = w * dpr;
    const ph = h * dpr;

    if (sx < 0 || sx >= pw || sy < 0 || sy >= ph) return;

    const idx = (sy * pw + sx) * 4;
    const targetR = data[idx], targetG = data[idx + 1], targetB = data[idx + 2], targetA = data[idx + 3];

    // Parse fill color
    const fillColor = this._hexToRgba(engine.settings.color, engine.settings.opacity);
    if (targetR === fillColor.r && targetG === fillColor.g && targetB === fillColor.b && targetA === fillColor.a) return;

    const tolerance = 30;
    const stack = [[sx, sy]];
    const visited = new Uint8Array(pw * ph);

    const match = (i) => {
      return Math.abs(data[i] - targetR) <= tolerance &&
             Math.abs(data[i + 1] - targetG) <= tolerance &&
             Math.abs(data[i + 2] - targetB) <= tolerance &&
             Math.abs(data[i + 3] - targetA) <= tolerance;
    };

    let iterations = 0;
    const maxIterations = pw * ph;

    while (stack.length > 0 && iterations < maxIterations) {
      iterations++;
      const [x, y] = stack.pop();
      const vi = y * pw + x;
      if (visited[vi]) continue;
      const i = vi * 4;
      if (!match(i)) continue;
      visited[vi] = 1;
      data[i] = fillColor.r;
      data[i + 1] = fillColor.g;
      data[i + 2] = fillColor.b;
      data[i + 3] = fillColor.a;
      if (x > 0) stack.push([x - 1, y]);
      if (x < pw - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < ph - 1) stack.push([x, y + 1]);
    }

    engine.ctx.putImageData(imgData, 0, 0);
  },
  _hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b, a: Math.round(opacity * 255) };
  }
});

// ── Eyedropper Tool ──
DC.Tools.register('eyedropper', {
  name: 'Pick Color',
  icon: 'eyedropper',
  onStart(engine, pos) {
    const dpr = engine.dpr;
    const px = engine.ctx.getImageData(pos.x * dpr, pos.y * dpr, 1, 1).data;
    const hex = '#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    engine.updateSetting('color', hex);
    // Update UI
    if (DC.Customization) DC.Customization.updateColorUI(hex);
    DC.App.showToast('Color picked: ' + hex, 'info');
    // Switch back to pen
    engine.updateSetting('tool', 'pen');
    if (DC.App) DC.App.setActiveTool('pen');
  },
  onMove() {},
  onEnd() {}
});

// Tool definitions for toolbar rendering
DC.Tools.toolList = [
  { id: 'pen', name: 'Pen', shortcut: 'P', icon: `<svg viewBox="0 0 24 24"><path d="M3 21l1.5-4.5L17.7 3.3a1 1 0 011.4 0l1.6 1.6a1 1 0 010 1.4L7.5 19.5z"/><path d="M15 5l4 4"/></svg>` },
  { id: 'brush', name: 'Brush', shortcut: 'B', icon: `<svg viewBox="0 0 24 24"><path d="M18.4 2.6a2 2 0 012.8 2.8l-8.5 8.5a4 4 0 01-1.7 1L8 16l1.1-3a4 4 0 011-1.7z"/><path d="M7 16c-2.5 0-4 1.5-4 4 1.5 0 4-.5 4-4z"/></svg>` },
  { id: 'eraser', name: 'Eraser', shortcut: 'E', icon: `<svg viewBox="0 0 24 24"><path d="M20 20H7L3 16a1 1 0 010-1.4l9.6-9.6a2 2 0 012.8 0l5.2 5.2a2 2 0 010 2.8L14 19.6"/><path d="M6 12l6 6"/></svg>` },
  { id: 'sep1', separator: true },
  { id: 'line', name: 'Line', shortcut: 'L', icon: `<svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5" stroke-linecap="round"/></svg>` },
  { id: 'rectangle', name: 'Rectangle', shortcut: 'R', icon: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/></svg>` },
  { id: 'circle', name: 'Circle', shortcut: 'C', icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>` },
  { id: 'arrow', name: 'Arrow', shortcut: 'A', icon: `<svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/></svg>` },
  { id: 'sep2', separator: true },
  { id: 'text', name: 'Text', shortcut: 'T', icon: `<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>` },
  { id: 'fill', name: 'Fill', shortcut: 'F', icon: `<svg viewBox="0 0 24 24"><path d="M2.5 18.5l9-9 5 5-9 9a1 1 0 01-1.4 0l-3.6-3.6a1 1 0 010-1.4z"/><path d="M8.5 6.5l5 5"/><path d="M15.5 6.5l-3-3"/><path d="M19 13c1.5 2 2 3.5 2 5a3 3 0 01-6 0c0-1.5.5-3 2-5l1-1.5z"/></svg>` },
  { id: 'eyedropper', name: 'Pick Color', shortcut: 'I', icon: `<svg viewBox="0 0 24 24"><path d="M21 3l-1.5 1.5M17 6l-8 8-2 6 6-2 8-8M14 10l-1-1"/><path d="M2 22l4-4"/></svg>` },
];
