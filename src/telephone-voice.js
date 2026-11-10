// Synthèse vocale du navigateur, sans imitation ni enregistrement externe.
export const voiceProfiles = {
  mairie: { index: 0, rate: .93, pitch: .85 },
  festivites: { index: 1, rate: 1.08, pitch: 1.25 },
  police: { index: 2, rate: .9, pitch: .68 },
  tourisme: { index: 3, rate: 1.02, pitch: 1.1 },
};

export class TelephoneVoice {
  constructor(synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance) {
    this.synth = synth;
    this.Utterance = Utterance;
  }
  stop() {
    try { this.synth?.cancel(); } catch { /* Lecture déjà arrêtée. */ }
  }
  say(text, onError = () => {}, contactId) {
    this.stop();
    if (!this.synth || !this.Utterance) { onError(); return false; }
    try {
      const voices = this.synth.getVoices();
      const profile = voiceProfiles[contactId] ?? { index: 0, rate: 1, pitch: 1 };
      const frenchVoices = voices.filter(voice => /^fr($|-|_)/i.test(voice.lang))
        .sort((a, b) => Number(Boolean(b.localService)) - Number(Boolean(a.localService))
          || `${a.voiceURI ?? a.name ?? a.lang}`.localeCompare(`${b.voiceURI ?? b.name ?? b.lang}`));
      const french = frenchVoices.length ? frenchVoices[profile.index % frenchVoices.length] : undefined;
      if (voices.length && !french) { onError(); return false; }
      const utterance = new this.Utterance(text);
      utterance.lang = 'fr-FR';
      if (french) utterance.voice = french;
      utterance.volume = 1;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
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
