// Game.js - Core game engine and state management
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        // World dimensions (increase travel distance)
        this.worldWidth = this.width * 10; // extend world to 10x screen width
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.flowerCount = 0;
        this.targetFlowers = 100;
        this.maxProgressX = 0; // furthest player has reached
        this.difficultyLevel = 1;
        this.lastDifficultyIncrease = 0;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.flowers = [];
        this.bricks = [];
        this.particles = [];
        this.thorns = [];
        
        // Environment
        this.environment = null;
        this.camera = { x: 0, y: 0 };
        this.forwardBoundary = 0; // prevent backtracking
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Input handling
        this.keys = {};
        this.touches = {};
        this.touchMoveDir = 0; // -1 left, 1 right, 0 none
        this.touchJumpQueued = false;
        
        // Game settings
        // Global speed factor to slow the overall game speed by ~30%
        this.speedFactor = 0.7;
        this.gravity = 0.8 * this.speedFactor;
        this.friction = 0.85;
        
        // Initialize new systems
        this.audioManager = null;
        this.powerUpManager = null;
        this.achievementManager = null;
        this.effectsManager = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastPerformanceCheck = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.player = new Player(100, this.height - 200, this);
        this.environment = new Environment(this);
        
        // Initialize new systems
        this.audioManager = new AudioManager();
        this.powerUpManager = new PowerUpManager(this);
        this.achievementManager = new AchievementManager(this);
        this.effectsManager = new EffectsManager(this);
        
        // Generate initial flowers
        this.generateFlowers();
        // Generate bricks (Mario-style)
        this.generateBricks();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
            if (e.code === 'Escape') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Touch controls (invisible screen zones for movement, swipe up to jump)
        const canvas = this.canvas;
        let touchStartY = 0;
        let touchStartX = 0;
        canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            touchStartX = t.clientX; touchStartY = t.clientY;
            // left/right half controls movement
            const rect = canvas.getBoundingClientRect();
            const x = t.clientX - rect.left;
            this.touchMoveDir = x < rect.width / 2 ? -1 : 1;
        }, {passive: false});
        canvas.addEventListener('touchmove', (e) => {
            // detect upward swipe for jump
            const t = e.touches[0];
            if (touchStartY - t.clientY > 40) this.touchJumpQueued = true;
        }, {passive: false});
        canvas.addEventListener('touchend', (e) => {
            this.touchMoveDir = 0;
        }, {passive: false});
        
        const thornBtn = document.getElementById('thornBtn');
        const plantBtn = document.getElementById('plantBtn');
        const startBtn = document.getElementById('startBtn');
        
        // Touch events for power buttons only (movement handled by screen zones)
        this.addTouchEvents(thornBtn, 'thorn');
        this.addTouchEvents(plantBtn, 'plant');
        
        startBtn.addEventListener('click', () => {
            this.audioManager.resumeContext();
            this.startGame();
        });

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => {
            try { window.CactusQuest.ui().showSettings(); } catch (_) {}
        });
    }
    
    addTouchEvents(element, action) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touches[action] = true;
        });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touches[action] = false;
        });
        
        element.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touches[action] = true;
        });
        
        element.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touches[action] = false;
        });
    }
    
    startGame() {
        this.state = 'playing';
        document.getElementById('startScreen').style.display = 'none';
        
        // Reset game state
        this.score = 0;
        this.player.reset();
        this.enemies = [];
        this.thorns = [];
        this.particles = [];
        
        // Generate initial enemies
        this.generateEnemies();
    }
    
    generateFlowers() {
        this.flowers = [];
        for (let i = 0; i < 15; i++) {
            this.flowers.push({
                x: Math.random() * this.worldWidth,
                y: this.height - 100 - Math.random() * 200,
                width: 20,
                height: 20,
                collected: false,
                type: Math.random() > 0.8 ? 'super' : 'normal'
            });
        }
    }

    generateBricks() {
        // Create some bricks at fixed positions above ground to be hit from below
        this.bricks = [
            { x: 350, y: this.height - 220, width: 40, height: 20, hit: false },
            { x: 650, y: this.height - 260, width: 40, height: 20, hit: false },
            { x: 980, y: this.height - 240, width: 40, height: 20, hit: false },
            { x: 1300, y: this.height - 230, width: 40, height: 20, hit: false },
        ];
    }

    generateMoreContent(fromX, toX) {
        try {
            // Additional flowers
            for (let i = 0; i < 20; i++) {
                this.flowers.push({
                    x: fromX + Math.random() * (toX - fromX),
                    y: this.height - 100 - Math.random() * 200,
                    width: 20,
                    height: 20,
                    collected: false,
                    type: Math.random() > 0.85 ? 'super' : 'normal'
                });
            }
            
            // Additional bricks
            for (let i = 0; i < 6; i++) {
                this.bricks.push({
                    x: fromX + 200 + i * 180 + Math.random() * 120,
                    y: this.height - 220 - Math.random() * 60,
                    width: 40,
                    height: 20,
                    hit: false
                });
            }
            
            // Additional camels (more with higher difficulty)
            const camelCount = Math.min(3 + Math.floor(this.difficultyLevel / 3), 6);
            for (let i = 0; i < camelCount; i++) {
                try {
                    const camel = new Camel(fromX + 300 + i * 300, this.height - 120, this);
                    // Increase camel speed with difficulty
                    if (camel.speed) {
                        camel.speed *= (1 + this.difficultyLevel * 0.1);
                    }
                    this.enemies.push(camel);
                } catch (e) {
                    console.warn('Failed to create camel:', e);
                }
            }
            
            // Occasionally spawn power-ups
            if (Math.random() < 0.3) {
                const powerUpX = fromX + Math.random() * (toX - fromX);
                const powerUpY = this.height - 120 - Math.random() * 100;
                this.powerUpManager.addPowerUp(powerUpX, powerUpY, 
                    ['speed', 'shield', 'multiThorn', 'jumpBoost'][Math.floor(Math.random() * 4)]);
            }
            
            // Add sand storms periodically (more frequent with difficulty)
            const chunkId = Math.floor(fromX / (this.width * 5));
            const stormFreq = Math.max(1, 4 - Math.floor(this.difficultyLevel / 2));
            if (chunkId % stormFreq === 1) {
                try {
                    const stormX = fromX + Math.random() * (toX - fromX - 200);
                    const storm = new SandStorm(stormX, 0, this.height, this);
                    // Increase storm speed with difficulty
                    if (storm.vx !== undefined) {
                        storm.vx *= (1 + this.difficultyLevel * 0.15);
                    }
                    this.environment.sandStorms.push(storm);
                } catch (e) {
                    console.warn('Failed to create sandstorm:', e);
                }
            }
        } catch (error) {
            console.error('Error in generateMoreContent:', error);
        }
    }
    
    generateEnemies() {
        this.enemies = [];
        const positions = [
            450, 900, 1250, 1600, 1950
        ];
        positions.forEach(px => {
            this.enemies.push(new Camel(
                px,
                this.height - 120,
                this
            ));
        });
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update game objects
        // Apply touch movement and jump intents
        if (this.touchMoveDir !== 0) {
            if (this.touchMoveDir < 0) this.keys['ArrowLeft'] = true; else this.keys['ArrowRight'] = true;
        } else {
            this.keys['ArrowLeft'] = false; this.keys['ArrowRight'] = false;
        }
        if (this.touchJumpQueued) { this.keys['ArrowUp'] = true; this.touchJumpQueued = false; }
        else { this.keys['ArrowUp'] = false; }

        this.player.update(deltaTime);
        
        // Update new systems
        this.powerUpManager.update(deltaTime);
        this.achievementManager.update(deltaTime);
        this.effectsManager.update(deltaTime);
        
        // Add player trail effect
        this.effectsManager.addPlayerTrail(this.player);
        
        // Update difficulty scaling
        this.updateDifficulty();

        // Update forward boundary (no backtracking)
        // Allow backtracking within current viewport only
        this.maxProgressX = Math.max(this.maxProgressX, this.player.x);
        this.forwardBoundary = Math.max(0, this.maxProgressX - this.width);

        // Handle brick hits
        this.handleBrickHits();
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.update(deltaTime);
            }
        });
        
        // Clean up inactive enemies
        this.enemies = this.enemies.filter(enemy => enemy.active);
        
        // Update thorns
        this.thorns.forEach(thorn => thorn.update(deltaTime));
        this.thorns = this.thorns.filter(thorn => thorn.active);
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => particle.active);
        
        // Limit particle count to prevent memory issues
        if (this.particles.length > 200) {
            this.particles = this.particles.slice(-100);
        }

        // Update flower physics (jump/fall for dynamic flowers)
        this.flowers.forEach(f => {
            if (!f.collected && f.dynamic) {
                f.vy += this.gravity * 0.6; // lighter gravity
                f.y += f.vy;
                // ground collision
                const groundY = this.height - 80 - f.height;
                if (f.y > groundY) { f.y = groundY; f.vy = 0; f.dynamic = false; }
            }
        });
        
        // Clean up old collected flowers to prevent memory leaks
        if (this.flowers.length > 500) {
            this.flowers = this.flowers.filter(f => !f.collected || f.x > this.player.x - this.width);
        }

        // Update environment
        this.environment.update(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Update camera to follow player
        this.updateCamera();

        // Infinite world extension
        if (this.player.x > this.worldWidth - this.width * 2) {
            const oldWidth = this.worldWidth;
            this.worldWidth += this.width * 5; // extend by 5 screens
            this.generateMoreContent(oldWidth, this.worldWidth);
            
            // Clean up old objects that are far behind the player
            this.cleanupOldObjects();
        }
        
        // Check win/lose conditions
        this.checkGameState();
    }

    checkCollisions() {
        // Player vs Flowers
        this.flowers.forEach(flower => {
            if (!flower.collected && this.checkCollision(this.player, flower)) {
                flower.collected = true;
                // Only super flowers cause growth; normal flowers just count/score
                this.player.eatFlower(flower.type);
                this.flowerCount += 1;
                this.score += flower.type === 'super' ? 20 : 10;
                
                // Play sound and track achievement
                this.audioManager.play(flower.type === 'super' ? 'superFlower' : 'flower');
                this.achievementManager.onFlowerCollected(flower.type);
                
                // Create particle effect
                this.createParticles(flower.x, flower.y, '#ff69b4', 5);
                if (flower.type === 'super') {
                    this.effectsManager.createSparkles(flower.x, flower.y, 8);
                }
            }
        });
        
        // Player vs Enemies
        this.enemies.forEach(enemy => {
            if (enemy.active && this.checkCollision(this.player, enemy)) {
                if (!this.player.isPlanted && !this.player.invulnerable) {
                    this.player.takeDamage();
                    this.audioManager.play('damage');
                    this.effectsManager.addScreenShake(8, 300);
                    this.createParticles(this.player.x, this.player.y, '#ff0000', 8);
                }
            }
        });
        
        // Thorns vs Enemies
        this.thorns.forEach(thorn => {
            this.enemies.forEach(enemy => {
                if (thorn.active && enemy.active && this.checkCollision(thorn, enemy)) {
                    enemy.takeDamage();
                    thorn.active = false;
                    this.audioManager.play('enemyHit');
                    this.achievementManager.onEnemyHit();
                    this.effectsManager.addScreenShake(4, 150);
                    this.effectsManager.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#8b4513', 8);
                    this.createParticles(enemy.x, enemy.y, '#8b4513', 6);
                }
            });
        });
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    updateCamera() {
        // Follow player with smooth camera movement
        const targetX = this.player.x - this.width / 2;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Keep camera within bounds of the world
        const maxCamX = Math.max(0, this.worldWidth - this.width);
        this.camera.x = Math.max(0, Math.min(this.camera.x, maxCamX));

        // Enforce forward-only boundary: don't allow camera (and thus player usability) to move backwards past boundary
        if (this.player.x < this.forwardBoundary) {
            this.player.x = this.forwardBoundary;
        }
    }
    
    updateDifficulty() {
        // Increase difficulty every 3000 pixels traveled
        const distanceTraveled = this.maxProgressX;
        const newDifficultyLevel = Math.floor(distanceTraveled / 3000) + 1;
        
        if (newDifficultyLevel > this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;
            try {
                if (this.ui) {
                    this.ui.showAlert(
                        `🔥 Difficulty Increased! Level ${this.difficultyLevel}`,
                        'rgba(255, 100, 0, 0.9)',
                        3000
                    );
                }
            } catch (e) {
                console.warn('Failed to show difficulty alert:', e);
            }
        }
    }
    
    performanceCheck() {
        const objectCount = this.flowers.length + this.enemies.length + this.particles.length + this.bricks.length;
        if (objectCount > 1000) {
            console.warn('High object count detected:', objectCount, 'forcing cleanup');
            this.cleanupOldObjects();
        }
    }
    
    cleanupOldObjects() {
        const cleanupDistance = this.player.x - this.width * 3;
        
        // Remove old flowers
        this.flowers = this.flowers.filter(f => f.x > cleanupDistance || !f.collected);
        
        // Remove old bricks
        this.bricks = this.bricks.filter(b => b.x > cleanupDistance);
        
        // Remove old enemies
        this.enemies = this.enemies.filter(e => e.x > cleanupDistance || e.active);
        
        // Clean up old sandstorms
        if (this.environment && this.environment.sandStorms) {
            this.environment.sandStorms = this.environment.sandStorms.filter(s => s.x > cleanupDistance);
        }
        
        // Clean up old particles
        this.particles = this.particles.filter(p => p.x > cleanupDistance);
        
        console.log('Cleanup completed. Objects remaining:', {
            flowers: this.flowers.length,
            enemies: this.enemies.length,
            particles: this.particles.length,
            bricks: this.bricks.length
        });
    }
    
    checkGameState() {
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        // Win when collected target number of flowers
        if (this.flowerCount >= this.targetFlowers) {
            this.levelComplete();
        }
    }
    
    gameOver() {
        this.state = 'gameOver';
        alert('Game Over! Your cactus couldn\'t survive the desert.');
        this.resetGame();
    }

    pauseGame() {
        this.state = 'paused';
        try { window.CactusQuest.ui().showPauseMenu(this.score, this.getTopScores()); } catch (_) {}
    }

    resumeGame() {
        this.state = 'playing';
        try { window.CactusQuest.ui().hidePauseMenu(); } catch (_) {}
    }

    getTopScores() {
        const raw = localStorage.getItem('cq_scores') || '[]';
        return JSON.parse(raw).slice(0,3);
    }

    recordScore(score) {
        const raw = localStorage.getItem('cq_scores') || '[]';
        const arr = JSON.parse(raw);
        arr.push(score);
        arr.sort((a,b)=>b-a);
        localStorage.setItem('cq_scores', JSON.stringify(arr.slice(0,10)));
    }
    
    levelComplete() {
        this.state = 'levelComplete';
        // Show UI overlay with replay option instead of alert
        try {
            const uiProvider = window.CactusQuest && typeof window.CactusQuest.ui === 'function' ? window.CactusQuest.ui() : null;
            if (uiProvider && typeof uiProvider.showLevelComplete === 'function') {
                uiProvider.showLevelComplete();
            } else {
                alert('Level Complete! Your cactus has grown strong!');
                this.resetGame();
            }
        } catch (e) {
            alert('Level Complete! Your cactus has grown strong!');
            this.resetGame();
        }
    }
    
    resetGame() {
        this.state = 'menu';
        document.getElementById('startScreen').style.display = 'flex';
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // Render environment
        this.environment.render(this.ctx);

        // Render bricks
        this.renderBricks(this.ctx);
        
        // Render flowers
        this.flowers.forEach(flower => {
            if (!flower.collected) {
                this.renderFlower(flower);
            }
        });
        
        // Render enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.render(this.ctx);
            }
        });
        
        // Render thorns
        this.thorns.forEach(thorn => thorn.render(this.ctx));
        
        // Render player
        this.player.render(this.ctx);
        
        // Render particles
        this.particles.forEach(particle => particle.render(this.ctx));
        
        // Render power-ups
        this.powerUpManager.render(this.ctx);
        
        // Render effects
        this.effectsManager.render(this.ctx);
        
        // Restore context
        this.ctx.restore();
        
        // Render UI (not affected by camera)
        this.renderUI();
    }
    
    renderFlower(flower) {
        this.ctx.save();
        // Superflower has distinct color
        this.ctx.fillStyle = flower.type === 'super' ? '#ffd700' : '#ff69b4';
        
        // Draw flower petals
        const centerX = flower.x + flower.width / 2;
        const centerY = flower.y + flower.height / 2;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const petalX = centerX + Math.cos(angle) * 8;
            const petalY = centerY + Math.sin(angle) * 8;
            
            this.ctx.beginPath();
            this.ctx.arc(petalX, petalY, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw center (superflower center slightly larger and glowing)
        this.ctx.fillStyle = flower.type === 'super' ? '#ffa500' : '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, flower.type === 'super' ? 6 : 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        if (flower.type === 'super') {
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Bloom effect for super flowers
            this.effectsManager.renderBloom(this.ctx, centerX, centerY, 15, 'rgba(255, 215, 0, 0.3)');
        }

        this.ctx.restore();
    }

    handleBrickHits() {
        // Detect if player's head hits brick from below while moving upward
        if (this.player.vy >= 0) return; // only when moving up
        const head = { x: this.player.x, y: this.player.y, width: this.player.width, height: 5 };
        this.bricks.forEach(brick => {
            if (!brick.hit && this.checkCollision(head, brick) && (this.player.prevY + this.player.height) >= (brick.y + brick.height)) {
                brick.hit = true;
                brick.bumpTimer = 200;
                this.audioManager.play('brick');
                this.achievementManager.onBrickHit();
                // Spawn a flower above the brick
                const type = Math.random() < 0.2 ? 'super' : 'normal';
                this.flowers.push({
                    x: brick.x + brick.width / 2 - 10,
                    y: brick.y - 25,
                    width: 20,
                    height: 20,
                    collected: false,
                    type,
                    dynamic: true,
                    vy: -8 * this.speedFactor
                });
                this.createParticles(brick.x + brick.width / 2, brick.y, '#b5651d', 6);
            }
        });
    }

    renderBricks(ctx) {
        this.bricks.forEach(brick => {
            ctx.save();
            const offsetY = brick.bumpTimer ? -4 * Math.sin((1 - brick.bumpTimer / 200) * Math.PI) : 0;
            if (brick.bumpTimer) {
                brick.bumpTimer -= this.deltaTime;
                if (brick.bumpTimer < 0) brick.bumpTimer = 0;
            }
            ctx.fillStyle = brick.hit ? '#8b4513' : '#d2691e';
            ctx.fillRect(brick.x, brick.y + offsetY, brick.width, brick.height);
            // Draw brick pattern
            ctx.strokeStyle = '#5a2e0c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(brick.x, brick.y + offsetY + brick.height / 2);
            ctx.lineTo(brick.x + brick.width, brick.y + offsetY + brick.height / 2);
            ctx.stroke();
            ctx.restore();
        });
    }
    
    renderUI() {
        // Update UI elements
        document.getElementById('thornCount').textContent = this.player.thorns;
        document.getElementById('cactusSize').textContent = 
            this.player.size === 1 ? 'Small' : 
            this.player.size === 2 ? 'Medium' : 'Large';
        const fc = document.getElementById('flowerCount');
        if (fc) fc.textContent = `${this.flowerCount}/${this.targetFlowers}`;
        
        // Update health display
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            heart.style.opacity = index < this.player.health ? '1' : '0.3';
        });
    }
    
    gameLoop(currentTime = 0) {
        try {
            this.deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Cap deltaTime to prevent issues with large frame gaps
            this.deltaTime = Math.min(this.deltaTime, 50);
            
            this.update(this.deltaTime);
            this.render();
            
            // Performance monitoring
            if (this.frameCount % 300 === 0) { // Every 5 seconds at 60fps
                this.performanceCheck();
            }
            this.frameCount = (this.frameCount || 0) + 1;
            
        } catch (error) {
            console.error('Game loop error:', error);
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Particle class for visual effects
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 2;
        this.active = true;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3 * (this.game ? this.game.speedFactor : 1); // gravity scaled
        this.life -= this.decay;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
