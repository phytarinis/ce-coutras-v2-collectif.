import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { publications, situation2Decisions } from '../src/situation2-state.js';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  async function arrive() {
    await page.goto('http://127.0.0.1:8000');
    await page.getByRole('button', { name: 'LANCER LE BAZAR !' }).click();
    await page.getByRole('button', { name: 'C — On cherche d’où vient l’affiche.', exact: true }).click();
    await page.getByRole('button', { name: 'Continuer — Tout le monde en parle !' }).click();
  }
  async function showPosts() {
    assert.equal(await page.locator('.s2-post').count(), 6);
    for (const post of publications) await page.getByText(post.text, { exact: true }).waitFor();
  }
  async function inspect(account, keyboard = false) {
    const card = page.getByRole('button', { name: `Rechercher la provenance de ${account}`, exact: true });
    for (let index = 0; index < 2; index++) {
      if (keyboard) { await card.focus(); await page.keyboard.press(index ? 'Space' : 'Enter'); }
      else await card.click();
    }
  }
  for (const decision of situation2Decisions) {
    await arrive();
    await page.clock.fastForward(120000);
    assert.equal(await page.getByRole('timer').count(), 0);
    await showPosts();
    await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).click();
    assert.equal(await page.getByRole('timer').textContent(), '1:30');
    await page.getByText('RapRadar33 : ce nom est déjà dans votre carnet.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Rechercher la provenance de @le_vrai_mika33', exact: true }).click();
    await page.getByText('Mika33 cite son cousin. Regardez sur quoi repose son information.', { exact: true }).waitFor();
    assert.equal(await page.getByText('Le cousin a simplement vu une affiche sur Internet. Il n’a reçu aucune confirmation d’un organisateur.', { exact: true }).count(), 0);
    await page.clock.fastForward(12000);
    await page.getByRole('button', { name: 'Mettre en pause', exact: true }).click();
    const paused = await page.getByRole('timer').textContent();
    await page.clock.fastForward(120000);
    assert.equal(await page.getByRole('timer').textContent(), paused);
    assert.equal(await page.locator('button.s2-post:disabled').count(), 6);
    await page.getByRole('button', { name: 'Reprendre le chronomètre' }).click();
    assert.ok((await page.getByRole('timer').textContent()).startsWith('1:18'));
    await inspect('@le_vrai_mika33', true);
    await inspect('@rapradar33', true);
    await inspect('@rapbuzz_gironde');
    await page.getByText('3 / 3 pistes découvertes', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Passer au débat collectif' }).click();
    assert.equal(await page.getByRole('timer').count(), 0);
    if (decision.id === 'D') {
      assert.equal(await page.getByRole('button', { name: 'Pas d’accord collectif', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Enregistrer un vote sans accord' }).click();
      assert.equal(await page.getByRole('button', { name: 'Pas d’accord collectif', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Enregistrer un vote sans accord' }).click();
    }
    await page.getByRole('button', { name: decision.label, exact: true }).click();
    await page.getByText(decision.notification, { exact: true }).waitFor();
    const expected = { A: ['10', '20'], B: ['5', '30'], C: ['5', '15'], D: ['0', '15'] }[decision.id];
    assert.deepEqual(await page.locator('dd').allTextContents(), expected);
    await page.getByRole('button', { name: 'CONTINUER — ALLÔ COUTRAS ?', exact: true }).click();
    await page.getByRole('heading', { name: 'Allô Coutras ?', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Situation précédente', exact: true }).click();
    await page.getByText(decision.notification, { exact: true }).waitFor();
    assert.deepEqual(await page.locator('dd').allTextContents(), expected);
  }
  // Expiration réelle du contrôleur d'interface, sans attendre 90 secondes.
  await arrive();
  await showPosts();
  await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).click();
  await inspect('@rapradar33');
  for (const [width, height] of [[1280, 720], [1920, 1080], [1024, 576], [375, 812]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  await page.clock.fastForward(90000);
  await page.getByText('Temps écoulé. L’exploration est terminée ; vos découvertes sont conservées.', { exact: true }).waitFor();
  assert.equal(await page.locator('button.s2-post').count(), 0);
  await page.getByText('Mémoire de la partie : 1 choix, 2 indice(s)', { exact: true }).waitFor();
  assert.deepEqual(await page.locator('dd').allTextContents(), ['0', '15']);
  await page.clock.fastForward(120000);
  await page.getByRole('button', { name: situation2Decisions[2].label, exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Situation 2 validée : introduction, six publications, timer, pause/reprise, exploration progressive souris/clavier, expiration, débat, quatre issues, continuité, 16:9 et animations réduites.');
} finally { await browser.close(); }
