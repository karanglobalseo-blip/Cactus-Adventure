// Audio.js - Sound effects and music management
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.enabled = true;
        this.volume = 0.7;
        this.musicVolume = 0.3;
        
        // Create audio context for better control
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
        
        this.initSounds();
    }
    
    initSounds() {
        // Create synthetic sounds using Web Audio API
        this.createSyntheticSounds();
        
        // Load any actual audio files if available
        this.loadAudioFiles();
    }
    
    createSyntheticSounds() {
        if (!this.audioContext) return;
        
        // Jump sound
        this.sounds.jump = () => this.playTone(220, 0.1, 'square');
        
        // Thorn throw sound
        this.sounds.thorn = () => this.playTone(440, 0.05, 'sawtooth');
        
        // Flower collect sound
        this.sounds.flower = () => this.playChord([523, 659, 784], 0.2);
        
        // Super flower sound
        this.sounds.superFlower = () => this.playChord([523, 659, 784, 1047], 0.3);
        
        // Friendship sound
        this.sounds.friendship = () => this.playChord([523, 659, 784], 0.3);
        
        // Tired sound
        this.sounds.tired = () => this.playTone(200, 0.2, 'sine');
        
        // Plant power sound
        this.sounds.plant = () => this.playTone(300, 0.4, 'sine');
        
        // Brick hit sound
        this.sounds.brick = () => this.playTone(200, 0.1, 'square');
        
        // Achievement sound
        this.sounds.achievement = () => this.playChord([523, 659, 784, 1047, 1319], 0.5);
        
        // Power-up collect sound
        this.sounds.powerup = () => this.playArpeggio([262, 330, 392, 523], 0.1);
        
        // New creature sounds
        this.sounds.creatureCall = () => this.playTone(300, 0.2, 'triangle');
        this.sounds.birdSong = () => this.playArpeggio([600, 700, 800], 0.1);
        this.sounds.gentleRumble = () => this.playTone(80, 0.4, 'sine');
        this.sounds.natureSound = () => this.playTone(200, 0.3, 'triangle');
        
        // Guardian sounds
        this.sounds.guardianAppear = () => this.playChord([200, 300, 400], 0.6);
        this.sounds.guardianFriendly = () => this.playArpeggio([400, 500, 600, 700, 800], 0.2);
        this.sounds.windWhisper = () => this.playTone(250, 0.5, 'sine');
        this.sounds.biomeTransition = () => this.playChord([500, 600, 700], 0.6);
    }
    
    loadAudioFiles() {
        // Placeholder for loading actual audio files
        // In a real game, you'd load .mp3/.wav files here
        const audioFiles = {
            // backgroundMusic: 'assets/audio/desert_theme.mp3',
            // windAmbient: 'assets/audio/desert_wind.mp3'
        };
        
        // Load files if they exist
        Object.entries(audioFiles).forEach(([name, src]) => {
            const audio = new Audio();
            audio.src = src;
            audio.volume = name.includes('Music') ? this.musicVolume : this.volume;
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = audio;
            });
            audio.addEventListener('error', () => {
                console.warn(`Could not load audio: ${src}`);
            });
        });
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playChord(frequencies, duration) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, duration * 0.8), index * 50);
        });
    }
    
    playArpeggio(frequencies, noteLength) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, noteLength), index * noteLength * 1000);
        });
    }
    
    play(soundName, options = {}) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (typeof sound === 'function') {
            sound();
        } else if (sound instanceof Audio) {
            sound.currentTime = 0;
            sound.volume = (options.volume || 1) * this.volume;
            sound.play().catch(e => console.warn('Audio play failed:', e));
        }
    }
    
    playMusic(musicName, loop = true) {
        if (!this.enabled) return;
        
        const music = this.sounds[musicName];
        if (music instanceof Audio) {
            music.loop = loop;
            music.volume = this.musicVolume;
            music.play().catch(e => console.warn('Music play failed:', e));
            this.music = music;
        }
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.music = null;
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    }
    
    // Resume audio context on user interaction (required by browsers)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Export for global use
window.AudioManager = AudioManager;
