import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, enterScene, choose } from '../src/engine.js';
import { situations, endings } from '../src/content.js';

test('sept situations, trois fins et valeurs initiales validées', () => {
  assert.equal(situations.length, 7);
  assert.equal(endings.length, 3);
  assert.equal(new Set([...situations, ...endings].map(item => item.id)).size, 10);
  assert.deepEqual(createGame().indicators, { rumor: 0, investigation: 0 });
});

test('choix et indice immédiat sont mémorisés sans doublon ni mutation', () => {
  const initial = enterScene(createGame(), 'affiche');
  const choice = { id: 'test', label: 'Test', effects: [{ type: 'clue', clue: { id: 'a', label: 'A' } }] };
  const result = choose(initial, choice);
  assert.equal(initial.choices.length, 0);
  assert.equal(result.clues.length, 1);
  assert.equal(result.choices.length, 1);
  assert.deepEqual(choose(result, choice), result);
  const moved = enterScene(result, 'allo');
  assert.deepEqual(moved.clues, result.clues);
  assert.deepEqual(moved.indicators, initial.indicators);
});

test('une conséquence différée se déclenche une seule fois à sa destination', () => {
  const choice = { id: 'test', label: 'Test', effects: [{ type: 'clue', clue: { id: 'later', label: 'Test différé' }, atScene: 'allo' }] };
  const pending = choose(enterScene(createGame(), 'affiche'), choice);
  assert.equal(pending.clues.length, 0);
  const other = enterScene(pending, 'tout-le-monde');
  assert.equal(other.pending.length, 1);
  const due = enterScene(other, 'allo');
  assert.equal(due.clues.length, 1);
  assert.equal(due.pending.length, 0);
  assert.equal(due.applied.length, 1);
  assert.deepEqual(enterScene(enterScene(due, 'affiche'), 'allo'), due);
});

test('les indicateurs exigent une initialisation explicite ; valeurs de test uniquement', () => {
  const undefinedGame = createGame();
  undefinedGame.indicators.rumor = null;
  assert.throws(() => choose(undefinedGame, { id: 'x', effects: [{ type: 'indicator', indicator: 'rumor', operation: 'add', value: 2 }] }), /initiale/);
  const initialized = choose(createGame(), { id: 'init', effects: [{ type: 'indicator', indicator: 'rumor', operation: 'set', value: 10 }] });
  const changed = choose(initialized, { id: 'change', effects: [{ type: 'indicator', indicator: 'rumor', operation: 'add', value: 2, atScene: 'allo' }] });
  assert.equal(changed.indicators.rumor, 10);
  assert.equal(enterScene(changed, 'allo').indicators.rumor, 12);
});

test('une nouvelle partie réinitialise toute la mémoire', () => {
  const old = choose(createGame(), { id: 'x', effects: [{ type: 'clue', clue: { id: 'x' }, atScene: 'allo' }] });
  const fresh = createGame();
  assert.equal(old.pending.length, 1);
  assert.equal(fresh.sceneId, 'accueil');
  for (const key of ['choices', 'clues', 'pending', 'applied']) assert.deepEqual(fresh[key], []);
});
