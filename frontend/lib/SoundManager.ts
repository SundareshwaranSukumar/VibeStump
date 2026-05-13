'use client';

class SoundManager {
  private wicketSound: HTMLAudioElement | null = null;
  private boundarySound: HTMLAudioElement | null = null;
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    try {
      this.wicketSound = new Audio('/sounds/wicket_faaaah.mp3');
      this.boundarySound = new Audio('/sounds/boundary.mp3'); // Optional extra
      this.initialized = true;
    } catch (e) {
      console.warn('Audio initialization failed', e);
    }
  }

  public play(event: 'wicket' | 'boundary') {
    if (!this.initialized) return;
    try {
      if (event === 'wicket' && this.wicketSound) {
        this.wicketSound.currentTime = 0;
        this.wicketSound.play().catch(e => console.warn('Audio play blocked', e));
      } else if (event === 'boundary' && this.boundarySound) {
        this.boundarySound.currentTime = 0;
        this.boundarySound.play().catch(e => console.warn('Audio play blocked', e));
      }
    } catch (e) {
      console.error('Audio play error', e);
    }
  }
}

export const soundManager = new SoundManager();
