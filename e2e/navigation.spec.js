import { test, expect } from '@playwright/test';

test.describe('Navegação CineWeave', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('e2e-test', 'true');
      const projects = JSON.parse(localStorage.getItem('cineweave_projects') || '[]');
      if (projects.length === 0) {
        projects.push({
          id: 'test-proj-1',
          title: 'Teste E2E',
          tagline: '',
          genre: '',
          logline: '',
          entities: {
            characters: [
              { id: 'char-test-1', name: 'João', role: 'Protagonista', description: 'Um herói', traits: ['Corajoso'], backstory: '', notes: '', avatar: 'blue', createdAt: 0, updatedAt: 0 },
            ],
            locations: [],
            objects: [],
            scenes: [],
            plot_points: [],
            themes: [],
            acts: [],
            dialogues: [],
            world_elements: [],
          },
          screenplay: [
            { id: 'sc-test-1', type: 'scene-heading', text: 'INT. CASA - DIA' },
            { id: 'sc-test-2', type: 'action', text: 'João entra na sala.' },
          ],
          mindMapNodes: [
            { id: 'n-test-1', entityId: 'char-test-1', x: 200, y: 200 },
          ],
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

  test('roteiro mostra cenas existentes', async ({ page }) => {
    await page.locator('.nav-item', { hasText: 'Roteiro' }).click();
    await expect(page.locator('.screenplay-layout-container')).toBeVisible({ timeout: 15000 });

    // Check that the editor shows scene text
    const editorContent = page.locator('.screenplay-container');
    await expect(editorContent).toContainText('INT. CASA - DIA', { timeout: 10000 });
    await expect(editorContent).toContainText('João entra na sala.', { timeout: 5000 });
  });

  test('enciclopedia mostra personagem', async ({ page }) => {
    await page.locator('.nav-item', { hasText: 'Enciclopédia' }).click();
    await expect(page.locator('.encyclopedia-container')).toBeVisible({ timeout: 15000 });

    // Personagens tab should be active by default
    const personagemCard = page.locator('.ficha-card').first();
    await expect(personagemCard).toContainText('João', { timeout: 10000 });
    await expect(personagemCard).toContainText('Protagonista', { timeout: 5000 });
  });

  test('mind map mostra nós', async ({ page }) => {
    await page.locator('.nav-item', { hasText: 'Mapa Mental' }).click();
    await expect(page.locator('.mindmap-container')).toBeVisible({ timeout: 15000 });

    // Should show the canvas SVG with nodes
    await expect(page.locator('.canvas-svg')).toBeVisible({ timeout: 10000 });
  });

});
