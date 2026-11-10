import test from 'node:test';
import assert from 'node:assert/strict';
import { BuzzAudio } from '../src/buzz-audio.js';

test('sons courts variés, sans chevauchement et coupés immédiatement', async () => {
  const frequencies = [], stops = [];
  const context = {
    state: 'running', currentTime: 0, destination: {}, resume: async () => {},
    createOscillator: () => ({ frequency: { setValueAtTime: value => frequencies.push(value) }, connect() {}, start() {}, stop: time => stops.push(time), disconnect() {} }),
    createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
  };
  const sound = new BuzzAudio(() => context);
  sound.play(0);
  assert.equal(frequencies.length, 0);
  assert.equal(await sound.enable(), true);
  sound.play(0); sound.play(1);
  assert.equal(frequencies.length, 1);
  context.currentTime = 1;
  sound.play(1);
  assert.notEqual(frequencies[0], frequencies[1]);
  assert.equal(stops[0], .1);
  sound.mute();
  context.currentTime = 2;
  sound.play(2);
  assert.equal(frequencies.length, 2);
  assert.equal(stops.at(-1), undefined);
});

test('absence ou refus audio : aucune exception bloquante', async () => {
  const sound = new BuzzAudio(() => { throw new Error('Audio bloqué'); });
  assert.equal(await sound.enable(), false);
  assert.doesNotThrow(() => sound.play(0));
  assert.doesNotThrow(() => sound.mute());
});
