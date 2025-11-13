(function () {
  window.JsoniaEditor = window.JsoniaEditor || {};

  async function saveProject(payload) {
    const res = await fetch('/editor/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error('Save failed: ' + res.status + ' ' + text);
    }
    return res.json().catch(() => null);
  }

  async function loadComponents() {
    const res = await fetch('/editor/api/components');
    if (!res.ok) throw new Error('loadComponents failed');
    return res.json();
  }

  window.JsoniaEditor.saveProject = saveProject;
  window.JsoniaEditor.loadComponents = loadComponents;
})();
