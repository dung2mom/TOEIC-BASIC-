class SoundManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check initial mute state from localStorage
    const saved = localStorage.getItem('toeic_sound_enabled');
    if (saved !== null) {
      this.isMuted = saved === 'false';
    }
  }

  private initCtx() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('toeic_sound_enabled', (!muted).toString());
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext failure gracefully handled
    }
  }

  public playCorrect() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      // Two-tone cheerful major chord
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5

      osc2.frequency.setValueAtTime(1046.50, now + 0.2); // C6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now + 0.2);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch {
      // Ignored
    }
  }

  public playWrong() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignored
    }
  }

  public playTimeout() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.setValueAtTime(200, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignored
    }
  }

  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.audioCtx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const noteStart = now + idx * 0.1;
        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch {
      // Ignored
    }
  }
}

export const soundManager = new SoundManager();
