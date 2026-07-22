import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.setTimeout(180_000);

const OUT = 'e2e/screenshots';

test('login + import FDX real', async ({ page }) => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const logs = [];
  const errors = [];

  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  // ── 1. Login ──────────────────────────────────────────────
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="email"]', { timeout: 10_000 });
  await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: true });

  await page.fill('input[type="email"]', 'gnnss777@gmail.com');
  await page.fill('input[type="password"]', 'Hell-5852');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Wait for app to load — tabs appear in header
  await page.waitForSelector('button.nav-item', { timeout: 15_000 });
  await page.screenshot({ path: `${OUT}/02-after-login.png`, fullPage: true });
  fs.writeFileSync(`${OUT}/02-after-login-text.txt`, await page.innerText('body'));

  // ── 2. Project selection ──────────────────────────────────
  // If already inside a project, "Roteiro" tab is visible
  // Otherwise we need to click the project card
  const roteiroBtn = page.locator('button.nav-item:has-text("Roteiro")');
  const inProject = await roteiroBtn.isVisible().catch(() => false);
  console.log(`IN_PROJECT: ${inProject}`);

  if (!inProject) {
    // Click the project card via JS
    const projectCard = page.locator('.project-card, .project-item').first();
    const cardVisible = await projectCard.isVisible().catch(() => false);
    console.log(`PROJECT_CARD_VISIBLE: ${cardVisible}`);
    if (cardVisible) {
      await projectCard.evaluate(el => el.click());
      // Wait for tabs to appear after entering project
      await page.waitForSelector('button.nav-item', { timeout: 10_000 });
      await page.waitForTimeout(2000);
    }
  }

  await page.screenshot({ path: `${OUT}/03-project.png`, fullPage: true });

  // ── 3. Navigate to Screenplay tab (Roteiro) ────────────────
  console.log('Clicking Roteiro tab...');
  // Force click to bypass any overlay issues in headless
  await roteiroBtn.click({ force: true });

  // Wait for ScreenplayTab to render: the hidden file input with accept=".fdx"
  const screenplayInput = page.locator('input[type="file"][accept*=".fdx"]');
  console.log(`Waiting for screenplay file input...`);
  try {
    await screenplayInput.waitFor({ state: 'attached', timeout: 10_000 });
    console.log('SCREENPLAY_INPUT_ATTACHED');
  } catch {
    console.log('SCREENPLAY_INPUT_NOT_FOUND after 10s — tab may not have switched');
    // Debug: check active class on buttons
    const activeBtn = await page.locator('button.nav-item.active').innerText().catch(() => 'none');
    console.log(`ACTIVE_TAB: "${activeBtn}"`);
  }

  await page.screenshot({ path: `${OUT}/04-screenplay-tab.png`, fullPage: true });
  fs.writeFileSync(`${OUT}/04-screenplay-text.txt`, await page.innerText('body'));

  // ── 4. Import FDX ──────────────────────────────────────
  const fdxPath = 'C:/Users/gnnss/Downloads/BENEDETTI SISTERS_ROTEIROS/T#07_ROTEIRO_BENEDETTI.fdx';

  if (!fs.existsSync(fdxPath)) {
    console.log(`FDX_NOT_FOUND: ${fdxPath}`);
    console.log(`Listing directory: ${fs.readdirSync(path.dirname(fdxPath)).join(', ')}`);
  }

  if (fs.existsSync(fdxPath)) {
    const inputAttached = await screenplayInput.count();
    console.log(`FDX_EXISTS: true, INPUT_COUNT: ${inputAttached}`);

    if (inputAttached > 0) {
      // Direct set on hidden input
      console.log('UPLOADING via hidden input.setInputFiles...');
      await screenplayInput.setInputFiles(fdxPath);
    } else {
      // Fallback: click the Upload toolbar button which triggers fountainInputRef.current.click()
      console.log('TRYING Upload button click...');
      const uploadBtn = page.locator('button.toolbar-tab-btn[title*="Importar"]');
      const uploadVisible = await uploadBtn.isVisible().catch(() => false);
      console.log(`UPLOAD_BTN_VISIBLE: ${uploadVisible}`);
      if (uploadVisible) {
        // Clicking triggers file dialog — use setInputFiles on the dialog
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5_000 }),
          uploadBtn.click({ force: true }),
        ]);
        await fileChooser.setFiles(fdxPath);
        console.log('FILECHOOSER_SET');
      } else {
        // Last resort: inject file via JS
        console.log('INJECTING file via evaluate...');
        const content = fs.readFileSync(fdxPath, 'utf-8');
        await page.evaluate(({ text, name }) => {
          // Create File object and dispatch change event on the hidden input
          const input = document.querySelector('input[type="file"][accept*=".fdx"]');
          if (input) {
            const dt = new DataTransfer();
            dt.items.add(new File([text], name, { type: 'text/xml' }));
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, { text: content, name: 'T#07_ROTEIRO_BENEDETTI.fdx' });
        console.log('INJECT_DONE');
      }
    }
  }

  // Wait for import + entity extraction + LLM enrichment
  console.log('Waiting 15s for import processing...');
  await page.waitForTimeout(15_000);

  await page.screenshot({ path: `${OUT}/05-after-import.png`, fullPage: true });
  fs.writeFileSync(`${OUT}/05-after-import-text.txt`, await page.innerText('body'));

  // ── 5. Check Encyclopedia ────────────────────────────────
  const encBtn = page.locator('button.nav-item:has-text("Enciclop")');
  if (await encBtn.isVisible().catch(() => false)) {
    await encBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/06-encyclopedia.png`, fullPage: true });
    fs.writeFileSync(`${OUT}/06-encyclopedia-text.txt`, await page.innerText('body'));
  }

  // ── 6. Check Mind Map ────────────────────────────────────
  const mmBtn = page.locator('button.nav-item:has-text("Mapa Mental")');
  if (await mmBtn.isVisible().catch(() => false)) {
    await mmBtn.click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/07-mindmap.png`, fullPage: true });
  }

  // ── 7. Save results ────────────────────────────────────
  fs.writeFileSync(`${OUT}/console-logs.txt`, logs.join('\n'));
  fs.writeFileSync(`${OUT}/console-errors.txt`, errors.join('\n'));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTS: ${logs.length} logs, ${errors.length} errors`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\n--- CONSOLE LOGS ---`);
  logs.forEach(l => console.log(l));
  if (errors.length) {
    console.log(`\n--- ERRORS ---`);
    errors.forEach(e => console.log(e));
  }
});
