/* @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

describe('editor-interactions', () => {
  let createInteractions;

  beforeAll(() => {
    const file = path.join(__dirname, '..', 'jsonia-editor', 'js', 'editor-interactions.js');
    const src = fs.readFileSync(file, 'utf8');
    // evaluate the module in the test environment
    eval(src);
    createInteractions = window.JsoniaEditor.createInteractions;
  });

  test('createPreview creates a ghost element and controls it', () => {
    const canvas = document.createElement('div');
    document.body.appendChild(canvas);
    const interactions = createInteractions({ canvas });
    const preview = interactions.createPreview();
    expect(typeof preview.show).toBe('function');
    preview.show('hello', 10, 10);
    // ghost should be present in DOM
    const ghost = document.querySelector('.jsonia-ghost');
    expect(ghost).not.toBeNull();
    expect(ghost.textContent).toContain('hello');
    preview.move(20, 20);
    preview.hide();
    expect(ghost.style.display).toBe('none');
    preview.destroy();
    expect(document.querySelector('.jsonia-ghost')).toBeNull();
  });

  test('placeholder controller shows and clears placeholder and highlight', () => {
    const canvas = document.createElement('div');
    canvas.style.position = 'relative';
    canvas.style.width = '400px';
    canvas.style.height = '400px';
    document.body.appendChild(canvas);
    const interactions = createInteractions({ canvas });
    const ctrl = interactions.createPlaceholderController();

    // add some draggable elements to canvas
    const a = document.createElement('div');
    a.className = 'draggable';
    a.style.left = '10px';
    a.style.top = '10px';
    a.style.height = '40px';
    canvas.appendChild(a);

    const b = document.createElement('div');
    b.className = 'draggable';
    b.style.left = '10px';
    b.style.top = '100px';
    b.style.height = '40px';
    canvas.appendChild(b);

    // show placeholder near top (should insert before first element)
    ctrl.showAt(20);
    let ph = canvas.querySelector('.jsonia-placeholder');
    expect(ph).not.toBeNull();

    // highlight element b
    ctrl.highlight(b);
    expect(b.classList.contains('jsonia-highlight')).toBe(true);

    // clear highlight
    ctrl.clearHighlight();
    expect(b.classList.contains('jsonia-highlight')).toBe(false);

    // clear placeholder
    ctrl.clear();
    ph = canvas.querySelector('.jsonia-placeholder');
    expect(ph).toBeNull();
  });
});
