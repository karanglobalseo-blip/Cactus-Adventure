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
        this.patrolDistance = 200;
        this.startX = x;
        this.chaseRange = 150;
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
        if (this.x < 0) {
            this.x = 0;
            this.direction = 1;
            this.facingRight = true;
        }
        if (this.x + this.width > this.game.width * 2) {
            this.x = this.game.width * 2 - this.width;
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
            ctx.globalAlpha = this.opacity;
            
            // Storm background
            const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
            gradient.addColorStop(0, 'rgba(139, 69, 19, 0.8)');
            gradient.addColorStop(0.5, 'rgba(160, 82, 45, 0.9)');
            gradient.addColorStop(1, 'rgba(139, 69, 19, 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw particles
            this.particles.forEach(particle => {
                ctx.fillStyle = `rgba(139, 69, 19, ${0.8 - particle.life * 0.3})`;
                ctx.beginPath();
                ctx.arc(
                    this.x + particle.x,
                    this.y + particle.y,
                    particle.size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            });
        }
        
        ctx.restore();
    }
}
