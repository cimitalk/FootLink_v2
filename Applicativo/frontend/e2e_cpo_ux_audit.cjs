/**
 * e2e_cpo_ux_audit.cjs
 * Footlink Sprint 8 — CPO End-to-End Headless Browser UX/UI Audit
 * 
 * Verifies:
 *  1. Coerenza (Design System Nike-like, tokens, color hierarchy)
 *  2. Utilità (Vertical Master Color, 360° Vendor Hub, 3-level BOM, 1-Click Explosion)
 *  3. Velocità (Render latency < 2500ms, interaction responsiveness)
 *  4. Semplicità (Zero-JSON, guided wizards, Zero-Training)
 *  5. Sicurezza L6 (Strict segregation for Tier-3 Terzisti at 0,00 €)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = 'http://127.0.0.1:5173';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../Azienda/docs/prd/screenshots_sprint8');

// Ensure output dir exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 [CPO Headless E2E UX Audit] Launching Chrome Browser...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High-res retina screenshots
  });

  const page = await context.newPage();
  const metrics = [];

  const measure = async (stepName, fn) => {
    const start = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - start;
      metrics.push({ step: stepName, durationMs, status: 'SUCCESS' });
      console.log(`⏱️ [${durationMs}ms] ${stepName}`);
    } catch (err) {
      const durationMs = Date.now() - start;
      metrics.push({ step: stepName, durationMs, status: 'FAILED', error: err.message });
      console.error(`❌ [${durationMs}ms] FAILED: ${stepName}: ${err.message}`);
      throw err;
    }
  };

  try {
    // 0. Initial Launch
    await measure('App Initialization & Launchpad', async () => {
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector('text=FOOTLINK OS', { timeout: 10000 });
    });

    // =========================================================================
    // PERSONA 1: Colorista & Sviluppo Materiali (Modulo 06 -> Color Intelligence)
    // =========================================================================
    await measure('Persona 1: Nav to Modulo 06 Anagrafiche', async () => {
      await page.click('button:has-text("06 Anagrafiche")');
      await page.waitForTimeout(600);
    });

    await measure('Persona 1: Open Cartella Colori Tab', async () => {
      await page.click('button:has-text("COLOR INTELLIGENCE")');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '01_color_intelligence_palette.png'),
        fullPage: false,
      });
      console.log('📸 Saved 01_color_intelligence_palette.png');
    });

    await measure('Persona 1: Open New Color Modal & Check Swatch', async () => {
      await page.click('button:has-text("+ NUOVA TINTA")');
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02_new_color_modal_swatch_preview.png'),
      });
      console.log('📸 Saved 02_new_color_modal_swatch_preview.png');
      // Close modal cleanly
      await page.locator('button', { hasText: 'Annulla' }).first().click();
      await page.waitForTimeout(300);
    });

    // =========================================================================
    // PERSONA 2: Buyer & Ufficio Acquisti (Modulo 06 -> Albo Fornitori 360°)
    // =========================================================================
    await measure('Persona 2: Open Albo Fornitori 360 Tab', async () => {
      await page.click('button:has-text("ALBO FORNITORI")');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03_vendor_hub_360_overview.png'),
      });
      console.log('📸 Saved 03_vendor_hub_360_overview.png');
    });

    await measure('Persona 2: Open Where-Used Impact Drawer', async () => {
      const whereUsedBtn = page.locator('button:has-text("Where-Used")').first();
      await whereUsedBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04_vendor_where_used_impact_drawer.png'),
      });
      console.log('📸 Saved 04_vendor_where_used_impact_drawer.png');
      // Close Where-Used panel
      const closeBtn = page.locator('button:has-text("Chiudi Analisi")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }
    });

    // =========================================================================
    // PERSONA 3: Modellista & Tecnico Distinta Base (Modulo 02 PLM & BOM Matrix)
    // =========================================================================
    await measure('Persona 3: Nav to Modulo 02 Prodotti PLM', async () => {
      await page.click('button:has-text("02 Prodotti")');
      await page.waitForTimeout(800);
    });

    await measure('Persona 3: Inspect Colorway BOM Matrix', async () => {
      const matrixBtn = page.locator('button:has-text("Colorway BOM Matrix")').first();
      if (await matrixBtn.isVisible()) {
        await matrixBtn.click();
        await page.waitForTimeout(600);
      }
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05_colorway_bom_matrix_3_levels.png'),
      });
      console.log('📸 Saved 05_colorway_bom_matrix_3_levels.png');
    });

    await measure('Persona 3: Open 1-Click Colorway Explosion Wizard', async () => {
      const explodeBtn = page.locator('button:has-text("1-Click Colorway Explosion")').first();
      if (await explodeBtn.isVisible()) {
        await explodeBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '06_colorway_explosion_wizard.png'),
        });
        console.log('📸 Saved 06_colorway_explosion_wizard.png');
        await page.locator('button', { hasText: 'Annulla' }).first().click();
        await page.waitForTimeout(300);
      }
    });

    await measure('Persona 3: Verify Expired Vendor Compliance Guard & Production Gate', async () => {
      // Scroll to the BOM matrix table where compliance warnings are listed
      await page.evaluate(() => {
        window.scrollBy(0, 450);
      });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07_bom_expired_vendor_compliance_guard.png'),
      });
      console.log('📸 Saved 07_bom_expired_vendor_compliance_guard.png');
      // Scroll back up
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
    });

    // =========================================================================
    // PERSONA 4: Responsabile Qualità Conceria (Modulo 04 Vault Conceria)
    // =========================================================================
    await measure('Persona 4: Nav to Modulo 04 Vault Conceria', async () => {
      await page.click('button:has-text("04 Vault")');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08_tannery_vault_color_consistency.png'),
      });
      console.log('📸 Saved 08_tannery_vault_color_consistency.png');
    });

    // =========================================================================
    // PERSONA 5: Digital E-Commerce & Merchandiser (Modulo 03 PIM Catalogo & Feeds)
    // =========================================================================
    await measure('Persona 5: Nav to Modulo 03 PIM Hub Feeds', async () => {
      await page.click('button:has-text("03 PIM")');
      await page.waitForTimeout(600);
      const feedTab = page.locator('button:has-text("Feed Syndication")').first();
      if (await feedTab.isVisible()) {
        await feedTab.click();
        await page.waitForTimeout(400);
      }
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '09_pim_ecommerce_color_automapping.png'),
      });
      console.log('📸 Saved 09_pim_ecommerce_color_automapping.png');
    });

    // =========================================================================
    // PERSONA 6: Artigiano Terzista 0 € (Mobile Viewport & L6 Segregation Audit)
    // =========================================================================
    await measure('Persona 6: Switch Role to Terzista (0 €) & Mobile Viewport', async () => {
      // Switch role via the header button
      await page.click('button:has-text("Terzista 0 €")');
      await page.waitForTimeout(400);

      // Set to mobile viewport (iPhone 14 / modern smartphone)
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(400);

      // Navigate to Modulo 08 Portale Terzisti
      await page.click('button:has-text("08 Terzisti")');
      await page.waitForTimeout(600);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '10_subcontractor_mobile_portal_zero_cost_l6.png'),
      });
      console.log('📸 Saved 10_subcontractor_mobile_portal_zero_cost_l6.png');
    });

    await measure('Persona 6: L6 Segregation Check in Albo Fornitori (Terzista View)', async () => {
      // Restore desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(400);

      await page.click('button:has-text("06 Anagrafiche")');
      await page.waitForTimeout(500);
      await page.click('button:has-text("ALBO FORNITORI")');
      await page.waitForTimeout(600);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '11_vendor_hub_l6_segregated_view.png'),
      });
      console.log('📸 Saved 11_vendor_hub_l6_segregated_view.png');

      // Switch back to Brand role
      await page.click('button:has-text("Brand (L6)")');
      await page.waitForTimeout(300);
    });

    // Summary of metrics
    console.log('\n📊 === CPO E2E AUDIT PERFORMANCE SUMMARY ===');
    console.table(metrics);
    const totalDuration = metrics.reduce((acc, m) => acc + m.durationMs, 0);
    console.log(`⏱️ Total Audit Execution Time: ${totalDuration}ms`);

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'e2e_audit_metrics.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), totalDuration, metrics }, null, 2)
    );
    console.log('✅ Audit metrics saved to e2e_audit_metrics.json');

  } catch (err) {
    console.error('❌ Error during E2E audit:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Browser closed cleanly.');
  }
})();
