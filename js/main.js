// Main.js - Game initialization and main entry point
let game;
let ui;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌵 Cactus Quest - Initializing...');
    
    try {
        // Create game instance
        game = new Game();
        
        // Create UI manager
        ui = new UI(game);
        
        // Set up additional event listeners
        setupAdditionalControls();
        
        // Set up resize handling for responsive design
        setupResizeHandler();
        
        // Enable debug mode with key combination
        setupDebugMode();
        
        console.log('🌵 Cactus Quest - Ready to play!');
        
    } catch (error) {
        console.error('Failed to initialize Cactus Quest:', error);
        showErrorMessage('Failed to load the game. Please refresh the page.');
    }
});

function setupAdditionalControls() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.code) {
            case 'KeyP':
                // Pause/unpause game
                if (game.state === 'playing') {
                    game.state = 'paused';
                    showPauseMenu();
                } else if (game.state === 'paused') {
                    game.state = 'playing';
                    hidePauseMenu();
                }
                e.preventDefault();
                break;
                
            case 'KeyR':
                // Restart game
                if (e.ctrlKey) {
                    location.reload();
                }
                break;
                
            case 'KeyM':
                // Toggle mute (placeholder for future audio)
                console.log('Mute toggled');
                break;
                
            case 'Escape':
                // Return to menu
                if (game.state === 'playing' || game.state === 'paused') {
                    game.resetGame();
                }
                e.preventDefault();
                break;
        }
    });
    
    // Prevent context menu on right click for better mobile experience
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Prevent default touch behaviors that might interfere with game
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // Handle visibility change (pause when tab is not active)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && game.state === 'playing') {
            game.state = 'paused';
            showPauseMenu();
        }
    });
}

function setupResizeHandler() {
    function handleResize() {
        // Adjust game canvas size for different screen sizes
        const container = document.getElementById('gameContainer');
        const canvas = document.getElementById('gameCanvas');
        
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.95;
        
        let scale = Math.min(maxWidth / 800, maxHeight / 600);
        scale = Math.min(scale, 1); // Don't scale up beyond original size
        
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'center center';
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
}

function setupDebugMode() {
    let debugKeySequence = [];
    const debugCode = ['KeyD', 'KeyE', 'KeyB', 'KeyU', 'KeyG'];
    
    document.addEventListener('keydown', function(e) {
        debugKeySequence.push(e.code);
        
        if (debugKeySequence.length > debugCode.length) {
            debugKeySequence.shift();
        }
        
        if (debugKeySequence.join(',') === debugCode.join(',')) {
            game.debug = !game.debug;
            console.log('Debug mode:', game.debug ? 'ON' : 'OFF');
            debugKeySequence = [];
        }
    });
}

function showPauseMenu() {
    const pauseDiv = document.createElement('div');
    pauseDiv.id = 'pauseMenu';
    pauseDiv.style.cssText = `
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
        z-index: 50;
        color: white;
        text-align: center;
    `;
    
    pauseDiv.innerHTML = `
        <h1 style="font-size: 36px; margin-bottom: 20px;">⏸️ Game Paused</h1>
        <p style="font-size: 18px; margin-bottom: 30px;">Press P to resume or ESC to return to menu</p>
        <div style="display: flex; gap: 20px;">
            <button onclick="resumeGame()" style="
                padding: 10px 20px;
                font-size: 16px;
                background: #27ae60;
                color: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
            ">Resume</button>
            <button onclick="game.resetGame()" style="
                padding: 10px 20px;
                font-size: 16px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
            ">Main Menu</button>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(pauseDiv);
}

function hidePauseMenu() {
    const pauseMenu = document.getElementById('pauseMenu');
    if (pauseMenu) {
        pauseMenu.remove();
    }
}

function resumeGame() {
    game.state = 'playing';
    hidePauseMenu();
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <h2>⚠️ Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            margin-top: 10px;
            padding: 10px 20px;
            background: white;
            color: #e74c3c;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        ">Reload Game</button>
    `;
    
    document.body.appendChild(errorDiv);
}

// Game event handlers for UI integration
function onPlayerHealthChanged(newHealth, oldHealth) {
    if (newHealth < oldHealth) {
        ui.showNotification('-1 Health', game.player.x, game.player.y - 20, '#ff0000');
        
        if (newHealth === 1) {
            ui.showHealthWarning();
        }
    }
}

function onFlowerCollected(flower, player) {
    const points = flower.type === 'special' ? 20 : 10;
    ui.showNotification(`+${points}`, flower.x, flower.y, '#00ff00');
    ui.showCollectionMessage(flower.type, points);
}

function onEnemyDefeated(enemy) {
    ui.showNotification('+10', enemy.x, enemy.y - 20, '#0099ff');
    ui.showEnemyDefeated();
}

function onStormWarning() {
    ui.showStormWarning();
}

function onShelterEntered() {
    ui.showShelterMessage();
}

// Mobile-specific optimizations
if ('ontouchstart' in window) {
    // Mobile device detected
    console.log('Mobile device detected - optimizing for touch');
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Optimize performance for mobile
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Disable image smoothing for better performance on mobile
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

// Service Worker registration for PWA capabilities (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when you have a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(function(registration) {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(function(registrationError) {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}

// Analytics and performance monitoring (placeholder)
function trackGameEvent(eventName, parameters = {}) {
    console.log('Game Event:', eventName, parameters);
    // Here you would integrate with analytics services like Google Analytics
}

// Export for debugging purposes
window.CactusQuest = {
    game: () => game,
    ui: () => ui,
    trackEvent: trackGameEvent
};
