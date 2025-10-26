/*
 * jsonia-runtime-actions.js (compat shim)
 *
 * The original repository shipped a monolithic `jsonia-runtime-actions.js` that
 * added many action handlers to JsoniaRuntime. The codebase was refactored into
 * modular files to improve maintainability. To preserve backwards compatibility
 * for pages that still include the old monolithic file, this shim dynamically
 * loads the modular bundles and applies them to any existing JsoniaRuntime.
 */

(function(){
    if (typeof window === 'undefined') return;

    // If the modular implementation is already present, noop.
    if (window.extendJsoniaRuntimeWithActions && window.addJsoniaRuntimeHelpers) {
        console.log('ℹ️ jsonia-runtime-actions: modular implementation already present');
        return;
    }

    console.warn('⚠️ jsonia-runtime-actions shim: loading modular action files for backward compatibility');

    const files = [
        '/js/jsonia-runtime-actions.dom.js',
        '/js/jsonia-runtime-actions.utils.js',
        '/js/jsonia-runtime-actions.template.js',
        '/js/jsonia-runtime-actions.core.js'
    ];

    function load(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = false; // preserve order
            s.onload = () => resolve(src);
            s.onerror = () => reject(new Error('Failed to load ' + src));
            document.head.appendChild(s);
        });
    }

    (async function(){
        try {
            for (const f of files) {
                await load(f);
                console.log('jsonia-runtime-actions shim: loaded', f);
            }

            if (window.JsoniaRuntime && typeof window.extendJsoniaRuntimeWithActions === 'function') {
                try {
                    window.extendJsoniaRuntimeWithActions(window.JsoniaRuntime);
                    if (typeof window.addJsoniaRuntimeHelpers === 'function') {
                        window.addJsoniaRuntimeHelpers(window.JsoniaRuntime);
                    }
                    console.log('✅ jsonia-runtime-actions shim: applied modular handlers to existing JsoniaRuntime');
                } catch (e) {
                    console.warn('⚠️ jsonia-runtime-actions shim: failed to apply handlers to existing JsoniaRuntime', e);
                }
            }
        } catch (err) {
            console.error('❌ jsonia-runtime-actions shim failed to load modules:', err);
        }
    })();
})();
