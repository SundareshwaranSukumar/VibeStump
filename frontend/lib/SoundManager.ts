'use client';

class SoundManager {
  private wicketSound: HTMLAudioElement | null = null;
  private boundarySound: HTMLAudioElement | null = null;
  private faahSound: HTMLAudioElement | null = null;
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    try {
      this.wicketSound = new Audio('/sounds/wicket_faaaah.mp3');
      // Remote fallback for boundary sound to avoid 404
      this.boundarySound = new Audio('https://actions.google.com/sounds/v1/sports/football_kick_off.ogg'); 
      this.faahSound = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
      this.initialized = true;
    } catch (e) {
      console.warn('Audio initialization failed', e);
    }
  }

  public play(event: 'wicket' | 'boundary' | 'faah') {
    if (!this.initialized) return;
    try {
      if (event === 'wicket' && this.wicketSound) {
        this.wicketSound.currentTime = 0;
        this.wicketSound.play().catch(e => console.warn('Audio play blocked', e));
      } else if (event === 'boundary' && this.boundarySound) {
        this.boundarySound.currentTime = 0;
        this.boundarySound.play().catch(e => console.warn('Audio play blocked', e));
      } else if (event === 'faah' && this.faahSound) {
        this.faahSound.currentTime = 0;
        this.faahSound.play().catch(e => console.warn('Audio play blocked', e));
      }
    } catch (e) {
      console.error('Audio play error', e);
    }
  }
}

export const soundManager = new SoundManager();
