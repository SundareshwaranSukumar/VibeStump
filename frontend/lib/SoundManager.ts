'use client';

class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    try {
      this.sounds.wicket = new Audio('/sounds/wicket.mp3');
      this.sounds.boundary = new Audio('/sounds/boundary.mp3');
      this.sounds.six = new Audio('/sounds/six.mp3');
      // Set volume for subtlety
      Object.values(this.sounds).forEach(s => { s.volume = 0.4; });
      this.initialized = true;
    } catch (e) {
      console.warn('[SoundManager] Init failed', e);
    }
  }

  public play(event: 'wicket' | 'boundary' | 'six') {
    if (!this.initialized) return;
    const sound = this.sounds[event];
    if (!sound) return;
    try {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    } catch {
      // Silently fail if audio blocked
    }
  }
}

export const soundManager = new SoundManager();
