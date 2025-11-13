const expr = require('./expression');

function renderAttributesToEJS(attributes, options = {}) {
  if (!attributes || typeof attributes !== 'object') {
    return '';
  }

  return Object.entries(attributes)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      if (typeof v === 'boolean') {
        return v ? k : '';
      }
      const ejsValue = expr.convertToEJSExpression(String(v), options);
      return `${k}="${ejsValue}"`;
    })
    .filter((attr) => attr)
    .map((attr) => ' ' + attr)
    .join('');
}

module.exports = {
  renderAttributesToEJS,
};
