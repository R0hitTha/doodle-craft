/* DoodleCraft — Export Module */
window.DC = window.DC || {};

DC.Export = {
  save(engine) {
    const title = document.getElementById('doodle-title')?.value || 'Untitled Doodle';
    const thumbnail = engine.getThumbnail(200);
    const fullData = engine.toDataURL('image/png');

    const doodle = {
      id: engine.currentDoodleId || DC.Storage.generateId(),
      title: title,
      thumbnail: thumbnail,
      imageData: fullData,
      width: engine.canvasWidth,
      height: engine.canvasHeight,
      settings: { ...engine.settings }
    };

    DC.Storage.saveDoodle(doodle);
    engine.currentDoodleId = doodle.id;
    DC.App.showToast('Doodle saved! ✨', 'success');
    return doodle;
  },

  download(engine, format = 'png') {
    const title = document.getElementById('doodle-title')?.value || 'doodlecraft';
    const safeName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.92 : undefined;

    engine.toBlob((blob) => {
      if (!blob) {
        DC.App.showToast('Export failed', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      DC.App.showToast(`Downloaded as ${format.toUpperCase()}! 📥`, 'success');
    }, mimeType, quality);
  },

  async share(engine) {
    const title = document.getElementById('doodle-title')?.value || 'My DoodleCraft Art';

    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      try {
        const dataURL = engine.toDataURL('image/png');
        const blob = await fetch(dataURL).then(r => r.blob());
        const file = new File([blob], 'doodle.png', { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'DoodleCraft',
            text: `Check out my doodle: "${title}"`,
            files: [file]
          });
          DC.App.showToast('Shared successfully! 🎉', 'success');
          return;
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    // Fallback: copy image to clipboard
    try {
      const dataURL = engine.toDataURL('image/png');
      const blob = await fetch(dataURL).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      DC.App.showToast('Copied to clipboard! 📋', 'success');
    } catch {
      // Final fallback: copy data URL
      try {
        const dataURL = engine.toDataURL('image/png');
        await navigator.clipboard.writeText(dataURL);
        DC.App.showToast('Link copied to clipboard! 📋', 'info');
      } catch {
        DC.App.showToast('Sharing not supported in this browser', 'error');
      }
    }
  },

  showDownloadModal(engine) {
    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <h3 style="margin-bottom:16px;font-family:var(--font-display)">Download Doodle</h3>
      <p style="margin-bottom:24px;font-size:0.95rem">Choose your preferred format:</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button class="btn btn-primary" id="dl-png" style="min-width:120px">
          PNG <span style="font-size:0.75rem;opacity:0.8;display:block">Best quality</span>
        </button>
        <button class="btn btn-secondary" id="dl-jpg" style="min-width:120px">
          JPG <span style="font-size:0.75rem;opacity:0.8;display:block">Smaller file</span>
        </button>
      </div>
    `;
    DC.App.openModal();

    document.getElementById('dl-png').addEventListener('click', () => {
      this.download(engine, 'png');
      DC.App.closeModal();
    });
    document.getElementById('dl-jpg').addEventListener('click', () => {
      this.download(engine, 'jpg');
      DC.App.closeModal();
    });
  }
};
