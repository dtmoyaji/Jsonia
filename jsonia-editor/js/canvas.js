(() => {
  const canvas = document.getElementById('canvas');
  const paletteItems = document.querySelectorAll('.palette .component');
  const props = document.getElementById('props-content');
  const btnSave = document.getElementById('btn-save');
  const btnNew = document.getElementById('btn-new');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');

  // properties renderer: use shared module if present
  const renderProperties =
    window.JsoniaEditor && typeof window.JsoniaEditor.createPropertiesRenderer === 'function'
      ? window.JsoniaEditor.createPropertiesRenderer(props)
      : function (el) {
          if (!el) {
            props.innerHTML = 'Select a component on the canvas';
            return;
          }
          props.innerHTML = '<pre>' + (el.dataset.type || el.getAttribute('data-type')) + '</pre>';
        };

  const interactions =
    window.JsoniaEditor && typeof window.JsoniaEditor.createInteractions === 'function'
      ? window.JsoniaEditor.createInteractions({ canvas, props, onSelect: renderProperties })
      : null;
  const hasCore =
    window.JsoniaEditor && typeof window.JsoniaEditor.createElementFromTemplate === 'function';

  // accessibility: aria-live announcer
  (function ensureAriaLiveRoot() {
    if (!document.getElementById('jsonia-aria-live')) {
      const live = document.createElement('div');
      live.id = 'jsonia-aria-live';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      live.style.position = 'absolute';
      live.style.width = '1px';
      live.style.height = '1px';
      live.style.overflow = 'hidden';
      live.style.clip = 'rect(1px, 1px, 1px, 1px)';
      live.style.whiteSpace = 'nowrap';
      live.style.border = '0';
      document.body.appendChild(live);
    }
  })();

  function announce(msg) {
    try {
      const live = document.getElementById('jsonia-aria-live');
      if (!live) return;
      live.textContent = '';
      setTimeout(() => {
        live.textContent = msg;
      }, 10);
    } catch (err) {
      // ignore
    }
  }

  // attach editor-wide drag/drop handlers via shared module if available
  if (window.JsoniaEditor && typeof window.JsoniaEditor.createEditorEvents === 'function') {
    window.JsoniaEditor.createEditorEvents({
      canvas,
      onDrop: (tpl, type, x, y) => {
        if (tpl) createComponentFromTemplate(tpl, x, y);
        else createComponent(type, x, y);
        if (interactions) interactions.pushHistory();
      },
    });
  } else {
    // fallback: keep local handlers (uses module-scope aria-live and announce)
    let _previewCtrl = null;
    let _isPaletteDragging = false;
    let _placeholderEl = null;

    let _currentHighlight = null;
    const featureFlag = document.documentElement.getAttribute('data-jsonia-dnd');
    const featureEnabled = featureFlag !== 'off';
    const placeholderCtrl =
      featureEnabled &&
      interactions &&
      typeof interactions.createPlaceholderController === 'function'
        ? interactions.createPlaceholderController()
        : null;
    paletteItems.forEach((it) => {
      // ensure palette items are keyboard accessible
      try {
        if (!it.hasAttribute('role')) it.setAttribute('role', 'button');
        if (!it.hasAttribute('tabindex')) it.setAttribute('tabindex', '0');
        if (!it.hasAttribute('aria-label')) {
          it.setAttribute(
            'aria-label',
            it.dataset.type || it.getAttribute('data-type') || 'component'
          );
        }
      } catch (err) {
        // ignore
      }
      it.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', it.dataset.type);
        try {
          e.dataTransfer.setData('application/json', JSON.stringify(it.dataset));
        } catch (err) {
          // ignore
        }

        _isPaletteDragging = true;

        // create a ghost preview if supported
        try {
          if (interactions && typeof interactions.createPreview === 'function') {
            _previewCtrl = interactions.createPreview();
            _previewCtrl.show('<div>' + (it.dataset.type || '') + '</div>', e.clientX, e.clientY);
          }
        } catch (err) {
          _previewCtrl = null;
        }
      });

      // support keyboard insert from palette (Enter / Space)
      it.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const rect = canvas.getBoundingClientRect();
          const cx = rect.left + rect.width / 2 - canvas.scrollLeft;
          const cy = rect.top + rect.height / 2 - canvas.scrollTop;
          const type = it.dataset.type || it.getAttribute('data-type');
          createComponent(type, Math.max(20, Math.floor(cx)), Math.max(20, Math.floor(cy)));
          if (interactions) interactions.pushHistory();
        }
      });
    });

    document.addEventListener('dragover', (e) => {
      if (_previewCtrl && typeof _previewCtrl.move === 'function') {
        _previewCtrl.move(e.clientX, e.clientY);
      }

      // show or move placeholder within the canvas when dragging from palette
      if (_isPaletteDragging) {
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top + canvas.scrollTop;

        // find insertion candidate by vertical position
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

        if (placeholderCtrl) {
          placeholderCtrl.showAt(y);
          // compute nearest candidate for highlight and delegate
          try {
            let nearest = null;
            let nearestDist = Infinity;
            for (let ch of candidates) {
              const chRect = ch.getBoundingClientRect();
              const chCenter = chRect.top - rect.top + canvas.scrollTop + chRect.height / 2;
              const d = Math.abs(y - chCenter);
              if (d < nearestDist) {
                nearestDist = d;
                nearest = ch;
              }
            }
            placeholderCtrl.highlight(nearest);
          } catch (err) {
            // ignore highlight errors
          }
        } else {
          if (!_placeholderEl) {
            _placeholderEl = document.createElement('div');
            _placeholderEl.className = 'jsonia-placeholder';
            _placeholderEl.style.minHeight = '36px';
            _placeholderEl.innerHTML = '';
          }

          if (insertBeforeNode) {
            if (insertBeforeNode !== _placeholderEl) {
              canvas.insertBefore(_placeholderEl, insertBeforeNode);
            }
          } else {
            // append placeholder at the end
            if (_placeholderEl.parentNode !== canvas) canvas.appendChild(_placeholderEl);
          }

          // highlight nearest candidate for visual feedback
          try {
            let nearest = null;
            let nearestDist = Infinity;
            for (let ch of candidates) {
              const chRect = ch.getBoundingClientRect();
              const chCenter = chRect.top - rect.top + canvas.scrollTop + chRect.height / 2;
              const d = Math.abs(y - chCenter);
              if (d < nearestDist) {
                nearestDist = d;
                nearest = ch;
              }
            }

            if (nearest && nearest !== _currentHighlight) {
              if (_currentHighlight) _currentHighlight.classList.remove('jsonia-highlight');
              nearest.classList.add('jsonia-highlight');
              _currentHighlight = nearest;
            }
          } catch (err) {
            // ignore highlight errors
          }
        }
      }

      e.preventDefault();
    });

    document.addEventListener('dragend', () => {
      _isPaletteDragging = false;
      if (_previewCtrl) {
        try {
          _previewCtrl.hide();
          _previewCtrl.destroy && _previewCtrl.destroy();
        } catch (err) {
          /* ignore */
        }
        _previewCtrl = null;
      }
      if (placeholderCtrl) {
        try {
          placeholderCtrl.clear();
        } catch (err) {
          /* ignore */
        }
      } else if (_placeholderEl && _placeholderEl.parentNode) {
        try {
          _placeholderEl.parentNode.removeChild(_placeholderEl);
        } catch (err) {
          /* ignore */
        }
        _placeholderEl = null;
      }
      // clear highlight
      if (_currentHighlight) {
        try {
          _currentHighlight.classList.remove('jsonia-highlight');
        } catch (err) {
          /* ignore */
        }
        _currentHighlight = null;
      }
    });

    canvas.addEventListener('dragover', (e) => e.preventDefault());

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      _isPaletteDragging = false;
      if (_previewCtrl) {
        try {
          _previewCtrl.hide();
          _previewCtrl.destroy && _previewCtrl.destroy();
        } catch (err) {
          /* ignore */
        }
        _previewCtrl = null;
      }

      const json = e.dataTransfer.getData('application/json');
      const type = e.dataTransfer.getData('text/plain');
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left + canvas.scrollLeft;
      const y = e.clientY - rect.top + canvas.scrollTop;

      // optional grid snap when Alt key is pressed during drop
      const snapToGrid = (v, g) => Math.round(v / g) * g;

      let createdEl = null;
      if (json) {
        try {
          const tpl = JSON.parse(json);
          createdEl = createComponentFromTemplate(tpl, x, y);
        } catch (err) {
          createdEl = createComponent(type, x, y);
        }
      } else {
        createdEl = createComponent(type, x, y);
      }

      // if placeholder exists, insert at that position
      let existingPlaceholder = null;
      if (placeholderCtrl) existingPlaceholder = canvas.querySelector('.jsonia-placeholder');
      else
        existingPlaceholder =
          _placeholderEl && _placeholderEl.parentNode === canvas ? _placeholderEl : null;

      if (existingPlaceholder && existingPlaceholder.parentNode === canvas) {
        try {
          canvas.insertBefore(createdEl, existingPlaceholder);
          existingPlaceholder.parentNode.removeChild(existingPlaceholder);
        } catch (err) {
          // fallback: leave created element at end
        }
        if (!placeholderCtrl) _placeholderEl = null;
      }

      // apply optional Alt-grid-snap for precise placement and trigger insertion animation
      try {
        // Ensure initial state for animation
        createdEl.classList.add('jsonia-insert');

        if (e.altKey) {
          const grid = 20;
          createdEl.style.left = snapToGrid(x, grid) + 'px';
          createdEl.style.top = snapToGrid(y, grid) + 'px';
        } else {
          // preserve original coords if not snapped
          createdEl.style.left = x + 'px';
          createdEl.style.top = y + 'px';
        }

        // allow browser to apply initial styles, then remove class to transition to final state
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            createdEl.classList.remove('jsonia-insert');
          });
        });
      } catch (err) {
        // ignore
      }

      // clear highlight after drop
      if (placeholderCtrl) {
        try {
          placeholderCtrl.clearHighlight();
        } catch (err) {
          /* ignore */
        }
      } else if (_currentHighlight) {
        try {
          _currentHighlight.classList.remove('jsonia-highlight');
        } catch (err) {
          /* ignore */
        }
        _currentHighlight = null;
      }

      if (interactions) interactions.pushHistory();
    });
  }

  function createComponent(type, x = 20, y = 20) {
    let el;
    if (hasCore) {
      el = window.JsoniaEditor.createElementFromTemplate({ type, name: type });
    } else {
      el = document.createElement('div');
      el.className = 'draggable';
      el.setAttribute('data-type', type);
      el.setAttribute('tabindex', '0');
      if (type === 'button') {
        el.innerHTML = '<button>Button</button>';
      } else if (type === 'card') {
        el.innerHTML = '<div class="card"><h3>Title</h3><p>Card body</p></div>';
      } else {
        el.innerText = 'Text';
      }
      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      el.appendChild(handle);
    }

    return finalizeElement(el, x, y);
  }

  function createComponentFromTemplate(template, x = 20, y = 20) {
    if (hasCore) {
      const el = window.JsoniaEditor.createElementFromTemplate(template);
      return finalizeElement(el, x, y);
    }
    const type =
      (template && (template.type || template.templateType || template.filename)) || 'component';
    return createComponent(type, x, y);
  }

  // common finalization for created elements (centralize duplicated logic)
  function finalizeElement(el, x = 20, y = 20) {
    try {
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    } catch (err) {
      /* ignore */
    }

    try {
      if (!el.getAttribute('data-component-id')) {
        const id = 'c-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        el.setAttribute('data-component-id', id);
      }
      el.classList.add('canvas-component');
    } catch (err) {
      /* ignore */
    }

    canvas.appendChild(el);

    // accessibility and keyboard handlers
    try {
      el.setAttribute('role', 'listitem');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-grabbed', 'false');
      el.addEventListener('keydown', (ev) => {
        const step = ev.shiftKey ? 1 : 10;
        let moved = false;
        const left = parseInt(el.style.left || 0, 10);
        const top = parseInt(el.style.top || 0, 10);
        if (ev.key === 'ArrowLeft') {
          el.style.left = left - step + 'px';
          moved = true;
        } else if (ev.key === 'ArrowRight') {
          el.style.left = left + step + 'px';
          moved = true;
        } else if (ev.key === 'ArrowUp') {
          el.style.top = top - step + 'px';
          moved = true;
        } else if (ev.key === 'ArrowDown') {
          el.style.top = top + step + 'px';
          moved = true;
        } else if (ev.key === 'Delete' || ev.key === 'Backspace') {
          try {
            if (el.parentNode) el.parentNode.removeChild(el);
            announce('Component removed');
            updateStructureTree();
          } catch (err) {
            /* ignore */
          }
          moved = true;
        }
        if (moved) {
          ev.preventDefault();
          if (interactions) interactions.pushHistory();
        }
      });
    } catch (err) {
      /* ignore */
    }

    if (interactions) interactions.attachDraggable(el);
    else attachDraggableFallback(el);
    if (interactions) interactions.selectElement(el);

    try {
      updateStructureTree();
    } catch (err) {
      /* ignore */
    }

    return el;
  }

  // rebuild the structure tree placed in `#structure-tree` from the current drop-zone
  function updateStructureTree() {
    try {
      // prefer runtime-provided tree updater if available to avoid duplicate implementations
      try {
        if (window.JsoniaEditor && typeof window.JsoniaEditor.updateStructureTree === 'function') {
          window.JsoniaEditor.updateStructureTree();
          return;
        }
      } catch (e) {
        /* ignore and fallback */
      }
      try {
        if (typeof window.updateStructureTree === 'function') {
          window.updateStructureTree();
          return;
        }
      } catch (e) {
        /* ignore and fallback */
      }
      const container = document.getElementById('structure-tree');
      if (!container) return;
      // find the framework drop-zone if present, otherwise fall back to canvas
      const dropZone = document.getElementById('drop-zone') || canvas;

      // recursive traversal to build nested list from elements with class 'canvas-component'

      const buildNode = function (el) {
        const type =
          el.getAttribute('data-component-type') || el.dataset.type || el.tagName.toLowerCase();
        const id = el.getAttribute('data-component-id') || '';
        let html = '';
        html += '<li class="tree-node" data-component-id="' + id + '">';
        html += '<span class="tree-node-label">' + (type || 'component') + '</span>';
        const children = Array.from(el.children).filter(function (c) {
          return c.classList && c.classList.contains('canvas-component');
        });
        if (children.length > 0) {
          html += '<ul class="tree-children">';
          for (let ch of children) {
            html += buildNode(ch);
          }
          html += '</ul>';
        }
        html += '</li>';
        return html;
      };

      // top-level components are direct children of dropZone with class canvas-component
      const top = Array.from(dropZone.querySelectorAll(':scope > .canvas-component'));
      if (top.length === 0) {
        // no components -> show empty state
        container.innerHTML =
          '<div style="padding: 10px; color: #999;">コンポーネントがありません</div>';

        return;
      }
      let out = '<ul class="tree-root">';
      for (let t of top) out += buildNode(t);
      out += '</ul>';
      container.innerHTML = out;
      // attach ARIA roles and click/keyboard handlers to tree for accessibility
      try {
        const rootUl = container.querySelector('.tree-root');
        if (rootUl) {
          rootUl.setAttribute('role', 'tree');
          const nodes = Array.from(rootUl.querySelectorAll('.tree-node'));
          nodes.forEach((node, idx) => {
            node.setAttribute('role', 'treeitem');
            node.setAttribute('tabindex', idx === 0 ? '0' : '-1');
            node.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const id = node.getAttribute('data-component-id');
              if (!id) return;
              const el = dropZone.querySelector('[data-component-id="' + id + '"]');
              if (el) {
                if (interactions && typeof interactions.selectElement === 'function') {
                  interactions.selectElement(el);
                } else {
                  selectElement(el);
                }
              }
            });
            node.addEventListener('keydown', (ev) => {
              const key = ev.key;
              if (key === 'Enter' || key === ' ') {
                ev.preventDefault();
                node.click();
                return;
              }
              // navigation: ArrowDown / ArrowUp / Home / End
              if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
                ev.preventDefault();
                const sibs = Array.from(rootUl.querySelectorAll('.tree-node'));
                let targetIndex = sibs.indexOf(node);
                if (key === 'ArrowDown') targetIndex = Math.min(sibs.length - 1, targetIndex + 1);
                else if (key === 'ArrowUp') targetIndex = Math.max(0, targetIndex - 1);
                else if (key === 'Home') targetIndex = 0;
                else if (key === 'End') targetIndex = sibs.length - 1;
                const target = sibs[targetIndex];
                if (target) {
                  // move tabindex and focus
                  sibs.forEach((n) => n.setAttribute('tabindex', '-1'));
                  target.setAttribute('tabindex', '0');
                  try {
                    target.focus();
                  } catch (err) {
                    /* ignore focus issues */
                  }
                }
              }
            });
          });
        }
      } catch (err) {
        /* ignore */
      }
    } catch (err) {
      // ignore tree update errors
    }
  }

  // expose to browser for component insert (backwards compatibility)
  window.createComponentFromTemplate = createComponentFromTemplate;

  function attachDraggableFallback(el) {
    let startX = 0;
    let startY = 0;
    let initLeft = 0;
    let initTop = 0;
    function onPointerDown(e) {
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      initLeft = parseInt(el.style.left || 0, 10);
      initTop = parseInt(el.style.top || 0, 10);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp, { once: true });
      selectElement(el);
    }
    function onPointerMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = initLeft + dx + 'px';
      el.style.top = initTop + dy + 'px';
    }
    function onPointerUp(_e) {
      el.removeEventListener('pointermove', onPointerMove);
      if (interactions) interactions.pushHistory();
    }
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', () => selectElement(el));
  }

  function selectElement(el) {
    const prev = canvas.querySelector('.selected');
    if (prev) prev.classList.remove('selected');
    if (el) el.classList.add('selected');
    renderProperties(el);
    // Sync selection with structure tree (if present)
    try {
      const tree = document.getElementById('structure-tree');
      if (tree) {
        // clear previous selection
        const prevNode = tree.querySelector('.tree-node.selected');
        if (prevNode) prevNode.classList.remove('selected');
        if (el) {
          const id = el.getAttribute('data-component-id');
          if (id) {
            const node = tree.querySelector('.tree-node[data-component-id="' + id + '"]');
            if (node) {
              node.classList.add('selected');
              // ensure visible
              try {
                node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              } catch (err) {
                /* ignore */
              }
            }
          }
        }
      }
    } catch (err) {
      /* ignore tree sync errors */
    }
  }

  btnNew.addEventListener('click', () => {
    canvas.innerHTML = '<div class="canvas-hint">Drop components here</div>';
    if (interactions) interactions.pushHistory();
  });

  if (interactions) btnUndo.addEventListener('click', interactions.undo);
  if (interactions) btnRedo.addEventListener('click', interactions.redo);

  btnSave.addEventListener('click', async () => {
    const comps = Array.from(document.querySelectorAll('.draggable')).map((el) => ({
      type: el.dataset.type,
      left: el.style.left,
      top: el.style.top,
      width: el.style.width || null,
      height: el.style.height || null,
      html: el.innerHTML,
    }));

    const payload = { projectName: 'editor-draft', content: { components: comps } };
    const saveFn =
      window.JsoniaEditor && typeof window.JsoniaEditor.saveProject === 'function'
        ? window.JsoniaEditor.saveProject
        : async (p) => {
            const r = await fetch('/editor/api/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p),
            });
            if (!r.ok) throw new Error('Save failed');
            return r.json().catch(() => null);
          };

    try {
      await saveFn(payload);
      alert('Saved');
    } catch (err) {
      console.error(err);
      alert('Save failed: ' + (err && err.message ? err.message : 'unknown'));
    }
  });

  // delegate click selection on canvas: click a `.draggable` to select, click empty space to deselect
  canvas.addEventListener('click', (e) => {
    try {
      const target = e.target instanceof Element ? e.target.closest('.draggable') : null;
      if (target) {
        if (interactions && typeof interactions.selectElement === 'function') {
          interactions.selectElement(target);
        } else {
          selectElement(target);
        }
      } else {
        // clicked empty canvas area -> clear selection
        if (interactions && typeof interactions.selectElement === 'function') {
          interactions.selectElement(null);
        } else {
          selectElement(null);
        }
      }
    } catch (err) {
      // ignore
    }
  });
})();
