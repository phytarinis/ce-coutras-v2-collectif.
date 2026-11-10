// Sonnerie originale à deux fréquences, synthétisée localement. Aucun appel réel.
export class TelephoneAudio {
  constructor(makeContext = () => new (window.AudioContext || window.webkitAudioContext)()) {
    this.makeContext = makeContext;
    this.enabled = true;
    this.voices = [];
    this.generation = 0;
  }
  stop() {
    this.generation++;
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Déjà terminée. */ } }
    this.voices = [];
  }
  mute() { this.enabled = false; this.stop(); }
  async ring(durationMs = 2000) {
    this.stop();
    if (!this.enabled || durationMs <= 0) return false;
    const generation = this.generation;
    try {
      this.context ??= this.makeContext();
      await this.context.resume();
      if (generation !== this.generation || !this.enabled || this.context.state !== 'running') return false;
      const now = this.context.currentTime;
      const duration = Math.min(2000, durationMs) / 1000;
      for (const frequency of [440, 480]) {
        const voice = this.context.createOscillator();
        const gain = this.context.createGain();
        voice.type = 'sine';
        voice.frequency.setValueAtTime(frequency, now);
        gain.gain.setValueAtTime(0, now);
        for (const offset of [0, .8]) {
          if (offset + .04 >= duration) continue;
          gain.gain.linearRampToValueAtTime(.055, now + offset + .02);
          gain.gain.setValueAtTime(.055, now + Math.min(offset + .35, duration - .02));
          gain.gain.linearRampToValueAtTime(0, now + Math.min(offset + .4, duration));
        }
        voice.connect(gain);
        gain.connect(this.context.destination);
        voice.start(now);
        voice.stop(now + duration);
        voice.onended = () => { voice.disconnect(); gain.disconnect(); };
        this.voices.push(voice);
      }
      return true;
    } catch { this.stop(); return false; }
  }
}
export const telephoneAudio = new TelephoneAudio();
