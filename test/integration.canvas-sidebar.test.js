/* @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

describe('integration: canvas and sidebar interaction', () => {
  beforeAll(() => {
    const ii = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'editor-interactions.js'),
      'utf8'
    );
    eval(ii);
    // minimal DOM
    document.body.innerHTML = `
      <div id="canvas" style="position:relative;width:600px;height:400px"></div>
      <div id="structure-tree"></div>
      <div id="props-content"></div>
      <button id="btn-save"></button>
      <button id="btn-new"></button>
      <button id="btn-undo"></button>
      <button id="btn-redo"></button>
    `;
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'canvas.js'),
      'utf8'
    );
    eval(src);
  });

  test('drop creates element reflected in tree and properties panel updates', () => {
    const canvas = document.getElementById('canvas');
    // simulate palette drop by directly creating element
    const el = window.createComponentFromTemplate({ type: 'button' }, 40, 40);
    expect(el).not.toBeNull();
    expect(canvas.querySelector('[data-component-id]')).not.toBeNull();

    // tree should contain nodes
    const tree = document.getElementById('structure-tree');
    expect(tree.querySelectorAll('.tree-node').length).toBeGreaterThan(0);

    // click first tree node -> should select element and render props
    const node = tree.querySelector('.tree-node');
    node.click();
    const selected = canvas.querySelector('.selected');
    expect(selected).not.toBeNull();

    const props = document.getElementById('props-content');
    // properties renderer should have rendered content (createPropertiesRenderer exists)
    expect(props.textContent.length).toBeGreaterThan(0);
  });
});
