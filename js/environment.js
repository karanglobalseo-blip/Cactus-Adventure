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
        // Create shelter locations
        this.shelters = [
            {
                x: 400,
                y: this.game.height - 150,
                width: 100,
                height: 70,
                type: 'rock'
            },
            {
                x: 800,
                y: this.game.height - 140,
                width: 120,
                height: 60,
                type: 'oasis'
            },
            {
                x: 1200,
                y: this.game.height - 160,
                width: 80,
                height: 80,
                type: 'cave'
            }
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
                x: Math.random() * this.game.width * 2,
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
                x: Math.random() * this.game.width * 2,
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
                x: Math.random() * this.game.width * 2,
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
        ctx.fillRect(0, 0, this.game.width * 2, this.game.height * 0.7);
        
        // Ground
        const groundGradient = ctx.createLinearGradient(0, this.game.height * 0.7, 0, this.game.height);
        groundGradient.addColorStop(0, '#DAA520');
        groundGradient.addColorStop(1, '#CD853F');
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, this.game.height * 0.7, this.game.width * 2, this.game.height * 0.3);
        
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
            const x = (i * 200 + this.cloudOffset) % (this.game.width * 2 + 100) - 50;
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
            const x = (i * 150 + this.sandDuneOffset) % (this.game.width * 2 + 100) - 50;
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
        
        switch (shelter.type) {
            case 'rock':
                // Rock formation shelter
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.ellipse(
                    shelter.x + shelter.width / 2,
                    shelter.y + shelter.height,
                    shelter.width / 2,
                    shelter.height / 2,
                    0, Math.PI, 0
                );
                ctx.fill();
                
                // Add some texture
                ctx.fillStyle = '#778899';
                ctx.beginPath();
                ctx.ellipse(
                    shelter.x + shelter.width * 0.3,
                    shelter.y + shelter.height * 0.7,
                    shelter.width * 0.2,
                    shelter.height * 0.2,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                break;
                
            case 'oasis':
                // Oasis with palm tree
                ctx.fillStyle = '#4169E1';
                ctx.beginPath();
                ctx.ellipse(
                    shelter.x + shelter.width / 2,
                    shelter.y + shelter.height,
                    shelter.width * 0.4,
                    shelter.height * 0.3,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                
                // Palm tree trunk
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(
                    shelter.x + shelter.width * 0.7,
                    shelter.y,
                    8,
                    shelter.height
                );
                
                // Palm fronds
                ctx.strokeStyle = '#228B22';
                ctx.lineWidth = 4;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    ctx.beginPath();
                    ctx.moveTo(shelter.x + shelter.width * 0.7 + 4, shelter.y + 10);
                    ctx.lineTo(
                        shelter.x + shelter.width * 0.7 + 4 + Math.cos(angle) * 25,
                        shelter.y + 10 + Math.sin(angle) * 15
                    );
                    ctx.stroke();
                }
                break;
                
            case 'cave':
                // Cave entrance
                ctx.fillStyle = '#2F4F4F';
                ctx.beginPath();
                ctx.arc(
                    shelter.x + shelter.width / 2,
                    shelter.y + shelter.height,
                    shelter.width / 2,
                    Math.PI, 0
                );
                ctx.fill();
                
                // Cave interior (darker)
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(
                    shelter.x + shelter.width / 2,
                    shelter.y + shelter.height,
                    shelter.width * 0.3,
                    Math.PI, 0
                );
                ctx.fill();
                break;
        }
        
        // Shelter indicator
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.fillRect(shelter.x, shelter.y, shelter.width, shelter.height);
        
        // Shelter label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SHELTER', shelter.x + shelter.width / 2, shelter.y - 5);
        
        ctx.restore();
    }
    
    renderSandStorms(ctx) {
        this.sandStorms.forEach(storm => storm.render(ctx));
    }
}
