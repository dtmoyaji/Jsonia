(function () {
  window.JsoniaEditor = window.JsoniaEditor || {};

  // Create and attach editor-level drag/drop event handlers.
  // Options: { canvas: HTMLElement, paletteSelector: string, onDrop: function(template, type, x, y) }
  function createEditorEvents({ canvas, paletteSelector = '.palette .component', onDrop } = {}) {
    if (!canvas) throw new Error('canvas required');

    function handlePaletteDragStart(it, e) {
      try {
        const comp = {};
        // include dataset if available
        for (const k of Object.keys(it.dataset || {})) comp[k] = it.dataset[k];
        e.dataTransfer.setData('application/json', JSON.stringify(comp));
      } catch (err) {
        // ignore
      }
      e.dataTransfer.setData(
        'text/plain',
        (it.dataset && (it.dataset.type || it.dataset.filename)) || ''
      );
    }

    function attachPalette() {
      const items = document.querySelectorAll(paletteSelector);
      items.forEach((it) => {
        it.addEventListener('dragstart', (e) => handlePaletteDragStart(it, e));
      });
    }

    function onCanvasDragOver(e) {
      e.preventDefault();
    }

    function onCanvasDrop(e) {
      e.preventDefault();
      const json = e.dataTransfer.getData('application/json');
      const type = e.dataTransfer.getData('text/plain');
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left + canvas.scrollLeft;
      const y = e.clientY - rect.top + canvas.scrollTop;

      if (json) {
        try {
          const tpl = JSON.parse(json);
          if (typeof onDrop === 'function') return onDrop(tpl, type, x, y, e);
        } catch (err) {
          // fallthrough
        }
      }
      if (typeof onDrop === 'function') return onDrop(null, type, x, y, e);
    }

    // Attach
    canvas.addEventListener('dragover', onCanvasDragOver);
    canvas.addEventListener('drop', onCanvasDrop);
    attachPalette();

    return {
      detach() {
        canvas.removeEventListener('dragover', onCanvasDragOver);
        canvas.removeEventListener('drop', onCanvasDrop);
        // removal of palette handlers is not tracked individually
      },
    };
  }

  window.JsoniaEditor.createEditorEvents = createEditorEvents;
})();
