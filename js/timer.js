// Timer class to handle time tracking functionality
class Timer {
    constructor() {
        this.startTime = null;
        this.endTime = null;
        this.pausedTime = 0;
        this.pauseStartTime = null;
        this.interval = null;
        this.isRunning = false;
        this.isPaused = false;
        
        // DOM elements
        this.hoursElement = document.getElementById('hours');
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        this.startButton = document.getElementById('start-timer');
        this.pauseButton = document.getElementById('pause-timer');
        this.stopButton = document.getElementById('stop-timer');
        
        // Bind event handlers
        this.startButton.addEventListener('click', this.start.bind(this));
        this.pauseButton.addEventListener('click', this.pause.bind(this));
        this.stopButton.addEventListener('click', this.stop.bind(this));
    }
    
    // Start the timer
    start() {
        if (this.isRunning && !this.isPaused) return;
        
        if (this.isPaused) {
            // Resume from pause
            this.isPaused = false;
            this.pausedTime += (Date.now() - this.pauseStartTime);
            this.pauseStartTime = null;
        } else {
            // Start new timer
            this.startTime = Date.now();
            this.pausedTime = 0;
            this.isRunning = true;
        }
        
        // Update UI
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.stopButton.disabled = false;
        
        // Start interval to update display
        this.interval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }
    
    // Pause the timer
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        clearInterval(this.interval);
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        
        // Update UI
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
    }
    
    // Stop the timer and calculate duration
    stop() {
        if (!this.isRunning) return;
        
        clearInterval(this.interval);
        this.endTime = Date.now();
        
        // Calculate duration
        const duration = this.calculateDuration();
        
        // Create timer data object
        const timerData = {
            startTime: new Date(this.startTime),
            endTime: new Date(this.endTime),
            durationMs: duration,
            durationFormatted: this.formatDuration(duration)
        };
        
        // Dispatch event with timer data
        const event = new CustomEvent('timer-stopped', { 
            detail: timerData,
            bubbles: true 
        });
        document.dispatchEvent(event);
        
        // Reset timer state
        this.reset();
        
        // Return timer data
        return timerData;
    }
    
    // Reset timer state
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        
        // Update UI
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.stopButton.disabled = true;
        this.hoursElement.textContent = '00';
        this.minutesElement.textContent = '00';
        this.secondsElement.textContent = '00';
    }
    
    // Calculate duration in milliseconds, accounting for pauses
    calculateDuration() {
        if (!this.startTime) return 0;
        
        const end = this.endTime || Date.now();
        const totalTimeMs = end - this.startTime;
        const effectiveTimeMs = totalTimeMs - this.pausedTime;
        
        return effectiveTimeMs;
    }
    
    // Update the timer display
    updateDisplay() {
        const durationMs = this.calculateDuration();
        const seconds = Math.floor(durationMs / 1000) % 60;
        const minutes = Math.floor(durationMs / (1000 * 60)) % 60;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.hoursElement.textContent = hours.toString().padStart(2, '0');
    }
    
    // Format duration for display (HH:MM:SS)
    formatDuration(durationMs) {
        const seconds = Math.floor(durationMs / 1000) % 60;
        const minutes = Math.floor(durationMs / (1000 * 60)) % 60;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Get current elapsed time
    getCurrentElapsed() {
        if (!this.isRunning) return 0;
        return this.calculateDuration();
    }
    
    // Check if timer is currently active
    isActive() {
        return this.isRunning;
    }
}

// Create timer instance
const timer = new Timer();