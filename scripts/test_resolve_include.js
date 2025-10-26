const includes = require('../server/lib/json-to-ejs/includes');
const path = require('path');
const editorPath = path.join(process.cwd(), 'jsonia-editor');
const p = includes.resolveIncludePath('components/accordion-with-behavior/style.json', { basePath: editorPath });
console.log('resolved:', p);
