// UI.js - User interface management and HUD elements
class UI {
    constructor(game) {
        this.game = game;
        this.notifications = [];
        this.alerts = [];
        
        // UI elements
        this.healthBar = document.getElementById('healthBar');
        this.thornCount = document.getElementById('thornCount');
        this.cactusSize = document.getElementById('cactusSize');
        
        // Alert system
        this.alertContainer = null;
        this.createAlertContainer();
        
        // Tutorial system
        this.tutorialStep = 0;
        this.showTutorial = true;
        this.tutorialMessages = [
            "Welcome to Cactus Quest! Use arrow keys or buttons to move.",
            "Press SPACE or ↑ to jump. Collect pink flowers to grow!",
            "Press X or 🌵 to throw thorns at camels.",
            "Press Z or 🌱 to plant yourself and resist sand storms!",
            "Find shelter to heal and restore thorns. Good luck!"
        ];
    }
    
    createAlertContainer() {
        this.alertContainer = document.createElement('div');
        this.alertContainer.id = 'alertContainer';
        this.alertContainer.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            pointer-events: none;
        `;
        document.getElementById('gameContainer').appendChild(this.alertContainer);
    }
    
    update(deltaTime) {
        // Update notifications
        this.notifications.forEach(notification => {
            notification.timer -= deltaTime;
            notification.y -= 0.5; // Float upward
            notification.opacity = Math.max(0, notification.timer / notification.maxTime);
        });
        
        this.notifications = this.notifications.filter(n => n.timer > 0);
        
        // Update alerts
        this.alerts.forEach(alert => {
            alert.timer -= deltaTime;
        });
        
        this.alerts = this.alerts.filter(a => a.timer > 0);
        
        // Update UI elements
        this.updateHealthDisplay();
        this.updateResourceDisplay();
        this.updateAlerts();
        
        // Show tutorial if needed
        if (this.showTutorial && this.game.state === 'playing') {
            this.updateTutorial(deltaTime);
        }
    }
    
    updateHealthDisplay() {
        const hearts = this.healthBar.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            if (index < this.game.player.health) {
                heart.style.opacity = '1';
                heart.style.transform = 'scale(1)';
            } else {
                heart.style.opacity = '0.3';
                heart.style.transform = 'scale(0.8)';
            }
        });
        
        // Add pulse effect when low health
        if (this.game.player.health === 1) {
            const activeHeart = hearts[0];
            if (activeHeart) {
                activeHeart.style.animation = 'pulse 0.5s infinite alternate';
            }
        } else {
            hearts.forEach(heart => {
                heart.style.animation = '';
            });
        }
    }
    
    updateResourceDisplay() {
        // Update thorn count
        this.thornCount.textContent = this.game.player.thorns;
        
        // Update size display
        const sizeNames = ['Small', 'Medium', 'Large'];
        this.cactusSize.textContent = sizeNames[this.game.player.size - 1] || 'Small';
        
        // Add visual feedback for low resources
        if (this.game.player.thorns === 0) {
            this.thornCount.style.color = '#e74c3c';
            this.thornCount.style.fontWeight = 'bold';
        } else {
            this.thornCount.style.color = '#2c3e50';
            this.thornCount.style.fontWeight = 'normal';
        }
    }
    
    updateAlerts() {
        // Clear existing alerts
        this.alertContainer.innerHTML = '';
        
        // Display active alerts
        this.alerts.forEach((alert, index) => {
            const alertElement = document.createElement('div');
            alertElement.style.cssText = `
                background: ${alert.color};
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                margin-bottom: 10px;
                font-weight: bold;
                font-size: 16px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                opacity: ${Math.min(1, alert.timer / 1000)};
                transform: translateY(${index * 60}px);
                animation: ${alert.animation || 'none'};
            `;
            alertElement.textContent = alert.message;
            this.alertContainer.appendChild(alertElement);
        });
    }
    
    updateTutorial(deltaTime) {
        // Simple tutorial system - could be expanded
        if (this.tutorialStep < this.tutorialMessages.length) {
            // Show tutorial message based on game events
            // This is a simplified version - in a full game you'd track specific actions
        }
    }
    
    showNotification(message, x, y, color = '#ffffff') {
        this.notifications.push({
            message: message,
            x: x,
            y: y,
            color: color,
            timer: 2000,
            maxTime: 2000,
            opacity: 1
        });
    }
    
    showAlert(message, color = 'rgba(255, 0, 0, 0.9)', duration = 3000, animation = '') {
        this.alerts.push({
            message: message,
            color: color,
            timer: duration,
            animation: animation
        });
    }
    
    showStormWarning() {
        this.showAlert(
            '⚠️ SAND STORM APPROACHING! ⚠️', 
            'rgba(255, 165, 0, 0.9)', 
            3000,
            'pulse 0.5s infinite'
        );
    }
    
    showHealthWarning() {
        this.showAlert(
            '❤️ LOW HEALTH! Find shelter to heal!', 
            'rgba(255, 0, 0, 0.9)', 
            2000,
            'shake 0.2s infinite'
        );
    }
    
    showCollectionMessage(type, points) {
        const messages = {
            'normal': `+${points} Flower collected!`,
            'super': `+${points} Super flower! Size increased!`
        };
        
        this.showAlert(
            messages[type] || messages['normal'],
            'rgba(0, 255, 0, 0.9)',
            1500
        );
    }
    
    showEnemyDefeated() {
        this.showAlert(
            '🌵 Camel defeated! +10 points',
            'rgba(0, 150, 255, 0.9)',
            1500
        );
    }
    
    showShelterMessage() {
        this.showAlert(
            '🏠 Safe in shelter! Healing...',
            'rgba(0, 255, 0, 0.9)',
            2000
        );
    }
    
    showGameOver(reason) {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
            color: white;
            text-align: center;
        `;
        
        gameOverDiv.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #e74c3c;">Game Over</h1>
            <p style="font-size: 24px; margin-bottom: 30px;">${reason}</p>
            <p style="font-size: 18px; margin-bottom: 20px;">Score: ${this.game.score}</p>
            <button onclick="location.reload()" style="
                padding: 15px 30px;
                font-size: 20px;
                background: #27ae60;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            ">Play Again</button>
        `;
        
        document.getElementById('gameContainer').appendChild(gameOverDiv);
    }
    
    showLevelComplete() {
        const completeDiv = document.createElement('div');
        completeDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 100;
            color: white;
            text-align: center;
        `;
        
        completeDiv.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; color: #f39c12;">🌵 Level Complete! 🌵</h1>
            <p style="font-size: 24px; margin-bottom: 30px;">Your cactus has survived the desert!</p>
            <p style="font-size: 18px; margin-bottom: 20px;">Final Score: ${this.game.score}</p>
            <button onclick="location.reload()" style="
                padding: 15px 30px;
                font-size: 20px;
                background: #27ae60;
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            ">Play Again</button>
        `;
        
        document.getElementById('gameContainer').appendChild(completeDiv);
    }
    
    // Settings overlay listing key bindings and touch hints
    showSettings() {
        const existing = document.getElementById('settingsOverlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'settingsOverlay';
        overlay.style.cssText = `
            position: absolute; inset: 0; background: rgba(0,0,0,0.75);
            display:flex; align-items:center; justify-content:center; z-index:120; color:#fff;`;
        const panel = document.createElement('div');
        panel.style.cssText = `background:#111827; padding:24px; border-radius:12px; width:min(560px,90%);
            font-family: system-ui, Arial, sans-serif; line-height:1.6;`;
        panel.innerHTML = `
            <h2 style="margin-top:0;">Settings & Controls</h2>
            <div>
                <strong>Move</strong>: Arrow Left/Right or A/D (mobile: hold left/right half of screen)
                <br>
                <strong>Jump</strong>: Arrow Up or W (mobile: swipe up)
                <br>
                <strong>Throw Thorn</strong>: Space or X (mobile: 🌵 button)
                <br>
                <strong>Plant Power</strong>: Ctrl or Z (mobile: 🌱 button)
                <br>
                <strong>Pause</strong>: Esc
            </div>
            <div style="margin-top:16px; display:flex; justify-content:flex-end; gap:8px;">
                <button id="closeSettingsBtn" style="padding:8px 14px; border:none; border-radius:8px;">Close</button>
            </div>`;
        overlay.appendChild(panel);
        document.getElementById('gameContainer').appendChild(overlay);
        panel.querySelector('#closeSettingsBtn').addEventListener('click', () => overlay.remove());
    }

    // Pause overlay with resume/restart and top 3 scores (from localStorage)
    showPauseMenu(score, top3 = []) {
        const existing = document.getElementById('pauseOverlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.id = 'pauseOverlay';
        overlay.style.cssText = `
            position:absolute; inset:0; background: rgba(0,0,0,0.7);
            display:flex; align-items:center; justify-content:center; z-index:130; color:#fff;`;
        const panel = document.createElement('div');
        panel.style.cssText = `background:#0b1220; padding:24px; border-radius:12px; width:min(520px,90%);
            font-family: system-ui, Arial, sans-serif;`;
        const list = (top3 || []).slice(0,3).map((s,i)=>`<div>#${i+1}: ${s}</div>`).join('') || '<div>No scores yet</div>';
        panel.innerHTML = `
            <h2 style="margin-top:0;">Paused</h2>
            <div style="opacity:0.9; margin-bottom:10px;">Score: ${score}</div>
            <div style="background:#111827; padding:12px; border-radius:8px; margin-bottom:12px;">
                <div style="font-weight:600; margin-bottom:6px;">Top 3 Scores</div>
                ${list}
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button id="resumeBtn" style="padding:10px 16px; border:none; border-radius:8px; background:#10b981; color:#fff;">Resume</button>
                <button id="restartBtn" style="padding:10px 16px; border:none; border-radius:8px; background:#3b82f6; color:#fff;">Restart</button>
            </div>`;
        overlay.appendChild(panel);
        document.getElementById('gameContainer').appendChild(overlay);
        panel.querySelector('#resumeBtn').addEventListener('click', () => {
            this.game.resumeGame();
            overlay.remove();
        });
        panel.querySelector('#restartBtn').addEventListener('click', () => {
            try { this.game.recordScore(this.game.score); } catch(_) {}
            location.reload();
        });
    }

    hidePauseMenu() {
        const el = document.getElementById('pauseOverlay');
        if (el) el.remove();
    }
    
    render(ctx) {
        // Render floating notifications
        this.notifications.forEach(notification => {
            ctx.save();
            ctx.globalAlpha = notification.opacity;
            ctx.fillStyle = notification.color;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            
            // Outline text for better visibility
            ctx.strokeText(notification.message, notification.x, notification.y);
            ctx.fillText(notification.message, notification.x, notification.y);
            
            ctx.restore();
        });
        
        // Render debug info if needed
        if (this.game.debug) {
            this.renderDebugInfo(ctx);
        }
    }
    
    renderDebugInfo(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 120);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${Math.round(1000 / this.game.deltaTime)}`,
            `Player: (${Math.round(this.game.player.x)}, ${Math.round(this.game.player.y)})`,
            `Health: ${this.game.player.health}/${this.game.player.maxHealth}`,
            `Thorns: ${this.game.player.thorns}`,
            `Size: ${this.game.player.size}`,
            `Enemies: ${this.game.enemies.filter(e => e.active).length}`,
            `Storms: ${this.game.environment.sandStorms.length}`,
            `Score: ${this.game.score}`
        ];
        
        debugInfo.forEach((line, index) => {
            ctx.fillText(line, 15, 25 + index * 12);
        });
        
        ctx.restore();
    }
}

// Add CSS animations for UI effects
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        100% { transform: scale(1.1); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
    }
    
    .heart {
        transition: all 0.2s ease;
    }
    
    .ui-element {
        transition: all 0.3s ease;
    }
    
    .control-btn {
        transition: all 0.1s ease;
    }
`;
document.head.appendChild(style);
