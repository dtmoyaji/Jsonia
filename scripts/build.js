const fs = require('fs');
const path = require('path');
const JsonToHtml = require('../server/lib/json-to-html');

/**
 * ビルドスクリプト - 静的HTMLファイルの生成
 */

const outputDir = path.join(__dirname, '../dist');
const publicDir = path.join(__dirname, '../public');

// 出力ディレクトリの作成
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// サンプルページの定義
const pages = {
    'landing': {
        title: 'Jsonia - JSON to HTML Generator',
        meta: {
            charset: 'UTF-8',
            viewport: 'width=device-width, initial-scale=1.0',
            description: 'JSONでHTMLを記述できる革新的なシステム'
        },
        styles: [
            { content: `
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .container { max-width: 800px; margin: 0 auto; }
                .hero { text-align: center; padding: 60px 0; }
                .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
                .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
                .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0; }
                .feature { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; }
                .btn { 
                    display: inline-block;
                    background: rgba(255,255,255,0.2); 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    border: 2px solid rgba(255,255,255,0.3);
                    margin: 5px;
                }
                .btn:hover { background: rgba(255,255,255,0.3); }
            `}
        ],
        body: [
            {
                tag: 'div',
                attributes: { class: 'container' },
                children: [
                    {
                        tag: 'section',
                        attributes: { class: 'hero' },
                        children: [
                            {
                                tag: 'h1',
                                text: '🎨 Jsonia'
                            },
                            {
                                tag: 'p',
                                text: 'JSONでHTMLを記述し、サーバーサイドとクライアントサイドの両方で描画'
                            },
                            {
                                tag: 'div',
                                children: [
                                    {
                                        tag: 'a',
                                        text: '🚀 デモを見る',
                                        attributes: {
                                            href: '/demo.html',
                                            class: 'btn'
                                        }
                                    },
                                    {
                                        tag: 'a',
                                        text: '📚 ドキュメント',
                                        attributes: {
                                            href: '/docs.html',
                                            class: 'btn'
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        tag: 'section',
                        attributes: { class: 'features' },
                        children: [
                            {
                                tag: 'div',
                                attributes: { class: 'feature' },
                                children: [
                                    { tag: 'h3', text: '🔄 統一API' },
                                    { tag: 'p', text: 'サーバーサイドとクライアントサイドで同じJSON形式を使用' }
                                ]
                            },
                            {
                                tag: 'div',
                                attributes: { class: 'feature' },
                                children: [
                                    { tag: 'h3', text: '🧩 コンポーネント' },
                                    { tag: 'p', text: '再利用可能なUIコンポーネントシステム' }
                                ]
                            },
                            {
                                tag: 'div',
                                attributes: { class: 'feature' },
                                children: [
                                    { tag: 'h3', text: '🛡️ セキュリティ' },
                                    { tag: 'p', text: 'XSS攻撃を防ぐ自動エスケープ処理' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    'demo': {
        title: 'Jsonia Demo',
        meta: {
            charset: 'UTF-8',
            viewport: 'width=device-width, initial-scale=1.0'
        },
        styles: [
            { content: `
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 1000px; margin: 0 auto; }
                .demo-item { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .btn { background: #007acc; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer; }
                .form-group { margin: 15px 0; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
                .form-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .card { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
                .card img { width: 100%; height: 200px; object-fit: cover; }
                .card-body { padding: 15px; }
            `}
        ],
        body: [
            {
                tag: 'div',
                attributes: { class: 'container' },
                children: [
                    {
                        tag: 'h1',
                        text: 'Jsonia デモページ'
                    },
                    {
                        tag: 'div',
                        attributes: { class: 'demo-item' },
                        children: [
                            { tag: 'h2', text: '基本的なHTML生成' },
                            { tag: 'p', text: 'このページ全体がJSONから生成されています。' },
                            { tag: 'button', text: '動的ボタン', attributes: { class: 'btn', onclick: 'alert("JSONから生成されました！")' } }
                        ]
                    },
                    {
                        tag: 'div',
                        attributes: { class: 'demo-item' },
                        children: [
                            { tag: 'h2', text: 'フォーム例' },
                            {
                                tag: 'form',
                                children: [
                                    {
                                        tag: 'div',
                                        attributes: { class: 'form-group' },
                                        children: [
                                            { tag: 'label', text: '名前:', attributes: { for: 'name' } },
                                            { tag: 'input', attributes: { type: 'text', id: 'name', name: 'name' } }
                                        ]
                                    },
                                    {
                                        tag: 'div',
                                        attributes: { class: 'form-group' },
                                        children: [
                                            { tag: 'label', text: 'メール:', attributes: { for: 'email' } },
                                            { tag: 'input', attributes: { type: 'email', id: 'email', name: 'email' } }
                                        ]
                                    },
                                    { tag: 'button', text: '送信', attributes: { type: 'submit', class: 'btn' } }
                                ]
                            }
                        ]
                    },
                    {
                        tag: 'div',
                        attributes: { class: 'demo-item' },
                        children: [
                            { tag: 'h2', text: 'カード例' },
                            {
                                tag: 'div',
                                attributes: { class: 'cards' },
                                children: [
                                    {
                                        tag: 'div',
                                        attributes: { class: 'card' },
                                        children: [
                                            { tag: 'img', attributes: { src: 'https://via.placeholder.com/300x200?text=Card+1', alt: 'Card 1' } },
                                            {
                                                tag: 'div',
                                                attributes: { class: 'card-body' },
                                                children: [
                                                    { tag: 'h3', text: 'サンプルカード1' },
                                                    { tag: 'p', text: 'JSONから生成されたカードコンポーネント' }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        tag: 'div',
                                        attributes: { class: 'card' },
                                        children: [
                                            { tag: 'img', attributes: { src: 'https://via.placeholder.com/300x200?text=Card+2', alt: 'Card 2' } },
                                            {
                                                tag: 'div',
                                                attributes: { class: 'card-body' },
                                                children: [
                                                    { tag: 'h3', text: 'サンプルカード2' },
                                                    { tag: 'p', text: '再利用可能なコンポーネント設計' }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

// HTML ファイルの生成
function generateStaticFiles() {
    console.log('静的ファイルの生成を開始...');

    Object.entries(pages).forEach(([name, config]) => {
        try {
            const html = JsonToHtml.renderPage(config);
            const filename = name === 'landing' ? 'index.html' : `${name}.html`;
            const filepath = path.join(outputDir, filename);
            
            fs.writeFileSync(filepath, html);
            console.log(`✅ ${filename} を生成しました`);
        } catch (error) {
            console.error(`❌ ${name}.html の生成に失敗:`, error.message);
        }
    });

    // public ディレクトリのファイルをコピー
    if (fs.existsSync(publicDir)) {
        const publicFiles = fs.readdirSync(publicDir, { recursive: true });
        
        publicFiles.forEach(file => {
            const srcPath = path.join(publicDir, file);
            const destPath = path.join(outputDir, file);
            
            if (fs.statSync(srcPath).isFile()) {
                const destDir = path.dirname(destPath);
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                fs.copyFileSync(srcPath, destPath);
                console.log(`📄 ${file} をコピーしました`);
            }
        });
    }

    console.log(`\n🎉 ビルド完了！出力先: ${outputDir}`);
}

// 直接実行時はビルドを実行
if (require.main === module) {
    generateStaticFiles();
}

module.exports = {
    generateStaticFiles,
    pages
};