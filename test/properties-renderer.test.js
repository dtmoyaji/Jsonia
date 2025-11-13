/* @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

describe('properties renderer', () => {
  beforeAll(() => {
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'jsonia-editor', 'js', 'editor-interactions.js'),
      'utf8'
    );
    eval(src);
  });

  test('renders basic properties and updates element text', () => {
    const props = document.createElement('div');
    document.body.appendChild(props);
    const renderer = window.JsoniaEditor.createPropertiesRenderer(props);

    const el = document.createElement('div');
    el.setAttribute('data-type', 'test');
    el.innerText = 'Hello';

    renderer(el);
    expect(props.textContent).toContain('Component: test');

    const input = props.querySelector('input');
    expect(input).not.toBeNull();
    input.value = 'World';
    input.dispatchEvent(new Event('change'));
    expect(el.innerText).toBe('World');
  });
});
