// Environment.js - Desert environment and background elements
class Environment {
    constructor(game) {
        this.game = game;
        this.sandStorms = [];
        this.shelters = [];
        this.backgroundElements = [];
        
        // Sand storm timing
        this.nextStormTime = 15000; // First storm after 15 seconds
        this.stormTimer = 0;
        this.stormInterval = 20000; // 20 seconds between storms
        
        // Background animation
        this.cloudOffset = 0;
        this.sandDuneOffset = 0;
        
        this.generateShelters();
        this.generateBackgroundElements();
    }
    
    generateShelters() {
        // Create shelter locations as wooden shacks
        this.shelters = [
            { x: 420,  y: this.game.height - 160, width: 100, height: 80, type: 'shack' },
            { x: 950,  y: this.game.height - 155, width: 110, height: 75, type: 'shack' },
            { x: 1500, y: this.game.height - 165, width: 120, height: 85, type: 'shack' }
        ];
    }
    
    generateBackgroundElements() {
        // Generate distant mountains, cacti, rocks, etc.
        this.backgroundElements = [];
        
        // Distant mountains
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'mountain',
                x: i * 300 + Math.random() * 100,
                y: this.game.height - 200 - Math.random() * 100,
                width: 150 + Math.random() * 100,
                height: 100 + Math.random() * 50,
                color: `hsl(25, 40%, ${30 + Math.random() * 20}%)`
            });
        }
        
        // Background cacti
        for (let i = 0; i < 10; i++) {
            this.backgroundElements.push({
                type: 'cactus',
                x: Math.random() * this.game.worldWidth,
                y: this.game.height - 120 - Math.random() * 50,
                width: 20 + Math.random() * 15,
                height: 40 + Math.random() * 30,
                color: '#2F4F2F'
            });
        }
        
        // Rocks and debris
        for (let i = 0; i < 15; i++) {
            this.backgroundElements.push({
                type: 'rock',
                x: Math.random() * this.game.worldWidth,
                y: this.game.height - 100 - Math.random() * 20,
                width: 15 + Math.random() * 25,
                height: 10 + Math.random() * 15,
                color: `hsl(30, 30%, ${40 + Math.random() * 20}%)`
            });
        }
        
        // Desert plants
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'plant',
                x: Math.random() * this.game.worldWidth,
                y: this.game.height - 90 - Math.random() * 10,
                width: 10 + Math.random() * 10,
                height: 8 + Math.random() * 12,
                color: '#556B2F'
            });
        }
    }
    
    update(deltaTime) {
        // Update sand storm timer
        this.stormTimer += deltaTime;
        
        if (this.stormTimer >= this.nextStormTime) {
            this.createSandStorm();
            this.stormTimer = 0;
            this.nextStormTime = this.stormInterval + Math.random() * 10000; // Add randomness
        }
        
        // Update active sand storms
        this.sandStorms.forEach(storm => storm.update(deltaTime));
        this.sandStorms = this.sandStorms.filter(storm => storm.active);
        
        // Update background animations
        this.cloudOffset += 0.2;
        this.sandDuneOffset += 0.1;
        
        // Check shelter interactions
        this.checkShelterInteractions();
    }
    
    createSandStorm() {
        const stormWidth = 200 + Math.random() * 100;
        const stormHeight = this.game.height - 80;
        const startX = this.game.width + 100; // Start off-screen right
        
        this.sandStorms.push(new SandStorm(startX, 0, stormWidth, stormHeight, this.game));
        
        // Show warning message
        this.showStormWarning();
    }
    
    showStormWarning() {
        // This could trigger UI alerts or sound effects
        console.log("Sand storm approaching!");
    }
    
    checkShelterInteractions() {
        const player = this.game.player;
        
        this.shelters.forEach(shelter => {
            if (this.checkCollision(player, shelter)) {
                // Player is in shelter - provide protection and healing
                if (player.health < player.maxHealth) {
                    // Slow healing in shelter
                    if (Math.random() < 0.01) { // 1% chance per frame
                        player.health = Math.min(player.health + 1, player.maxHealth);
                    }
                }
                
                // Restore thorns slowly
                if (player.thorns < player.maxThorns && Math.random() < 0.005) {
                    player.thorns++;
                }
            }
        });
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    render(ctx) {
        this.renderBackground(ctx);
        this.renderShelters(ctx);
        this.renderSandStorms(ctx);
    }
    
    renderBackground(ctx) {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.game.height * 0.7);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.7, '#F4D03F');
        skyGradient.addColorStop(1, '#DAA520');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.game.worldWidth, this.game.height * 0.7);
        
        // Ground
        const groundGradient = ctx.createLinearGradient(0, this.game.height * 0.7, 0, this.game.height);
        groundGradient.addColorStop(0, '#DAA520');
        groundGradient.addColorStop(1, '#CD853F');
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, this.game.height * 0.7, this.game.worldWidth, this.game.height * 0.3);
        
        // Clouds
        this.renderClouds(ctx);
        
        // Sand dunes
        this.renderSandDunes(ctx);
        
        // Background elements
        this.renderBackgroundElements(ctx);
        
        // Sun
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.game.width * 0.8, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun rays
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const rayLength = 60;
            
            ctx.beginPath();
            ctx.moveTo(
                this.game.width * 0.8 + Math.cos(angle) * 45,
                80 + Math.sin(angle) * 45
            );
            ctx.lineTo(
                this.game.width * 0.8 + Math.cos(angle) * (45 + rayLength),
                80 + Math.sin(angle) * (45 + rayLength)
            );
            ctx.stroke();
        }
    }
    
    renderClouds(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Animated clouds
        for (let i = 0; i < 4; i++) {
            const x = (i * 200 + this.cloudOffset) % (this.game.worldWidth + 100) - 50;
            const y = 60 + i * 20;
            
            // Cloud shape made of circles
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
            ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
            ctx.arc(x + 25, y - 15, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderSandDunes(ctx) {
        ctx.fillStyle = '#F4A460';
        
        // Animated sand dunes in background
        for (let i = 0; i < 6; i++) {
            const x = (i * 150 + this.sandDuneOffset) % (this.game.worldWidth + 100) - 50;
            const y = this.game.height - 150;
            const width = 100 + Math.sin(i) * 20;
            const height = 30 + Math.cos(i) * 10;
            
            ctx.beginPath();
            ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderBackgroundElements(ctx) {
        this.backgroundElements.forEach(element => {
            ctx.fillStyle = element.color;
            
            switch (element.type) {
                case 'mountain':
                    // Draw triangular mountain
                    ctx.beginPath();
                    ctx.moveTo(element.x, element.y + element.height);
                    ctx.lineTo(element.x + element.width / 2, element.y);
                    ctx.lineTo(element.x + element.width, element.y + element.height);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'cactus':
                    // Simple background cactus
                    ctx.fillRect(
                        element.x + element.width * 0.3,
                        element.y,
                        element.width * 0.4,
                        element.height
                    );
                    
                    // Arms if large enough
                    if (element.width > 25) {
                        ctx.fillRect(
                            element.x,
                            element.y + element.height * 0.3,
                            element.width * 0.3,
                            element.height * 0.3
                        );
                        ctx.fillRect(
                            element.x + element.width * 0.7,
                            element.y + element.height * 0.3,
                            element.width * 0.3,
                            element.height * 0.3
                        );
                    }
                    break;
                    
                case 'rock':
                    // Irregular rock shape
                    ctx.beginPath();
                    ctx.ellipse(
                        element.x + element.width / 2,
                        element.y + element.height / 2,
                        element.width / 2,
                        element.height / 2,
                        0, 0, Math.PI * 2
                    );
                    ctx.fill();
                    break;
                    
                case 'plant':
                    // Small desert plant
                    ctx.fillRect(element.x, element.y, element.width, element.height);
                    
                    // Add some spiky details
                    ctx.strokeStyle = element.color;
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(element.x + i * element.width / 3, element.y);
                        ctx.lineTo(element.x + i * element.width / 3 - 2, element.y - 3);
                        ctx.stroke();
                    }
                    break;
            }
        });
    }
    
    renderShelters(ctx) {
        this.shelters.forEach(shelter => {
            this.renderShelter(ctx, shelter);
        });
    }
    
    renderShelter(ctx, shelter) {
        ctx.save();
        // Wooden shack: base rectangle, roof, door, planks
        if (shelter.type === 'shack') {
            // Base
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(shelter.x, shelter.y, shelter.width, shelter.height);

            // Plank lines
            ctx.strokeStyle = '#5A2E0C';
            ctx.lineWidth = 2;
            for (let i = 1; i < 5; i++) {
                const px = shelter.x + (i * shelter.width / 5);
                ctx.beginPath();
                ctx.moveTo(px, shelter.y);
                ctx.lineTo(px, shelter.y + shelter.height);
                ctx.stroke();
            }

            // Roof
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.moveTo(shelter.x - 10, shelter.y);
            ctx.lineTo(shelter.x + shelter.width / 2, shelter.y - shelter.height * 0.4);
            ctx.lineTo(shelter.x + shelter.width + 10, shelter.y);
            ctx.closePath();
            ctx.fill();

            // Door
            ctx.fillStyle = '#3E1F0C';
            const doorW = shelter.width * 0.25;
            const doorH = shelter.height * 0.55;
            ctx.fillRect(
                shelter.x + shelter.width * 0.1,
                shelter.y + shelter.height - doorH,
                doorW,
                doorH
            );

            // Window
            ctx.fillStyle = '#C0D6E4';
            const winW = shelter.width * 0.22;
            const winH = shelter.height * 0.3;
            ctx.fillRect(
                shelter.x + shelter.width * 0.6,
                shelter.y + shelter.height * 0.25,
                winW,
                winH
            );
            ctx.strokeStyle = '#5A2E0C';
            ctx.strokeRect(
                shelter.x + shelter.width * 0.6,
                shelter.y + shelter.height * 0.25,
                winW,
                winH
            );
        }
        ctx.restore();
    }
    
    renderSandStorms(ctx) {
        this.sandStorms.forEach(storm => storm.render(ctx));
    }
}
