/**
 * escapeHtml, styleObjectToCss, camelToKebab, generateSampleData
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function styleObjectToCss(styleObj) {
    if (!styleObj || typeof styleObj !== 'object') return '';

    const lines = [];

    for (const [selector, declarations] of Object.entries(styleObj)) {
        if (selector === 'media') continue;
        if (!declarations || typeof declarations !== 'object') continue;

        const declLines = [];
        for (const [prop, value] of Object.entries(declarations)) {
            const cssProp = camelToKebab(prop);
            declLines.push(`  ${cssProp}: ${String(value)};`);
        }

        lines.push(`${selector} {`);
        lines.push(...declLines);
        lines.push('}');
    }

    return lines.join('\n');
}

function generateSampleData(config) {
    const sampleData = {
        title: 'Sample Page Title',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        items: ['Item 1', 'Item 2', 'Item 3'],
        products: [
            { id: 1, name: 'Product A', price: 1000 },
            { id: 2, name: 'Product B', price: 2000 },
            { id: 3, name: 'Product C', price: 3000 }
        ],
        user: {
            name: 'Alice Smith',
            role: 'admin',
            avatar: 'https://via.placeholder.com/64x64',
            isActive: true
        },
        settings: {
            theme: 'dark',
            language: 'ja'
        },
        menuItems: [
            { title: 'ホーム', url: '/' },
            { title: 'サービス', url: '/services' },
            { title: 'お問い合わせ', url: '/contact' }
        ],
        stats: {
            title: 'Total Users',
            value: 1250,
            description: 'Active users this month'
        },
        tableHeaders: ['ID', 'Name', 'Email', 'Status'],
        tableData: [
            [1, 'Alice', 'alice@example.com', 'Active'],
            [2, 'Bob', 'bob@example.com', 'Inactive'],
            [3, 'Charlie', 'charlie@example.com', 'Active']
        ],
        currentYear: new Date().getFullYear(),
        isLoggedIn: true,
        count: 42
    };

    return sampleData;
}

module.exports = {
    escapeHtml,
    camelToKebab,
    styleObjectToCss,
    generateSampleData
};
