import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, enterScene } from '../src/engine.js';
import { contacts, transitionSituation3 as step } from '../src/situation3-state.js';

function initial() {
  const game = createGame();
  game.indicators = { rumor: 10, investigation: 20 };
  game.clues = [{ id: 'previous', label: 'Indice précédent' }];
  game.pending = [{ id: 'other-effect', atScene: 'other', effect: { type: 'clue', clue: { id: 'other' } } }];
  return step(enterScene(game, 'allo'), { type: 'visit' }, 0);
}
function call(state, id, now = 0) {
  state = step(state, { type: 'select', id }, now);
  state = step(state, { type: 'confirm' }, now);
  state = step(state, { type: 'answer' }, now);
  return step(state, { type: 'finish' }, now);
}

test('sélection/annulation gratuites ; confirmation consomme immédiatement et une seule fois', () => {
  const base = initial();
  let state = step(base, { type: 'select', id: 'mairie' }, 0);
  assert.equal(state.situation3.calls.length, 0);
  state = step(state, { type: 'cancel' }, 0);
  assert.equal(state.situation3.selected, null);
  state = step(step(state, { type: 'select', id: 'mairie' }, 0), { type: 'confirm' }, 0);
  assert.equal(state.situation3.calls.length, 1);
  assert.equal(state.situation3.calls[0].completed, false);
  assert.equal(state.situation3.calls[0].response, null);
  assert.deepEqual(step(state, { type: 'confirm' }, 100), state);
  assert.equal(base.situation3.calls.length, 0);
  assert.throws(() => step(enterScene(state, 'tout-le-monde'), { type: 'visit' }, 0), /Situation incorrecte/);
});

test('sonnerie de deux secondes ou réponse immédiate, sans chronomètre de jeu', () => {
  let state = step(step(initial(), { type: 'select', id: 'mairie' }, 0), { type: 'confirm' }, 0);
  assert.equal(step(state, { type: 'visit' }, 1999).situation3.phase, 'ringing');
  assert.equal(step(state, { type: 'visit' }, 2000).situation3.phase, 'answer');
  assert.equal(step(state, { type: 'answer' }, 0).situation3.phase, 'answer');
  state = step(enterScene(enterScene(state, 'tout-le-monde'), 'allo'), { type: 'visit' }, 10000);
  assert.equal(state.situation3.calls.length, 1);
  assert.equal(state.situation3.phase, 'answer');
});

for (const first of contacts) {
  test(`appel unique ${first.id} : réponse, indice, bilan et jauges conservés`, () => {
    const state = call(initial(), first.id);
    assert.equal(state.situation3.calls[0].response, first.response);
    assert.equal(state.situation3.calls[0].clue, first.clue);
    assert.equal(state.clues.length, 2);
    assert.ok(state.clues.some(clue => clue.id === 'previous'));
    assert.deepEqual(state.indicators, { rumor: 10, investigation: 20 });
    assert.equal(state.pending.filter(item => item.id === 's3-correction').length, 1);
    assert.ok(!state.clues.some(clue => clue.id === 's3-relay'));
    const summary = step(state, { type: 'summary' }, 0);
    assert.equal(summary.situation3.phase, 'summary');
    assert.equal(step(summary, { type: 'select', id: 'police' }, 0).situation3.selected, null);
    const future = enterScene(enterScene(summary, 'c24'), 'buzz');
    assert.equal(future.clues.filter(clue => clue.id === 's3-relay').length, 1);
    assert.equal(future.pending.length, 1);
    assert.equal(enterScene(enterScene(future, 'c24'), 'buzz').clues.length, future.clues.length);
  });
  for (const second of contacts.filter(contact => contact !== first)) {
    test(`combinaison ${first.id} puis ${second.id} : deux appels maximum, ordre et priorité`, () => {
      let state = call(initial(), first.id);
      state = step(state, { type: 'select', id: first.id }, 0);
      assert.equal(state.situation3.selected, null);
      state = call(state, second.id);
      assert.deepEqual(state.situation3.calls.map(call => call.id), [first.id, second.id]);
      assert.deepEqual(state.situation3.calls.map(call => call.order), [1, 2]);
      for (const contact of contacts) {
        const attempt = step(step(state, { type: 'select', id: contact.id }, 0), { type: 'confirm' }, 0);
        assert.equal(attempt.situation3.calls.length, 2);
      }
      const expected = ['festivites', 'mairie', 'police', 'tourisme'].find(id => [first.id, second.id].includes(id));
      assert.equal(state.situation3.relay.id, expected);
      assert.equal(state.pending.filter(item => item.id === 's3-correction').length, 1);
      assert.deepEqual(state.indicators, { rumor: 10, investigation: 20 });
      assert.equal(state.clues.length, 3);
      const after = enterScene(state, 'c24');
      assert.deepEqual(after.situation3.calls, state.situation3.calls);
      assert.equal(after.clues.length, state.clues.length);
    });
  }
}

test('aucun bilan sans appel ; une nouvelle partie efface appels et relais', () => {
  assert.equal(step(initial(), { type: 'summary' }, 0).situation3.phase, 'contacts');
  const fresh = step(enterScene(createGame(), 'allo'), { type: 'visit' }, 0);
  assert.equal(fresh.situation3.calls.length, 0);
  assert.equal(fresh.situation3.relay, null);
});
