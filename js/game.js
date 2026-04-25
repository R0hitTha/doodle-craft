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

DC.RunnerGame = {
  score: 0,
  isPlaying: false,
  speed: 0.5, // moving speed of obstacles
  lanes: [-3, 0, 3], // x positions
  currentLane: 1, // center
  isJumping: false,
  yVelocity: 0,
  gravity: -0.015,
  jumpStrength: 0.35,
  obstacles: [],
  coins: [],
  scene: null,
  camera: null,
  renderer: null,
  player: null,
  chaser: null,
  floor: null,
  animationId: null,
  textureLoader: null,
  lastGamepadState: {}, // To prevent rapid-fire jumping on console controllers

  init() {
    const startBtn = document.getElementById('start-runner-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }

    // Tabs logic
    document.querySelectorAll('.gallery-tab[data-game]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.gallery-tab[data-game]').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        const snitchGame = document.getElementById('snitch-game-container');
        const runnerGame = document.getElementById('runner-game-container');
        const flappyGame = document.getElementById('flappy-game-container');
        
        if (snitchGame) snitchGame.style.display = 'none';
        if (runnerGame) runnerGame.style.display = 'none';
        if (flappyGame) flappyGame.style.display = 'none';
        
        if (e.target.dataset.game === 'snitch') {
          if (snitchGame) snitchGame.style.display = 'flex';
          this.stop3D();
          if (DC.FlappyGame) DC.FlappyGame.stop3D();
        } else if (e.target.dataset.game === 'runner') {
          if (runnerGame) runnerGame.style.display = 'flex';
          this.init3D();
          if (DC.FlappyGame) DC.FlappyGame.stop3D();
        } else if (e.target.dataset.game === 'flappy') {
          if (flappyGame) flappyGame.style.display = 'flex';
          this.stop3D();
          if (DC.FlappyGame) DC.FlappyGame.init3D();
        }
      });
    });

    // Keyboard Controls
    document.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveLane(-1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveLane(1);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this.jump();
    });

    // Swipe Controls
    const area = document.getElementById('runner-game-area');
    if (area) {
      let startX = 0, startY = 0;
      area.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
      area.addEventListener('touchend', (e) => {
        if (!this.isPlaying) return;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - startX;
        const dy = endY - startY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) > 30) this.moveLane(dx > 0 ? 1 : -1);
        } else {
          if (dy < -30) this.jump(); // swipe up
        }
      }, { passive: true });
    }

    // Selection Logic
    this.selectedChar = 'images/harry_sticker_1777102259714.png';
    this.selectedVillain = 'images/voldemort_sticker_1777104400035.png';
    
    document.querySelectorAll('.char-select').forEach(img => {
      img.addEventListener('click', (e) => {
        document.querySelectorAll('.char-select').forEach(el => {
          el.classList.remove('active');
          el.style.borderColor = 'transparent';
        });
        e.target.classList.add('active');
        e.target.style.borderColor = 'gold';
        this.selectedChar = e.target.dataset.img;
      });
    });

    document.querySelectorAll('.villain-select').forEach(img => {
      img.addEventListener('click', (e) => {
        document.querySelectorAll('.villain-select').forEach(el => {
          el.classList.remove('active');
          el.style.borderColor = 'transparent';
        });
        e.target.classList.add('active');
        e.target.style.borderColor = 'red';
        this.selectedVillain = e.target.dataset.img;
      });
    });
  },

  init3D() {
    if (this.scene) return; // already initialized
    if (typeof THREE === 'undefined') return;

    const container = document.getElementById('runner-game-area');
    
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020205, 0.025);
    
    this.textureLoader = new THREE.TextureLoader();
    this.bgStaircase = this.textureLoader.load('images/bg_staircase_1777105378907.png');
    this.bgDiagonAlley = this.textureLoader.load('images/bg_diagon_alley_1777105520467.png');
    this.bgHogwarts = this.textureLoader.load('images/bg_hogwarts_1777105596178.png');
    this.scene.background = this.bgStaircase;

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 150);
    // Camera looks down the track
    this.camera.position.set(0, 5, 12);
    this.camera.lookAt(0, 0, -20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x404060, 1.5);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffaa00, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Ambient floating stars/magic dust
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 300;
    const dustPos = new Float32Array(dustCount * 3);
    for(let i=0; i<dustCount*3; i++) {
      dustPos[i] = (Math.random() - 0.5) * 60;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 200);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f2015, roughness: 0.9, metalness: 0.1 });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.z = -50;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Track Lane Dividers
    const lineGeo = new THREE.PlaneGeometry(0.2, 200);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3 });
    const line1 = new THREE.Mesh(lineGeo, lineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(-1.5, 0.02, -50);
    this.scene.add(line1);
    const line2 = new THREE.Mesh(lineGeo, lineMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(1.5, 0.02, -50);
    this.scene.add(line2);

    // Character Sprite (2D Billboard style)
    const playerGeo = new THREE.PlaneGeometry(1.8, 2.4);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    this.player = new THREE.Mesh(playerGeo, playerMat);
    this.player.position.set(0, 1.2, 0); 
    this.player.castShadow = true;
    this.scene.add(this.player);

    // Chaser Sprite
    const chaserGeo = new THREE.PlaneGeometry(1.8, 2.4);
    const chaserMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    this.chaser = new THREE.Mesh(chaserGeo, chaserMat);
    this.chaser.position.set(-3, 1.2, 6); 
    this.chaser.castShadow = true;
    this.scene.add(this.chaser);

    // Particles array
    this.particles = [];

    window.addEventListener('resize', () => {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Render an initial frame
    this.renderer.render(this.scene, this.camera);
  },

  startGame() {
    this.init3D();
    if (!this.scene) return;
    
    // Apply selected textures to Sprites
    this.textureLoader.load(this.selectedChar, (tex) => {
      this.player.material.map = tex;
      this.player.material.needsUpdate = true;
    });

    this.textureLoader.load(this.selectedVillain, (tex) => {
      this.chaser.material.map = tex;
      this.chaser.material.needsUpdate = true;
    });

    this.score = 0;
    this.isPlaying = true;
    this.speed = 0.5;
    this.currentLane = 1;
    this.player.position.set(this.lanes[this.currentLane], 1, 0);
    this.chaser.position.set(this.lanes[this.currentLane], 1, 6);
    this.scene.background = this.bgStaircase;
    this.floor.material.color.setHex(0x0f2015);
    this.scene.fog.density = 0.025;
    
    // Clear obstacles and coins
    this.obstacles.forEach(o => this.scene.remove(o));
    this.obstacles = [];
    this.coins.forEach(c => this.scene.remove(c));
    this.coins = [];
    
    // Clear particles
    this.particles.forEach(p => this.scene.remove(p));
    this.particles = [];

    document.getElementById('runner-selection-screen').style.display = 'none';
    document.getElementById('runner-score-board').style.display = 'block';
    document.getElementById('runner-score').textContent = '0';
    
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  },

  moveLane(dir) {
    this.currentLane += dir;
    if (this.currentLane < 0) this.currentLane = 0;
    if (this.currentLane > 2) this.currentLane = 2;
  },

  jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.yVelocity = this.jumpStrength;
  },

  spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const isTall = Math.random() > 0.5;

    let obs;
    if (isTall) {
      // Tall Pillar (Must dodge)
      const geo = new THREE.CylinderGeometry(0.8, 1.2, 4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
      obs = new THREE.Mesh(geo, mat);
      obs.position.set(this.lanes[lane], 2, -80);
    } else {
      // Short Trunk (Can jump over)
      const geo = new THREE.BoxGeometry(1.5, 1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 }); // Brown wood
      obs = new THREE.Mesh(geo, mat);
      obs.position.set(this.lanes[lane], 0.5, -80);
      
      // Add metallic bands
      const bandGeo = new THREE.BoxGeometry(1.55, 1.05, 0.2);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
      const band1 = new THREE.Mesh(bandGeo, bandMat);
      band1.position.x = -0.5;
      obs.add(band1);
      const band2 = new THREE.Mesh(bandGeo, bandMat);
      band2.position.x = 0.5;
      obs.add(band2);
    }

    obs.castShadow = true;
    this.scene.add(obs);
    this.obstacles.push(obs);
  },

  spawnCoin() {
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.SphereGeometry(0.4, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.2, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const coin = new THREE.Mesh(geo, mat);
    // Add little wings
    const wingGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    coin.add(wing);

    coin.position.set(this.lanes[lane], 1.5, -80);
    this.scene.add(coin);
    this.coins.push(coin);
  },

  gameLoop(time) {
    if (!this.isPlaying) return;

    const delta = time - this.lastTime;
    this.lastTime = time;

    // --- CONSOLE GAMEPAD SUPPORT ---
    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      if (gamepads[0]) {
        const gp = gamepads[0];
        // Jump: Button 0 (A/Cross) or D-Pad Up (12)
        const jumpPressed = gp.buttons[0]?.pressed || gp.buttons[12]?.pressed;
        if (jumpPressed && !this.lastGamepadState.jump) this.jump();
        this.lastGamepadState.jump = jumpPressed;

        // Move Left: D-Pad Left (14) or Left Stick X < -0.5
        const leftPressed = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
        if (leftPressed && !this.lastGamepadState.left) this.moveLane(-1);
        this.lastGamepadState.left = leftPressed;

        // Move Right: D-Pad Right (15) or Left Stick X > 0.5
        const rightPressed = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
        if (rightPressed && !this.lastGamepadState.right) this.moveLane(1);
        this.lastGamepadState.right = rightPressed;
      }
    }
    // --------------------------------

    // Score and Speed (distance points)
    this.score += 1;
    if (this.score % 5 === 0) {
      document.getElementById('runner-score').textContent = Math.floor(this.score / 10);
    }
    // Gradually increase speed
    this.speed += 0.0001;

    // Spawning
    if (Math.random() < 0.02) this.spawnObstacle();
    if (Math.random() < 0.015) this.spawnCoin(); 

    // Smooth lane transition for Player
    const targetX = this.lanes[this.currentLane];
    this.player.position.x += (targetX - this.player.position.x) * 0.2;

    // Chaser follows player loosely
    this.chaser.position.x += (targetX - this.chaser.position.x) * 0.05;
    // Dynamic Environment Changes (Approx 30 seconds and 60 seconds)
    // 60fps * 30s = 1800 ticks -> displayScore = 180
    const displayScore = Math.floor(this.score / 10);
    if (displayScore === 180 && this.scene.background !== this.bgDiagonAlley) {
      // Transition to Diagon Alley (30 seconds)
      this.scene.background = this.bgDiagonAlley;
      this.floor.material.color.setHex(0x2a2a2a); // Gray cobblestone vibe
      this.scene.fog.density = 0.015;
      if (DC.App) DC.App.showToast('Entering Diagon Alley...', 'info');
    } else if (displayScore === 360 && this.scene.background !== this.bgHogwarts) {
      // Transition to Hogwarts Castle (60 seconds)
      this.scene.background = this.bgHogwarts;
      this.floor.material.color.setHex(0x11321d); // Greenish grounds
      this.scene.fog.density = 0.005; // less fog
      if (DC.App) DC.App.showToast('Arriving at Hogwarts!', 'success');
    }

    // Grid floor scrolling illusion
    if (this.grid) {
      this.grid.position.z += this.speed;
      if (this.grid.position.z >= 0) this.grid.position.z -= 10;
    }

    // Player Jump Physics
    if (this.isJumping) {
      this.player.position.y += this.yVelocity;
      this.yVelocity += this.gravity;
      // Hit ground
      if (this.player.position.y <= 1) {
        this.player.position.y = 1;
        this.isJumping = false;
        this.yVelocity = 0;
      }
    }

    // Spawn obstacles
    if (Math.random() < 0.03 + (this.speed * 0.01)) {
      // Don't spawn too often
      if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length-1].position.z > -60) {
        this.spawnObstacle();
      }
    }

    // Move obstacles and collision
    const playerBox = new THREE.Box3().setFromObject(this.player);
    playerBox.expandByScalar(-0.5); // Forgiving hitbox for plane

    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      obs.position.z += this.speed;

      // Rotate obstacle slightly for organic feel if it's a pillar
      if (obs.geometry.type === "CylinderGeometry") {
        obs.rotation.y += 0.01;
      }

      const obsBox = new THREE.Box3().setFromObject(obs);
      obsBox.expandByScalar(-0.2);

      // Collision
      if (playerBox.intersectsBox(obsBox)) {
        this.endGame();
        return;
      }

      // Remove passed obstacles
      if (obs.position.z > 15) {
        this.scene.remove(obs);
        this.obstacles.splice(i, 1);
        i--;
      }
    }

    // Move coins and collect
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      coin.position.z += this.speed;
      coin.rotation.y += 0.1;

      const coinBox = new THREE.Box3().setFromObject(coin);
      
      if (playerBox.intersectsBox(coinBox)) {
        // Collect!
        this.score += 500; // adds 50 to display score
        document.getElementById('runner-score').textContent = Math.floor(this.score / 10);
        
        // Spawn collection particles
        for(let p=0; p<5; p++){
          const sparkGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
          const spark = new THREE.Mesh(sparkGeo, sparkMat);
          spark.position.copy(coin.position);
          spark.position.x += (Math.random()-0.5)*2;
          spark.position.y += (Math.random()-0.5)*2;
          this.scene.add(spark);
          this.particles.push(spark);
        }

        this.scene.remove(coin);
        this.coins.splice(i, 1);
        i--;
        continue;
      }

      if (coin.position.z > 15) {
        this.scene.remove(coin);
        this.coins.splice(i, 1);
        i--;
      }
    }

    // Magical Particles trail behind player
    if (Math.random() < 0.4) {
      const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.8 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(this.player.position.x + (Math.random() - 0.5), this.player.position.y - 0.5, this.player.position.z + 1);
      this.scene.add(p);
      this.particles.push(p);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.position.y += 0.05;
      p.position.z += this.speed * 0.5;
      p.material.opacity -= 0.02;
      p.rotation.x += 0.1;
      
      if (p.material.opacity <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
        i--;
      }
    }

    if (this.dustParticles) {
      this.dustParticles.rotation.y += 0.001;
      this.dustParticles.position.z += this.speed * 0.1;
      if(this.dustParticles.position.z > 20) this.dustParticles.position.z = -20;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  },

  endGame() {
    this.isPlaying = false;
    
    // Animate chaser catching up
    this.chaser.position.z = 1; 

    setTimeout(() => {
      document.getElementById('runner-selection-screen').style.display = 'flex';
      document.getElementById('runner-score-board').style.display = 'none';
      const startBtn = document.getElementById('start-runner-btn');
      startBtn.textContent = 'Try Again (Score: ' + Math.floor(this.score / 10) + ')';
    }, 1500);
    
    if (DC.App) {
      let villainName = "The enemy";
      if (this.selectedVillain.includes('snape')) villainName = "Snape";
      if (this.selectedVillain.includes('voldemort')) villainName = "Voldemort";
      if (this.selectedVillain.includes('draco')) villainName = "Draco";

      DC.App.showToast(`Game Over! ${villainName} caught you! Score: ${Math.floor(this.score / 10)}`, 'error');
    }
  },

  stop3D() {
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
};

/* ═════════════════════════════════════════
   FLAPPY BROOM GAME (3D)
═══════════════════════════════════════════ */
DC.FlappyGame = {
  score: 0,
  isPlaying: false,
  scene: null,
  camera: null,
  renderer: null,
  player: null,
  obstacles: [],
  animationId: null,
  
  // Physics
  velocity: 0,
  gravity: -0.005, // Much slower falling
  flapStrength: 0.12, // Softer jump
  speed: 0.1, // Slower forward movement
  pipeSpawnTimer: 0,
  selectedChar: 'images/harry_sticker_1777102259714.png',
  lastGamepadState: {}, // For console controller
  particles: [],
  coins: [],

  init3D() {
    if (this.scene) return;
    if (typeof THREE === 'undefined') return;

    const container = document.getElementById('flappy-game-area');
    
    this.scene = new THREE.Scene();
    this.textureLoader = new THREE.TextureLoader();
    this.bgQuidditch = this.textureLoader.load('images/bg_quidditch_1777105904225.png');
    this.bgQuidditch.wrapS = THREE.RepeatWrapping;
    this.bgQuidditch.wrapT = THREE.RepeatWrapping;
    
    // Animated Background Mesh
    const bgGeo = new THREE.PlaneGeometry(200, 100);
    const bgMat = new THREE.MeshBasicMaterial({ map: this.bgQuidditch });
    this.bgMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgMesh.position.set(0, 10, -30);
    this.scene.add(this.bgMesh);

    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    // Side view orthographic or narrow perspective
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.set(0, 5, 25);
    this.camera.lookAt(0, 5, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Player (Harry on a broom)
    this.player = new THREE.Group();
    
    // Character Sprite
    const charGeo = new THREE.PlaneGeometry(1.6, 2.2);
    const charMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    this.playerSprite = new THREE.Mesh(charGeo, charMat);
    this.playerSprite.position.y = 0.5;
    this.playerSprite.castShadow = true;
    this.player.add(this.playerSprite);

    // Broom
    const broomGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    const broomMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const broom = new THREE.Mesh(broomGeo, broomMat);
    broom.rotation.z = Math.PI / 2;
    broom.position.set(0, -0.5, 0);
    this.player.add(broom);
    
    // Broom bristles
    const bristleGeo = new THREE.ConeGeometry(0.4, 1, 8);
    const bristleMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
    const bristles = new THREE.Mesh(bristleGeo, bristleMat);
    bristles.rotation.z = -Math.PI / 2;
    bristles.position.set(-2, -0.5, 0);
    this.player.add(bristles);

    this.scene.add(this.player);

    // Clouds
    for(let i=0; i<10; i++) {
      const cloudGeo = new THREE.SphereGeometry(Math.random() * 2 + 1, 8, 8);
      const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set((Math.random() - 0.5) * 60, Math.random() * 10 + 5, -10 - Math.random() * 10);
      this.scene.add(cloud);
    }

    // Selection Logic
    document.querySelectorAll('.flappy-char-select').forEach(img => {
      img.addEventListener('click', (e) => {
        document.querySelectorAll('.flappy-char-select').forEach(el => {
          el.classList.remove('active');
          el.style.borderColor = 'transparent';
        });
        e.target.classList.add('active');
        e.target.style.borderColor = 'gold';
        this.selectedChar = e.target.dataset.img;
      });
    });

    // Input
    const startBtn = document.getElementById('start-flappy-btn');
    if (startBtn) startBtn.addEventListener('click', () => this.startGame());

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isPlaying) this.flap();
    });
    
    container.addEventListener('mousedown', () => { if(this.isPlaying) this.flap(); });
    container.addEventListener('touchstart', (e) => { 
      if(this.isPlaying) { e.preventDefault(); this.flap(); }
    }, { passive: false });

    window.addEventListener('resize', () => {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    this.renderer.render(this.scene, this.camera);
  },

  startGame() {
    this.score = 0;
    this.isPlaying = true;
    this.velocity = 0;
    this.speed = 0.1; // Slower forward movement
    this.player.position.set(-10, 5, 0); // Start on left side
    this.player.rotation.z = 0;

    // Reset Sky
    this.bgMesh.material.color.setHex(0xffffff); // reset tint
    this.scene.fog.color.setHex(0x87CEEB);

    // Apply selected texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(this.selectedChar, (tex) => {
      this.playerSprite.material.map = tex;
      this.playerSprite.material.needsUpdate = true;
    });

    // Clear obstacles and coins
    this.obstacles.forEach(o => {
      this.scene.remove(o.mesh);
    });
    this.obstacles = [];
    this.pipeSpawnTimer = 0;
    
    this.coins.forEach(c => this.scene.remove(c));
    this.coins = [];
    
    // Clear particles
    this.particles.forEach(p => this.scene.remove(p));
    this.particles = [];

    document.getElementById('flappy-selection-screen').style.display = 'none';
    document.getElementById('flappy-score-board').style.display = 'block';
    document.getElementById('flappy-score').textContent = '0';

    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  },

  flap() {
    this.velocity = this.flapStrength;
    this.player.rotation.z = 0.5; // Softer tilt
  },

  spawnPipe() {
    // Generate Golden Quidditch Hoops
    const gapCenter = Math.random() * 8 + 2; 

    // Golden material
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });

    // The entire obstacle group
    const hoopGroup = new THREE.Group();

    // The pole (bottom part)
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 20, 8);
    const pole = new THREE.Mesh(poleGeo, goldMat);
    pole.position.y = -10; // offset so top is at 0
    hoopGroup.add(pole);

    // The hoop (torus)
    const ringGeo = new THREE.TorusGeometry(2.5, 0.2, 8, 24);
    const ring = new THREE.Mesh(ringGeo, goldMat);
    ring.position.y = 2.5; // sit on top of pole
    hoopGroup.add(ring);

    hoopGroup.position.set(20, gapCenter - 2.5, 0);
    this.scene.add(hoopGroup);

    // Hitboxes (Top bounds and Bottom bounds around the hoop hole)
    // We create two invisible boxes so the player has to fly *through* the Torus
    const topBox = new THREE.Box3();
    topBox.min.set(20 - 1, gapCenter + 2, -2);
    topBox.max.set(20 + 1, 50, 2);

    const bottomBox = new THREE.Box3();
    bottomBox.min.set(20 - 1, -50, -2);
    bottomBox.max.set(20 + 1, gapCenter - 2, 2);

    this.obstacles.push({ mesh: hoopGroup, topBox: topBox, bottomBox: bottomBox, passed: false });
  },

  spawnCoin() {
    const geo = new THREE.SphereGeometry(0.4, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.2, emissive: 0xffaa00, emissiveIntensity: 0.5 });
    const coin = new THREE.Mesh(geo, mat);
    
    // Add little wings
    const wingGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    coin.add(wing);

    coin.position.set(20, Math.random() * 10 + 2, 0); // Random Y position between 2 and 12
    this.scene.add(coin);
    this.coins.push(coin);
  },

  gameLoop(time) {
    if (!this.isPlaying) return;

    // --- CONSOLE GAMEPAD SUPPORT ---
    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      if (gamepads[0]) {
        const gp = gamepads[0];
        // Flap: Button 0 (A/Cross) or Button 7 (Right Trigger)
        const flapPressed = gp.buttons[0]?.pressed || gp.buttons[7]?.pressed;
        if (flapPressed && !this.lastGamepadState.flap) this.flap();
        this.lastGamepadState.flap = flapPressed;
      }
    }
    // --------------------------------

    // Physics
    this.velocity += this.gravity;
    this.player.position.y += this.velocity;
    
    // Rotate player back down smoothly
    if (this.player.rotation.z > -0.5) {
      this.player.rotation.z -= 0.02;
    }

    // Floor / Ceiling bounds
    if (this.player.position.y < -5 || this.player.position.y > 15) {
      this.endGame();
      return;
    }

    // Scroll Background
    if (this.bgMesh) {
      this.bgMesh.material.map.offset.x += 0.0005;
    }

    // Spawn pipes
    this.pipeSpawnTimer++;
    if (this.pipeSpawnTimer > 150) { // Slower spawning
      this.spawnPipe();
      this.pipeSpawnTimer = 0;
    }

    // Fixed, forgiving player hitbox (ignores rotation AABB inflation)
    const playerBox = new THREE.Box3();
    playerBox.min.set(this.player.position.x - 0.6, this.player.position.y - 0.6, -0.5);
    playerBox.max.set(this.player.position.x + 0.6, this.player.position.y + 0.6, 0.5);

    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      obs.mesh.position.x -= this.speed;
      
      // Update hitbox positions
      obs.topBox.min.x -= this.speed;
      obs.topBox.max.x -= this.speed;
      obs.bottomBox.min.x -= this.speed;
      obs.bottomBox.max.x -= this.speed;

      // Collision
      if (playerBox.intersectsBox(obs.topBox) || playerBox.intersectsBox(obs.bottomBox)) {
        this.endGame();
        return;
      }

      // Score and Environment Changes
      if (!obs.passed && obs.mesh.position.x < this.player.position.x) {
        obs.passed = true;
        this.score++;
        document.getElementById('flappy-score').textContent = this.score;
        this.speed += 0.002; // Slower difficulty scaling

        // Change time of day based on score (approx 30s/60s)
        if (this.score === 15) {
          // Sunset vibe
          this.bgMesh.material.color.setHex(0xffaa88); // tint background image
          this.scene.fog.color.setHex(0xff7f50);
          if (DC.App) DC.App.showToast('Sunset approaching...', 'info');
        } else if (this.score === 30) {
          // Night vibe
          this.bgMesh.material.color.setHex(0x5555aa); // darken background image
          this.scene.fog.color.setHex(0x0a0a2a);
          this.scene.fog.density = 0.05;
          if (DC.App) DC.App.showToast('Night falls...', 'info');
        }
      }

      // Cleanup
      if (obs.mesh.position.x < -20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
        i--;
      }
    }

    // Move coins and collect
    if (Math.random() < 0.015) this.spawnCoin();

    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      coin.position.x -= this.speed;
      coin.rotation.y += 0.1;

      const coinBox = new THREE.Box3().setFromObject(coin);
      
      if (playerBox.intersectsBox(coinBox)) {
        // Collect Snitch!
        this.score += 5; // Flappy score increment
        document.getElementById('flappy-score').textContent = this.score;
        if (DC.App) DC.App.showToast('+5 Snitch Bonus!', 'success');
        
        // Spawn collection particles
        for(let p=0; p<5; p++){
          const sparkGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
          const spark = new THREE.Mesh(sparkGeo, sparkMat);
          spark.position.copy(coin.position);
          spark.position.x += (Math.random()-0.5)*2;
          spark.position.y += (Math.random()-0.5)*2;
          this.scene.add(spark);
          this.particles.push(spark);
        }

        this.scene.remove(coin);
        this.coins.splice(i, 1);
        i--;
        continue;
      }

      if (coin.position.x < -20) {
        this.scene.remove(coin);
        this.coins.splice(i, 1);
        i--;
      }
    }

    // Broom Particle Trail
    if (Math.random() < 0.4) {
      const pGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xd2b48c, transparent: true, opacity: 1 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(this.player.position.x - 2, this.player.position.y - 0.5, this.player.position.z + (Math.random() - 0.5));
      this.scene.add(p);
      this.particles.push(p);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.position.x -= this.speed; // move backward
      p.position.y -= 0.02; // fall slightly
      p.material.opacity -= 0.03;
      
      if (p.material.opacity <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
        i--;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  },

  endGame() {
    this.isPlaying = false;
    
    setTimeout(() => {
      document.getElementById('flappy-selection-screen').style.display = 'flex';
      document.getElementById('flappy-score-board').style.display = 'none';
      const startBtn = document.getElementById('start-flappy-btn');
      startBtn.textContent = 'Fly Again (Score: ' + this.score + ')';
    }, 1000);
    
    if (DC.App) {
      DC.App.showToast(`Broom crashed! Score: ${this.score}`, 'error');
    }
  },

  stop3D() {
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DC.Game.init();
  DC.RunnerGame.init();
});
