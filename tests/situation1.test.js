import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, enterScene } from '../src/engine.js';
import { inspectPoster, decidePoster, decisions } from '../src/situation1.js';

test('exploration libre, sans doublon, sans points et sans décision', () => {
  let state = enterScene(createGame(), 'affiche');
  for (const id of ['lieu', 'date', 'organisateur', 'date']) state = inspectPoster(state, id);
  assert.equal(state.clues.length, 3);
  assert.equal(state.choices.length, 0);
  assert.deepEqual(state.indicators, { rumor: 0, investigation: 0 });
});

for (const decision of decisions) {
  test(`décision ${decision.id} : points exacts, exclusive et conservée après navigation`, () => {
    const original = enterScene(createGame(), 'affiche');
    const chosen = decidePoster(original, decision.id);
    assert.equal(original.choices.length, 0);
    assert.deepEqual(chosen.indicators, { rumor: decision.id === 'A' ? 15 : 0, investigation: decision.id === 'C' ? 15 : 0 });
    assert.equal(chosen.choices.length, 1);
    assert.equal(chosen.clues.some(item => item.id === 'affiche-source'), decision.id === 'C');
    for (const other of decisions) assert.deepEqual(decidePoster(chosen, other.id), chosen);
    const back = enterScene(enterScene(chosen, 'tout-le-monde'), 'affiche');
    assert.deepEqual(decidePoster(back, 'A'), chosen);
  });
}
