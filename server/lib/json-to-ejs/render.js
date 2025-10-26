const expr = require('./expression');
const attr = require('./attributes');
const utils = require('./utils');
const includes = require('./includes');

function render(config, options = {}) {
    if (typeof config === 'string') {
        return expr.convertToEJSExpression(config, options);
    }

    if (Array.isArray(config)) {
        return config.map(item => render(item, options)).join('');
    }

    if (!config || typeof config !== 'object') {
        return '';
    }

    // collect component-linked styles/behaviors when rendering components
    // options.collectedStyles: array of style objects
    // options.collectedBehaviors: array of { name, behavior }
    const path = require('path');
    const fs = require('fs');
    if (!options.collectedStyles) options.collectedStyles = [];
    if (!options.collectedBehaviors) options.collectedBehaviors = [];

    if (config.extends) {
        return includes.handleExtends(config, options, render);
    }

    if (config.$include) {
        return includes.handleInclude(config.$include, options);
    }

    if (config.text && !config.tag) {
        return expr.convertToEJSExpression(config.text, options);
    }

    const tag = config.tag || 'div';
    const attributes = attr.renderAttributesToEJS(config.attributes || {}, options);
    const children = config.children || [];
    const text = config.text || '';

    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    if (selfClosingTags.includes(tag.toLowerCase())) {
        return `<${tag}${attributes} />`;
    }

    let ejs = `<${tag}${attributes}>`;
    if (text) {
        ejs += expr.convertToEJSExpression(text, options);
    }
    if (children.length > 0) {
        ejs += render(children, options);
    }
    // If this component references local style or behavior files, collect them for page-level injection
    try {
        // styleFile: relative path inside component folder
        if (config.styleFile && config.__sourcePath) {
            const stylePath = path.join(path.dirname(config.__sourcePath), config.styleFile);
            if (fs.existsSync(stylePath)) {
                try {
                    const styleContent = fs.readFileSync(stylePath, 'utf8');
                    const styleObj = JSON.parse(styleContent);
                    // avoid duplicates by filename
                    if (!options.collectedStyles.find(s => s.__source === stylePath)) {
                        styleObj.__source = stylePath;
                        options.collectedStyles.push(styleObj);
                    }
                } catch (err) {
                    // ignore malformed style files
                }
            }
        }

        if (config.behaviorFile && config.__sourcePath) {
            const behaviorPath = path.join(path.dirname(config.__sourcePath), config.behaviorFile);
            if (fs.existsSync(behaviorPath)) {
                try {
                    const behaviorContent = fs.readFileSync(behaviorPath, 'utf8');
                    const behaviorObj = JSON.parse(behaviorContent);
                    const compName = config.name || path.basename(path.dirname(config.__sourcePath));
                    if (!options.collectedBehaviors.find(b => b.__source === behaviorPath)) {
                        options.collectedBehaviors.push({ __source: behaviorPath, name: compName, behavior: behaviorObj });
                    }
                } catch (err) {
                    // ignore malformed behavior files
                }
            }
        }
    } catch (e) {
        // defensive: do not let collection break rendering
    }
    ejs += `</${tag}>`;
    return ejs;
}

function renderPage(pageConfig, options = {}) {
    const title = pageConfig.title || 'Jsonia EJS Page';
    const meta = pageConfig.meta || {};
    const head = pageConfig.head || [];
    const body = pageConfig.body || [];
    const scripts = pageConfig.scripts || [];
    const styles = pageConfig.styles || [];

    let ejs = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n';

    if (expr.isEJSExpression(title)) {
        ejs += `    <title>${expr.convertToEJSExpression(title, options)}</title>\n`;
    } else {
        ejs += `    <title>${utils.escapeHtml(title)}</title>\n`;
    }

    if (meta.charset) {
        ejs += `    <meta charset="${meta.charset}">\n`;
    }
    if (meta.viewport) {
        ejs += `    <meta name="viewport" content="${meta.viewport}">\n`;
    }

    if (head.length > 0) {
        ejs += '    ' + render(head, options).replace(/\n/g, '\n    ') + '\n';
    }

    // Render body into a buffer first so component-local styles/behaviors are collected
    const bodyEjs = body.length > 0 ? '    ' + render(body, options).replace(/\n/g, '\n    ') + '\n' : '';

    styles.forEach(style => {
        if (typeof style === 'string') {
            ejs += `    <link rel="stylesheet" href="${style}">\n`;
            return;
        }
        if (typeof style === 'object') {
            if (style.$include) {
                try {
                    const fs = require('fs');
                    const fullPath = includes.resolveIncludePath(style.$include, options);
                    if (fullPath) {
                        const includeContent = fs.readFileSync(fullPath, 'utf8');
                        const includeConfig = JSON.parse(includeContent);
                        const cssText = utils.styleObjectToCss(includeConfig);
                        const mediaAttr = style.media ? ` media="${utils.escapeHtml(String(style.media))}"` : '';
                        ejs += `    <style${mediaAttr}>\n${cssText}\n    </style>\n`;
                    } else {
                        ejs += `    <!-- Style include not found: ${style.$include} -->\n`;
                    }
                } catch (err) {
                    ejs += `    <!-- Failed to include style: ${utils.escapeHtml(err.message)} -->\n`;
                }
                return;
            }

            if (style.content) {
                const mediaAttr = style.media ? ` media="${utils.escapeHtml(String(style.media))}"` : '';
                ejs += `    <style${mediaAttr}>\n${style.content}\n    </style>\n`;
                return;
            }

            try {
                const cssText = utils.styleObjectToCss(style);
                const mediaAttr = style.media ? ` media="${utils.escapeHtml(String(style.media))}"` : '';
                ejs += `    <style${mediaAttr}>\n${cssText}\n    </style>\n`;
            } catch (err) {
                ejs += `    <!-- Failed to render style: ${utils.escapeHtml(err.message)} -->\n`;
            }
            return;
        }
    });
    // Inject any collected component-local styles into head
    if (options.collectedStyles && options.collectedStyles.length > 0) {
        for (const styleObj of options.collectedStyles) {
            try {
                const cssText = utils.styleObjectToCss(styleObj);
                ejs += `    <style data-source="${utils.escapeHtml(styleObj.__source || '')}">\n${cssText}\n    </style>\n`;
            } catch (err) {
                ejs += `    <!-- Failed to render collected style: ${utils.escapeHtml(err.message)} -->\n`;
            }
        }
    }

    // close head and open body
    ejs += '</head>\n<body>\n';

    // append body
    if (bodyEjs) {
        ejs += bodyEjs;
    }

    scripts.forEach(script => {
        if (typeof script === 'string') {
            ejs += `    <script src="${script}"></script>\n`;
        } else if (script.content) {
            ejs += `    <script>\n${script.content}\n    </script>\n`;
        } else if (script.$include) {
            try {
                const fs = require('fs');
                const fullPath = includes.resolveIncludePath(script.$include, options);
                if (fullPath) {
                    const includeContent = fs.readFileSync(fullPath, 'utf8');
                    if (fullPath.endsWith('.json')) {
                        const JsonToJS = require('../json-to-js');
                        const jsGenerator = new JsonToJS();
                        const includeConfig = JSON.parse(includeContent);
                        const jsCode = jsGenerator.generate(includeConfig);
                        ejs += `    <script>\n${jsCode}\n    </script>\n`;
                    } else {
                        ejs += `    <script>\n${includeContent}\n    </script>\n`;
                    }
                } else {
                    ejs += `    <!-- Script include not found: ${script.$include} -->\n`;
                }
            } catch (err) {
                ejs += `    <!-- Failed to include script: ${utils.escapeHtml(err.message)} -->\n`;
            }
        } else {
            try {
                const jsonStr = JSON.stringify(script, null, 2);
                ejs += `    <script>\n`;
                ejs += `        // JSON定義をJsoniaRuntimeで実行\n`;
                ejs += `        document.addEventListener('DOMContentLoaded', function() {\n`;
                ejs += `            if (window.JsoniaRuntime) {\n`;
                ejs += `                const runtime = new JsoniaRuntime();\n`;
                ejs += `                const definition = ${jsonStr};\n`;
                ejs += `                runtime.init(definition);\n`;
                ejs += `                window.jsoniaRuntime = runtime;\n`;
                ejs += `                console.log('✅ JsoniaRuntime実行完了');\n`;
                ejs += `            } else {\n`;
                ejs += `                console.error('❌ JsoniaRuntime が見つかりません');\n`;
                ejs += `            }\n`;
                ejs += `        });\n`;
                ejs += `    </script>\n`;
            } catch (err) {
                ejs += `    <!-- Failed to generate script: ${utils.escapeHtml(err.message)} -->\n`;
            }
        }
    });
    // If there are collected behaviors, inject them as a JSON payload and register after runtime init
    if (options.collectedBehaviors && options.collectedBehaviors.length > 0) {
        try {
            const payload = JSON.stringify(options.collectedBehaviors.map(b => ({ name: b.name, behavior: b.behavior })));
            ejs += `    <script>\n`;
            ejs += `        (function(){\n`;
            ejs += `            var comps = ${payload};\n`;
            ejs += `            if (window.JsoniaRuntime && window.jsoniaRuntime) {\n`;
            ejs += `                // expose behaviors for runtime to pick up\n`;
            ejs += `                window.__injectedComponentBehaviors = window.__injectedComponentBehaviors || [];\n`;
            ejs += `                window.__injectedComponentBehaviors = window.__injectedComponentBehaviors.concat(comps);\n`;
            ejs += `            } else {\n`;
            ejs += `                window.__injectedComponentBehaviors = window.__injectedComponentBehaviors || [];\n`;
            ejs += `                window.__injectedComponentBehaviors = window.__injectedComponentBehaviors.concat(comps);\n`;
            ejs += `            }\n`;
            ejs += `        })();\n`;
            ejs += `    </script>\n`;
        } catch (err) {
            ejs += `    <!-- Failed to inject collected behaviors: ${utils.escapeHtml(err.message)} -->\n`;
        }
    }

    ejs += '</body>\n</html>';
    return ejs;
}

module.exports = {
    render,
    renderPage
};
