// Small core utilities for Jsonia Editor used by browser and canvas
(function () {
  window.JsoniaEditor = window.JsoniaEditor || {};

  function createElementFromTemplate(template) {
    const type =
      (template && (template.type || template.templateType || template.filename)) || 'component';
    const el = document.createElement('div');
    el.className = 'draggable';

    if (template.width) el.style.width = template.width;
    if (template.height) el.style.height = template.height;
    if (template.style && typeof template.style === 'object') {
      Object.keys(template.style).forEach((k) => {
        try {
          el.style[k] = template.style[k];
        } catch (e) {
          // ignore invalid style keys
        }
      });
    }

    el.setAttribute('data-type', type);
    if (template.name) el.setAttribute('data-name', template.name);
    if (template.filename) el.setAttribute('data-filename', template.filename);

    if (template.html) {
      el.innerHTML = template.html;
    } else if (template.template && typeof template.template === 'string') {
      el.innerHTML = template.template;
    } else if (type === 'button') {
      el.innerHTML = '<button>Button</button>';
    } else if (type === 'card') {
      el.innerHTML = '<div class="card"><h3>Title</h3><p>Card body</p></div>';
    } else if (template.text) {
      el.innerText = template.text;
    } else {
      el.innerText = template.name || 'Component';
    }

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    el.appendChild(handle);

    return el;
  }

  window.JsoniaEditor.createElementFromTemplate = createElementFromTemplate;
})();
