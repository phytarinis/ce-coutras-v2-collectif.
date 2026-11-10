import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, enterScene } from '../src/engine.js';
import { decidePoster, inspectPoster } from '../src/situation1.js';
import { transitionSituation2 as step, publications, situation2Decisions } from '../src/situation2-state.js';

function initial() {
  const previous = decidePoster(inspectPoster(enterScene(createGame(), 'affiche'), 'date'), 'C');
  return step(enterScene(previous, 'tout-le-monde'), { type: 'visit' }, 0);
}
function started() {
  let state = initial();
  for (let i = 0; i < 5; i++) state = step(state, { type: 'nextPost' }, 1000000);
  return step(state, { type: 'start' }, 1000000);
}
function discover(state, now = 1001000) {
  for (const trail of ['B', 'A', 'C']) for (let i = 0; i < 2; i++) state = step(state, { type: 'inspect', trail }, now);
  return state;
}

test('six publications, introduction sans chronomètre et départ explicite à 90 s', () => {
  assert.equal(publications.length, 6);
  let state = initial();
  state = step(state, { type: 'tick' }, 1000000);
  assert.equal(state.situation2.remainingMs, 90000);
  assert.equal(step(state, { type: 'start' }, 1000000).situation2.phase, 'intro');
  state = started();
  assert.equal(state.situation2.remainingMs, 90000);
  assert.equal(state.situation2.phase, 'explore');
});

test('deux clics par piste, ordre libre, indices uniques et aucune variation de points', () => {
  let state = started();
  const original = structuredClone(state);
  state = step(state, { type: 'inspect', trail: 'B' }, 1001000);
  assert.equal(state.clues.length, original.clues.length);
  assert.equal(state.situation2.steps.B, 1);
  state = discover(state);
  state = discover(state);
  assert.equal(state.clues.length, original.clues.length + 3);
  assert.deepEqual(state.indicators, original.indicators);
  assert.deepEqual(state.choices, original.choices);
  assert.equal(original.situation2.steps.B, 0);
});

test('pause/reprise sans remise à zéro et exploration bloquée pendant la pause', () => {
  let state = step(started(), { type: 'pause' }, 1012500);
  assert.equal(state.situation2.remainingMs, 77500);
  state = step(state, { type: 'inspect', trail: 'A' }, 1100000);
  assert.equal(state.situation2.steps.A, 0);
  state = step(state, { type: 'resume' }, 1200000);
  assert.equal(state.situation2.remainingMs, 77500);
  state = step(state, { type: 'tick' }, 1201500);
  assert.equal(state.situation2.remainingMs, 76000);
});

test('expiration stricte avant toute interaction, découvertes conservées, débat sans chrono', () => {
  let state = step(step(started(), { type: 'inspect', trail: 'B' }, 1001000), { type: 'inspect', trail: 'B' }, 1002000);
  state = step(state, { type: 'inspect', trail: 'C' }, 1090000);
  assert.equal(state.situation2.phase, 'debate');
  assert.equal(state.situation2.remainingMs, 0);
  assert.equal(state.situation2.steps.C, 0);
  assert.ok(state.clues.some(clue => clue.id === 's2-B'));
  assert.equal(step(state, { type: 'tick' }, 9999999).situation2.phase, 'debate');
});

test('fin anticipée seulement après trois découvertes et conservation après retour', () => {
  const state = started();
  assert.equal(step(state, { type: 'debate' }, 1001000).situation2.phase, 'explore');
  const done = step(discover(state), { type: 'debate' }, 1002000);
  assert.equal(done.situation2.phase, 'debate');
  assert.equal(done.situation2.remainingMs, 88000);
  const back = step(enterScene(enterScene(done, 'affiche'), 'tout-le-monde'), { type: 'visit' }, 2000000);
  assert.deepEqual(back.situation2, done.situation2);
});

for (const [id, rumor, investigation] of [['A', 10, 5], ['B', 5, 15], ['C', 5, 0], ['D', 0, 0]]) {
  test(`issue ${id} : points cumulés exacts, décision unique et indices de S1 conservés`, () => {
    let state = step(discover(started()), { type: 'debate' }, 1001000);
    if (id === 'D') {
      assert.throws(() => step(state, { type: 'decide', id: 'D' }, 1001000), /indisponible/);
      state = step(state, { type: 'failedVote' }, 1001000);
      assert.throws(() => step(state, { type: 'decide', id: 'D' }, 1001000), /indisponible/);
      state = step(state, { type: 'failedVote' }, 1001000);
    }
    const result = step(state, { type: 'decide', id }, 1001000);
    assert.deepEqual(result.indicators, { rumor, investigation: 15 + investigation });
    assert.equal(result.choices.length, 2);
    assert.ok(result.clues.some(clue => clue.id === 'affiche-source'));
    assert.ok(result.clues.some(clue => clue.id === 'affiche-date'));
    assert.equal(result.clues.some(clue => clue.id === 's2-festivites'), id === 'B');
    for (const decision of situation2Decisions) assert.deepEqual(step(result, { type: 'decide', id: decision.id }, 2000000), result);
    const next = enterScene(result, 'allo');
    assert.deepEqual(next.indicators, result.indicators);
    assert.deepEqual(next.clues, result.clues);
  });
}
