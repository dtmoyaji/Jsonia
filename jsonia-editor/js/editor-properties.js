(function () {
  window.JsoniaEditor = window.JsoniaEditor || {};

  // create a properties renderer bound to a container element
  function createPropertiesRenderer(container) {
    if (!container) throw new Error('container required');

    function renderProperties(el) {
      if (!el) {
        container.innerHTML = 'Select a component on the canvas';
        return;
      }

      const type = el.dataset.type || el.getAttribute('data-type');
      container.innerHTML = '';

      const header = document.createElement('div');
      header.innerHTML = `<b>Type</b>: ${type}`;
      container.appendChild(header);

      // Position
      const posSection = document.createElement('div');
      posSection.className = 'section';
      const leftLabel = document.createElement('label');
      leftLabel.innerText = 'X:';
      const inputX = document.createElement('input');
      inputX.type = 'number';
      inputX.value = parseInt(el.style.left || 0, 10);
      inputX.addEventListener('change', () => {
        el.style.left = inputX.value + 'px';
      });
      posSection.appendChild(leftLabel);
      posSection.appendChild(inputX);

      const topLabel = document.createElement('label');
      topLabel.innerText = 'Y:';
      const inputY = document.createElement('input');
      inputY.type = 'number';
      inputY.value = parseInt(el.style.top || 0, 10);
      inputY.addEventListener('change', () => {
        el.style.top = inputY.value + 'px';
      });
      posSection.appendChild(topLabel);
      posSection.appendChild(inputY);
      container.appendChild(posSection);

      // Common
      const commonSection = document.createElement('div');
      commonSection.className = 'section';
      const classLabel = document.createElement('label');
      classLabel.innerText = 'Class';
      const classInput = document.createElement('input');
      classInput.type = 'text';
      classInput.value = el.getAttribute('data-class') || '';
      classInput.addEventListener('change', () => {
        const v = classInput.value.trim();
        if (v) el.setAttribute('data-class', v);
        else el.removeAttribute('data-class');
        el.className = 'draggable' + (v ? ' ' + v : '');
      });
      commonSection.appendChild(classLabel);
      commonSection.appendChild(classInput);
      container.appendChild(commonSection);
    }

    return renderProperties;
  }

  window.JsoniaEditor.createPropertiesRenderer = createPropertiesRenderer;
})();
