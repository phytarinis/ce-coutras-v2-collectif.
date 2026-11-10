// Synthèse vocale du navigateur, sans imitation ni enregistrement externe.
export class TelephoneVoice {
  constructor(synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance) {
    this.synth = synth;
    this.Utterance = Utterance;
  }
  stop() {
    try { this.synth?.cancel(); } catch { /* Lecture déjà arrêtée. */ }
  }
  say(text, onError = () => {}) {
    this.stop();
    if (!this.synth || !this.Utterance) { onError(); return false; }
    try {
      const voices = this.synth.getVoices();
      const french = voices.find(voice => /^fr(-|_)/i.test(voice.lang) && voice.localService)
        ?? voices.find(voice => /^fr($|-|_)/i.test(voice.lang));
      if (voices.length && !french) { onError(); return false; }
      const utterance = new this.Utterance(text);
      utterance.lang = 'fr-FR';
      if (french) utterance.voice = french;
      utterance.volume = 1;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onerror = event => {
        if (!['canceled', 'interrupted'].includes(event.error)) onError();
      };
      this.utterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch { onError(); return false; }
  }
}
export const telephoneVoice = new TelephoneVoice();
