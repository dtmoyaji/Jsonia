const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async function () {
  console.log('Running simple axe-core audit (dev)');
  try {
    const html = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'test-components.html'),
      'utf8'
    );
    const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    // lazy-load axe
    const axe = require('axe-core');
    const results = await axe.run(dom.window.document);
    console.log('Violations:', results.violations.length);
    results.violations.forEach((v) => {
      console.log(v.id, v.impact, v.help);
      v.nodes.forEach((n) => console.log('  -', n.target.join(', ')));
    });
  } catch (err) {
    console.error('axe audit failed:', err.message || err);
  }
})();
