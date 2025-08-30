/**
 * Notification Sound Utility
 * Handles playing notification sounds when new notifications are received
 */

export class NotificationSoundService {
  private static audioContext: AudioContext | null = null;
  private static isEnabled: boolean = true;

  /**
   * Initialize audio context (required for modern browsers)
   */
  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Create a simple notification beep sound using Web Audio API
   */
  static async playNotificationSound(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const audioContext = this.getAudioContext();
      
      // Resume audio context if suspended (required by Chrome)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create oscillator for the beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure the sound - pleasant notification tone
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800 Hz
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // Drop to 600 Hz
      
      // Set volume (gentle sound)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      // Play the sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Play a more elaborate sound for important notifications
   */
  static async playImportantNotificationSound(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const audioContext = this.getAudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create a two-tone notification sound
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playTone(800, now, 0.15);           // First beep
      playTone(1000, now + 0.2, 0.15);   // Second higher beep

    } catch (error) {
      console.warn('Could not play important notification sound:', error);
    }
  }

  /**
   * Enable/disable notification sounds
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('notificationSoundsEnabled', enabled.toString());
  }

  /**
   * Check if notification sounds are enabled
   */
  static isNotificationSoundEnabled(): boolean {
    const stored = localStorage.getItem('notificationSoundsEnabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  }

  /**
   * Initialize the service (call this on app startup)
   */
  static init(): void {
    this.isEnabled = this.isNotificationSoundEnabled();
  }
}