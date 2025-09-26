// Bosses.js - Boss enemies for biome transitions

class BossManager {
    constructor(game) {
        this.game = game;
        this.currentBoss = null;
        this.bossActive = false;
        this.bossSpawned = false;
        this.bossDefeated = false;
    }
    
    update(deltaTime) {
        if (this.currentBoss && this.currentBoss.active) {
            this.currentBoss.update(deltaTime);
            
            // Check if boss is defeated
            if (!this.currentBoss.active && !this.bossDefeated) {
                this.onBossDefeated();
            }
        }
    }
    
    spawnBoss(biome, x, y) {
        if (this.bossSpawned) return;
        
        this.bossSpawned = true;
        this.bossActive = true;
        this.bossDefeated = false;
        
        switch (biome) {
            case 'desert':
                this.currentBoss = new SandWorm(x, y, this.game);
                break;
            case 'oasis':
                this.currentBoss = new GiantVulture(x, y, this.game);
                break;
            case 'canyon':
                this.currentBoss = new RockTitan(x, y, this.game);
                break;
            case 'ruins':
                this.currentBoss = new AncientGuardian(x, y, this.game);
                break;
        }
        
        // Boss entrance effects
        this.game.effectsManager.addScreenShake(12, 1000);
        this.game.ui.showAlert(
            `⚔️ BOSS BATTLE: ${this.currentBoss.name}!`,
            'rgba(255, 0, 0, 0.95)',
            5000
        );
        
        if (this.game.audioManager) {
            this.game.audioManager.play('bossAppear');
        }
        
        console.log(`Boss spawned: ${this.currentBoss.name}`);
    }
    
    onBossDefeated() {
        this.bossDefeated = true;
        this.bossActive = false;
        
        // Victory effects
        this.game.effectsManager.addScreenShake(15, 1200);
        this.game.createParticles(
            this.currentBoss.x + this.currentBoss.width/2,
            this.currentBoss.y + this.currentBoss.height/2,
            '#FFD700', 30
        );
        
        // Rewards
        this.spawnBossRewards();
        
        // Achievement
        if (this.game.achievementManager) {
            this.game.achievementManager.onBossDefeated(this.currentBoss.name);
        }
        
        this.game.ui.showAlert(
            `🏆 ${this.currentBoss.name} Defeated!`,
            'rgba(255, 215, 0, 0.95)',
            4000
        );
        
        if (this.game.audioManager) {
            this.game.audioManager.play('bossDefeated');
        }
    }
    
    spawnBossRewards() {
        const bossX = this.currentBoss.x + this.currentBoss.width/2;
        const bossY = this.currentBoss.y + this.currentBoss.height/2;
        
        // Spawn multiple power-ups
        const powerUps = ['speed', 'shield', 'multiThorn', 'jumpBoost', 'thornRegen'];
        for (let i = 0; i < 3; i++) {
            const powerUp = powerUps[Math.floor(Math.random() * powerUps.length)];
            this.game.powerUpManager.addPowerUp(
                bossX + (i - 1) * 50,
                bossY - 50,
                powerUp
            );
        }
        
        // Spawn super flowers
        for (let i = 0; i < 5; i++) {
            this.game.flowers.push({
                x: bossX + (i - 2) * 30,
                y: bossY - 30,
                width: 20,
                height: 20,
                collected: false,
                type: 'super'
            });
        }
    }
    
    render(ctx) {
        if (this.currentBoss && this.currentBoss.active) {
            this.currentBoss.render(ctx);
        }
    }
    
    reset() {
        this.currentBoss = null;
        this.bossActive = false;
        this.bossSpawned = false;
        this.bossDefeated = false;
    }
}

class SandWorm {
    constructor(x, y, game) {
        this.game = game;
        this.name = "Sand Worm";
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 200;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.health = 15;
        this.maxHealth = 15;
        this.speed = 3 * this.game.speedFactor;
        this.active = true;
        
        // Boss mechanics
        this.phase = 1; // 1: surface attacks, 2: underground, 3: rage mode
        this.attackTimer = 0;
        this.attackCooldown = 2000;
        this.underground = false;
        this.undergroundTimer = 0;
        this.emergeCooldown = 0;
        
        // Segments for worm body
        this.segments = [];
        for (let i = 0; i < 8; i++) {
            this.segments.push({
                x: x,
                y: y + i * 25,
                targetX: x,
                targetY: y + i * 25
            });
        }
        
        this.animationTimer = 0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.updateTimers(deltaTime);
        this.updatePhase();
        this.updateAI(deltaTime);
        this.updateSegments(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.attackTimer > 0) this.attackTimer -= deltaTime;
        if (this.undergroundTimer > 0) this.undergroundTimer -= deltaTime;
        if (this.emergeCooldown > 0) this.emergeCooldown -= deltaTime;
    }
    
    updatePhase() {
        if (this.health < this.maxHealth * 0.7 && this.phase === 1) {
            this.phase = 2;
            this.goUnderground();
        } else if (this.health < this.maxHealth * 0.3 && this.phase === 2) {
            this.phase = 3;
            this.underground = false;
            this.speed *= 1.5;
        }
    }
    
    updateAI(deltaTime) {
        const player = this.game.player;
        
        if (this.phase === 1) {
            this.surfaceAttacks(player);
        } else if (this.phase === 2) {
            this.undergroundAttacks(player);
        } else if (this.phase === 3) {
            this.rageMode(player);
        }
    }
    
    surfaceAttacks(player) {
        if (this.attackTimer <= 0) {
            const attack = Math.random();
            if (attack < 0.5) {
                this.sandBlast();
            } else {
                this.bodySlam(player);
            }
            this.attackTimer = this.attackCooldown;
        }
    }
    
    undergroundAttacks(player) {
        if (this.underground) {
            if (this.undergroundTimer <= 0) {
                this.emergeAttack(player);
            }
        } else if (this.emergeCooldown <= 0) {
            this.goUnderground();
        }
    }
    
    rageMode(player) {
        // Continuous attacks in rage mode
        if (this.attackTimer <= 0) {
            this.sandBlast();
            this.bodySlam(player);
            this.attackTimer = this.attackCooldown * 0.5; // Faster attacks
        }
    }
    
    sandBlast() {
        // Create multiple sand projectiles
        for (let i = 0; i < 5; i++) {
            const angle = (i - 2) * 0.3;
            const projectile = {
                x: this.x + this.width/2,
                y: this.y + 50,
                vx: Math.cos(angle) * 6 * this.game.speedFactor,
                vy: Math.sin(angle) * 6 * this.game.speedFactor,
                width: 10,
                height: 10,
                active: true,
                type: 'sand',
                damage: 1
            };
            
            this.game.enemyProjectiles = this.game.enemyProjectiles || [];
            this.game.enemyProjectiles.push(projectile);
        }
        
        if (this.game.audioManager) {
            this.game.audioManager.play('sandBlast');
        }
    }
    
    bodySlam(player) {
        // Move towards player quickly
        const dx = player.x - this.x;
        this.vx = Math.sign(dx) * this.speed * 2;
        
        // Create shockwave on impact
        this.game.effectsManager.addScreenShake(8, 400);
        this.game.createParticles(this.x + this.width/2, this.y + this.height, '#D2B48C', 12);
    }
    
    goUnderground() {
        this.underground = true;
        this.undergroundTimer = 3000; // 3 seconds underground
        this.emergeCooldown = 5000; // 5 seconds before can go underground again
        
        // Visual effect
        this.game.createParticles(this.x + this.width/2, this.y + this.height, '#8B4513', 20);
    }
    
    emergeAttack(player) {
        this.underground = false;
        this.undergroundTimer = 0;
        
        // Emerge near player
        this.x = player.x - this.width/2 + (Math.random() - 0.5) * 200;
        this.y = this.game.height - 80 - this.height;
        
        // Emergence effects
        this.game.effectsManager.addScreenShake(10, 600);
        this.game.createParticles(this.x + this.width/2, this.y + this.height, '#D2B48C', 25);
        
        // Damage player if too close
        if (Math.abs(this.x - player.x) < 80 && !player.invulnerable) {
            player.takeDamage();
        }
    }
    
    updateSegments(deltaTime) {
        // Update segment positions to follow head
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            
            if (i === 0) {
                segment.targetX = this.x;
                segment.targetY = this.y + 30;
            } else {
                const prevSegment = this.segments[i - 1];
                segment.targetX = prevSegment.x;
                segment.targetY = prevSegment.y + 25;
            }
            
            // Smooth movement
            segment.x += (segment.targetX - segment.x) * 0.1;
            segment.y += (segment.targetY - segment.y) * 0.1;
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        
        // Friction
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        // Keep on ground
        const groundY = this.game.height - 80 - this.height;
        if (this.y > groundY) {
            this.y = groundY;
        }
    }
    
    takeDamage() {
        this.health--;
        
        // Flash effect
        this.game.createParticles(this.x + this.width/2, this.y + 50, '#FF0000', 8);
        
        if (this.health <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Don't render if underground
        if (this.underground) {
            // Show underground indicator
            ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
            ctx.fillRect(this.x, this.game.height - 80, this.width, 20);
            ctx.restore();
            return;
        }
        
        this.drawWorm(ctx);
        this.drawHealthBar(ctx);
        
        ctx.restore();
    }
    
    drawWorm(ctx) {
        // Draw segments
        this.segments.forEach((segment, index) => {
            const size = 20 - index * 2;
            ctx.fillStyle = index === 0 ? '#8B4513' : '#D2B48C';
            ctx.fillRect(segment.x + (20 - size)/2, segment.y, size, 25);
            
            // Segment details
            if (index < 3) {
                ctx.fillStyle = '#654321';
                ctx.fillRect(segment.x + 5, segment.y + 5, size - 10, 3);
                ctx.fillRect(segment.x + 5, segment.y + 15, size - 10, 3);
            }
        });
        
        // Draw head
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(this.x, this.y, this.width, 60);
        
        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 20, this.y + 15, 8, 8);
        ctx.fillRect(this.x + 72, this.y + 15, 8, 8);
        
        // Mouth
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 30, this.y + 35, 40, 15);
        
        // Teeth
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 6; i++) {
            ctx.fillRect(this.x + 32 + i * 6, this.y + 35, 3, 8);
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = 100;
        const barHeight = 8;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 20;
        
        // Background
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Boss name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width/2, barY - 5);
    }
}

class GiantVulture {
    constructor(x, y, game) {
        this.game = game;
        this.name = "Giant Vulture";
        this.x = x;
        this.y = y - 100; // Start in air
        this.width = 120;
        this.height = 80;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.health = 12;
        this.maxHealth = 12;
        this.speed = 4 * this.game.speedFactor;
        this.active = true;
        
        // Flying patterns
        this.phase = 1;
        this.attackTimer = 0;
        this.attackCooldown = 3000;
        this.diveCooldown = 0;
        this.windAttackCooldown = 0;
        
        // Flight pattern
        this.centerX = x;
        this.centerY = y - 150;
        this.angle = 0;
        this.circleRadius = 150;
        
        this.animationTimer = 0;
        this.wingFlap = 0;
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.updateTimers(deltaTime);
        this.updatePhase();
        this.updateAI(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.attackTimer > 0) this.attackTimer -= deltaTime;
        if (this.diveCooldown > 0) this.diveCooldown -= deltaTime;
        if (this.windAttackCooldown > 0) this.windAttackCooldown -= deltaTime;
    }
    
    updatePhase() {
        if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.3;
            this.attackCooldown *= 0.7;
        }
    }
    
    updateAI(deltaTime) {
        const player = this.game.player;
        
        if (this.attackTimer <= 0) {
            const attack = Math.random();
            if (attack < 0.4 && this.diveCooldown <= 0) {
                this.diveAttack(player);
            } else if (attack < 0.7 && this.windAttackCooldown <= 0) {
                this.windGust();
            } else {
                this.featherStorm();
            }
            this.attackTimer = this.attackCooldown;
        } else {
            this.circlePlayer(player);
        }
    }
    
    circlePlayer(player) {
        this.centerX = player.x;
        this.angle += 0.03;
        
        const targetX = this.centerX + Math.cos(this.angle) * this.circleRadius;
        const targetY = this.centerY + Math.sin(this.angle) * 50;
        
        this.vx = (targetX - this.x) * 0.05;
        this.vy = (targetY - this.y) * 0.05;
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    diveAttack(player) {
        this.diveCooldown = 5000;
        
        // Dive towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * this.speed * 3;
        this.vy = (dy / distance) * this.speed * 3;
        
        // Create wind effect
        this.game.createParticles(this.x + this.width/2, this.y + this.height, '#87CEEB', 15);
        
        if (this.game.audioManager) {
            this.game.audioManager.play('vultureDive');
        }
    }
    
    windGust() {
        this.windAttackCooldown = 4000;
        
        // Create wind projectiles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const projectile = {
                x: this.x + this.width/2,
                y: this.y + this.height/2,
                vx: Math.cos(angle) * 5 * this.game.speedFactor,
                vy: Math.sin(angle) * 5 * this.game.speedFactor,
                width: 15,
                height: 15,
                active: true,
                type: 'wind',
                damage: 1
            };
            
            this.game.enemyProjectiles = this.game.enemyProjectiles || [];
            this.game.enemyProjectiles.push(projectile);
        }
        
        // Push player back
        const player = this.game.player;
        const dx = player.x - this.x;
        if (Math.abs(dx) < 200) {
            player.vx += Math.sign(dx) * 5;
        }
    }
    
    featherStorm() {
        // Rain of feathers
        for (let i = 0; i < 12; i++) {
            const projectile = {
                x: this.x + Math.random() * this.width,
                y: this.y,
                vx: (Math.random() - 0.5) * 2 * this.game.speedFactor,
                vy: 3 * this.game.speedFactor,
                width: 8,
                height: 12,
                active: true,
                type: 'feather',
                damage: 1
            };
            
            this.game.enemyProjectiles = this.game.enemyProjectiles || [];
            this.game.enemyProjectiles.push(projectile);
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        this.wingFlap += deltaTime * 0.01;
        
        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Friction
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // Keep in bounds
        if (this.y < 50) this.y = 50;
        if (this.y > this.game.height - 200) this.y = this.game.height - 200;
    }
    
    takeDamage() {
        this.health--;
        
        // Knockback
        this.vy -= 3;
        
        this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#654321', 10);
        
        if (this.health <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        this.drawVulture(ctx);
        this.drawHealthBar(ctx);
        ctx.restore();
    }
    
    drawVulture(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 20, this.game.height - 80, this.width - 40, 10);
        
        // Body
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(this.x + 40, this.y + 30, 40, 35);
        
        // Head
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x + 50, this.y + 20, 25, 20);
        
        // Beak
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x + 75, this.y + 25, 15, 8);
        
        // Wings (animated)
        const wingOffset = Math.sin(this.wingFlap) * 10;
        ctx.fillStyle = '#2F4F4F';
        
        // Left wing
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 40 + wingOffset, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.ellipse(this.x + 100, this.y + 40 + wingOffset, 25, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (glowing)
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(this.x + 55, this.y + 23, 4, 4);
        ctx.fillRect(this.x + 65, this.y + 23, 4, 4);
        
        // Talons
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + 45 + i * 5, this.y + 60);
            ctx.lineTo(this.x + 47 + i * 5, this.y + 70);
            ctx.stroke();
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = 120;
        const barHeight = 8;
        const barX = this.x;
        const barY = this.y - 20;
        
        // Background
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Boss name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width/2, barY - 5);
    }
}

// Export classes
window.BossManager = BossManager;
window.SandWorm = SandWorm;
window.GiantVulture = GiantVulture;
