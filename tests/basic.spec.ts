import { test, expect } from '@playwright/test';
test('main menu renders and exposes gameplay controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /RULE THE/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /PLAY NOW/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'RANKING' })).toBeVisible();
  await expect(page.getByLabel('API SIMULATION')).toBeVisible();
});
test('options validate and persist', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /OPTIONS/i }).click();
  await page.getByLabel('GAME SESSION TIME').selectOption('90');
  await page.getByLabel('ENEMY SPAWN TIME').fill('6');
  await page.getByRole('button', { name: /SAVE OPTIONS/i }).click();
  await page.reload();
  await page.getByRole('button', { name: /OPTIONS/i }).click();
  await expect(page.getByLabel('GAME SESSION TIME')).toHaveValue('90');
  await expect(page.getByLabel('ENEMY SPAWN TIME')).toHaveValue('6');
});
test('play starts a PixiJS arena and pause can resume', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /PLAY NOW/i }).click();
  await expect(page.getByRole('heading', { name: /ENGAGE THE ENEMY/i })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: /Pause game/i }).click();
  await expect(page.getByRole('heading', { name: /VOYAGE PAUSED/i })).toBeVisible();
  await page.getByRole('button', { name: /RESUME VOYAGE/i }).click();
  await expect(page.getByRole('heading', { name: /ENGAGE THE ENEMY/i })).toBeVisible();
});
