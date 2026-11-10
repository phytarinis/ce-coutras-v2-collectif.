// Notifications originales synthétisées localement : aucun fichier ni réseau.
export class BuzzAudio {
  constructor(makeContext = () => new (window.AudioContext || window.webkitAudioContext)()) {
    this.makeContext = makeContext;
    this.enabled = false;
    this.context = null;
    this.lastEnd = 0;
  }
  async enable() {
    try {
      this.context ??= this.makeContext();
      await this.context.resume();
      this.enabled = this.context.state === 'running';
    } catch { this.enabled = false; }
    return this.enabled;
  }
  mute() {
    this.enabled = false;
    // Coupe aussi une notification qui serait encore en cours.
    try { this.voice?.stop(); } catch { /* Déjà terminée. */ }
  }
  play(index) {
    if (!this.enabled || this.context?.state !== 'running') return;
    const time = this.context.currentTime;
    if (time < this.lastEnd) return;
    try {
      const voice = this.context.createOscillator();
      const volume = this.context.createGain();
      voice.type = 'sine';
      voice.frequency.setValueAtTime([620, 740, 680, 820, 700, 780][index % 6], time);
      volume.gain.setValueAtTime(0, time);
      volume.gain.linearRampToValueAtTime(.035, time + .012);
      volume.gain.exponentialRampToValueAtTime(.0001, time + .09);
      voice.connect(volume);
      volume.connect(this.context.destination);
      voice.start(time);
      voice.stop(time + .1);
      voice.onended = () => { voice.disconnect(); volume.disconnect(); };
      this.voice = voice;
      this.lastEnd = time + .12;
    } catch { this.mute(); }
  }
}
export const buzzAudio = new BuzzAudio();
