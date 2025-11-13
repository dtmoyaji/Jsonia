/* @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

describe('basic components accessibility and rendering', () => {
  beforeAll(() => {
    // load interactions and canvas to ensure helpers exist
    const ii = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'editor-interactions.js'),
      'utf8'
    );
    eval(ii);
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'canvas.js'),
      'utf8'
    );
    // minimal DOM
    document.body.innerHTML = `
      <div id="canvas" style="position:relative;width:600px;height:400px"></div>
      <div id="props-content"></div>
      <button id="btn-save"></button>
      <button id="btn-new"></button>
      <button id="btn-undo"></button>
      <button id="btn-redo"></button>
    `;
    eval(src);
  });

  const components = ['button', 'dropdown', 'tabs', 'accordion'];

  components.forEach((type) => {
    test(`renders ${type} and has accessible attributes`, () => {
      const el = window.createComponentFromTemplate({ type }, 10, 10);
      expect(el).not.toBeNull();
      // should have data-component-id and tabindex
      expect(el.getAttribute('data-component-id')).toBeTruthy();
      expect(el.getAttribute('tabindex')).toBe('0');
      // role listitem should be present
      expect(el.getAttribute('role')).toBe('listitem');
    });
  });
});
