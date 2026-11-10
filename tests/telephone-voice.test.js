import test from 'node:test';
import assert from 'node:assert/strict';
import { TelephoneVoice } from '../src/telephone-voice.js';

test('voix française, texte intégral, coupure avant chaque lecture', () => {
  const spoken = []; let canceled = 0;
  const voice = { lang: 'fr-FR', localService: true };
  const reader = new TelephoneVoice({ getVoices: () => [{ lang: 'en-US' }, voice], speak: line => spoken.push(line), cancel: () => canceled++ }, class { constructor(text) { this.text = text; } });
  assert.equal(reader.say('Message. Réponse.'), true);
  assert.equal(spoken[0].text, 'Message. Réponse.');
  assert.equal(spoken[0].voice, voice);
  assert.equal(spoken[0].lang, 'fr-FR');
  reader.stop();
  assert.equal(canceled, 2);
});

test('absence de synthèse ou de voix française : signalement sans blocage', () => {
  let issues = 0;
  const reader = new TelephoneVoice({}, undefined);
  assert.equal(reader.say('Texte', () => issues++), false);
  const english = new TelephoneVoice({ cancel() {}, getVoices: () => [{ lang: 'en-US' }] }, class {});
  assert.equal(english.say('Texte', () => issues++), false);
  assert.equal(issues, 2);
});
