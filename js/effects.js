// Effects.js - Visual effects and screen shake system
class EffectsManager {
    constructor(game) {
        this.game = game;
        this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
        this.particles = [];
        this.trails = [];
    }
    
    update(deltaTime) {
        // Update screen shake
        if (this.screenShake.duration > 0) {
            this.screenShake.duration -= deltaTime;
            const intensity = this.screenShake.intensity * (this.screenShake.duration / 1000);
            this.screenShake.x = (Math.random() - 0.5) * intensity;
            this.screenShake.y = (Math.random() - 0.5) * intensity;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
        
        // Update particle trails
        this.trails.forEach(trail => {
            trail.life -= deltaTime * 0.001;
            trail.alpha = Math.max(0, trail.life);
        });
        this.trails = this.trails.filter(trail => trail.life > 0);
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
        this.screenShake.duration = Math.max(this.screenShake.duration, duration);
    }
    
    addPlayerTrail(player) {
        // Add movement trail for speed boost
        if (player.powerUpEffects.hasPowerUp('speed')) {
            this.trails.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                life: 1.0,
                alpha: 1.0,
                color: '#00ff00'
            });
        }
    }
    
    createExplosion(x, y, color, particleCount = 12) {
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 3 + Math.random() * 4;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02,
                size: 2 + Math.random() * 3,
                color: color
            });
        }
        this.particles.push(...particles);
        
        // Add screen shake for explosions
        this.addScreenShake(5, 200);
    }
    
    createSparkles(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                life: 1.0,
                decay: 0.015,
                size: 1 + Math.random() * 2,
                color: '#ffd700'
            });
        }
    }
    
    render(ctx) {
        // Apply screen shake
        if (this.screenShake.intensity > 0) {
            ctx.save();
            ctx.translate(this.screenShake.x, this.screenShake.y);
        }
        
        // Render particle trails
        this.trails.forEach(trail => {
            ctx.save();
            ctx.globalAlpha = trail.alpha * 0.6;
            ctx.fillStyle = trail.color;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Render effect particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;
        });
        
        // Remove dead particles
        this.particles = this.particles.filter(p => p.life > 0);
        
        if (this.screenShake.intensity > 0) {
            ctx.restore();
        }
    }
    
    // Bloom effect for super flowers
    renderBloom(ctx, x, y, radius, color) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

window.EffectsManager = EffectsManager;
