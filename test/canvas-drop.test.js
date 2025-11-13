/* @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

describe('canvas drop / select / delete flow', () => {
  beforeAll(() => {
    // load interactions helper first (so canvas can use it)
    const ii = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'editor-interactions.js'),
      'utf8'
    );
    eval(ii);
    // ensure DOM has canvas and required controls before loading canvas.js
    const html =
      '<div id="canvas" style="position:relative;width:600px;height:400px"></div>' +
      '<div id="props-content"></div>' +
      '<button id="btn-save"></button>' +
      '<button id="btn-new"></button>' +
      '<button id="btn-undo"></button>' +
      '<button id="btn-redo"></button>';
    document.body.innerHTML = html + document.body.innerHTML;
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'canvas.js'),
      'utf8'
    );
    eval(src);
  });

  test('create component via template, select it, then delete it', (done) => {
    // use createComponentFromTemplate exposed by canvas.js
    expect(typeof window.createComponentFromTemplate).toBe('function');
    window.createComponentFromTemplate({ type: 'button' }, 30, 30);
    // element appended
    const canvas = document.getElementById('canvas');
    const created = canvas.querySelector('[data-component-id]');
    expect(created).not.toBeNull();

    // click to select
    created.click();
    expect(created.classList.contains('selected')).toBe(true);

    // dispatch Delete keydown to remove
    const ev = new KeyboardEvent('keydown', { key: 'Delete' });
    created.dispatchEvent(ev);

    // deletion is synchronous in handler; ensure removed
    setTimeout(() => {
      const after = canvas.querySelector('[data-component-id]');
      expect(after).toBeNull();
      done();
    }, 10);
  });
});
