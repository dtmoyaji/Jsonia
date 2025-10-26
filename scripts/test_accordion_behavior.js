const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  const editorPath = path.join(process.cwd(), 'jsonia-editor');

  // Build minimal HTML using the accordion component template
  const accordionHtml = `
    <div class="accordion">
      <div class="accordion-item" data-accordion-id="test-1">
        <div class="accordion-header expanded" data-accordion-header="true" data-accordion-id="test-1">
          <span class="accordion-icon">▼</span>
          <span>テストセクション</span>
        </div>
        <div class="accordion-content" data-accordion-content="test-1" data-slot="children"></div>
      </div>
    </div>
  `;

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${accordionHtml}</body></html>`;

  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.Node = window.Node;

  // load runtime and actions into the window
  const runtimeSrc = fs.readFileSync(path.join(process.cwd(), 'public/js/jsonia-runtime.js'), 'utf8');
  const actionsSrc = fs.readFileSync(path.join(process.cwd(), 'public/js/jsonia-runtime-actions.js'), 'utf8');

  // Evaluate runtime first, then actions
  window.eval(runtimeSrc);
  window.eval(actionsSrc);

  // Ensure helper extensions applied if needed (actions file applies them when window.JsoniaRuntime exists)
  if (window.extendJsoniaRuntimeWithActions && window.JsoniaRuntime) {
    window.extendJsoniaRuntimeWithActions(window.JsoniaRuntime);
    window.addJsoniaRuntimeHelpers(window.JsoniaRuntime);
  }

  // Load component behavior definition
  const behaviorPath = path.join(process.cwd(), 'components', 'accordion-with-behavior', 'behavior.json');
  const behaviorDef = JSON.parse(fs.readFileSync(behaviorPath, 'utf8'));

  // Convert events that reference an action name into events with action definitions
  const eventsForInit = (behaviorDef.events || []).map(ev => {
    if (ev.actions) return ev;
    if (ev.action && behaviorDef.actions && behaviorDef.actions[ev.action]) {
      return { ...ev, actions: [behaviorDef.actions[ev.action]] };
    }
    return ev;
  });

  // Create runtime and init with behavior def
  const runtime = new window.JsoniaRuntime();
  // Put sharedComponents state minimal so renderComponentFromJSON can find if necessary
  runtime.setState('sharedComponents', []);

  // initialize events and actions
  runtime.init({ events: eventsForInit, actions: behaviorDef.actions, methods: behaviorDef.methods });

  // helper to query elements
  const header = document.querySelector('[data-accordion-header]');
  const icon = header.querySelector('.accordion-icon');
  const content = document.querySelector('[data-accordion-content]');

  console.log('Initial classes:', { header: header.className, icon: icon.className, content: content.className });

  // Simulate first click (should toggle to collapsed and add rotated)
  header.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));

  console.log('After 1st click classes:', { header: header.className, icon: icon.className, content: content.className });

  // Capture state after first click
  const after1Rotated = icon.classList.contains('rotated');

  // Simulate second click (should toggle back to expanded and remove rotated)
  header.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));

  console.log('After 2nd click classes:', { header: header.className, icon: icon.className, content: content.className });

  // Capture state after second click
  const after2Rotated = icon.classList.contains('rotated');

  console.log('\nTest results:');
  console.log(' - rotated after first click:', after1Rotated);
  console.log(' - rotated after second click (should be false):', !after2Rotated ? false : after2Rotated);

  // output exit code semantics
  if (after1Rotated && !after2Rotated) {
    console.log('SUCCESS: icon toggles correctly');
    process.exit(0);
  } else {
    console.error('FAIL: icon did not toggle as expected');
    process.exit(2);
  }
})();
