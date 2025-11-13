const { spawn } = require('child_process');
// Avoid heavy DOM libraries in Jest environment; we'll parse HTML via regex/string

jest.setTimeout(20000);

describe('E2E Smoke (server + HTML parsing)', () => {
  let serverProcess = null;
  const PORT = process.env.E2E_PORT || 4000;

  beforeAll(async () => {
    serverProcess = spawn(process.execPath, ['server/jsonia.js'], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server did not start in time')), 10000);
      serverProcess.stdout.on('data', (chunk) => {
        const str = String(chunk);
        if (str.indexOf(`http://localhost:${PORT}`) !== -1 || /準備完了/.test(str)) {
          clearTimeout(timeout);
          resolve();
        }
      });
      serverProcess.stderr.on('data', () => {
        /* ignore stderr for startup; some warnings are expected */
      });
    });
  });

  afterAll(() => {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch (e) {
        /* ignore */
      }
    }
  });

  test('Editor canvas endpoint returns HTML with canvas hint', async () => {
    const url = `http://localhost:${PORT}/editor/canvas`;
    const getText = (u) =>
      new Promise((resolve, reject) => {
        const { URL } = require('url');
        const parsed = new URL(u);
        const lib = parsed.protocol === 'https:' ? require('https') : require('http');
        lib
          .get(parsed, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => resolve(data));
          })
          .on('error', reject);
      });

    const html = await getText(url);
    const m = html.match(/<[^>]*class=["']canvas-hint["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
    expect(m).not.toBeNull();
    const hint = m[1].trim();
    expect(hint).toMatch(/Drop components here/i);
  });
});
