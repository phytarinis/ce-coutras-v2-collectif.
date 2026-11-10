import test from 'node:test';
import assert from 'node:assert/strict';
import { TelephoneVoice, voiceProfiles } from '../src/telephone-voice.js';

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

for (const count of [1, 2, 4]) {
  test(`${count} voix française(s) : profils distincts, attribution stable et texte conservé`, () => {
    const spoken = [];
    const voices = Array.from({ length: count }, (_, index) => ({ lang: 'fr-FR', voiceURI: `voix-${index}`, localService: true }));
    const reader = new TelephoneVoice({ cancel() {}, getVoices: () => [...voices].reverse(), speak: line => spoken.push(line) }, class { constructor(text) { this.text = text; } });
    for (const id of Object.keys(voiceProfiles)) reader.say('Dialogue inchangé.', () => {}, id);
    assert.equal(new Set(spoken.map(line => `${line.rate}:${line.pitch}`)).size, 4);
    assert.equal(new Set(spoken.map(line => line.voice.voiceURI)).size, count);
    assert.ok(spoken.every(line => line.text === 'Dialogue inchangé.'));
    reader.say('Dialogue inchangé.', () => {}, 'mairie');
    assert.equal(spoken[4].voice, spoken[0].voice);
    assert.equal(spoken[4].pitch, spoken[0].pitch);
  });
}

test('absence de synthèse ou de voix française : signalement sans blocage', () => {
  let issues = 0;
  const reader = new TelephoneVoice({}, undefined);
  assert.equal(reader.say('Texte', () => issues++), false);
  const english = new TelephoneVoice({ cancel() {}, getVoices: () => [{ lang: 'en-US' }] }, class {});
  assert.equal(english.say('Texte', () => issues++), false);
  assert.equal(issues, 2);
});
