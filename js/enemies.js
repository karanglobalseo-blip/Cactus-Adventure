// Enemies.js - Enemy classes and AI
class Camel {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.health = 2;
        this.maxHealth = 2;
        this.speed = 2 * this.game.speedFactor;
        this.active = true;
        
        // AI State
        this.state = 'patrol'; // patrol, chase, stunned
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.patrolDistance = 120;
        this.startX = x;
        this.homeX = x;
        this.chaseRange = 180; // starts chasing when player enters this radius from camel
        this.maxChaseDistance = 220; // camel won't go beyond this from homeX
        this.attackRange = 40;
        
        // Timers
        this.stunnedTimer = 0;
        this.attackCooldown = 0;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.facingRight = this.direction > 0;
        
        // Ground detection
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
        if (this.stunnedTimer > 0) {
            this.stunnedTimer -= deltaTime;
            if (this.stunnedTimer <= 0) {
                this.state = 'patrol';
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }
    
    updateAI(deltaTime) {
        if (this.state === 'stunned') {
            this.vx = 0;
            return;
        }
        
        const player = this.game.player;
        const distanceToPlayer = Math.abs(this.x - player.x);
        
        // State transitions
        if (distanceToPlayer < this.chaseRange && this.state === 'patrol') {
            this.state = 'chase';
        } else if (distanceToPlayer > this.chaseRange * 1.5 && this.state === 'chase') {
            this.state = 'patrol';
        }
        
        // Behavior based on state
        switch (this.state) {
            case 'patrol':
                this.patrol();
                break;
            case 'chase':
                this.chase();
                break;
        }
    }
    
    patrol() {
        // Simple patrol behavior
        const distanceFromStart = this.x - this.startX;
        
        if (Math.abs(distanceFromStart) > this.patrolDistance) {
            this.direction *= -1;
            this.facingRight = this.direction > 0;
        }
        
        this.vx = this.direction * this.speed * 0.5;
    }
    
    chase() {
        const player = this.game.player;
        
        if (player.x < this.x) {
            this.vx = -this.speed;
            this.facingRight = false;
            this.direction = -1;
        } else {
            this.vx = this.speed;
            this.facingRight = true;
            this.direction = 1;
        }
        
        // Jump if player is above
        if (player.y < this.y - 20 && this.isGrounded && Math.abs(player.x - this.x) < 100) {
            this.vy = -12 * this.game.speedFactor;
            this.isGrounded = false;
        }

        // Do not chase beyond max distance from home
        if (Math.abs(this.x - this.homeX) > this.maxChaseDistance) {
            this.state = 'patrol';
        }
    }
    
    updatePhysics(deltaTime) {
        // Apply gravity
        this.vy += this.game.gravity;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
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
        const minX = Math.max(0, this.homeX - this.maxChaseDistance);
        const maxX = Math.min(this.game.width * 2 - this.width, this.homeX + this.maxChaseDistance);
        if (this.x < minX) {
            this.x = minX;
            this.direction = 1;
            this.facingRight = true;
        }
        if (this.x + this.width > maxX) {
            this.x = maxX - this.width;
            this.direction = -1;
            this.facingRight = false;
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 300) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }
    
    takeDamage() {
        this.health--;
        this.state = 'stunned';
        this.stunnedTimer = 1500; // 1.5 seconds
        
        // Knockback
        this.vx = (this.facingRight ? -5 : 5) * this.game.speedFactor;
        this.vy = -8 * this.game.speedFactor;
        
        if (this.health <= 0) {
            this.active = false;
            // Create death particles
            this.game.createParticles(this.x + this.width/2, this.y + this.height/2, '#8B4513', 10);
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Flicker when stunned
        if (this.state === 'stunned' && Math.floor(Date.now() / 100) % 2) {
            ctx.globalAlpha = 0.7;
        }
        
        this.drawCamel(ctx);
        
        ctx.restore();
    }
    
    drawCamel(ctx) {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;
        
        // Flip horizontally if facing left
        if (!this.facingRight) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-this.x * 2 - this.width, 0);
        }
        
        // Body
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(this.x + 15, this.y + 20, 50, 25);
        
        // Legs
        ctx.fillStyle = '#CD853F';
        const legWidth = 8;
        const legHeight = 20;
        
        // Front legs
        ctx.fillRect(this.x + 20, this.y + 40, legWidth, legHeight);
        ctx.fillRect(this.x + 30, this.y + 40, legWidth, legHeight);
        
        // Back legs
        ctx.fillRect(this.x + 50, this.y + 40, legWidth, legHeight);
        ctx.fillRect(this.x + 60, this.y + 40, legWidth, legHeight);
        
        // Neck and head
        ctx.fillStyle = '#D2B48C';
        
        // Neck
        ctx.fillRect(this.x + 65, this.y + 10, 12, 25);
        
        // Head
        ctx.beginPath();
        ctx.arc(this.x + 75, this.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Hump
        ctx.beginPath();
        ctx.arc(this.x + 40, this.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 72, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 78, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.arc(this.x + 70, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 80, this.y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + 30);
        ctx.lineTo(this.x + 5, this.y + 35);
        ctx.stroke();
        
        // Angry expression when chasing
        if (this.state === 'chase') {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            
            // Angry eyebrows
            ctx.beginPath();
            ctx.moveTo(this.x + 70, this.y + 10);
            ctx.lineTo(this.x + 74, this.y + 8);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 76, this.y + 8);
            ctx.lineTo(this.x + 80, this.y + 10);
            ctx.stroke();
        }
        
        if (!this.facingRight) {
            ctx.restore();
        }
    }
}

// Sand Storm class - Environmental hazard
class SandStorm {
    constructor(x, y, width, height, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = -2 * this.game.speedFactor; // Moves left across screen
        this.active = true;
        this.damage = 1;
        
        // Visual effects
        this.particles = [];
        this.opacity = 0.7;
        this.animationTimer = 0;
        
        // Warning system
        this.warningTime = 3000; // 3 seconds warning
        this.warningTimer = this.warningTime;
        this.isWarning = true;
        
        this.generateParticles();
    }
    
    generateParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 4 * this.game.speedFactor,
                vy: (Math.random() - 0.5) * 2 * this.game.speedFactor,
                size: Math.random() * 3 + 1,
                life: Math.random()
            });
        }
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Update warning timer
        if (this.isWarning) {
            this.warningTimer -= deltaTime;
            if (this.warningTimer <= 0) {
                this.isWarning = false;
            }
            return;
        }
        
        // Move storm
        this.x += this.vx;
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life += 0.01;
            
            // Wrap particles within storm bounds
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;
        });
        
        this.animationTimer += deltaTime;
        
        // Check collision with player
        const player = this.game.player;
        if (this.checkCollision(player) && !player.isPlanted) {
            // Damage player if not planted
            if (!player.invulnerable) {
                player.takeDamage();
            }
        }
        
        // Remove storm when it goes off screen
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }
    
    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        if (this.isWarning) {
            // Draw warning indicator
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(this.x, 0, this.width, this.game.height);
            
            // Warning text
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SAND STORM INCOMING!', this.x + this.width/2, 50);
            
            // Flashing effect
            if (Math.floor(Date.now() / 200) % 2) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 4;
                ctx.strokeRect(this.x, 0, this.width, this.game.height);
            }
        } else {
            // Draw actual storm
            const stormImg = this.game.assets && this.game.assets.storm;
            if (stormImg && stormImg.complete) {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                // Draw image scaled to storm bounds
                ctx.drawImage(stormImg, this.x, this.y, this.width, this.height);
                ctx.restore();
                ctx.restore();
                return;
            }
            ctx.globalAlpha = this.opacity;

            // Create a wavy-edged clipping path for the storm body
            ctx.save();
            ctx.beginPath();
            const waveAmp = 10; // amplitude
            const waveLen = 60; // wavelength
            const t = (Date.now() / 200) % (Math.PI * 2);
            // Top edge
            ctx.moveTo(this.x, this.y);
            for (let px = 0; px <= this.width; px += 10) {
                const yOff = Math.sin((px / waveLen) + t) * waveAmp;
                ctx.lineTo(this.x + px, this.y + yOff);
            }
            // Right edge
            ctx.lineTo(this.x + this.width, this.y + this.height);
            // Bottom edge (wavy)
            for (let px = this.width; px >= 0; px -= 10) {
                const yOff = Math.cos((px / waveLen) + t) * waveAmp;
                ctx.lineTo(this.x + px, this.y + this.height - yOff);
            }
            // Left edge
            ctx.closePath();
            ctx.clip();

            // Storm background gradient
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
            gradient.addColorStop(0, 'rgba(150, 90, 40, 0.9)');
            gradient.addColorStop(0.5, 'rgba(180, 120, 60, 0.85)');
            gradient.addColorStop(1, 'rgba(150, 90, 40, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Add horizontal streaks for wind effect
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 6; i++) {
                const y = this.y + (i + 1) * (this.height / 7) + Math.sin(t + i) * 4;
                ctx.fillRect(this.x, y, this.width, 2);
            }
            ctx.globalAlpha = this.opacity;

            // Draw swirling particles
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            this.particles.forEach(particle => {
                // Swirl motion: offset by a small circular component
                const angle = (particle.life * Math.PI * 2) + t * 2;
                const swirlRadius = 6;
                const px = this.x + particle.x + Math.cos(angle) * swirlRadius;
                const py = this.y + particle.y + Math.sin(angle) * swirlRadius;
                ctx.fillStyle = `rgba(139, 69, 19, ${0.8 - particle.life * 0.3})`;
                ctx.beginPath();
                ctx.arc(px, py, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        }
        
        ctx.restore();
    }
}
