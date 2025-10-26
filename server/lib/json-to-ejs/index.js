const renderModule = require('./render');
const attributes = require('./attributes');
const expr = require('./expression');
const utils = require('./utils');
const includes = require('./includes');

class JsonToEJS {}

Object.assign(JsonToEJS, {
    render: renderModule.render,
    renderPage: renderModule.renderPage,
    renderAttributesToEJS: attributes.renderAttributesToEJS,
    convertToEJSExpression: expr.convertToEJSExpression,
    isEJSExpression: expr.isEJSExpression,
    generateSampleData: utils.generateSampleData,
    escapeHtml: utils.escapeHtml,
    styleObjectToCss: utils.styleObjectToCss,
    camelToKebab: utils.camelToKebab,
    resolveIncludePath: includes.resolveIncludePath,
    handleInclude: includes.handleInclude,
    handleExtends: includes.handleExtends,
    findElementByAttribute: includes.findElementByAttribute,
    renderEJSToHTML: includes.renderEJSToHTML
});

// Node.js環境とブラウザ環境の両方に対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JsonToEJS;
} else {
    window.JsonToEJS = JsonToEJS;
    window.JsonToHtml = JsonToEJS;
}
