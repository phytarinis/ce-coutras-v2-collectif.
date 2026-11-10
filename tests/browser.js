// Démarrer le serveur avec npm start avant ce test.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { situations, endings } from '../src/content.js';
import { decisions, observations } from '../src/situation1.js';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function finishSituation2() {
    const skip = page.getByRole('button', { name: 'Passer l’animation', exact: true });
    if (await skip.count()) await skip.click();
    await page.getByRole('button', { name: 'LANCER L’ENQUÊTE — 90 S' }).click();
    for (const account of ['@rapbuzz_gironde', '@le_vrai_mika33', '@rapradar33']) {
      for (let click = 0; click < 2; click++) await page.getByRole('button', { name: `Rechercher la provenance de ${account}`, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Passer au débat collectif' }).click();
    await page.getByRole('button', { name: 'C — Ne rien relayer sans preuve.', exact: true }).click();
    await page.getByRole('button', { name: 'CONTINUER — ALLÔ COUTRAS ?', exact: true }).click();
  }
  await page.goto('http://127.0.0.1:8000');
  for (const [width, height] of [[1280, 720], [1920, 1080], [1024, 576], [375, 812]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    for (const selector of ['.home-title', '.home-tagline', '.home-start', '.home-facts', '.home-identity']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `${selector} hors écran ${width}×${height}`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), true);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const image of await page.locator('.home img').all()) {
    await image.evaluate(img => img.decode());
    assert.equal(await image.evaluate(img => img.naturalWidth > 0), true);
  }
  const bg = await page.request.get('http://127.0.0.1:8000/assets/originals/images%20(8).jpeg');
  assert.equal(bg.ok(), true);
  for (const decision of decisions) {
    await page.reload();
    await page.getByRole('button', { name: 'LANCER LE BAZAR !' }).click();
    await page.getByText('KØZMO GRATUIT À COUTRAS ?! Faites tourner avant que ça disparaisse !', { exact: true }).waitFor();
    const open = page.getByRole('button', { name: 'Agrandir et explorer l’affiche' });
    await open.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').waitFor();
    for (const id of ['date', 'lieu', 'organisateur']) {
      const zone = page.locator(`.s1-hotspot-${id}`);
      await zone.hover();
      assert.notEqual(await zone.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      await zone.click();
      await page.getByRole('status').filter({ hasText: observations.find(item => item.id === id).text }).waitFor();
    }
    const ids = ['organisateur', 'date', 'lieu', 'date'];
    for (const id of ids) {
      const hotspot = page.locator(`.s1-hotspot-${id}`);
      await hotspot.focus();
      await page.keyboard.press('Space');
      await page.getByRole('status').filter({ hasText: observations.find(item => item.id === id).text }).waitFor();
      assert.equal(await hotspot.getAttribute('aria-pressed'), 'true');
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.locator(':focus').textContent(), 'Agrandir et explorer l’affiche');
    await page.getByText('3 / 3 informations consultées', { exact: true }).waitFor();
    await page.getByText('Mémoire de la partie : 0 choix, 3 indice(s)', { exact: true }).waitFor();
    await page.getByRole('button', { name: decision.label, exact: true }).click();
    await page.getByText(decision.consequence, { exact: true }).waitFor();
    assert.equal(await page.locator('.s1-decision').count(), 0);
    assert.deepEqual(await page.locator('dd').allTextContents(), [decision.id === 'A' ? '15' : '0', decision.id === 'C' ? '15' : '0']);
    await page.getByRole('button', { name: 'Continuer — Tout le monde en parle !' }).click();
    await page.getByRole('button', { name: 'Situation précédente', exact: true }).click();
    await page.getByText(decision.consequence, { exact: true }).waitFor();
    assert.deepEqual(await page.locator('dd').allTextContents(), [decision.id === 'A' ? '15' : '0', decision.id === 'C' ? '15' : '0']);
  }
  await page.reload();
  await page.getByRole('button', { name: 'LANCER LE BAZAR !' }).click();
  await page.getByRole('button', { name: decisions[2].label, exact: true }).click();
  await page.getByText('Mémoire de la partie : 1 choix, 1 indice(s)', { exact: true }).waitFor();
  for (let index = 0; index < situations.length; index++) {
    await page.getByRole('heading', { level: 1, name: situations[index].title, exact: true }).waitFor();
    if (index === 1) await finishSituation2();
    else if (index < situations.length - 1) await page.getByRole('button', { name: index === 0 ? 'Continuer — Tout le monde en parle !' : 'Situation suivante', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Voir les emplacements des fins' }).click();
  for (const ending of endings) {
    await page.getByRole('button', { name: `Aperçu : ${ending.title}`, exact: true }).click();
    await page.getByRole('heading', { level: 1, name: ending.title, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Retour aux trois fins' }).click();
  }
  await page.getByRole('button', { name: 'Recommencer une partie', exact: true }).click();
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  await page.getByText('Mémoire de la partie : 2 choix, 4 indice(s)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Recommencer une partie', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmer le redémarrage', exact: true }).click();
  await page.getByRole('heading', { name: 'Ce Coutras qui n’existe pas… Ça dérape !' }).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'LANCER LE BAZAR !');
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: situations[0].title, exact: true }).waitFor();
  for (const [width, height] of [[1280, 720], [1920, 1080], [1024, 576]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('header > p:last-child').isVisible(), false);
    await page.getByRole('button', { name: 'Agrandir et explorer l’affiche' }).click();
    const modal = await page.getByRole('dialog').boundingBox();
    assert.ok(modal.x >= 0 && modal.y >= 0 && modal.x + modal.width <= width + 1 && modal.y + modal.height <= height + 1);
    await page.keyboard.press('Escape');
  }
  await page.getByRole('button', { name: decisions[1].label, exact: true }).click();
  await page.getByRole('button', { name: 'Continuer — Tout le monde en parle !' }).click();
  await finishSituation2();
  await page.getByRole('button', { name: 'Enregistrer le choix et l’indice de démonstration' }).click();
  await page.getByRole('button', { name: 'Situation suivante', exact: true }).click();
  await page.getByRole('button', { name: 'Situation précédente', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Essai déjà enregistré' }).isDisabled(), true);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.reload();
  await page.getByRole('button', { name: 'LANCER LE BAZAR !' }).click();
  await page.getByText('Mémoire de la partie : 0 choix, 0 indice(s)', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Parcours navigateur validé : 7 situations, 3 fins, mémoire, retour, remise à zéro, clavier, affichage mobile et absence d’erreur JavaScript.');
} finally {
  await browser.close();
}
