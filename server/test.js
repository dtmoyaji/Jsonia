const JsonToHtml = require('./lib/json-to-html');
const cardBase = require('../components/card/component.json');

function makeCard(src, title, text, btnClass = 'btn btn-outline') {
    const c = JSON.parse(JSON.stringify(cardBase));
    try {
        if (c.template && c.template.children && c.template.children[0] && c.template.children[0].attributes) {
            c.template.children[0].attributes.src = src;
        }
        if (c.template && c.template.children && c.template.children[1] && c.template.children[1].children) {
            c.template.children[1].children[0].text = title;
            c.template.children[1].children[1].text = text;
            if (c.template.children[1].children[2] && c.template.children[1].children[2].attributes) {
                c.template.children[1].children[2].attributes.class = btnClass;
            }
        }
    } catch (e) {
        // fallback: leave base unchanged
    }
    return c;
}

// サンプルJSON設定
const sampleConfigs = {
    // 基本的な使用例
    basic: {
        tag: 'div',
        attributes: { class: 'sample-basic' },
        children: [
            {
                tag: 'h2',
                text: '基本的な例'
            },
            {
                tag: 'p',
                text: 'これはJSONから生成されたHTMLです。'
            }
        ]
    },

    // フォーム例
    form: {
        tag: 'form',
        attributes: {
            method: 'post',
            action: '/submit'
        },
        children: [
            {
                tag: 'div',
                attributes: { class: 'form-group' },
                children: [
                    {
                        tag: 'label',
                        text: '名前:',
                        attributes: { for: 'name' }
                    },
                    {
                        tag: 'input',
                        attributes: {
                            type: 'text',
                            id: 'name',
                            name: 'name',
                            required: true
                        }
                    }
                ]
            },
            {
                tag: 'div',
                attributes: { class: 'form-group' },
                children: [
                    {
                        tag: 'label',
                        text: 'メールアドレス:',
                        attributes: { for: 'email' }
                    },
                    {
                        tag: 'input',
                        attributes: {
                            type: 'email',
                            id: 'email',
                            name: 'email',
                            required: true
                        }
                    }
                ]
            },
            {
                tag: 'button',
                text: '送信',
                attributes: {
                    type: 'submit',
                    class: 'btn btn-primary'
                }
            }
        ]
    },

    // ナビゲーション例
    navigation: {
        tag: 'nav',
        attributes: { class: 'main-nav' },
        children: [
            {
                tag: 'ul',
                children: [
                    {
                        tag: 'li',
                        children: [
                            {
                                tag: 'a',
                                text: 'ホーム',
                                attributes: { href: '/' }
                            }
                        ]
                    },
                    {
                        tag: 'li',
                        children: [
                            {
                                tag: 'a',
                                text: 'サービス',
                                attributes: { href: '/services' }
                            }
                        ]
                    },
                    {
                        tag: 'li',
                        children: [
                            {
                                tag: 'a',
                                text: 'お問い合わせ',
                                attributes: { href: '/contact' }
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // カード式レイアウト例 — components/card に集約
    cards: [
        makeCard('https://via.placeholder.com/300x200', 'カードタイトル1', 'カードの説明文です。JSONから生成されたカードコンポーネント。', 'btn btn-outline'),
        makeCard('https://via.placeholder.com/300x200', 'カードタイトル2', '別のカードの説明文です。同じ構造で異なる内容。', 'btn btn-outline')
    ]
};

// テスト関数
function testRendering() {
    console.log('=== Jsonia HTML Generator Tests ===\n');

    Object.entries(sampleConfigs).forEach(([name, config]) => {
        console.log(`--- ${name.toUpperCase()} ---`);
        try {
            const html = JsonToHtml.render(config);
            console.log(html);
        } catch (error) {
            console.error(`Error rendering ${name}:`, error.message);
        }
        console.log('\n');
    });
}

// 完全なページテスト
function testPageGeneration() {
    console.log('=== Complete Page Generation Test ===\n');

    const pageConfig = {
        title: 'Jsonia Test Page',
        meta: {
            charset: 'UTF-8',
            viewport: 'width=device-width, initial-scale=1.0'
        },
        styles: [
            '/css/style.css'
        ],
        body: [
            sampleConfigs.navigation,
            {
                tag: 'main',
                children: [
                    sampleConfigs.basic,
                    {
                        tag: 'section',
                        attributes: { class: 'cards-section' },
                        children: sampleConfigs.cards
                    },
                    sampleConfigs.form
                ]
            }
        ],
        scripts: [
            '/js/jsonia-client.js'
        ]
    };

    try {
        const fullHtml = JsonToHtml.renderPage(pageConfig);
        console.log(fullHtml);
    } catch (error) {
        console.error('Error generating page:', error.message);
    }
}

// 直接実行時のテスト
if (require.main === module) {
    testRendering();
    testPageGeneration();
}

module.exports = {
    sampleConfigs,
    testRendering,
    testPageGeneration
};