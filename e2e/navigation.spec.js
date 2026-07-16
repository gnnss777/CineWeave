import { test, expect } from '@playwright/test';

test.describe('Navegação CineWeave', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e-test', 'true');
      // Create a mock project so tabs have data
      const projects = JSON.parse(localStorage.getItem('cineweave_projects') || '[]');
      if (projects.length === 0) {
        projects.push({
          id: 'test-proj-1',
          title: 'Teste E2E',
          tagline: '',
          genre: '',
          logline: '',
          entities: {},
          screenplay: [],
          mindMapNodes: [],
          mindMapLinks: [],
          characters: [],
          locations: [],
          objects: [],
          ideas: [],
          recordings: [],
          mediaUploads: [],
          brainstormDocuments: [],
          versions: { blockStore: {}, all: [], head: null, staging: [] },
        });
        localStorage.setItem('cineweave_projects', JSON.stringify(projects));
      }
    });
    await page.reload();
    await page.waitForSelector('.header-bar', { timeout: 15000 });
  });

  test('carrega app e mostra 4 nav tabs', async ({ page }) => {
    const tabs = page.locator('.nav-item');
    await expect(tabs).toHaveCount(4, { timeout: 10000 });

    const labels = await tabs.allTextContents();
    expect(labels.join(' ')).toContain('Roteiro');
    expect(labels.join(' ')).toContain('Enciclopédia');
    expect(labels.join(' ')).toContain('Mapa Mental');
    expect(labels.join(' ')).toContain('Ideias');
  });

  test('navega entre as 4 abas', async ({ page }) => {
    await expect(page.locator('.nav-item')).toHaveCount(4, { timeout: 10000 });

    await page.locator('.nav-item', { hasText: 'Roteiro' }).click();
    await expect(page.locator('.screenplay-layout-container')).toBeVisible({ timeout: 15000 });

    await page.locator('.nav-item', { hasText: 'Enciclopédia' }).click();
    await expect(page.locator('.encyclopedia-container')).toBeVisible({ timeout: 15000 });

    await page.locator('.nav-item', { hasText: 'Mapa Mental' }).click();
    await expect(page.locator('.mindmap-container')).toBeVisible({ timeout: 15000 });

    await page.locator('.nav-item', { hasText: 'Ideias' }).click();
    await expect(page.locator('[data-onboarding="brainstorm-tab"]')).toBeVisible({ timeout: 15000 });
  });

});
