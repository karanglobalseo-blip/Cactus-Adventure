// Player.js - Cactus player character
class Player {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        
        // Player stats
        this.health = 3;
        this.maxHealth = 3;
        this.size = 1; // 1=small, 2=medium, 3=large
        this.thorns = 5;
        this.maxThorns = 10;
        
        // States
        this.isGrounded = false;
        this.isPlanted = false;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.plantedTimer = 0;
        
        // Movement (apply global speed factor)
        this.speed = 5 * this.game.speedFactor;
        this.jumpPower = 15 * this.game.speedFactor;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.facingRight = true;
        
        // Input handling
        this.lastThornTime = 0;
        this.thornCooldown = 300; // milliseconds
    }
    
    reset() {
        this.health = this.maxHealth;
        this.size = 1;
        this.thorns = 5;
        this.x = 100;
        this.y = this.game.height - 200;
        this.vx = 0;
        this.vy = 0;
        this.isPlanted = false;
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
        this.plantedTimer = 0;
    }
    
    update(deltaTime) {
        this.handleInput();
        this.updatePhysics(deltaTime);
        this.updateStates(deltaTime);
        this.updateAnimation(deltaTime);
    }
    
    handleInput() {
        const game = this.game;
        
        // Movement input
        if ((game.keys['ArrowLeft'] || game.keys['KeyA'] || game.touches['left']) && !this.isPlanted) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if ((game.keys['ArrowRight'] || game.keys['KeyD'] || game.touches['right']) && !this.isPlanted) {
            this.vx = this.speed;
            this.facingRight = true;
        } else if (!this.isPlanted) {
            this.vx *= game.friction;
        }
        
        // Jump input (remove Space to free it for throwing)
        if ((game.keys['ArrowUp'] || game.keys['KeyW'] || game.touches['jump']) && this.isGrounded && !this.isPlanted) {
            this.vy = -this.jumpPower;
            this.isGrounded = false;
        }
        
        // Thorn throwing
        if ((game.keys['KeyX'] || game.keys['Space'] || game.touches['thorn']) && this.canThrowThorn()) {
            this.throwThorn();
        }
        
        // Plant ability
        if ((game.keys['KeyZ'] || game.keys['ControlLeft'] || game.keys['ControlRight'] || game.touches['plant']) && this.isGrounded) {
            this.togglePlant();
        }
    }
    
    updatePhysics(deltaTime) {
        // Track previous Y for head-bump detection
        this.prevY = this.y;
        if (!this.isPlanted) {
            // Apply gravity
            this.vy += this.game.gravity;
            
            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Enforce forward-only boundary
            if (this.x < this.game.forwardBoundary) {
                this.x = this.game.forwardBoundary;
                if (this.vx < 0) this.vx = 0;
            }
            
            // Ground collision
            const groundY = this.game.height - 80;
            if (this.y + this.height > groundY) {
                this.y = groundY - this.height;
                this.vy = 0;
                this.isGrounded = true;
            } else {
                this.isGrounded = false;
            }
            
            // Screen boundaries
            if (this.x < 0) {
                this.x = 0;
                this.vx = 0;
            }
            if (this.x + this.width > this.game.width * 2) {
                this.x = this.game.width * 2 - this.width;
                this.vx = 0;
            }
        }
    }
    
    updateStates(deltaTime) {
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update planted state
        if (this.isPlanted) {
            this.plantedTimer -= deltaTime;
            if (this.plantedTimer <= 0) {
                this.isPlanted = false;
            }
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 200) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    canThrowThorn() {
        const currentTime = Date.now();
        return this.thorns > 0 && 
               (currentTime - this.lastThornTime) > this.thornCooldown &&
               !this.isPlanted;
    }
    
    throwThorn() {
        if (!this.canThrowThorn()) return;
        
        this.thorns--;
        this.lastThornTime = Date.now();
        
        const thornX = this.x + (this.facingRight ? this.width : 0);
        const thornY = this.y + this.height / 2;
        const direction = this.facingRight ? 1 : -1;
        
        this.game.thorns.push(new Thorn(thornX, thornY, direction, this.game));
    }
    
    togglePlant() {
        if (this.isPlanted) {
            this.isPlanted = false;
            this.plantedTimer = 0;
        } else {
            this.isPlanted = true;
            this.plantedTimer = 3000; // 3 seconds
            this.vx = 0;
            this.vy = 0;
        }
    }
    
    eatFlower(type) {
        if (type === 'super') {
            // Superflower increases size and restores more thorns
            this.grow(2);
            this.thorns = Math.min(this.thorns + 2, this.maxThorns);
        } else {
            // Normal flower does NOT grow size; small thorn restore remains
            this.thorns = Math.min(this.thorns + 1, this.maxThorns);
        }
    }
    
    grow(amount) {
        this.size = Math.min(this.size + amount, 3);
        
        // Update size-based properties
        switch(this.size) {
            case 1:
                this.width = 40;
                this.height = 60;
                this.speed = 5 * this.game.speedFactor;
                break;
            case 2:
                this.width = 50;
                this.height = 75;
                this.speed = 4 * this.game.speedFactor;
                break;
            case 3:
                this.width = 60;
                this.height = 90;
                this.speed = 3 * this.game.speedFactor;
                break;
        }
    }
    
    takeDamage() {
        if (this.invulnerable) return;
        
        this.health--;
        this.invulnerable = true;
        this.invulnerabilityTimer = 2000; // 2 seconds
        
        // Shrink when damaged
        if (this.size > 1) {
            this.size--;
            this.grow(0); // Update size properties
        }
        
        // Knockback effect
        this.vx = this.facingRight ? -8 : 8;
        this.vy = -5;
    }
    
    render(ctx) {
        ctx.save();
        
        // Flicker when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // Draw cactus body
        this.drawCactus(ctx);
        
        // Draw planted effect
        if (this.isPlanted) {
            this.drawPlantedEffect(ctx);
        }
        
        ctx.restore();
    }
    
    drawCactus(ctx) {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;
        
        // Main body (green cylinder)
        ctx.fillStyle = '#228B22';
        ctx.fillRect(
            centerX - this.width * 0.3,
            this.y,
            this.width * 0.6,
            this.height
        );
        
        // Arms (if medium or large)
        if (this.size >= 2) {
            // Left arm
            ctx.fillRect(
                centerX - this.width * 0.6,
                this.y + this.height * 0.3,
                this.width * 0.3,
                this.height * 0.4
            );
            
            // Right arm
            ctx.fillRect(
                centerX + this.width * 0.3,
                this.y + this.height * 0.3,
                this.width * 0.3,
                this.height * 0.4
            );
        }
        
        // Extra segments for large cactus
        if (this.size >= 3) {
            ctx.fillRect(
                centerX - this.width * 0.25,
                this.y - 15,
                this.width * 0.5,
                20
            );
        }
        
        // Spines
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.height; i += 15) {
            // Left spines
            ctx.beginPath();
            ctx.moveTo(centerX - this.width * 0.3, this.y + i);
            ctx.lineTo(centerX - this.width * 0.4, this.y + i);
            ctx.stroke();
            
            // Right spines
            ctx.beginPath();
            ctx.moveTo(centerX + this.width * 0.3, this.y + i);
            ctx.lineTo(centerX + this.width * 0.4, this.y + i);
            ctx.stroke();
        }
        
        // Face
        ctx.fillStyle = '#000000';
        
        // Eyes
        const eyeY = this.y + this.height * 0.25;
        ctx.beginPath();
        ctx.arc(centerX - 8, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + 8, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (changes based on health)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const mouthY = this.y + this.height * 0.4;
        if (this.health > 1) {
            // Happy mouth
            ctx.arc(centerX, mouthY, 8, 0, Math.PI);
        } else {
            // Sad mouth
            ctx.arc(centerX, mouthY + 10, 8, Math.PI, 0);
        }
        ctx.stroke();
        
        // Flower on top (if large)
        if (this.size >= 3) {
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(centerX, this.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawPlantedEffect(ctx) {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;
        
        // Root system
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i - 2) * 0.3;
            const rootLength = 30;
            
            ctx.beginPath();
            ctx.moveTo(centerX, bottomY);
            ctx.lineTo(
                centerX + Math.sin(angle) * rootLength,
                bottomY + Math.cos(angle) * rootLength
            );
            ctx.stroke();
        }
        
        // Glow effect
        ctx.shadowColor = '#90EE90';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#90EE90';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// Thorn projectile class
class Thorn {
    constructor(x, y, direction, game) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 4;
        this.vx = direction * 12 * game.speedFactor;
        this.vy = 0;
        this.game = game;
        this.active = true;
        this.lifetime = 4000; // doubled lifetime for 100% more range
        this.timer = 0;
    }
    
    update(deltaTime) {
        this.timer += deltaTime;
        
        if (this.timer > this.lifetime) {
            this.active = false;
            return;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply slight gravity
        this.vy += 0.2 * this.game.speedFactor;
        
        // Remove if off screen
        if (this.x < -50 || this.x > this.game.width * 2 + 50 || 
            this.y > this.game.height) {
            this.active = false;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw thorn
        ctx.fillStyle = '#8B4513';
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        ctx.beginPath();
        ctx.moveTo(-this.width/2, 0);
        ctx.lineTo(this.width/2, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}
