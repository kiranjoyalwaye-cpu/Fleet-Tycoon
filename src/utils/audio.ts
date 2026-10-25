// ============================================================================
// Web Audio & Android Haptic Synthesis Engine
// Zero Asset Audio - Generates Low-Latency Retro & Micro-Tones in Real Time
// ============================================================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    // Lazy initialize on first user gesture
  }

  public init() {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        // AudioContext not permitted yet
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(val: boolean) {
    this.enabled = val;
  }

  public isSoundEnabled() {
    return this.enabled;
  }

  public setHapticsEnabled(val: boolean) {
    this.hapticsEnabled = val;
  }

  public isHapticsEnabled() {
    return this.hapticsEnabled;
  }

  // Trigger Android native haptics if supported
  private vibrate(ms: number | number[]) {
    if (!this.hapticsEnabled || typeof window === 'undefined') return;
    if (window.navigator && typeof window.navigator.vibrate === 'function') {
      try {
        window.navigator.vibrate(ms);
      } catch {
        // Ignore haptic failures
      }
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      o.type = type;
      // Micro-detune for acoustic warmth
      o.frequency.value = freq * (0.98 + Math.random() * 0.04);

      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18 * vol, this.ctx.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

      o.connect(g);
      g.connect(this.ctx.destination);

      o.start();
      o.stop(this.ctx.currentTime + dur + 0.02);
    } catch {
      // Audio stream busy
    }
  }

  public click() {
    this.vibrate(10);
    this.blip(520, 0.06, 'triangle', 0.6);
  }

  public ok() {
    this.vibrate([15, 30, 20]);
    this.blip(440, 0.09, 'sine', 0.8);
    setTimeout(() => this.blip(660, 0.11, 'sine', 0.65), 70);
  }

  public bad() {
    this.vibrate([40, 30, 40]);
    this.blip(170, 0.18, 'sawtooth', 0.5);
  }

  public cash() {
    this.vibrate(18);
    this.blip(880, 0.08, 'square', 0.35);
  }

  public event() {
    this.vibrate([30, 40, 30]);
    this.blip(330, 0.14, 'triangle', 0.8);
  }

  public otaSuccess() {
    this.vibrate([20, 20, 20, 20, 40]);
    this.blip(523, 0.08, 'sine', 0.7);
    setTimeout(() => this.blip(659, 0.08, 'sine', 0.7), 80);
    setTimeout(() => this.blip(783, 0.12, 'sine', 0.8), 160);
  }
}

export const sfx = new SoundEngine();
