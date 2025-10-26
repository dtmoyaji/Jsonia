const fs = require('fs');
const path = require('path');
const renderer = require('../server/lib/json-to-ejs/render');

const pageConfig = {
    title: 'Collected Styles Test',
    styles: [],
    body: [
        { $include: 'components/accordion-with-behavior/component.json' }
    ]
};

const html = renderer.renderPage(pageConfig, {});
fs.writeFileSync(path.join(process.cwd(), 'tmp_collected_test.html'), html, 'utf8');
console.log('Wrote tmp_collected_test.html');
