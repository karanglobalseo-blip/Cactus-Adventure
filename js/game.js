// Game.js - Core game engine and state management
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.state = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.flowers = [];
        this.particles = [];
        this.thorns = [];
        
        // Environment
        this.environment = null;
        this.camera = { x: 0, y: 0 };
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Input handling
        this.keys = {};
        this.touches = {};
        
        // Game settings
        this.gravity = 0.8;
        this.friction = 0.85;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.player = new Player(100, this.height - 200, this);
        this.environment = new Environment(this);
        
        // Generate initial flowers
        this.generateFlowers();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Touch/Mouse events for mobile controls
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const jumpBtn = document.getElementById('jumpBtn');
        const thornBtn = document.getElementById('thornBtn');
        const plantBtn = document.getElementById('plantBtn');
        const startBtn = document.getElementById('startBtn');
        
        // Touch events for buttons
        this.addTouchEvents(leftBtn, 'left');
        this.addTouchEvents(rightBtn, 'right');
        this.addTouchEvents(jumpBtn, 'jump');
        this.addTouchEvents(thornBtn, 'thorn');
        this.addTouchEvents(plantBtn, 'plant');
        
        startBtn.addEventListener('click', () => this.startGame());
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
                x: Math.random() * (this.width * 2),
                y: this.height - 100 - Math.random() * 200,
                width: 20,
                height: 20,
                collected: false,
                type: Math.random() > 0.8 ? 'special' : 'normal'
            });
        }
    }
    
    generateEnemies() {
        this.enemies = [];
        for (let i = 0; i < 5; i++) {
            this.enemies.push(new Camel(
                200 + i * 300,
                this.height - 120,
                this
            ));
        }
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update game objects
        this.player.update(deltaTime);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                enemy.update(deltaTime);
            }
        });
        
        // Update thorns
        this.thorns.forEach(thorn => thorn.update(deltaTime));
        this.thorns = this.thorns.filter(thorn => thorn.active);
        
        // Update particles
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => particle.active);
        
        // Update environment
        this.environment.update(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update camera to follow player
        this.updateCamera();
        
        // Check win/lose conditions
        this.checkGameState();
    }
    
    checkCollisions() {
        // Player vs Flowers
        this.flowers.forEach(flower => {
            if (!flower.collected && this.checkCollision(this.player, flower)) {
                flower.collected = true;
                this.player.eatFlower(flower.type);
                this.score += flower.type === 'special' ? 20 : 10;
                
                // Create particle effect
                this.createParticles(flower.x, flower.y, '#ff69b4', 5);
            }
        });
        
        // Player vs Enemies
        this.enemies.forEach(enemy => {
            if (enemy.active && this.checkCollision(this.player, enemy)) {
                if (!this.player.isPlanted && !this.player.invulnerable) {
                    this.player.takeDamage();
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
        
        // Keep camera within bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.width));
    }
    
    checkGameState() {
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        // Check if all flowers collected
        const remainingFlowers = this.flowers.filter(f => !f.collected).length;
        if (remainingFlowers === 0) {
            this.levelComplete();
        }
    }
    
    gameOver() {
        this.state = 'gameOver';
        alert('Game Over! Your cactus couldn\'t survive the desert.');
        this.resetGame();
    }
    
    levelComplete() {
        this.state = 'levelComplete';
        alert('Level Complete! Your cactus has grown strong!');
        this.resetGame();
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
        
        // Restore context
        this.ctx.restore();
        
        // Render UI (not affected by camera)
        this.renderUI();
    }
    
    renderFlower(flower) {
        this.ctx.save();
        this.ctx.fillStyle = flower.type === 'special' ? '#ff1493' : '#ff69b4';
        
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
        
        // Draw center
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    renderUI() {
        // Update UI elements
        document.getElementById('thornCount').textContent = this.player.thorns;
        document.getElementById('cactusSize').textContent = 
            this.player.size === 1 ? 'Small' : 
            this.player.size === 2 ? 'Medium' : 'Large';
        
        // Update health display
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            heart.style.opacity = index < this.player.health ? '1' : '0.3';
        });
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
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
        this.vy += 0.3; // gravity
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
