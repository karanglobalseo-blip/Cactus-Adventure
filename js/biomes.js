// Biomes.js - Biome system with different environments and enemies

class BiomeManager {
    constructor(game) {
        this.game = game;
        this.currentBiome = null;
        this.biomeTransitionDistance = 5000; // Distance between biome changes
        this.lastBiomeChange = 0;
        
        // Define biomes
        this.biomes = {
            desert: {
                name: 'Desert',
                colors: {
                    sky: ['#FFE4B5', '#F4A460', '#DEB887'],
                    ground: '#D2B48C',
                    accent: '#CD853F'
                },
                enemies: ['camel', 'scorpion'],
                hazards: ['sandstorm'],
                powerUps: ['speed', 'shield'],
                music: 'desert_theme',
                description: 'Endless sandy dunes stretch to the horizon'
            },
            oasis: {
                name: 'Oasis',
                colors: {
                    sky: ['#87CEEB', '#98FB98', '#90EE90'],
                    ground: '#228B22',
                    accent: '#32CD32'
                },
                enemies: ['camel', 'vulture'],
                hazards: ['quicksand'],
                powerUps: ['jumpBoost', 'thornRegen'],
                music: 'oasis_theme',
                description: 'A lush paradise in the desert'
            },
            canyon: {
                name: 'Rocky Canyon',
                colors: {
                    sky: ['#B22222', '#CD853F', '#A0522D'],
                    ground: '#8B4513',
                    accent: '#D2691E'
                },
                enemies: ['rockGolem', 'vulture'],
                hazards: ['rockfall'],
                powerUps: ['multiThorn', 'shield'],
                music: 'canyon_theme',
                description: 'Towering red cliffs and ancient stone'
            },
            ruins: {
                name: 'Ancient Ruins',
                colors: {
                    sky: ['#483D8B', '#6A5ACD', '#9370DB'],
                    ground: '#696969',
                    accent: '#4B0082'
                },
                enemies: ['ancientGuardian', 'scorpion'],
                hazards: ['cursedFog'],
                powerUps: ['speed', 'multiThorn', 'jumpBoost'],
                music: 'ruins_theme',
                description: 'Mysterious structures from a forgotten civilization'
            }
        };
        
        this.biomeOrder = ['desert', 'oasis', 'canyon', 'ruins'];
        this.currentBiomeIndex = 0;
        this.currentBiome = this.biomes.desert;
    }
    
    update(deltaTime) {
        const playerDistance = this.game.player.x;
        const expectedBiomeIndex = Math.floor(playerDistance / this.biomeTransitionDistance);
        
        if (expectedBiomeIndex !== this.currentBiomeIndex) {
            this.transitionToBiome(expectedBiomeIndex);
        }
    }
    
    transitionToBiome(biomeIndex) {
        const actualIndex = biomeIndex % this.biomeOrder.length;
        const biomeName = this.biomeOrder[actualIndex];
        
        if (this.currentBiome !== this.biomes[biomeName]) {
            this.currentBiomeIndex = actualIndex;
            this.currentBiome = this.biomes[biomeName];
            this.lastBiomeChange = this.game.player.x;
            
            // Trigger biome change effects
            this.onBiomeChange(biomeName);
        }
    }
    
    onBiomeChange(biomeName) {
        console.log(`Entering ${this.currentBiome.name} biome`);
        
        // Show biome notification
        if (this.game.ui) {
            this.game.ui.showAlert(
                `🌍 Entering ${this.currentBiome.name}!`,
                'rgba(100, 200, 255, 0.9)',
                4000
            );
        }
        
        // Play biome transition sound
        if (this.game.audioManager) {
            this.game.audioManager.play('biomeTransition');
        }
        
        // Update environment colors
        if (this.game.environment) {
            this.game.environment.setBiome(this.currentBiome);
        }
        
        // Trigger achievement
        if (this.game.achievementManager) {
            this.game.achievementManager.onBiomeEntered(biomeName);
        }
    }
    
    getCurrentBiome() {
        return this.currentBiome;
    }
    
    getBiomeEnemies() {
        return this.currentBiome.enemies;
    }
    
    getBiomePowerUps() {
        return this.currentBiome.powerUps;
    }
    
    shouldSpawnBoss() {
        const distanceInBiome = this.game.player.x - this.lastBiomeChange;
        return distanceInBiome > this.biomeTransitionDistance * 0.8; // Boss appears near end of biome
    }
}

// New Enemy Classes

class Scorpion {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.health = 1;
        this.maxHealth = 1;
        this.speed = 3 * this.game.speedFactor;
        this.active = true;
        
        // AI State
        this.state = 'patrol';
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.patrolDistance = 80;
        this.startX = x;
        this.chaseRange = 120;
        this.attackRange = 30;
        this.stingCooldown = 0;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.facingRight = this.direction > 0;
        
        this.isGrounded = false;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.updateTimers(deltaTime);
        this.updateAI(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.stingCooldown > 0) {
            this.stingCooldown -= deltaTime;
        }
    }
    
    updateAI(deltaTime) {
        const player = this.game.player;
        const distanceToPlayer = Math.abs(this.x - player.x);
        
        if (distanceToPlayer < this.chaseRange) {
            this.state = 'chase';
            this.chase();
        } else {
            this.state = 'patrol';
            this.patrol();
        }
        
        // Sting attack
        if (distanceToPlayer < this.attackRange && this.stingCooldown <= 0) {
            this.sting();
        }
    }
    
    chase() {
        const player = this.game.player;
        
        if (player.x < this.x) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else {
            this.vx = this.speed;
            this.facingRight = true;
        }
    }
    
    patrol() {
        const distanceFromStart = this.x - this.startX;
        
        if (Math.abs(distanceFromStart) > this.patrolDistance) {
            this.direction *= -1;
            this.facingRight = this.direction > 0;
        }
        
        this.vx = this.direction * this.speed * 0.3;
    }
    
    sting() {
        this.stingCooldown = 2000; // 2 second cooldown
        
        // Create poison projectile
        const projectile = {
            x: this.x + (this.facingRight ? this.width : 0),
            y: this.y + this.height / 2,
            vx: (this.facingRight ? 5 : -5) * this.game.speedFactor,
            vy: 0,
            width: 8,
            height: 4,
            active: true,
            type: 'poison',
            damage: 1
        };
        
        this.game.enemyProjectiles = this.game.enemyProjectiles || [];
        this.game.enemyProjectiles.push(projectile);
        
        if (this.game.audioManager) {
            this.game.audioManager.play('scorpionSting');
        }
    }
    
    updatePhysics(deltaTime) {
        // Apply gravity
        this.vy += this.game.gravity;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Ground collision
        const groundY = this.game.height - 80 - this.height;
        if (this.y > groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }
        
        // World bounds
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.worldWidth - this.width) {
            this.x = this.game.worldWidth - this.width;
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 200) {
            this.animationFrame = (this.animationFrame + 1) % 6;
            this.animationTimer = 0;
        }
    }
    
    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
            this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#8B0000', 8);
        }
    }
    
    befriend() {
        this.active = false;
        this.state = 'friendly';
        // Create happy particles
        this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#90EE90', 12);
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Flip if facing left
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x * 2 - this.width, 0);
        }
        
        this.drawScorpion(ctx);
        ctx.restore();
    }
    
    drawScorpion(ctx) {
        // Body
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(this.x + 10, this.y + 15, 20, 10);
        
        // Claws
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x + 5, this.y + 12, 8, 6);
        ctx.fillRect(this.x + 27, this.y + 12, 8, 6);
        
        // Tail segments
        ctx.fillStyle = '#8B0000';
        for (let i = 0; i < 3; i++) {
            const segmentX = this.x + 25 + i * 4;
            const segmentY = this.y + 8 - i * 2;
            ctx.fillRect(segmentX, segmentY, 4, 4);
        }
        
        // Stinger
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 37, this.y + 2, 3, 3);
        
        // Legs
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const legX = this.x + 8 + i * 6;
            ctx.beginPath();
            ctx.moveTo(legX, this.y + 20);
            ctx.lineTo(legX + 2, this.y + 28);
            ctx.stroke();
        }
    }
}

class Vulture {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.health = 2;
        this.maxHealth = 2;
        this.speed = 2.5 * this.game.speedFactor;
        this.active = true;
        
        // Flying AI
        this.state = 'circling';
        this.centerX = x;
        this.centerY = y;
        this.circleRadius = 100;
        this.angle = 0;
        this.angleSpeed = 0.02;
        this.diveSpeed = 8;
        this.diveCooldown = 0;
        
        // Animation
        this.wingFlap = 0;
        this.facingRight = true;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.updateTimers(deltaTime);
        this.updateAI(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.diveCooldown > 0) {
            this.diveCooldown -= deltaTime;
        }
    }
    
    updateAI(deltaTime) {
        const player = this.game.player;
        const distanceToPlayer = Math.sqrt(
            Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2)
        );
        
        if (distanceToPlayer < 150 && this.diveCooldown <= 0 && this.state === 'circling') {
            this.state = 'diving';
            this.targetX = player.x;
            this.targetY = player.y;
            this.diveCooldown = 4000; // 4 second cooldown
        }
        
        switch (this.state) {
            case 'circling':
                this.circle();
                break;
            case 'diving':
                this.dive();
                break;
            case 'returning':
                this.returnToCircle();
                break;
        }
    }
    
    circle() {
        this.angle += this.angleSpeed;
        this.x = this.centerX + Math.cos(this.angle) * this.circleRadius;
        this.y = this.centerY + Math.sin(this.angle) * 30 + 100; // Fly above ground
        
        this.facingRight = Math.cos(this.angle) > 0;
    }
    
    dive() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            this.vx = (dx / distance) * this.diveSpeed;
            this.vy = (dy / distance) * this.diveSpeed;
            this.x += this.vx;
            this.y += this.vy;
            
            this.facingRight = this.vx > 0;
        } else {
            this.state = 'returning';
        }
    }
    
    returnToCircle() {
        const dx = this.centerX - this.x;
        const dy = this.centerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
            this.x += this.vx;
            this.y += this.vy;
        } else {
            this.state = 'circling';
            this.vx = 0;
            this.vy = 0;
        }
    }
    
    updateAnimation(deltaTime) {
        this.wingFlap += deltaTime * 0.01;
    }
    
    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.active = false;
            this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#654321', 10);
        }
    }
    
    befriend() {
        this.active = false;
        this.state = 'friendly';
        // Create happy particles
        this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#90EE90', 12);
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x * 2 - this.width, 0);
        }
        
        this.drawVulture(ctx);
        ctx.restore();
    }
    
    drawVulture(ctx) {
        // Body
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(this.x + 20, this.y + 15, 15, 20);
        
        // Head
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + 25, this.y + 10, 10, 10);
        
        // Beak
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 35, this.y + 13, 6, 4);
        
        // Wings (animated)
        const wingOffset = Math.sin(this.wingFlap) * 5;
        ctx.fillStyle = '#2F4F4F';
        
        // Left wing
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + 20 + wingOffset, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.ellipse(this.x + 40, this.y + 20 + wingOffset, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(this.x + 15, this.y + 30, 8, 8);
    }
}

class RockGolem {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.health = 4;
        this.maxHealth = 4;
        this.speed = 1.5 * this.game.speedFactor;
        this.active = true;
        
        // AI State
        this.state = 'sleeping';
        this.activationRange = 100;
        this.attackRange = 80;
        this.smashCooldown = 0;
        this.rockThrowCooldown = 0;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.facingRight = true;
        
        this.isGrounded = false;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.updateTimers(deltaTime);
        this.updateAI(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.smashCooldown > 0) this.smashCooldown -= deltaTime;
        if (this.rockThrowCooldown > 0) this.rockThrowCooldown -= deltaTime;
    }
    
    updateAI(deltaTime) {
        const player = this.game.player;
        const distanceToPlayer = Math.abs(this.x - player.x);
        
        // Wake up when player is near
        if (this.state === 'sleeping' && distanceToPlayer < this.activationRange) {
            this.state = 'active';
            this.game.effectsManager.addScreenShake(6, 500);
        }
        
        if (this.state === 'active') {
            if (distanceToPlayer < this.attackRange) {
                if (this.smashCooldown <= 0) {
                    this.groundSmash();
                }
            } else if (distanceToPlayer < 200 && this.rockThrowCooldown <= 0) {
                this.throwRock();
            } else {
                this.moveTowardsPlayer();
            }
        }
    }
    
    moveTowardsPlayer() {
        const player = this.game.player;
        
        if (player.x < this.x) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else {
            this.vx = this.speed;
            this.facingRight = true;
        }
    }
    
    groundSmash() {
        this.smashCooldown = 3000; // 3 second cooldown
        this.vx = 0;
        
        // Create shockwave effect
        this.game.effectsManager.addScreenShake(10, 800);
        this.game.createParticles(this.x + this.width/2, this.y + this.height, '#8B4513', 15);
        
        // Damage player if close
        const player = this.game.player;
        if (Math.abs(this.x - player.x) < this.attackRange && !player.invulnerable) {
            player.takeDamage();
        }
        
        if (this.game.audioManager) {
            this.game.audioManager.play('groundSmash');
        }
    }
    
    throwRock() {
        this.rockThrowCooldown = 4000; // 4 second cooldown
        
        const player = this.game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const projectile = {
            x: this.x + this.width / 2,
            y: this.y + 20,
            vx: (dx / distance) * 4 * this.game.speedFactor,
            vy: (dy / distance) * 4 * this.game.speedFactor - 2,
            width: 12,
            height: 12,
            active: true,
            type: 'rock',
            damage: 1
        };
        
        this.game.enemyProjectiles = this.game.enemyProjectiles || [];
        this.game.enemyProjectiles.push(projectile);
        
        if (this.game.audioManager) {
            this.game.audioManager.play('rockThrow');
        }
    }
    
    updatePhysics(deltaTime) {
        // Apply gravity
        this.vy += this.game.gravity;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Ground collision
        const groundY = this.game.height - 80 - this.height;
        if (this.y > groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isGrounded = true;
        }
        
        // Friction
        this.vx *= 0.9;
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 400) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    takeDamage() {
        this.health--;
        
        // Wake up if sleeping
        if (this.state === 'sleeping') {
            this.state = 'active';
        }
        
        if (this.health <= 0) {
            this.active = false;
            this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#8B4513', 20);
            this.game.effectsManager.addScreenShake(8, 600);
        }
    }
    
    befriend() {
        this.active = false;
        this.state = 'friendly';
        // Create happy particles
        this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#90EE90', 15);
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Dim when sleeping
        if (this.state === 'sleeping') {
            ctx.globalAlpha = 0.7;
        }
        
        this.drawGolem(ctx);
        ctx.restore();
    }
    
    drawGolem(ctx) {
        // Body
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + 10, this.y + 20, 40, 50);
        
        // Head
        ctx.fillStyle = '#778899';
        ctx.fillRect(this.x + 15, this.y + 5, 30, 25);
        
        // Arms
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + 5, this.y + 25, 12, 30);
        ctx.fillRect(this.x + 43, this.y + 25, 12, 30);
        
        // Legs
        ctx.fillRect(this.x + 15, this.y + 60, 12, 20);
        ctx.fillRect(this.x + 33, this.y + 60, 12, 20);
        
        // Eyes (glowing when active)
        if (this.state === 'active') {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(this.x + 20, this.y + 12, 4, 4);
            ctx.fillRect(this.x + 36, this.y + 12, 4, 4);
        }
        
        // Rock texture
        ctx.strokeStyle = '#2F4F4F';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const lineX = this.x + 10 + Math.random() * 40;
            const lineY = this.y + 20 + Math.random() * 50;
            ctx.beginPath();
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX + 5, lineY + 3);
            ctx.stroke();
        }
    }
}

// Export classes
window.BiomeManager = BiomeManager;
window.Scorpion = Scorpion;
window.Vulture = Vulture;
window.RockGolem = RockGolem;
