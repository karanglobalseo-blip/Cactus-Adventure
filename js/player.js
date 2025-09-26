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
            
            // Screen/world boundaries
            if (this.x < 0) {
                this.x = 0;
                this.vx = 0;
            }
            if (this.x + this.width > this.game.worldWidth) {
                this.x = this.game.worldWidth - this.width;
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
        // If an image is supplied, draw it and return
        if (this.game && this.game.assets && this.game.assets.cactus && this.game.assets.cactus.complete) {
            const img = this.game.assets.cactus;
            // Maintain the same hitbox; center the image within it visually
            ctx.drawImage(img, this.x - this.width * 0.2, this.y - this.height * 0.15, this.width * 1.4, this.height * 1.3);
            return;
        }
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;

        // Terracotta pot (visual only; does not affect hitbox)
        const potH = Math.max(10, this.height * 0.22);
        const potTopY = bottomY - potH * 0.9;
        ctx.fillStyle = '#E1864B';
        ctx.strokeStyle = '#5A2E0C';
        ctx.lineWidth = 2;
        // Pot body
        ctx.beginPath();
        ctx.moveTo(centerX - this.width * 0.45, bottomY);
        ctx.lineTo(centerX + this.width * 0.45, bottomY);
        ctx.lineTo(centerX + this.width * 0.38, potTopY);
        ctx.lineTo(centerX - this.width * 0.38, potTopY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Pot rim
        ctx.fillStyle = '#D3763E';
        const rimH = potH * 0.28;
        ctx.fillRect(centerX - this.width * 0.44, potTopY - rimH, this.width * 0.88, rimH);
        ctx.strokeRect(centerX - this.width * 0.44, potTopY - rimH, this.width * 0.88, rimH);

        // Main cactus body (rounded capsule)
        const bodyW = this.width * 0.55;
        const bodyH = this.height - potH * 0.9;
        const bodyX = centerX - bodyW / 2;
        const bodyY = this.y + Math.max(0, (this.height - potH) * 0.02);
        const radius = Math.min(bodyW, bodyH) * 0.28;
        ctx.fillStyle = '#47A04A';
        ctx.strokeStyle = '#1F5A20';
        ctx.lineWidth = 3;
        // Rounded rect
        ctx.beginPath();
        ctx.moveTo(bodyX + radius, bodyY);
        ctx.lineTo(bodyX + bodyW - radius, bodyY);
        ctx.quadraticCurveTo(bodyX + bodyW, bodyY, bodyX + bodyW, bodyY + radius);
        ctx.lineTo(bodyX + bodyW, bodyY + bodyH - radius);
        ctx.quadraticCurveTo(bodyX + bodyW, bodyY + bodyH, bodyX + bodyW - radius, bodyY + bodyH);
        ctx.lineTo(bodyX + radius, bodyY + bodyH);
        ctx.quadraticCurveTo(bodyX, bodyY + bodyH, bodyX, bodyY + bodyH - radius);
        ctx.lineTo(bodyX, bodyY + radius);
        ctx.quadraticCurveTo(bodyX, bodyY, bodyX + radius, bodyY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vertical segments (light/dark halves)
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(centerX, bodyY + 6, 2, bodyH - 12);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(centerX + bodyW * 0.18, bodyY + 6, 2, bodyH - 12);
        ctx.fillRect(centerX - bodyW * 0.18, bodyY + 6, 2, bodyH - 12);

        // Arms (rounded) for size >= 2
        if (this.size >= 2) {
            ctx.fillStyle = '#47A04A';
            ctx.strokeStyle = '#1F5A20';
            // Left arm
            const laX = bodyX - bodyW * 0.25;
            const laY = bodyY + bodyH * 0.35;
            const laW = bodyW * 0.28;
            const laH = bodyH * 0.38;
            ctx.beginPath();
            ctx.moveTo(laX + laW * 0.2, laY);
            ctx.quadraticCurveTo(laX, laY + laH * 0.25, laX + laW * 0.2, laY + laH);
            ctx.lineTo(laX + laW * 0.6, laY + laH);
            ctx.quadraticCurveTo(laX + laW * 0.8, laY + laH * 0.25, laX + laW * 0.6, laY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Right arm
            const raX = bodyX + bodyW;
            const raY = laY;
            const raW = laW;
            const raH = laH;
            ctx.beginPath();
            ctx.moveTo(raX + raW * 0.4, raY);
            ctx.quadraticCurveTo(raX + raW, raY + raH * 0.25, raX + raW * 0.4, raY + raH);
            ctx.lineTo(raX, raY + raH);
            ctx.quadraticCurveTo(raX - raW * 0.2, raY + raH * 0.25, raX, raY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Small spines
        ctx.strokeStyle = '#35612F';
        ctx.lineWidth = 2;
        for (let i = 0; i < bodyH - 10; i += 14) {
            ctx.beginPath();
            ctx.moveTo(bodyX + 6, bodyY + 6 + i);
            ctx.lineTo(bodyX, bodyY + 6 + i);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bodyX + bodyW - 6, bodyY + 13 + i);
            ctx.lineTo(bodyX + bodyW, bodyY + 13 + i);
            ctx.stroke();
        }

        // Face (kawaii)
        const eyeY = bodyY + bodyH * 0.35;
        ctx.fillStyle = '#000000';
        // Eyes
        ctx.beginPath();
        ctx.arc(centerX - 8, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 8, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        // Eye shines
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - 9, eyeY - 1, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 7, eyeY - 1, 1.4, 0, Math.PI * 2);
        ctx.fill();
        // Cheeks
        ctx.fillStyle = '#FF9BB0';
        ctx.beginPath();
        ctx.arc(centerX - 15, eyeY + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 15, eyeY + 6, 3, 0, Math.PI * 2);
        ctx.fill();
        // Mouth (happy when health>1)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const mouthY = bodyY + bodyH * 0.48;
        ctx.beginPath();
        if (this.health > 1) {
            ctx.arc(centerX, mouthY, 7, 0, Math.PI);
        } else {
            ctx.arc(centerX, mouthY + 8, 7, Math.PI, 0);
        }
        ctx.stroke();

        // Top flower accent
        ctx.fillStyle = '#FFC83D';
        const fx = centerX;
        const fy = bodyY - 6;
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(fx + Math.cos(ang) * 7, fy + Math.sin(ang) * 7, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#F79F00';
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, Math.PI * 2);
        ctx.fill();
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
