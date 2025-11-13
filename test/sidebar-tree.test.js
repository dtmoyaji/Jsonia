/* @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

describe('sidebar structure tree', () => {
  beforeAll(() => {
    const ii = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'editor-interactions.js'),
      'utf8'
    );
    eval(ii);
    // minimal DOM including buttons expected by canvas.js
    document.body.innerHTML =
      '<div id="canvas" style="position:relative;width:600px;height:400px"></div>' +
      '<div id="structure-tree"></div>' +
      '<div id="props-content"></div>' +
      '<button id="btn-save"></button>' +
      '<button id="btn-new"></button>' +
      '<button id="btn-undo"></button>' +
      '<button id="btn-redo"></button>';
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'canvas.js'),
      'utf8'
    );
    eval(src);
  });

  test('clicking tree node selects canvas element', () => {
    const canvas = document.getElementById('canvas');
    // create two elements
    window.createComponentFromTemplate({ type: 'button' }, 10, 10);
    window.createComponentFromTemplate({ type: 'card' }, 20, 60);
    // tree should be built by createComponentFromTemplate during creation
    const tree = document.getElementById('structure-tree');
    expect(tree).not.toBeNull();
    const nodes = tree.querySelectorAll('.tree-node');
    expect(nodes.length).toBeGreaterThanOrEqual(2);

    // click second node
    nodes[1].click();
    // ensure selected on canvas
    const selected = canvas.querySelector('.selected');
    expect(selected).not.toBeNull();
    // the selected element id should match node's data-component-id
    const nodeId = nodes[1].getAttribute('data-component-id');
    expect(selected.getAttribute('data-component-id')).toBe(nodeId);
  });
});
