/* Editor interactions: draggable, selection, history (shared) */
(function () {
  window.JsoniaEditor = window.JsoniaEditor || {};

  function createInteractions({ canvas, _props, onSelect } = {}) {
    if (!canvas) throw new Error('canvas element required');

    // ensure common CSS variables for editor UI are present
    function ensureCssVariables() {
      try {
        if (document.getElementById('jsonia-variables-style')) return;
        const s = document.createElement('style');
        s.id = 'jsonia-variables-style';
        s.textContent = `:root{
  --jsonia-ghost-bg: rgba(43,108,176,0.08);
  --jsonia-ghost-border: rgba(43,108,176,0.18);
  --jsonia-placeholder-bg: rgba(16,24,40,0.03);
  --jsonia-highlight: rgba(43,108,176,0.12);
}`;
        document.head.appendChild(s);
      } catch (err) {
        /* ignore */
      }
    }

    ensureCssVariables();

    let selected = null;
    let dragState = null;
    const history = [];
    let historyIndex = -1;

    function pushHistory() {
      const snapshot = canvas.innerHTML;
      history.splice(historyIndex + 1);
      history.push(snapshot);
      historyIndex = history.length - 1;
    }

    function undo() {
      if (historyIndex > 0) {
        historyIndex--;
        canvas.innerHTML = history[historyIndex];
        attachHandlers();
      }
    }

    function redo() {
      if (historyIndex < history.length - 1) {
        historyIndex++;
        canvas.innerHTML = history[historyIndex];
        attachHandlers();
      }
    }

    function attachDraggable(el) {
      el.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('resize-handle')) {
          dragState = {
            type: 'resize',
            el,
            startX: e.clientX,
            startY: e.clientY,
            startW: el.offsetWidth,
            startH: el.offsetHeight,
          };
        } else {
          dragState = {
            type: 'move',
            el,
            startX: e.clientX,
            startY: e.clientY,
            origX: parseInt(el.style.left || 0, 10),
            origY: parseInt(el.style.top || 0, 10),
          };
        }
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });

      el.addEventListener('pointermove', (e) => {
        if (!dragState) return;
        if (dragState.el !== el) return;
        if (dragState.type === 'move') {
          const dx = e.clientX - dragState.startX;
          const dy = e.clientY - dragState.startY;
          el.style.left = dragState.origX + dx + 'px';
          el.style.top = dragState.origY + dy + 'px';
        } else if (dragState.type === 'resize') {
          const dx = e.clientX - dragState.startX;
          const dy = e.clientY - dragState.startY;
          el.style.width = Math.max(40, dragState.startW + dx) + 'px';
          el.style.height = Math.max(20, dragState.startH + dy) + 'px';
        }
      });

      el.addEventListener('pointerup', (e) => {
        if (!dragState) return;
        el.releasePointerCapture(e.pointerId);
        dragState = null;
        pushHistory();
      });

      el.addEventListener('click', (e) => {
        selectElement(el);
        e.stopPropagation();
      });

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          el.remove();
          pushHistory();
        }
      });
    }

    function selectElement(el) {
      if (selected) selected.classList.remove('selected');
      selected = el;
      if (el) el.classList.add('selected');
      if (typeof onSelect === 'function') onSelect(el);
    }

    function attachHandlers() {
      document.querySelectorAll('.draggable').forEach((el) => {
        if (!el._attached) {
          attachDraggable(el);
          el._attached = true;
        }
      });
    }

    // initialize
    attachHandlers();

    return {
      pushHistory,
      undo,
      redo,
      attachDraggable,
      attachHandlers,
      selectElement,
      getSelected: () => selected,
      // create a lightweight drag preview (ghost) manager
      createPreview: function () {
        let ghost = null;
        function ensureStyle() {
          if (document.getElementById('jsonia-ghost-style')) return;
          const s = document.createElement('style');
          s.id = 'jsonia-ghost-style';
          s.textContent = `
          .jsonia-ghost{position:fixed;pointer-events:none;z-index:9999;padding:6px 10px;border-radius:6px;background:var(--jsonia-ghost-bg,rgba(43,108,176,0.08));border:1px solid rgba(43,108,176,0.18);box-shadow:0 6px 18px rgba(16,24,40,0.12);font-size:12px;color:#1f2d3d}
          `;
          document.head.appendChild(s);
        }

        function create() {
          if (!ghost) {
            ghost = document.createElement('div');
            ghost.className = 'jsonia-ghost';
            ghost.style.display = 'none';
            document.body.appendChild(ghost);
          }
          return ghost;
        }

        return {
          show: function (content, x, y) {
            ensureStyle();
            const g = create();
            if (typeof content === 'string') g.innerHTML = content;
            else if (content instanceof Node) {
              g.innerHTML = '';
              g.appendChild(content);
            }
            g.style.left = x + 8 + 'px';
            g.style.top = y + 8 + 'px';
            g.style.display = 'block';
          },
          move: function (x, y) {
            if (!ghost) return;
            ghost.style.left = x + 8 + 'px';
            ghost.style.top = y + 8 + 'px';
          },
          hide: function () {
            if (!ghost) return;
            ghost.style.display = 'none';
            ghost.innerHTML = '';
          },
          destroy: function () {
            if (!ghost) return;
            ghost.remove();
            ghost = null;
          },
        };
      },
      // placeholder and highlight helpers for drag/drop UX
      createPlaceholderController: function () {
        let _placeholderEl = null;
        let _currentHighlight = null;

        function ensurePlaceholder() {
          if (!_placeholderEl) {
            _placeholderEl = document.createElement('div');
            _placeholderEl.className = 'jsonia-placeholder';
            _placeholderEl.style.minHeight = '36px';
          }
          return _placeholderEl;
        }

        function showAt(y) {
          const rect = canvas.getBoundingClientRect();
          const candidates = Array.from(canvas.querySelectorAll('.draggable')).filter((n) => {
            return !n.classList.contains('canvas-hint');
          });
          let insertBeforeNode = null;
          for (let ch of candidates) {
            const chRect = ch.getBoundingClientRect();
            const chTop = chRect.top - rect.top + canvas.scrollTop;
            if (y < chTop + chRect.height / 2) {
              insertBeforeNode = ch;
              break;
            }
          }
          const ph = ensurePlaceholder();
          if (insertBeforeNode) canvas.insertBefore(ph, insertBeforeNode);
          else if (ph.parentNode !== canvas) canvas.appendChild(ph);
        }

        function clear() {
          if (_placeholderEl && _placeholderEl.parentNode) {
            _placeholderEl.parentNode.removeChild(_placeholderEl);
          }
          _placeholderEl = null;
        }

        function highlight(el) {
          if (_currentHighlight && _currentHighlight !== el) {
            _currentHighlight.classList.remove('jsonia-highlight');
          }
          if (el) el.classList.add('jsonia-highlight');
          _currentHighlight = el;
        }

        function clearHighlight() {
          if (_currentHighlight) {
            _currentHighlight.classList.remove('jsonia-highlight');
            _currentHighlight = null;
          }
        }

        return { showAt, clear, highlight, clearHighlight };
      },
    };
  }

  window.JsoniaEditor.createInteractions = createInteractions;

  // simple properties renderer factory
  window.JsoniaEditor.createPropertiesRenderer = function (propsContainer) {
    return function renderProps(el) {
      if (!propsContainer) return;
      if (!el) {
        propsContainer.innerHTML = '<div>Select a component on the canvas</div>';
        return;
      }
      const type = el.getAttribute('data-type') || el.dataset.type || el.tagName.toLowerCase();
      const id = el.getAttribute('data-component-id') || '';
      propsContainer.innerHTML = '';
      const title = document.createElement('div');
      title.textContent = 'Component: ' + type;
      propsContainer.appendChild(title);

      const idLabel = document.createElement('div');
      idLabel.textContent = 'id: ' + id;
      propsContainer.appendChild(idLabel);

      // editable label (if present as innerText)
      const labelRow = document.createElement('div');
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = el.innerText || '';
      labelRow.appendChild(labelInput);
      propsContainer.appendChild(labelRow);

      labelInput.addEventListener('change', () => {
        try {
          if (el.tagName.toLowerCase() === 'div' && el.querySelector('button')) {
            // update button text if button exists
            const btn = el.querySelector('button');
            if (btn) btn.textContent = labelInput.value;
          } else {
            el.innerText = labelInput.value;
          }
        } catch (err) {
          /* ignore */
        }
      });
    };
  };
})();
