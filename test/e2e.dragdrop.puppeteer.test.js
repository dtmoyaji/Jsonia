// Puppeteer E2E test scaffold for drag/drop (skipped by default)
// To run: set RUN_E2E=1 and run `npm test` (this will run the test)
const puppeteer = require('puppeteer');
const child = require('child_process');
const http = require('http');

const describeIf = process.env.RUN_E2E ? describe : describe.skip;

describeIf('E2E: drag and drop (puppeteer)', () => {
  let browser;
  let serverProc;

  beforeAll(async () => {
    // start the server
    serverProc = child.spawn('node', ['server/jsonia.js'], { stdio: 'inherit' });
    // wait for server to be ready (simple HTTP probe)
    const max = Date.now() + 10000;
    while (Date.now() < max) {
      try {
        await new Promise((resolve, _reject) => {
          const req = http.get('http://localhost:3000', (res) => {
            res.resume();
            resolve();
          });
          req.on('error', () => {
            setTimeout(resolve, 200);
          });
        });
        break;
      } catch (e) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    browser = await puppeteer.launch({ headless: true });
  }, 20000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (serverProc) serverProc.kill();
  });

  test('drag from palette to canvas shows placeholder and inserts element', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/jsonia-editor/test-components.html');

    // TODO: implement realistic drag-and-drop using Puppeteer helper
    // This is a scaffold; running E2E requires additional CI setup.
    expect(true).toBe(true);
  });
});
