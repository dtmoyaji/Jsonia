/**
 * JsonToEJS - JSONからEJSテンプレートを生成する特化インタプリタ
 * EJS機能に特化し、シンプルで強力なテンプレート生成を提供
 */

class JsonToEJS {
    /**
     * JSON設定からEJSテンプレートを生成（メインメソッド）
     * @param {Object} config - JSON設定オブジェクト
     * @param {Object} options - EJS生成オプション
     * @returns {string} - 生成されたEJSテンプレート文字列
     */
    static render(config, options = {}) {
        if (typeof config === 'string') {
            return this.convertToEJSExpression(config, options);
        }

        if (Array.isArray(config)) {
            return config.map(item => this.render(item, options)).join('');
        }

        if (!config || typeof config !== 'object') {
            return '';
        }

        // extends ディレクティブの処理（コンポーネント継承）
        if (config.extends) {
            return this.handleExtends(config, options);
        }

        // $include ディレクティブの処理（部品化）
        if (config.$include) {
            return this.handleInclude(config.$include, options);
        }

        // テキストノードの場合
        if (config.text && !config.tag) {
            return this.convertToEJSExpression(config.text, options);
        }

        const tag = config.tag || 'div';
        const attributes = this.renderAttributesToEJS(config.attributes || {}, options);
        const children = config.children || [];
        const text = config.text || '';

        // 自己終了タグの処理
        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
        if (selfClosingTags.includes(tag.toLowerCase())) {
            return `<${tag}${attributes} />`;
        }

        // 通常の開始・終了タグ
        let ejs = `<${tag}${attributes}>`;
        
        if (text) {
            ejs += this.convertToEJSExpression(text, options);
        }
        
        if (children.length > 0) {
            ejs += this.render(children, options);
        }
        
        ejs += `</${tag}>`;
        
        return ejs;
    }

    /**
     * 完全なEJSページを生成
     * @param {Object} pageConfig - ページ設定オブジェクト
     * @param {Object} options - EJS生成オプション
     * @returns {string} - 完全なEJSテンプレート文字列
     */
    static renderPage(pageConfig, options = {}) {
        const title = pageConfig.title || 'Jsonia EJS Page';
        const meta = pageConfig.meta || {};
        const head = pageConfig.head || [];
        const body = pageConfig.body || [];
        const scripts = pageConfig.scripts || [];
        const styles = pageConfig.styles || [];

        let ejs = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n';
        
        // タイトルをEJS変数対応
        if (this.isEJSExpression(title)) {
            ejs += `    <title>${this.convertToEJSExpression(title, options)}</title>\n`;
        } else {
            ejs += `    <title>${this.escapeHtml(title)}</title>\n`;
        }
        
        // メタタグの追加
        if (meta.charset) {
            ejs += `    <meta charset="${meta.charset}">\n`;
        }
        if (meta.viewport) {
            ejs += `    <meta name="viewport" content="${meta.viewport}">\n`;
        }
        
        // 追加のheadコンテンツ
        if (head.length > 0) {
            ejs += '    ' + this.render(head, options).replace(/\n/g, '\n    ') + '\n';
        }
        
        // スタイルの追加
        styles.forEach(style => {
            // 文字列は外部スタイルシートへのリンク
            if (typeof style === 'string') {
                ejs += `    <link rel="stylesheet" href="${style}">\n`;
                return;
            }

            // オブジェクト形式: { content, media, $include, ... } または JSONスタイルオブジェクト
            if (typeof style === 'object') {
                // $include ディレクティブの処理
                if (style.$include) {
                    try {
                        const fs = require('fs');
                        
                        // パス解決（フォールバック機能付き）
                        const fullPath = this.resolveIncludePath(style.$include, options);
                        
                        if (fullPath) {
                            const includeContent = fs.readFileSync(fullPath, 'utf8');
                            const includeConfig = JSON.parse(includeContent);
                            const cssText = this.styleObjectToCss(includeConfig);
                            const mediaAttr = style.media ? ` media="${this.escapeHtml(String(style.media))}"` : '';
                            ejs += `    <style${mediaAttr}>\n${cssText}\n    </style>\n`;
                        } else {
                            ejs += `    <!-- Style include not found: ${style.$include} -->\n`;
                        }
                    } catch (err) {
                        ejs += `    <!-- Failed to include style: ${this.escapeHtml(err.message)} -->\n`;
                    }
                    return;
                }

                // content プロパティがあればそのまま出力（既存互換）
                if (style.content) {
                    const mediaAttr = style.media ? ` media="${this.escapeHtml(String(style.media))}"` : '';
                    ejs += `    <style${mediaAttr}>\n${style.content}\n    </style>\n`;
                    return;
                }

                // JSONスタイルオブジェクト（selector: { prop: value }）を CSS 文字列に変換
                try {
                    const cssText = this.styleObjectToCss(style);
                    const mediaAttr = style.media ? ` media="${this.escapeHtml(String(style.media))}"` : '';
                    ejs += `    <style${mediaAttr}>\n${cssText}\n    </style>\n`;
                } catch (err) {
                    // 変換失敗時は無視せずコメントで残す
                    ejs += `    <!-- Failed to render style: ${this.escapeHtml(err.message)} -->\n`;
                }
                return;
            }

            // 上記以外はスキップ
        });
        if (body.length > 0) {
            ejs += '    ' + this.render(body, options).replace(/\n/g, '\n    ') + '\n';
        }
        
        // スクリプトの追加
        scripts.forEach(script => {
            if (typeof script === 'string') {
                // 外部スクリプトファイル
                ejs += `    <script src="${script}"></script>\n`;
            } else if (script.content) {
                // インラインスクリプト（従来型）
                ejs += `    <script>\n${script.content}\n    </script>\n`;
            } else if (script.$include) {
                // $include で外部JSファイルを読み込み
                try {
                    const fs = require('fs');
                    
                    // パス解決（フォールバック機能付き）
                    const fullPath = this.resolveIncludePath(script.$include, options);
                    
                    if (fullPath) {
                        const includeContent = fs.readFileSync(fullPath, 'utf8');
                        
                        // .jsonファイルの場合はJSONとして解析してJavaScriptに変換
                        if (fullPath.endsWith('.json')) {
                            const JsonToJS = require('./json-to-js');
                            const jsGenerator = new JsonToJS();
                            const includeConfig = JSON.parse(includeContent);
                            const jsCode = jsGenerator.generate(includeConfig);
                            ejs += `    <script>\n${jsCode}\n    </script>\n`;
                        } else {
                            // .jsファイルの場合はそのまま埋め込み
                            ejs += `    <script>\n${includeContent}\n    </script>\n`;
                        }
                    } else {
                        ejs += `    <!-- Script include not found: ${script.$include} -->\n`;
                    }
                } catch (err) {
                    ejs += `    <!-- Failed to include script: ${this.escapeHtml(err.message)} -->\n`;
                }
            } else {
                // JSON形式のJavaScript定義 - JsoniaRuntimeを使用
                try {
                    // JSONをそのまま埋め込んでクライアント側で実行
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
                    ejs += `    <!-- Failed to generate script: ${this.escapeHtml(err.message)} -->\n`;
                }
            }
        });
        
        ejs += '</body>\n</html>';
        
        return ejs;
    }

    /**
     * 属性をEJS形式の文字列に変換
     * @param {Object} attributes - 属性オブジェクト
     * @param {Object} options - EJS生成オプション
     * @returns {string} - EJS属性文字列
     */
    static renderAttributesToEJS(attributes, options = {}) {
        if (!attributes || typeof attributes !== 'object') {
            return '';
        }

        return Object.entries(attributes)
            .filter(([key, value]) => value !== null && value !== undefined)
            .map(([key, value]) => {
                // ブール属性の処理
                if (typeof value === 'boolean') {
                    return value ? key : '';
                }
                
                // EJS変数を含む属性値の処理
                const ejsValue = this.convertToEJSExpression(String(value), options);
                return `${key}="${ejsValue}"`;
            })
            .filter(attr => attr)
            .map(attr => ' ' + attr)
            .join('');
    }

    /**
     * テキストをEJS表現に変換（コア機能）
     * @param {string} text - 変換するテキスト
     * @param {Object} options - 変換オプション
     * @returns {string} - EJS表現
     */
    static convertToEJSExpression(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        // {{variable}} 形式をEJS <%= variable %> に変換
        let ejsText = text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
            const trimmedVar = variable.trim();
            
            // オプションでrawモードが指定されている場合は <%- %> を使用（HTMLエスケープなし）
            if (options.raw && options.raw.includes(trimmedVar)) {
                return `<%- ${trimmedVar} %>`;
            }
            
            // 通常はHTMLエスケープありの <%= %> を使用
            return `<%= ${trimmedVar} %>`;
        });

        // {{% code %}} 形式をEJS <% code %> に変換（コード実行）
        ejsText = ejsText.replace(/\{\{%([^%]+)%\}\}/g, (match, code) => {
            return `<% ${code.trim()} %>`;
        });

        // 条件分岐の処理: {{#if condition}} ... {{/if}}
        ejsText = ejsText.replace(/\{\{#if\s+([^}]+)\}\}/g, '<% if ($1) { %>');
        ejsText = ejsText.replace(/\{\{#else\}\}/g, '<% } else { %>');
        ejsText = ejsText.replace(/\{\{\/if\}\}/g, '<% } %>');

        // ループの処理: {{#each array}} ... {{/each}}
        ejsText = ejsText.replace(/\{\{#each\s+([^}]+)\}\}/g, '<% $1.forEach(function(item, index) { %>');
        ejsText = ejsText.replace(/\{\{\/each\}\}/g, '<% }); %>');

        return ejsText;
    }

    /**
     * EJS表現かどうかを判定
     * @param {string} text - 判定するテキスト
     * @returns {boolean} - EJS表現の場合true
     */
    static isEJSExpression(text) {
        return typeof text === 'string' && (
            text.includes('{{') || 
            text.includes('<%') ||
            text.includes('{%')
        );
    }

    /**
     * EJSテンプレート用のサンプルデータを生成
     * @param {Object} config - JSON設定
     * @returns {Object} - サンプルデータオブジェクト
     */
    static generateSampleData(config) {
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

    /**
     * HTMLエスケープ処理（必要最小限）
     * @param {string} text - エスケープするテキスト
     * @returns {string} - エスケープされたテキスト
     */
    static escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * JSON形式のスタイルオブジェクトを CSS テキストに変換する
     * 例: { ".card": { backgroundColor: "#fff", padding: "10px" }, "#main": { display: "flex" } }
     * @param {Object} styleObj - スタイル定義オブジェクト
     * @returns {string} - CSS テキスト
     */
    static styleObjectToCss(styleObj) {
        if (!styleObj || typeof styleObj !== 'object') return '';

        const lines = [];

        for (const [selector, declarations] of Object.entries(styleObj)) {
            // skip special keys like 'media' which are handled outside
            if (selector === 'media') continue;

            if (!declarations || typeof declarations !== 'object') continue;

            const declLines = [];
            for (const [prop, value] of Object.entries(declarations)) {
                const cssProp = this.camelToKebab(prop);
                declLines.push(`  ${cssProp}: ${String(value)};`);
            }

            lines.push(`${selector} {`);
            lines.push(...declLines);
            lines.push('}');
        }

        return lines.join('\n');
    }

    /**
     * camelCase を kebab-case に変換
     */
    static camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * includeパスを解決（フォールバック機能付き）
     * @param {string} includePath - インクルードするファイルのパス
     * @param {Object} options - レンダリングオプション（basePathを含む）
     * @returns {string|null} - 解決されたフルパス、または null
     */
    static resolveIncludePath(includePath, options = {}) {
        const fs = require('fs');
        const path = require('path');
        const basePath = options.basePath || process.cwd();
        
        // ワークスペースルート（Jsoniaのルートディレクトリ）を取得
        // basePathがprojects/sample-projectなら、../..でルートへ
        const workspaceRoot = path.resolve(basePath, '..', '..');
        
        // パスの解決候補リスト（フォールバック機能）
        let candidatePaths = [];
        
        if (includePath.startsWith('/')) {
            // 絶対パス（プロジェクトルートから）
            candidatePaths.push(path.join(basePath, includePath.substring(1)));
        } else if (includePath.startsWith('components/')) {
            // componentsフォルダからの参照：専用 → 共有 の順でフォールバック
            const componentName = includePath.substring('components/'.length);
            
            // 1. プロジェクト内の専用components
            candidatePaths.push(path.join(basePath, 'components', componentName));
            
            // 2. ルートの共有components（フォールバック）
            candidatePaths.push(path.join(workspaceRoot, 'components', componentName));
        } else {
            // 相対パス（現在のプロジェクトディレクトリから）
            candidatePaths.push(path.join(basePath, includePath));
        }

        // .json 拡張子の自動補完
        candidatePaths = candidatePaths.map(p => p.endsWith('.json') ? p : p + '.json');

        // ファイルの検索（最初に見つかったファイルを使用）
        for (const candidate of candidatePaths) {
            if (fs.existsSync(candidate)) {
                console.log(`✅ Component found: ${candidate}`);
                return candidate;
            }
        }

        // 見つからない場合
        const searchedPaths = candidatePaths.join('\n  - ');
        console.warn(`❌ Include file not found: ${includePath}\nSearched paths:\n  - ${searchedPaths}`);
        return null;
    }

    /**
     * $include ディレクティブを処理して外部JSONファイルを埋め込む
     * @param {string} includePath - インクルードするファイルのパス
     * @param {Object} options - レンダリングオプション（basePathを含む）
     * @returns {string} - レンダリングされたHTML/EJS
     */
    static handleInclude(includePath, options = {}) {
        // Node.js環境でのみ動作
        if (typeof require === 'undefined') {
            console.warn('$include is only available in Node.js environment');
            return `<!-- $include: ${includePath} (not available in browser) -->`;
        }

        try {
            const fs = require('fs');
            
            // パス解決（フォールバック機能付き）
            const fullPath = this.resolveIncludePath(includePath, options);
            
            if (!fullPath) {
                return `<!-- $include: ${includePath} (file not found in project or shared components) -->`;
            }

            const includeContent = fs.readFileSync(fullPath, 'utf8');
            const includeConfig = JSON.parse(includeContent);

            // 再帰的にレンダリング（同じオプションを引き継ぐ）
            return this.render(includeConfig, options);

        } catch (error) {
            console.error(`Error processing $include: ${includePath}`, error.message);
            return `<!-- $include error: ${includePath} - ${error.message} -->`;
        }
    }

    /**
     * extends ディレクティブの処理（コンポーネント継承）
     * @param {Object} config - extends設定を含むオブジェクト
     * @param {Object} options - レンダリングオプション
     * @returns {string} - レンダリング結果
     */
    static handleExtends(config, options = {}) {
        if (typeof require === 'undefined') {
            console.warn('extends is only available in Node.js environment');
            return `<!-- extends: ${config.extends} (not available in browser) -->`;
        }

        try {
            const fs = require('fs');
            const path = require('path');
            
            console.log('🔄 extends処理開始:', config.extends);
            
            // 共有コンポーネントのパスを解決
            const componentName = config.extends;
            const componentsDir = path.join(process.cwd(), 'components');
            const componentPath = path.join(componentsDir, `${componentName}.json`);
            
            console.log('📂 コンポーネントパス:', componentPath);
            
            if (!fs.existsSync(componentPath)) {
                console.warn(`⚠️ Component not found: ${componentPath}`);
                return `<!-- extends: ${componentName} (component not found) -->`;
            }

            const componentContent = fs.readFileSync(componentPath, 'utf8');
            const baseComponent = JSON.parse(componentContent);
            
            console.log('✅ ベースコンポーネント読み込み成功:', baseComponent.name || componentName);
            
            // component.jsonは抽象基底クラスなので、extendsをスキップしてconfigをそのまま返す
            if (componentName === 'component') {
                console.log('⏭️  component.jsonは基底クラスなので、継承のみでテンプレートマージはスキップ');
                // extendsプロパティを削除してから再レンダリング（無限ループ防止）
                const configWithoutExtends = { ...config };
                delete configWithoutExtends.extends;
                
                // configにtemplateがある場合はそれを使う
                if (configWithoutExtends.template) {
                    return this.render(configWithoutExtends.template, options);
                }
                // templateがない場合はconfig自体をレンダリング（tagプロパティがあることを期待）
                return this.render(configWithoutExtends, options);
            }
            
            // テンプレートをディープコピー
            let mergedTemplate = JSON.parse(JSON.stringify(baseComponent.template || baseComponent));
            
            // accordion-with-behaviorの場合は .accordion-item だけを抽出
            if (mergedTemplate.attributes && mergedTemplate.attributes.class === 'accordion' && 
                mergedTemplate.children && mergedTemplate.children[0]) {
                console.log('🔧 accordion構造を検出、accordion-itemを抽出');
                mergedTemplate = mergedTemplate.children[0]; // .accordion-item を取得
            }
            
            console.log('📋 マージ前テンプレート:', JSON.stringify(mergedTemplate.attributes));
            
            // オーバーライド処理
            if (config.attributes) {
                mergedTemplate.attributes = {
                    ...mergedTemplate.attributes,
                    ...config.attributes
                };
            }
            
            // attributesから accordion-id を取得
            const accordionId = config.attributes && config.attributes['data-accordion-id'];
            
            // header部分のオーバーライド
            if (config.header || accordionId) {
                const headerElement = this.findElementByAttribute(mergedTemplate, 'data-accordion-header');
                if (headerElement) {
                    // accordion-id を設定
                    if (accordionId) {
                        headerElement.attributes['data-accordion-id'] = accordionId;
                    }
                    // テキストを設定
                    if (config.header && config.header.text) {
                        const textSpan = headerElement.children.find(c => 
                            !c.attributes || !c.attributes.class || !c.attributes.class.includes('accordion-icon')
                        );
                        if (textSpan) {
                            textSpan.text = config.header.text;
                        }
                    }
                }
            }
            
            // content部分のオーバーライド
            if (config.content || accordionId) {
                const contentElement = this.findElementByAttribute(mergedTemplate, 'data-accordion-content');
                if (contentElement) {
                    // accordion-id でコンテンツとヘッダーを紐付け
                    const contentId = config.content && config.content.id ? config.content.id : accordionId;
                    if (contentId) {
                        contentElement.attributes.id = contentId;
                        contentElement.attributes['data-accordion-content'] = accordionId || contentId;
                    }
                    // 子要素を設定
                    if (config.content && config.content.children) {
                        contentElement.children = config.content.children;
                    }
                }
            }
            
            // マージされたテンプレートをレンダリング
            console.log('✅ マージ完了、レンダリング開始');
            console.log('📋 最終テンプレート:', JSON.stringify(mergedTemplate, null, 2));
            return this.render(mergedTemplate, options);

        } catch (error) {
            console.error(`❌ Error processing extends: ${config.extends}`, error.message);
            console.error(error.stack);
            return `<!-- extends error: ${config.extends} - ${error.message} -->`;
        }
    }

    /**
     * テンプレート内から指定された属性を持つ要素を再帰的に探す
     * @param {Object} template - テンプレートオブジェクト
     * @param {string} attrName - 検索する属性名
     * @returns {Object|null} - 見つかった要素またはnull
     */
    static findElementByAttribute(template, attrName) {
        if (template.attributes && template.attributes[attrName]) {
            return template;
        }
        if (template.children && Array.isArray(template.children)) {
            for (const child of template.children) {
                const found = this.findElementByAttribute(child, attrName);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * EJSテンプレートをレンダリング（Node.js環境でのみ利用可能）
     * @param {string} ejsTemplate - EJSテンプレート文字列
     * @param {Object} data - レンダリングデータ
     * @returns {Promise<string>} - レンダリングされたHTML
     */
    static async renderEJSToHTML(ejsTemplate, data = {}) {
        // Node.js環境でのみ動作
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
}

// Node.js環境とブラウザ環境の両方に対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JsonToEJS;
} else {
    window.JsonToEJS = JsonToEJS;
    // 後方互換性のためにJsonToHtmlとしても公開
    window.JsonToHtml = JsonToEJS;
}