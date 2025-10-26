const fs = require('fs');
const path = require('path');
const JsonToEJS = require('../server/lib/json-to-ejs');

const editorPath = path.join(process.cwd(), 'jsonia-editor');
const mainJsonPath = path.join(editorPath, 'main.json');
const mainJson = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));

const html = JsonToEJS.renderPage(mainJson, { basePath: editorPath });
fs.writeFileSync('tmp_render_editor_main.html', html, 'utf8');
console.log('Wrote tmp_render_editor_main.html');
