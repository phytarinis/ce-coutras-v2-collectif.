// Démarrer le serveur avec npm start avant ce test.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { situations, endings } from '../src/content.js';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8000');
  await page.getByRole('button', { name: 'Commencer la démonstration' }).click();
  await page.getByRole('button', { name: 'Enregistrer le choix et l’indice de démonstration' }).click();
  await page.getByText('Mémoire de la partie : 1 choix, 1 indice(s)', { exact: true }).waitFor();
  for (let index = 0; index < situations.length; index++) {
    await page.getByRole('heading', { level: 1, name: situations[index].title, exact: true }).waitFor();
    if (index < situations.length - 1) await page.getByRole('button', { name: 'Situation suivante', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Voir les emplacements des fins' }).click();
  for (const ending of endings) {
    await page.getByRole('button', { name: `Aperçu : ${ending.title}`, exact: true }).click();
    await page.getByRole('heading', { level: 1, name: ending.title, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Retour aux trois fins' }).click();
  }
  await page.getByRole('button', { name: 'Recommencer une partie', exact: true }).click();
  await page.getByRole('button', { name: 'Annuler', exact: true }).click();
  await page.getByText('Mémoire de la partie : 1 choix, 1 indice(s)', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Recommencer une partie', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmer le redémarrage', exact: true }).click();
  await page.getByRole('heading', { name: 'Une enquête à mener ensemble' }).waitFor();
  await page.getByText('Mémoire de la partie : 0 choix, 0 indice(s)', { exact: true }).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Commencer la démonstration');
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: situations[0].title, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Enregistrer le choix et l’indice de démonstration' }).click();
  await page.getByRole('button', { name: 'Situation suivante', exact: true }).click();
  await page.getByRole('button', { name: 'Situation précédente', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Essai déjà enregistré' }).isDisabled(), true);
  assert.equal(await page.getByText('Non définie — barème à valider', { exact: true }).count(), 2);
  await page.setViewportSize({ width: 375, height: 812 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.reload();
  await page.getByText('Mémoire de la partie : 0 choix, 0 indice(s)', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Parcours navigateur validé : 7 situations, 3 fins, mémoire, retour, remise à zéro, clavier, affichage mobile et absence d’erreur JavaScript.');
} finally {
  await browser.close();
}
