# 🌵 Cactus Quest

A 2D mobile adventure game starring a heroic cactus navigating a desert to find flowers for food while evading desert camels and sand storms.

## 🎮 Game Overview

**Cactus Quest** is a cute, lighthearted 2D adventure game where players control a brave cactus trying to survive in the harsh desert environment. The goal is to collect flowers to grow stronger while avoiding dangerous camels and weathering sand storms using strategic abilities.

## 🎯 Gameplay Features

### Player Character (Cactus)
- **Health System**: 3 lives with visual health bar
- **Growth Mechanics**: Grows larger when eating flowers
- **Thorn Throwing**: Limited projectiles to defeat enemies
- **Plant Ability**: Root down to resist sand storm damage
- **Size Progression**: Small → Medium → Large with different abilities

### Enemies & Hazards
- **Desert Camels**: Patrol and chase the player, can be defeated with thorns
- **Sand Storms**: Periodic environmental hazards that damage unprotected cacti
- **Dynamic AI**: Enemies switch between patrol and chase behaviors

### Environment
- **Desert Setting**: Animated sand dunes, mountains, and background elements
- **Shelter System**: Rock formations, oases, and caves provide healing
- **Weather System**: Sand storms with warning indicators
- **Collectibles**: Normal and special flowers for growth and points

## 🎮 Controls

### Keyboard Controls
- **Arrow Keys / WASD**: Move left/right, jump
- **X**: Throw thorn
- **Z**: Plant/unplant (resist sand storms)
- **P**: Pause game
- **ESC**: Return to main menu

### Mobile Touch Controls
- **← →**: Move left/right
- **↑**: Jump
- **🌵**: Throw thorn
- **🌱**: Plant ability

## 🚀 Getting Started

### Prerequisites
- Modern web browser with HTML5 Canvas support
- No additional dependencies required

### Installation
1. Clone or download the project files
2. Open `index.html` in a web browser
3. Click "Start Adventure" to begin playing

### File Structure
```
CactusQuest/
├── index.html          # Main game page
├── js/
│   ├── game.js         # Core game engine
│   ├── player.js       # Player character logic
│   ├── enemies.js      # Enemy AI and behaviors
│   ├── environment.js  # World environment and effects
│   ├── ui.js          # User interface management
│   └── main.js        # Game initialization
└── README.md          # This file
```

## 🎨 Art Style

The game features a **cute, cartoonish art style** with:
- Bright, vibrant colors
- Simple geometric shapes
- Smooth animations
- Desert-themed color palette (browns, yellows, greens)
- Friendly character designs

## 🎯 Game Objectives

### Primary Goals
- Survive as long as possible in the desert
- Collect flowers to grow and increase your score
- Avoid or defeat camel enemies
- Weather sand storms using the plant ability
- Find shelter to heal and restore resources

### Scoring System
- Normal flowers: +10 points
- Special flowers: +20 points
- Defeated camels: +10 points
- Survival time bonus

## 🔧 Technical Details

### Technologies Used
- **HTML5 Canvas** for 2D graphics rendering
- **JavaScript ES6+** for game logic
- **CSS3** for UI styling and animations
- **Responsive Design** for mobile compatibility

### Performance Features
- Efficient particle system for visual effects
- Optimized collision detection
- Mobile-friendly touch controls
- Smooth 60 FPS gameplay

## 🎮 Game Mechanics Deep Dive

### Health & Growth System
- Start with 3 health points
- Taking damage shrinks the cactus and reduces health
- Eating flowers increases size and restores some resources
- Larger cacti are slower but more resilient

### Combat System
- Limited thorn ammunition (starts with 5)
- Thorns can defeat camels temporarily
- Flowers restore thorn count
- Strategic resource management required

### Environmental Challenges
- Sand storms occur periodically with warnings
- Planting provides immunity but prevents movement
- Shelters offer healing and resource restoration
- Dynamic weather creates strategic decisions

## 🚀 Future Enhancements

### Planned Features
- Multiple levels with increasing difficulty
- Power-ups and special abilities
- Achievement system
- Leaderboards and score sharing
- Sound effects and background music
- Additional enemy types
- Boss battles
- Customizable cactus skins

### Mobile App Conversion
- Cordova/PhoneGap packaging for iOS/Android
- Progressive Web App (PWA) capabilities
- Touch gesture improvements
- Device-specific optimizations

## 🎯 Development Roadmap

### Phase 1: MVP (Current)
- ✅ Core gameplay mechanics
- ✅ Single level design
- ✅ Basic enemy AI
- ✅ Environmental hazards
- ✅ Touch controls

### Phase 2: Enhancement
- 🔄 Sound and music integration
- 🔄 Additional levels
- 🔄 Power-up system
- 🔄 Achievement tracking

### Phase 3: Polish
- 📋 Advanced animations
- 📋 Particle effects enhancement
- 📋 UI/UX improvements
- 📋 Performance optimizations

## 🐛 Known Issues & Limitations

- Audio system not yet implemented
- Single level only (MVP version)
- Limited enemy variety
- No persistent save system
- Basic particle effects

## 🤝 Contributing

This is an MVP (Minimum Viable Product) version designed for testing and feedback. Contributions and suggestions are welcome!

## 📱 Mobile Compatibility

The game is designed with mobile-first principles:
- Touch-friendly controls
- Responsive layout
- Optimized performance for mobile devices
- Portrait and landscape orientation support

## 🎮 Tips for Players

1. **Resource Management**: Don't waste thorns - aim carefully!
2. **Timing**: Use the plant ability strategically during sand storms
3. **Exploration**: Find shelters to heal and restore resources
4. **Growth Strategy**: Prioritize special flowers for faster growth
5. **Positioning**: Stay mobile to avoid camel attacks

## 📊 Success Metrics

The game tracks several metrics for evaluation:
- Player retention during the level
- Engagement with core mechanics
- User feedback on difficulty balance
- Art style reception
- Mobile usability

## 🏆 Credits

**Cactus Quest** - A 2D Mobile Adventure Game
- Game Design & Development: AI Assistant
- Art Style: Programmatic 2D Canvas Graphics
- Target Platform: Mobile (iOS/Android via web)

---

**Have fun surviving the desert! 🌵🏜️**
