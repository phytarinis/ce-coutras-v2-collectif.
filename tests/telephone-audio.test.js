import test from 'node:test';
import assert from 'node:assert/strict';
import { TelephoneAudio } from '../src/telephone-audio.js';

test('sonnerie locale de deux secondes, coupure et réponse immédiate sans reprise tardive', async () => {
  const stops = [], frequencies = [];
  const context = {
    state: 'running', currentTime: 10, destination: {}, resume: async () => {},
    createOscillator: () => ({ frequency: { setValueAtTime: value => frequencies.push(value) }, start() {}, stop: time => stops.push(time), connect() {}, disconnect() {} }),
    createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
  };
  const audio = new TelephoneAudio(() => context);
  assert.equal(await audio.ring(), true);
  assert.deepEqual(frequencies, [440, 480]);
  assert.deepEqual(stops, [12, 12]);
  audio.mute();
  assert.equal(audio.enabled, false);
  assert.equal(await audio.ring(), false);
  audio.enabled = true;
  const promise = audio.ring();
  audio.stop();
  assert.equal(await promise, false);
  assert.equal(frequencies.length, 2);
});

test('audio indisponible : retour sans exception', async () => {
  const audio = new TelephoneAudio(() => { throw new Error('Audio bloqué'); });
  assert.equal(await audio.ring(), false);
  assert.doesNotThrow(() => audio.stop());
});
