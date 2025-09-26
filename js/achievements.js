// Achievements.js - Achievement system with progress tracking
class AchievementManager {
    constructor(game) {
        this.game = game;
        this.achievements = new Map();
        this.progress = new Map();
        this.unlockedQueue = [];
        
        this.initAchievements();
        this.loadProgress();
    }
    
    initAchievements() {
        const achievements = [
            // Distance achievements
            { id: 'explorer', name: 'Desert Explorer', description: 'Travel 5000 pixels', target: 5000, icon: '🗺️', type: 'distance' },
            { id: 'nomad', name: 'Desert Nomad', description: 'Travel 15000 pixels', target: 15000, icon: '🏃', type: 'distance' },
            { id: 'wanderer', name: 'Eternal Wanderer', description: 'Travel 50000 pixels', target: 50000, icon: '🌟', type: 'distance' },
            
            // Combat achievements
            { id: 'marksman', name: 'Thorn Marksman', description: 'Hit 50 enemies with thorns', target: 50, icon: '🎯', type: 'enemiesHit' },
            { id: 'warrior', name: 'Desert Warrior', description: 'Hit 200 enemies with thorns', target: 200, icon: '⚔️', type: 'enemiesHit' },
            { id: 'legend', name: 'Cactus Legend', description: 'Hit 500 enemies with thorns', target: 500, icon: '👑', type: 'enemiesHit' },
            
            // Collection achievements
            { id: 'collector', name: 'Flower Collector', description: 'Collect 100 flowers', target: 100, icon: '🌸', type: 'flowersCollected' },
            { id: 'gardener', name: 'Desert Gardener', description: 'Collect 500 flowers', target: 500, icon: '🌺', type: 'flowersCollected' },
            { id: 'botanist', name: 'Master Botanist', description: 'Collect 1000 flowers', target: 1000, icon: '🌻', type: 'flowersCollected' },
            
            // Survival achievements
            { id: 'survivor', name: 'Storm Survivor', description: 'Survive 10 sand storms', target: 10, icon: '🌪️', type: 'stormsWeathered' },
            { id: 'stormmaster', name: 'Storm Master', description: 'Survive 50 sand storms', target: 50, icon: '⛈️', type: 'stormsWeathered' },
            
            // Special achievements
            { id: 'untouchable', name: 'Untouchable', description: 'Travel 2000 pixels without taking damage', target: 2000, icon: '👻', type: 'noDamageDistance' },
            { id: 'poweruser', name: 'Power User', description: 'Collect 25 power-ups', target: 25, icon: '⚡', type: 'powerupsCollected' },
            { id: 'brickbreaker', name: 'Brick Breaker', description: 'Hit 100 bricks', target: 100, icon: '🧱', type: 'bricksHit' },
            { id: 'jumper', name: 'High Jumper', description: 'Jump 1000 times', target: 1000, icon: '🦘', type: 'jumps' },
            { id: 'planter', name: 'Master Planter', description: 'Use plant power 100 times', target: 100, icon: '🌱', type: 'plantsUsed' },
            
            // Score achievements
            { id: 'scorer', name: 'Point Scorer', description: 'Reach 5000 points', target: 5000, icon: '💯', type: 'score' },
            { id: 'champion', name: 'Desert Champion', description: 'Reach 20000 points', target: 20000, icon: '🏆', type: 'score' },
            
            // Growth achievements
            { id: 'grower', name: 'Growing Strong', description: 'Reach maximum size', target: 3, icon: '📏', type: 'maxSize' },
            { id: 'superflower', name: 'Super Collector', description: 'Collect 50 super flowers', target: 50, icon: '🌟', type: 'superFlowersCollected' }
        ];
        
        achievements.forEach(ach => {
            this.achievements.set(ach.id, {
                ...ach,
                unlocked: false,
                progress: 0,
                unlockedAt: null
            });
        });
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('cq_achievements');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(item => {
                    if (this.achievements.has(item.id)) {
                        const ach = this.achievements.get(item.id);
                        ach.unlocked = item.unlocked;
                        ach.progress = item.progress;
                        ach.unlockedAt = item.unlockedAt;
                    }
                });
            }
            
            const savedProgress = localStorage.getItem('cq_progress');
            if (savedProgress) {
                const progressData = JSON.parse(savedProgress);
                Object.entries(progressData).forEach(([key, value]) => {
                    this.progress.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load achievement progress:', e);
        }
    }
    
    saveProgress() {
        try {
            const achievementData = Array.from(this.achievements.values()).map(ach => ({
                id: ach.id,
                unlocked: ach.unlocked,
                progress: ach.progress,
                unlockedAt: ach.unlockedAt
            }));
            localStorage.setItem('cq_achievements', JSON.stringify(achievementData));
            
            const progressData = Object.fromEntries(this.progress);
            localStorage.setItem('cq_progress', JSON.stringify(progressData));
        } catch (e) {
            console.warn('Failed to save achievement progress:', e);
        }
    }
    
    increment(type, amount = 1) {
        const current = this.progress.get(type) || 0;
        this.progress.set(type, current + amount);
        
        // Check for newly unlocked achievements
        this.checkAchievements(type);
        this.saveProgress();
    }
    
    set(type, value) {
        this.progress.set(type, value);
        this.checkAchievements(type);
        this.saveProgress();
    }
    
    checkAchievements(type) {
        this.achievements.forEach(achievement => {
            if (achievement.unlocked || achievement.type !== type) return;
            
            const currentProgress = this.progress.get(type) || 0;
            achievement.progress = currentProgress;
            
            if (currentProgress >= achievement.target) {
                this.unlockAchievement(achievement.id);
            }
        });
    }
    
    unlockAchievement(id) {
        const achievement = this.achievements.get(id);
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        achievement.progress = achievement.target;
        
        this.unlockedQueue.push(achievement);
        
        // Play achievement sound
        if (this.game.audioManager) {
            this.game.audioManager.play('achievement');
        }
        
        // Show notification
        if (this.game.ui) {
            this.game.ui.showAchievementUnlocked(achievement);
        }
        
        this.saveProgress();
    }
    
    getProgress(type) {
        return this.progress.get(type) || 0;
    }
    
    getAchievement(id) {
        return this.achievements.get(id);
    }
    
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }
    
    getUnlockedAchievements() {
        return Array.from(this.achievements.values()).filter(ach => ach.unlocked);
    }
    
    getUnlockedCount() {
        return this.getUnlockedAchievements().length;
    }
    
    getTotalCount() {
        return this.achievements.size;
    }
    
    getCompletionPercentage() {
        return Math.round((this.getUnlockedCount() / this.getTotalCount()) * 100);
    }
    
    // Update method to track various game events
    update(deltaTime) {
        const player = this.game.player;
        
        // Track distance
        this.increment('distance', Math.abs(player.vx) * deltaTime * 0.1);
        
        // Track no damage distance
        if (player.invulnerabilityTimer <= 0) {
            this.increment('noDamageDistance', Math.abs(player.vx) * deltaTime * 0.1);
        } else {
            this.progress.set('noDamageDistance', 0); // Reset on damage
        }
        
        // Track current score
        this.set('score', this.game.score);
        
        // Track max size reached
        this.set('maxSize', player.size);
    }
    
    // Methods to be called by game events
    onFlowerCollected(type) {
        this.increment('flowersCollected');
        if (type === 'super') {
            this.increment('superFlowersCollected');
        }
    }
    
    onEnemyHit() {
        this.increment('enemiesHit');
    }
    
    onStormWeathered() {
        this.increment('stormsWeathered');
    }
    
    onBrickHit() {
        this.increment('bricksHit');
    }
    
    onJump() {
        this.increment('jumps');
    }
    
    onPlantUsed() {
        this.increment('plantsUsed');
    }
    
    onPowerUpCollected() {
        this.increment('powerupsCollected');
    }
}

window.AchievementManager = AchievementManager;
