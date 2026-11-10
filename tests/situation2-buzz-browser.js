import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.clock.install();
  await page.addInitScript(() => {
    window.tones = [];
    window.AudioContext = class {
      constructor() { if (window.blockAudio) throw new Error('Bloqué'); }
      state = 'running'; destination = {};
      get currentTime() { return Date.now() / 1000; }
      async resume() {}
      createOscillator() { return { frequency: { setValueAtTime: value => window.tones.push(value) }, connect() {}, start() {}, stop() {}, disconnect() {} }; }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
    };
  });
  async function arrive() {
    await page.goto('http://127.0.0.1:8000');
    await page.getByRole('button', { name: 'LANCER LE BAZAR !' }).click();
    await page.getByRole('button', { name: 'B — On signale la publication.', exact: true }).click();
    await page.getByRole('button', { name: 'Continuer — Tout le monde en parle !' }).click();
  }
  await arrive();
  assert.equal(await page.locator('.s2-post').count(), 1);
  await page.getByRole('button', { name: 'Lancer le buzz', exact: true }).click();
  await page.getByRole('button', { name: 'Son activé', exact: true }).waitFor();
  for (let count = 2; count <= 6; count++) {
    await page.clock.fastForward(1200);
    assert.equal(await page.locator('.s2-post').count(), count);
    assert.equal(await page.getByRole('timer').count(), 0);
  }
  const tones = await page.evaluate(() => window.tones);
  assert.equal(tones.length, 6);
  assert.ok(new Set(tones).size > 1);
  assert.equal(await page.locator('.s2-kozmo img').count(), 1);
  await page.locator('.s2-kozmo img').evaluate(img => img.decode());
  await page.getByRole('button', { name: 'Son activé', exact: true }).click();
  await page.getByRole('button', { name: 'Son coupé', exact: true }).waitFor();
  await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).click();
  assert.equal(await page.getByRole('timer').textContent(), '1:30');
  for (const account of ['@rapbuzz_gironde', '@le_vrai_mika33']) {
    const card = page.getByRole('button', { name: `Rechercher la provenance de ${account}`, exact: true });
    await card.click(); await card.click();
  }
  await page.clock.fastForward(90000);
  assert.equal(await page.locator('.s2-summary-card').count(), 3);
  assert.equal(await page.getByText('Non découverte', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Une réputation passée, mais aucune confirmation officielle de ce concert.', { exact: true }).count(), 0);
  const colors = await page.locator('.s2-decisions button').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).backgroundColor));
  assert.equal(new Set(colors).size, 1);
  // Désactivation pendant l'avalanche : plus aucun son sur les publications suivantes.
  await arrive();
  await page.getByRole('button', { name: 'Lancer le buzz', exact: true }).click();
  await page.getByRole('button', { name: 'Son activé', exact: true }).click();
  const mutedCount = await page.evaluate(() => window.tones.length);
  await page.clock.fastForward(1200);
  assert.equal(await page.evaluate(() => window.tones.length), mutedCount);
  await page.getByRole('button', { name: 'Passer l’animation' }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.s2-post').count(), 6);
  // Un navigateur sans API sonore permet toujours d'aller à l'enquête.
  await page.addInitScript(() => { window.blockAudio = true; });
  await arrive();
  await page.getByRole('button', { name: 'Lancer le buzz', exact: true }).click();
  await page.getByText('Son indisponible. Vous pouvez continuer sans son.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Passer l’animation' }).click();
  await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).click();
  await page.getByRole('timer').waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await arrive();
  assert.equal(await page.locator('.s2-post').count(), 6);
  assert.equal(await page.getByRole('button', { name: 'Passer l’animation' }).count(), 0);
  assert.equal(await page.locator('.s2-arrive').evaluate(node => getComputedStyle(node).animationName), 'none');
  await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('timer').textContent(), '1:30');
  console.log('Avalanche validée : six apparitions, sons variés facultatifs, coupure, saut clavier, vignette locale, bilan sans divulgation et deux pistes à expiration.');
} finally { await browser.close(); }
