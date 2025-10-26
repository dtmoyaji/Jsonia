const expr = require('./expression');

function renderAttributesToEJS(attributes, options = {}) {
    if (!attributes || typeof attributes !== 'object') {
        return '';
    }

    return Object.entries(attributes)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => {
            if (typeof value === 'boolean') {
                return value ? key : '';
            }
            const ejsValue = expr.convertToEJSExpression(String(value), options);
            return `${key}="${ejsValue}"`;
        })
        .filter(attr => attr)
        .map(attr => ' ' + attr)
        .join('');
}

module.exports = {
    renderAttributesToEJS
};
