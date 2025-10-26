// Simple Puppeteer snapshot test for the Jsonia editor accordion
// - saves screenshots before click, after collapse, and after expand
// - saves a small JSON file with classList and computed styles for the content/icon/header
// Usage:
// 1) Ensure the editor server is running (e.g. npm start)
// 2) Install puppeteer if not installed: npm install puppeteer
// 3) node scripts/test_accordion_puppeteer.js

const fs = require('fs');
const path = require('path');

(async () => {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (err) {
    console.error('Puppeteer is not installed. Install it with: npm install puppeteer');
    process.exit(2);
  }

  const outDir = path.join(process.cwd(), 'tmp', 'puppeteer-accordion');
  fs.mkdirSync(outDir, { recursive: true });

  const url = process.env.JSONIA_EDITOR_URL || 'http://localhost:3000/editor';
  console.log('Opening', url);

  const browser = await puppeteer.launch({ headless: true });
  let consoleLines = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    // capture console logs from the page for debugging
    page.on('console', msg => {
      try {
        const args = msg.args();
        Promise.all(args.map(a => a.jsonValue())).then(vals => {
          consoleLines.push({ type: msg.type(), text: vals.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' ') });
        }).catch(() => {
          consoleLines.push({ type: msg.type(), text: msg.text() });
        });
      } catch (e) {
        consoleLines.push({ type: msg.type(), text: msg.text() });
      }
    });

    // Wait up to 10s for the editor to be ready
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    // Inject a deterministic test accordion into the page so we target the correct element
    const testId = 'puppeteer-test';
    const testHtml = `
      <div id="puppeteer-test-root" style="padding:20px;">
        <div class="accordion">
          <div class="accordion-item">
            <div class="accordion-header expanded" data-accordion-header="true" data-accordion-id="${testId}">
              <span class="accordion-icon">▼</span>
              <span>PUppeteer Test Section</span>
            </div>
            <div class="accordion-content" data-accordion-content="${testId}" data-slot="children">
              <p>Test content line</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await page.evaluate(html => {
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.insertBefore(container, document.body.firstChild);
    }, testHtml);

    // Ensure our injected accordion header exists
    const headerSelector = `[data-accordion-id="${testId}"]`;
    await page.waitForSelector(headerSelector, { timeout: 8000 });

    // helper to capture element info
    async function captureState(name) {
      const screenshotPath = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      const info = await page.evaluate((testId) => {
        const header = document.querySelector(`[data-accordion-id="${testId}"]`);
        const content = document.querySelector(`[data-accordion-content="${testId}"]`);
        const icon = header ? header.querySelector('.accordion-icon') : null;
        function computed(el, props) {
          if (!el) return null;
          const cs = getComputedStyle(el);
          const out = {};
          for (const p of props) out[p] = cs.getPropertyValue(p);
          return out;
        }
        return {
          headerClass: header ? [...header.classList] : null,
          contentClass: content ? [...content.classList] : null,
          iconClass: icon ? [...icon.classList] : null,
          headerStyle: header ? header.getAttribute('style') : null,
          contentStyle: content ? content.getAttribute('style') : null,
          iconStyle: icon ? icon.getAttribute('style') : null,
          headerComputed: computed(header, ['background-color','color']),
          contentComputed: computed(content, ['max-height','opacity','display','overflow']),
          iconComputed: computed(icon, ['transform'])
        };
      }, testId);

      fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(info, null, 2));
      console.log('Saved', screenshotPath, 'and', `${name}.json`);
    }

  // small helper sleep for timing (works regardless of Puppeteer version)
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  // Initial snapshot
  await sleep(300); // small delay to settle
  await captureState('initial');

  // Click header -> collapse
  await page.click(headerSelector);
  await sleep(400); // allow CSS transitions
  await captureState('after-collapse');

  // Click header again -> expand
  await page.click(headerSelector);
  await sleep(400);
  await captureState('after-expand');

    console.log('Puppeteer snapshots saved to', outDir);
    } finally {
      // dump collected console logs
      try {
        fs.writeFileSync(path.join(outDir, 'page-console.json'), JSON.stringify(consoleLines, null, 2));
        console.log('Wrote page console to', path.join(outDir, 'page-console.json'));
      } catch (e) {
        console.warn('Could not write console logs', e);
      }
      await browser.close();
    }
})();
