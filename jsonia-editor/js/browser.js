(function () {
  const libContainer = document.getElementById('component-library');
  if (!libContainer) return;

  async function loadLibrary() {
    libContainer.innerHTML = '<div class="lib-loading">Loading library...</div>';
    try {
      const loader =
        window.JsoniaEditor && typeof window.JsoniaEditor.loadComponents === 'function'
          ? window.JsoniaEditor.loadComponents
          : async () => {
              const res = await fetch('/editor/api/components');
              if (!res.ok) throw new Error('Failed to load components');
              return res.json();
            };

      const data = await loader();
      renderLibrary((data && data.components) || []);
    } catch (err) {
      libContainer.innerHTML = `<div class="lib-error">Error loading library: ${err.message}</div>`;
    }
  }

  function renderLibrary(components) {
    if (!components.length) {
      libContainer.innerHTML = '<div class="lib-empty">No components found</div>';
      return;
    }

    // group by category
    const byCat = components.reduce((acc, c) => {
      const cat = c.category || 'uncategorized';
      acc[cat] = acc[cat] || [];
      acc[cat].push(c);
      return acc;
    }, {});

    libContainer.innerHTML = '';

    Object.keys(byCat)
      .sort()
      .forEach((cat) => {
        const h = document.createElement('div');
        h.className = 'lib-category';
        const title = document.createElement('h5');
        title.innerText = cat;
        h.appendChild(title);

        const list = document.createElement('div');
        list.className = 'lib-list';

        byCat[cat].forEach((comp) => {
          const item = document.createElement('div');
          item.className = 'lib-item';
          item.draggable = true;
          item.setAttribute('data-filename', comp.filename || '');
          item.setAttribute(
            'data-name',
            comp.name || comp.title || comp.name || comp.fileName || 'component'
          );

          const icon = document.createElement('span');
          icon.className = 'lib-icon';
          icon.innerText = comp.icon || '◻';
          item.appendChild(icon);

          const meta = document.createElement('div');
          meta.className = 'lib-meta';
          const nm = document.createElement('div');
          nm.className = 'lib-name';
          nm.innerText = comp.name || comp.title || comp.filename;
          meta.appendChild(nm);
          if (comp.description) {
            const desc = document.createElement('div');
            desc.className = 'lib-desc';
            desc.innerText = comp.description;
            meta.appendChild(desc);
          }
          item.appendChild(meta);

          const actions = document.createElement('div');
          actions.className = 'lib-actions';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.innerText = 'Insert';
          btn.addEventListener('click', () => insertComponent(comp));
          actions.appendChild(btn);
          item.appendChild(actions);

          // drag data: include component data as JSON under application/json
          item.addEventListener('dragstart', (e) => {
            try {
              e.dataTransfer.setData('application/json', JSON.stringify(comp));
              // also set plain for backwards compatibility with palette types
              e.dataTransfer.setData('text/plain', comp.type || comp.filename || '');
            } catch (err) {
              // ignore
            }
          });

          list.appendChild(item);
        });

        h.appendChild(list);
        libContainer.appendChild(h);
      });
  }

  function insertComponent(comp) {
    // Prefer shared core API: createElementFromTemplate + append to canvas
    try {
      const tpl = comp.template || comp;
      // Use JsoniaEditor.createElementFromTemplate if available
      if (
        window.JsoniaEditor &&
        typeof window.JsoniaEditor.createElementFromTemplate === 'function'
      ) {
        const el = window.JsoniaEditor.createElementFromTemplate(tpl);
        // place near top-left of canvas
        el.style.left = '40px';
        el.style.top = '40px';
        const canvas = document.getElementById('canvas');
        if (!canvas) throw new Error('Canvas element not found');
        canvas.appendChild(el);
        // Attach interactions if available
        if (window.JsoniaEditor && typeof window.JsoniaEditor.createInteractions === 'function') {
          // try to attach handlers via existing interactions instance (canvas.js handles attach)
        }
        return;
      }

      // Fallback to global helper used previously
      if (window.createComponentFromTemplate) {
        window.createComponentFromTemplate(comp.template || comp, 40, 40);
        return;
      }

      alert('Canvas insert API not available');
    } catch (err) {
      console.error('Insert component failed', err);
      alert('Insert failed: ' + (err && err.message ? err.message : 'unknown'));
    }
  }

  // initial load
  loadLibrary();
})();
