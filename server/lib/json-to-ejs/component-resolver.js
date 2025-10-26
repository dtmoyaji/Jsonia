const fs = require('fs');
const path = require('path');

/**
 * component-resolver
 *
 * Responsibilities:
 * - Resolve include paths used by JsonToEJS (`resolveIncludePath`).
 * - Find and resolve shared components stored under `components/` (single file or folder).
 * - Load and cache parsed component JSON files (`loadComponent`).
 * - Resolve `extends` chains and produce merged template objects (`resolveExtends`, `resolveComponentTemplate`).
 * - Provide simple cycle detection for `extends` to avoid infinite recursion.
 *
 * This module is intentionally thin and synchronous because JsonToEJS rendering is sync in this project.
 */

// Simple in-memory caches
// key for pathCache: `${componentName}|${basePath||''}` => resolvedPath or null
const pathCache = new Map();
// key for componentCache: absolute componentPath => { parsed, mtimeMs }
const componentCache = new Map();

// Expose a simple cache clear for debugging/tests
/**
 * Clear in-memory caches.
 * Useful for tests or developer workflows where files change and you want to force re-resolution.
 */
function clearCaches() {
    pathCache.clear();
    componentCache.clear();
}

/**
 * Find a likely workspace root directory by walking up from basePath.
 * Heuristic: stop when package.json or .git is found, or after a few steps.
 * @param {string} [basePath] - starting path (defaults to process.cwd())
 * @returns {string} - resolved workspace root directory
 */
function getWorkspaceRoot(basePath) {
    // Try to find workspace root by stepping up until we find package.json or .git, else parent
    let dir = basePath || process.cwd();
    for (let i = 0; i < 4; i++) {
        const pkg = path.join(dir, 'package.json');
        const git = path.join(dir, '.git');
        if (fs.existsSync(pkg) || fs.existsSync(git)) return dir;
        dir = path.resolve(dir, '..');
    }
    return path.resolve(process.cwd(), '..');
}

/**
 * Resolve an include path used in page/component styles or scripts.
 * Supports several syntaxes:
 * - '/path/inside/project' (absolute to project basePath)
 * - 'components/<component-name>' which resolves to project-local or shared components
 * - relative paths resolved from basePath
 * @param {string} includePath
 * @param {Object} [options]
 * @param {string} [options.basePath] - base directory to resolve relative includes
 * @returns {string|null} - absolute filesystem path to found .json or null
 */
function resolveIncludePath(includePath, options = {}) {
    const basePath = options.basePath || process.cwd();
    const workspaceRoot = getWorkspaceRoot(basePath);

    let candidatePaths = [];

    if (includePath.startsWith('/')) {
        candidatePaths.push(path.join(basePath, includePath.substring(1)));
    } else if (includePath.startsWith('components/')) {
        const componentName = includePath.substring('components/'.length);
        // project-local then workspace shared
        candidatePaths.push(path.join(basePath, 'components', componentName));
        candidatePaths.push(path.join(workspaceRoot, 'components', componentName));
    } else {
        candidatePaths.push(path.join(basePath, includePath));
    }

    candidatePaths = candidatePaths.map(p => p.endsWith('.json') ? p : p + '.json');

    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    // If includePath referenced 'components/<name>' but the actual component is in a folder
    // like components/<name>/component.json, attempt to resolve via resolveComponentPath
    if (includePath.startsWith('components/')) {
        const componentName = includePath.substring('components/'.length).replace(/\.json$/i, '');
        const resolved = resolveComponentPath(componentName, basePath);
        if (resolved) return resolved;
    }

    return null;
}

/**
 * Return candidate absolute paths for a named shared component.
 * The search order is:
 *  - <repoRoot>/components/<name>.json
 *  - <repoRoot>/components/<name>/component.json
 *  - fallback using workspace root for similar paths
 * @param {string} componentName
 * @param {string} [basePath]
 * @returns {string[]} - list of candidate absolute paths (not filtered)
 */
function findComponentCandidates(componentName, basePath) {
    const componentsDir = path.join(process.cwd(), 'components');
    const workspaceRoot = getWorkspaceRoot(basePath || process.cwd());

    const candidates = [
        path.join(componentsDir, `${componentName}.json`),
        path.join(componentsDir, componentName, 'component.json'),
        path.join(workspaceRoot, 'components', `${componentName}.json`),
        path.join(workspaceRoot, 'components', componentName, 'component.json')
    ];
    return candidates;
}

/**
 * Resolve the first existing component file path for a component name.
 * Uses an in-memory pathCache to avoid repeated file-system scans.
 * If a cached path no longer exists it will be invalidated.
 * @param {string} componentName
 * @param {string} [basePath]
 * @returns {string|null}
 */
function resolveComponentPath(componentName, basePath) {
    const cacheKey = `${componentName}|${basePath || ''}`;
    // validate cached path: if file has been removed, invalidate cache
    if (pathCache.has(cacheKey)) {
        const cached = pathCache.get(cacheKey);
        if (cached && fs.existsSync(cached)) return cached;
        // stale entry
        pathCache.delete(cacheKey);
    }

    const candidates = findComponentCandidates(componentName, basePath);
    let found = null;
    for (const c of candidates) {
        if (fs.existsSync(c)) {
            found = c;
            break;
        }
    }
    pathCache.set(cacheKey, found);
    return found;
}

/**
 * Load and parse a component JSON file with mtime-based caching.
 * The cache stores `{ parsed, mtimeMs }` so edits on disk are detected.
 * @param {string} componentPath - absolute path to .json component file
 * @returns {Object} - parsed JSON content
 * @throws {Error} - when file read or JSON parse fails
 */
function loadComponent(componentPath) {
    // return cached if mtime matches
    try {
        const stats = fs.statSync(componentPath);
        const mtimeMs = stats.mtimeMs;

        if (componentCache.has(componentPath)) {
            const entry = componentCache.get(componentPath);
            if (entry && entry.mtimeMs === mtimeMs) {
                return entry.parsed;
            }
        }

        const content = fs.readFileSync(componentPath, 'utf8');
        const parsed = JSON.parse(content);
        componentCache.set(componentPath, { parsed, mtimeMs });
        return parsed;
    } catch (err) {
        // On error (missing file or parse error) ensure cache cleared and rethrow
        componentCache.delete(componentPath);
        throw err;
    }
}

/**
 * Resolve extends and perform the existing merge logic.
 * renderFunc: function to render merged template (e.g., JsonToEJS.render)
 */
/**
 * Resolve an extends directive from a component or inline config and render the merged template.
 * This is a wrapper that uses `resolveComponentTemplate` to obtain a merged template object
 * then calls the provided `renderFunc` (typically `JsonToEJS.render`) to render it.
 *
 * Cycle detection is implemented via `options._visited` set. If a cycle is detected,
 * a clear HTML comment is returned instead of throwing.
 *
 * @param {Object} config - object that contains an `extends` property and possible overrides
 * @param {Object} [options]
 * @param {Function} renderFunc - function(templateObject, options) => string
 * @returns {string}
 */
function resolveExtends(config, options = {}, renderFunc) {
    try {
        const componentName = config.extends;
        if (!componentName) return renderFunc(config, options);

        // use a visited set to detect cyclic extends
        const visited = options._visited || new Set();
        if (visited.has(componentName)) {
            console.error(`❌ Detected cyclic extends for component: ${componentName}`);
            return `<!-- extends cycle detected: ${componentName} -->`;
        }
        visited.add(componentName);

        // resolve full parent template JSON (handles multi-level extends)
        const parentTemplate = resolveComponentTemplate(componentName, options);
        if (!parentTemplate) {
            console.warn(`⚠️ Component not found (checked candidates) for: ${componentName}`);
            return `<!-- extends: ${componentName} (component not found) -->`;
        }

        if (componentName === 'component') {
            const cfg = { ...config };
            delete cfg.extends;
            if (cfg.template) return renderFunc(cfg.template, options);
            return renderFunc(cfg, options);
        }

        let mergedTemplate = JSON.parse(JSON.stringify(parentTemplate));

        if (mergedTemplate.attributes && mergedTemplate.attributes.class === 'accordion' && mergedTemplate.children && mergedTemplate.children[0]) {
            mergedTemplate = mergedTemplate.children[0];
        }

        if (config.attributes) {
            mergedTemplate.attributes = { ...mergedTemplate.attributes, ...config.attributes };
        }

        const accordionId = config.attributes && config.attributes['data-accordion-id'];

        if (config.header || accordionId) {
            const headerElement = findElementByAttribute(mergedTemplate, 'data-accordion-header');
            if (headerElement) {
                if (accordionId) headerElement.attributes['data-accordion-id'] = accordionId;
                if (config.header && config.header.text) {
                    const textSpan = headerElement.children.find(c => !c.attributes || !c.attributes.class || !c.attributes.class.includes('accordion-icon'));
                    if (textSpan) textSpan.text = config.header.text;
                }
            }
        }

        if (config.content || accordionId) {
            const contentElement = findElementByAttribute(mergedTemplate, 'data-accordion-content');
            if (contentElement) {
                const contentId = config.content && config.content.id ? config.content.id : accordionId;
                if (contentId) {
                    contentElement.attributes.id = contentId;
                    contentElement.attributes['data-accordion-content'] = accordionId || contentId;
                }
                if (config.content && config.content.children) contentElement.children = config.content.children;
            }
        }

        return renderFunc(mergedTemplate, options);
    } catch (err) {
        console.error(`❌ Error resolving extends: ${config.extends} - ${err.message}`);
        return `<!-- extends error: ${config.extends} - ${err.message} -->`;
    }
}

/**
 * Resolve the final template object for a component by following its `extends` chain.
 * This function returns the merged template object (not a rendered string).
 * It detects cycles by using the `visited` set and returns null on cycle detection.
 *
 * @param {string} componentName
 * @param {Object} [options]
 * @param {Set<string>} [visited]
 * @returns {Object|null}
 */
function resolveComponentTemplate(componentName, options = {}, visited = new Set()) {
    if (visited.has(componentName)) {
        console.error(`❌ Detected cyclic extends while resolving template: ${componentName}`);
        return null;
    }
    visited.add(componentName);

    const componentPath = resolveComponentPath(componentName, options.basePath);
    if (!componentPath) return null;

    const comp = loadComponent(componentPath);

    // start with this component's own template or the component object itself
    let baseTemplate = comp.template ? JSON.parse(JSON.stringify(comp.template)) : JSON.parse(JSON.stringify(comp));

    if (comp.extends) {
        const parentName = comp.extends;
        const parentTemplate = resolveComponentTemplate(parentName, options, visited);
        if (parentTemplate) {
            // deep merge parentTemplate <- baseTemplate
            baseTemplate = deepMergeTemplates(parentTemplate, baseTemplate);
        }
    }

    return baseTemplate;
}

/**
 * Deep-merge two template objects.
 * - attributes: shallow-merged with child taking precedence
 * - tag/text: child overrides if present
 * - children: child.children preferred; otherwise parent.children
 * - other keys from child overwrite parent
 *
 * This merge strategy is intentionally simple and conservative; adjust as needed.
 *
 * @param {Object} parent
 * @param {Object} child
 * @returns {Object}
 */
function deepMergeTemplates(parent, child) {
    if (!parent) return child || null;
    if (!child) return parent || null;

    const merged = JSON.parse(JSON.stringify(parent));

    // merge attributes
    merged.attributes = { ...(parent.attributes || {}), ...(child.attributes || {}) };

    // merge tag
    merged.tag = child.tag || parent.tag;

    // merge text
    merged.text = child.text !== undefined ? child.text : parent.text;

    // children: prefer child if it defines children, otherwise keep parent's children
    if (child.children && Array.isArray(child.children) && child.children.length > 0) {
        merged.children = child.children;
    } else {
        merged.children = parent.children ? JSON.parse(JSON.stringify(parent.children)) : (child.children || []);
    }

    // copy other keys from child
    for (const [k, v] of Object.entries(child)) {
        if (['attributes', 'tag', 'text', 'children'].includes(k)) continue;
        merged[k] = v;
    }

    return merged;
}

function findElementByAttribute(template, attrName) {
    if (!template) return null;
    if (template.attributes && template.attributes[attrName]) return template;
    if (template.children && Array.isArray(template.children)) {
        for (const child of template.children) {
            const found = findElementByAttribute(child, attrName);
            if (found) return found;
        }
    }
    return null;
}

module.exports = {
    resolveIncludePath,
    resolveComponentPath,
    loadComponent,
    resolveExtends,
    findComponentCandidates,
    clearCaches
};
