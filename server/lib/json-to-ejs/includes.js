const path = require('path');
// render は循環参照を避けるため遅延 require する

function resolveIncludePath(includePath, options = {}) {
    try {
        const resolver = require('./component-resolver');
        return resolver.resolveIncludePath(includePath, options);
    } catch (err) {
        console.warn('resolveIncludePath delegate failed:', err.message);
        return null;
    }
}

function handleInclude(includePath, options = {}) {
    if (typeof require === 'undefined') {
        console.warn('$include is only available in Node.js environment');
        return `<!-- $include: ${includePath} (not available in browser) -->`;
    }

    try {
        const fs = require('fs');
        const fullPath = resolveIncludePath(includePath, options);
        if (!fullPath) {
            return `<!-- $include: ${includePath} (file not found in project or shared components) -->`;
        }
    const includeContent = fs.readFileSync(fullPath, 'utf8');
    const includeConfig = JSON.parse(includeContent);
    // prepare a config object for rendering: if the component uses `template`, render that but
    // carry over styleFile/behaviorFile and source path so renderer can collect them
    const renderConfig = includeConfig.template && typeof includeConfig.template === 'object'
        ? Object.assign({}, includeConfig.template)
        : Object.assign({}, includeConfig);
    if (includeConfig.styleFile) renderConfig.styleFile = includeConfig.styleFile;
    if (includeConfig.behaviorFile) renderConfig.behaviorFile = includeConfig.behaviorFile;
    // remember source path so renderer can resolve component-local files (style/behavior)
    renderConfig.__sourcePath = fullPath;

        // 遅延ロードして render 関数を取得
        const renderFunc = require('./render').render;
        return renderFunc(renderConfig, options);
    } catch (error) {
        console.error(`Error processing $include: ${includePath}`, error.message);
        return `<!-- $include error: ${includePath} - ${error.message} -->`;
    }
}

function handleExtends(config, options = {}, renderFn) {
    if (typeof require === 'undefined') {
        console.warn('extends is only available in Node.js environment');
        return `<!-- extends: ${config.extends} (not available in browser) -->`;
    }
    try {
        const resolver = require('./component-resolver');
        // resolver.resolveExtends(config, options, renderFn) を期待
    return resolver.resolveExtends(config, options, renderFn || require('./render').render);
    } catch (err) {
        console.error('extends delegate failed:', err.message);
        return `<!-- extends error: ${config.extends} - ${err.message} -->`;
    }
}

function findElementByAttribute(template, attrName) {
    if (template.attributes && template.attributes[attrName]) {
        return template;
    }
    if (template.children && Array.isArray(template.children)) {
        for (const child of template.children) {
            const found = findElementByAttribute(child, attrName);
            if (found) return found;
        }
    }
    return null;
}

async function renderEJSToHTML(ejsTemplate, data = {}) {
    if (typeof require === 'undefined') {
        throw new Error('EJS rendering is only available in Node.js environment');
    }
    try {
        const ejs = require('ejs');
        return ejs.render(ejsTemplate, data);
    } catch (error) {
        throw new Error('EJS rendering failed: ' + error.message);
    }
}

module.exports = {
    resolveIncludePath,
    handleInclude,
    handleExtends,
    findElementByAttribute,
    renderEJSToHTML
};
