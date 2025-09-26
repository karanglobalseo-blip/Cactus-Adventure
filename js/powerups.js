// PowerUps.js - Power-up system and effects
class PowerUp {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.width = 24;
        this.height = 24;
        this.collected = false;
        this.active = true;
        
        // Animation
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
        this.glowIntensity = 0;
        
        // Power-up definitions
        this.powerUpData = {
            speed: {
                color: '#00ff00',
                icon: '⚡',
                name: 'Speed Boost',
                duration: 8000,
                description: 'Move faster!'
            },
            shield: {
                color: '#0080ff',
                icon: '🛡️',
                name: 'Shield',
                duration: 10000,
                description: 'Temporary invincibility!'
            },
            multiThorn: {
                color: '#ff8000',
                icon: '🔱',
                name: 'Multi-Thorn',
                duration: 15000,
                description: 'Shoot 3 thorns at once!'
            },
            jumpBoost: {
                color: '#ff00ff',
                icon: '🦘',
                name: 'Jump Boost',
                duration: 12000,
                description: 'Higher jumps!'
            },
            thornRegen: {
                color: '#ffff00',
                icon: '🌵',
                name: 'Thorn Regen',
                duration: 20000,
                description: 'Regenerate thorns over time!'
            }
        };
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        // Bobbing animation
        this.bobOffset += this.bobSpeed * deltaTime;
        
        // Glow animation
        this.glowIntensity = (Math.sin(this.bobOffset * 0.01) + 1) * 0.5;
        
        // Check collision with player
        if (this.game.checkCollision(this, this.game.player)) {
            this.collect();
        }
    }
    
    collect() {
        if (this.collected) return;
        
        this.collected = true;
        this.active = false;
        
        // Apply power-up effect to player
        this.game.player.addPowerUp(this.type, this.powerUpData[this.type].duration);
        
        // Play sound and show notification
        this.game.audioManager.play('powerup');
        this.game.ui.showPowerUpMessage(this.powerUpData[this.type]);
        
        // Create particles
        this.game.createParticles(this.x, this.y, this.powerUpData[this.type].color, 8);
        
        // Track achievement
        this.game.achievementManager.increment('powerupsCollected');
    }
    
    render(ctx) {
        if (this.collected) return;
        
        const data = this.powerUpData[this.type];
        const yPos = this.y + Math.sin(this.bobOffset * 0.01) * 3;
        
        ctx.save();
        
        // Glow effect
        ctx.shadowColor = data.color;
        ctx.shadowBlur = 10 + this.glowIntensity * 10;
        
        // Background circle
        ctx.fillStyle = data.color;
        ctx.globalAlpha = 0.3 + this.glowIntensity * 0.3;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, yPos + this.height/2, this.width/2 + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.globalAlpha = 1;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(data.icon, this.x + this.width/2, yPos + this.height/2 + 6);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, yPos + this.height/2, this.width/2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Power-up manager for spawning and managing power-ups
class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 15000; // 15 seconds
        this.powerUpTypes = ['speed', 'shield', 'multiThorn', 'jumpBoost', 'thornRegen'];
    }
    
    update(deltaTime) {
        // Update existing power-ups
        this.powerUps.forEach(powerUp => powerUp.update(deltaTime));
        this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
        
        // Spawn new power-ups
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
        }
    }
    
    spawnPowerUp() {
        const player = this.game.player;
        const spawnX = player.x + this.game.width * 0.5 + Math.random() * this.game.width;
        const spawnY = this.game.height - 150 - Math.random() * 100;
        const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
        
        this.powerUps.push(new PowerUp(spawnX, spawnY, type, this.game));
    }
    
    render(ctx) {
        this.powerUps.forEach(powerUp => powerUp.render(ctx));
    }
    
    // Add power-up at specific location (for testing or special events)
    addPowerUp(x, y, type) {
        this.powerUps.push(new PowerUp(x, y, type, this.game));
    }
}

// Player power-up effects
class PlayerPowerUpEffects {
    constructor(player) {
        this.player = player;
        this.activePowerUps = new Map();
    }
    
    addPowerUp(type, duration) {
        // Remove existing power-up of same type
        if (this.activePowerUps.has(type)) {
            this.removePowerUp(type);
        }
        
        const powerUp = {
            type: type,
            timeRemaining: duration,
            originalValues: {}
        };
        
        // Apply power-up effects
        switch (type) {
            case 'speed':
                powerUp.originalValues.speed = this.player.speed;
                this.player.speed *= 1.5;
                break;
                
            case 'shield':
                powerUp.originalValues.invulnerable = this.player.invulnerable;
                this.player.invulnerable = true;
                this.player.shieldActive = true;
                break;
                
            case 'multiThorn':
                this.player.multiThorn = true;
                break;
                
            case 'jumpBoost':
                powerUp.originalValues.jumpPower = this.player.jumpPower;
                this.player.jumpPower *= 1.4;
                break;
                
            case 'thornRegen':
                this.player.thornRegen = true;
                break;
        }
        
        this.activePowerUps.set(type, powerUp);
    }
    
    update(deltaTime) {
        for (const [type, powerUp] of this.activePowerUps) {
            powerUp.timeRemaining -= deltaTime;
            
            // Handle thorn regeneration
            if (type === 'thornRegen' && Math.random() < 0.002) {
                this.player.thorns = Math.min(this.player.thorns + 1, this.player.maxThorns);
            }
            
            if (powerUp.timeRemaining <= 0) {
                this.removePowerUp(type);
            }
        }
    }
    
    removePowerUp(type) {
        const powerUp = this.activePowerUps.get(type);
        if (!powerUp) return;
        
        // Restore original values
        switch (type) {
            case 'speed':
                this.player.speed = powerUp.originalValues.speed;
                break;
                
            case 'shield':
                this.player.invulnerable = powerUp.originalValues.invulnerable;
                this.player.shieldActive = false;
                break;
                
            case 'multiThorn':
                this.player.multiThorn = false;
                break;
                
            case 'jumpBoost':
                this.player.jumpPower = powerUp.originalValues.jumpPower;
                break;
                
            case 'thornRegen':
                this.player.thornRegen = false;
                break;
        }
        
        this.activePowerUps.delete(type);
    }
    
    hasPowerUp(type) {
        return this.activePowerUps.has(type);
    }
    
    getPowerUpTimeRemaining(type) {
        const powerUp = this.activePowerUps.get(type);
        return powerUp ? powerUp.timeRemaining : 0;
    }
    
    renderEffects(ctx) {
        // Render shield effect
        if (this.hasPowerUp('shield')) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#0080ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.player.x + this.player.width/2, 
                this.player.y + this.player.height/2, 
                this.player.width/2 + 8 + Math.sin(Date.now() * 0.01) * 2, 
                0, Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }
    }
}

window.PowerUp = PowerUp;
window.PowerUpManager = PowerUpManager;
window.PlayerPowerUpEffects = PlayerPowerUpEffects;
