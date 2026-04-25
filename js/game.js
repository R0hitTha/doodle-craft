/* DoodleCraft — Mini-Games */
window.DC = window.DC || {};

DC.Game = {
  score: 0,
  timeLeft: 30,
  isPlaying: false,
  timer: null,
  spawnInterval: null,
  activeEntities: [],
  spawnRate: 1000,

  init() {
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }
    
    // Add game area background
    const container = document.getElementById('snitch-game-container');
    if (container) {
      container.style.backgroundImage = 'radial-gradient(circle at center, #1a1a3a 0%, #050510 100%)';
      container.style.border = '2px solid #d3a625';
    }
  },

  startGame() {
    this.score = 0;
    this.timeLeft = 30;
    this.isPlaying = true;
    this.spawnRate = 1200;
    
    // Clear old entities
    this.activeEntities.forEach(e => e.remove());
    this.activeEntities = [];

    document.getElementById('start-game-btn').style.display = 'none';
    this.updateScore();
    this.updateTime();
    
    this.scheduleNextSpawn();

    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTime();
      
      // Speed up as time goes down
      if (this.timeLeft === 20) this.spawnRate = 900;
      if (this.timeLeft === 10) this.spawnRate = 600;
      
      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  },

  scheduleNextSpawn() {
    if (!this.isPlaying) return;
    this.spawnEntity();
    this.spawnInterval = setTimeout(() => this.scheduleNextSpawn(), this.spawnRate);
  },

  spawnEntity() {
    if (!this.isPlaying) return;
    
    const gameArea = document.getElementById('game-area');

    const rand = Math.random();
    let type = 'snitch';
    let imgSrc = null;
    let points = 10;
    let lifespan = 2000;
    
    if (rand < 0.15) {
      type = 'harry'; imgSrc = 'images/harry_sticker_1777102259714.png'; points = 20; lifespan = 1500;
    } else if (rand < 0.30) {
      type = 'hermione'; imgSrc = 'images/hermione_sticker_1777102279849.png'; points = 20; lifespan = 1500;
    } else if (rand < 0.45) {
      type = 'ron'; imgSrc = 'images/ron_sticker_1777102323126.png'; points = 20; lifespan = 1500;
    } else if (rand < 0.7) {
      type = 'snape'; imgSrc = 'images/snape_sticker_1777102386855.png'; points = -20; lifespan = 2500;
    }

    const entity = document.createElement('div');
    entity.className = 'snitch';
    entity.style.transition = 'all 0.3s ease';
    
    if (type === 'snitch') {
        entity.innerHTML = `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:45px; height:15px; background:rgba(255,255,255,0.9); border-radius:50%; box-shadow:0 0 10px white; transform:rotate(-30deg) translateX(-25px); animation: flutterLeft 0.1s infinite alternate;"></div>
            <div style="position:absolute; width:45px; height:15px; background:rgba(255,255,255,0.9); border-radius:50%; box-shadow:0 0 10px white; transform:rotate(30deg) translateX(25px); animation: flutterRight 0.1s infinite alternate;"></div>
            <div style="position:absolute; z-index:2; width:28px; height:28px; background:radial-gradient(circle, #fff 10%, #ffd700 40%, #b8860b 90%); border-radius:50%; box-shadow:0 0 20px #ffd700, inset 0 0 5px #fff;"></div>
          </div>
        `;
    } else {
        const color = type === 'snape' ? 'rgba(255,0,0,0.5)' : 'rgba(211,166,37,0.5)';
        entity.innerHTML = `<img src="${imgSrc}" style="width:70px; height:70px; object-fit:contain; border-radius:50%; box-shadow: 0 0 20px ${color}; background:rgba(0,0,0,0.6); pointer-events:none;">`;
    }
    
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;
    entity.style.left = x + '%';
    entity.style.top = y + '%';
    entity.style.transform = 'scale(0)';
    
    gameArea.appendChild(entity);
    this.activeEntities.push(entity);

    // Animate in
    setTimeout(() => entity.style.transform = 'scale(1)', 50);

    const removeEntity = () => {
      entity.style.transform = 'scale(0)';
      setTimeout(() => {
        if (entity.parentNode) entity.remove();
        this.activeEntities = this.activeEntities.filter(e => e !== entity);
      }, 300);
    };

    // Auto remove after lifespan
    const timeoutId = setTimeout(() => {
      if (this.isPlaying && entity.parentNode) removeEntity();
    }, lifespan);
    
    const onClick = (e) => {
      if (!this.isPlaying) return;
      e.preventDefault();
      
      this.score += points;
      this.updateScore();
      
      if (type === 'snape') {
        if (DC.App) DC.App.showToast('Oh no! Snape caught you! -20 points', 'error');
        gameArea.style.backgroundColor = 'rgba(255,0,0,0.3)';
        setTimeout(() => gameArea.style.backgroundColor = 'transparent', 200);
      } else {
        const msg = type === 'snitch' ? '+10 Snitch!' : `+20 ${type.charAt(0).toUpperCase() + type.slice(1)}!`;
        if (DC.App) DC.App.showToast(msg, 'success');
        
        // Success flash
        gameArea.style.backgroundColor = 'rgba(211,166,37,0.2)';
        setTimeout(() => gameArea.style.backgroundColor = 'transparent', 200);
      }
      
      clearTimeout(timeoutId);
      removeEntity();
    };

    entity.addEventListener('mousedown', onClick);
    entity.addEventListener('touchstart', onClick, { passive: false });
  },

  updateScore() {
    const el = document.getElementById('snitch-score');
    if (el) el.textContent = this.score;
  },

  updateTime() {
    const el = document.getElementById('snitch-time');
    if (el) el.textContent = this.timeLeft;
  },

  endGame() {
    this.isPlaying = false;
    clearInterval(this.timer);
    if (this.spawnInterval) clearTimeout(this.spawnInterval);
    
    this.activeEntities.forEach(e => {
        e.style.transform = 'scale(0)';
        setTimeout(() => e.remove(), 300);
    });
    this.activeEntities = [];

    const startBtn = document.getElementById('start-game-btn');
    startBtn.style.display = 'inline-flex';
    startBtn.textContent = 'Play Again (Score: ' + this.score + ')';
    
    if (DC.App) {
      DC.App.showToast(`Game Over! Final Score: ${this.score}`, 'info');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DC.Game.init();
});
