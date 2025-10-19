/**
 * JsonToJS - JSON定義からJavaScriptコードを生成
 * イベントハンドラー、状態管理、API呼び出しなどを構造化
 */

class JsonToJS {
    constructor() {
        this.stateVars = new Map();
    }

    /**
     * JSON定義全体からJavaScriptコードを生成
     */
    generate(config) {
        const parts = [];

        // 状態管理の初期化
        if (config.state) {
            parts.push(this.generateState(config.state));
        }

        // computed プロパティ
        if (config.computed) {
            parts.push(this.generateComputed(config.computed));
        }

        // API定義
        if (config.apis) {
            parts.push(this.generateAPIs(config.apis));
        }

        // イベントハンドラー
        if (config.events) {
            parts.push(this.generateEvents(config.events));
        }

        // バリデーション
        if (config.validation) {
            parts.push(this.generateValidation(config.validation));
        }

        // 初期化処理
        if (config.onLoad) {
            parts.push(this.generateOnLoad(config.onLoad));
        }

        return parts.filter(p => p).join('\n\n');
    }

    /**
     * 状態管理コードの生成
     */
    generateState(stateConfig) {
        const stateEntries = Object.entries(stateConfig)
            .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
            .join(',\n');

        return `// State Management
const appState = {
${stateEntries}
};

function setState(updates) {
    Object.assign(appState, updates);
    if (typeof onStateChange === 'function') {
        onStateChange(appState);
    }
}

function getState(key) {
    return key ? appState[key] : appState;
}`;
    }

    /**
     * computed プロパティの生成
     */
    generateComputed(computedConfig) {
        const computedFunctions = Object.entries(computedConfig)
            .map(([key, expr]) => {
                const jsExpr = this.expressionToJS(expr);
                return `    get ${key}() { return ${jsExpr}; }`;
            })
            .join(',\n');

        return `// Computed Properties
const computed = {
${computedFunctions}
};`;
    }

    /**
     * 式をJavaScriptに変換
     */
    expressionToJS(expr) {
        if (typeof expr === 'string') {
            // テンプレート変数の置換 {{variable}}
            return expr.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
                return `getState('${path}')`;
            });
        }

        if (typeof expr === 'object') {
            // 演算子の処理
            if (expr.sum) return `${this.arrayToJS(expr.sum)}.reduce((a, b) => a + b, 0)`;
            if (expr.add) return this.arrayToJS(expr.add).replace(/,/g, ' + ');
            if (expr.multiply) return this.arrayToJS(expr.multiply).replace(/,/g, ' * ');
            if (expr.gt) return `${this.valueToJS(expr.gt[0])} > ${this.valueToJS(expr.gt[1])}`;
            if (expr.lt) return `${this.valueToJS(expr.lt[0])} < ${this.valueToJS(expr.lt[1])}`;
            if (expr.eq) return `${this.valueToJS(expr.eq[0])} === ${this.valueToJS(expr.eq[1])}`;
            if (expr.and) return this.arrayToJS(expr.and).replace(/,/g, ' && ');
            if (expr.or) return this.arrayToJS(expr.or).replace(/,/g, ' || ');
            if (expr.not) return `!(${this.valueToJS(expr.not)})`;
            if (expr.notNull) return `${this.valueToJS(expr.notNull)} != null`;
            if (expr.map) return `Object.values(${this.valueToJS(expr.map)})`;
        }

        return JSON.stringify(expr);
    }

    arrayToJS(arr) {
        return `[${arr.map(v => this.valueToJS(v)).join(', ')}]`;
    }

    valueToJS(value) {
        if (typeof value === 'string' && value.startsWith('{{')) {
            return this.expressionToJS(value);
        }
        return JSON.stringify(value);
    }

    /**
     * API定義の生成
     */
    generateAPIs(apisConfig) {
        const apiMethods = Object.entries(apisConfig)
            .map(([name, config]) => {
                const url = config.url || '';
                const method = config.method || 'GET';
                const body = config.body ? JSON.stringify(config.body, null, 4) : 'null';
                const transform = config.transform ? this.expressionToJS(config.transform) : 'response';

                return `    async ${name}(params = {}) {
        try {
            const url = \`${url}\`.replace(/\\{(\\w+)\\}/g, (_, key) => params[key] || '');
            const options = {
                method: '${method}',
                headers: { 'Content-Type': 'application/json' }
            };
            
            ${method !== 'GET' ? `options.body = JSON.stringify(${body.replace(/\{\{([^}]+)\}\}/g, (_, path) => `params.${path}`)});` : ''}
            
            const response = await fetch(url, options);
            const data = await response.json();
            return ${transform.replace(/response/g, 'data')};
        } catch (error) {
            console.error('API Error (${name}):', error);
            throw error;
        }
    }`;
            })
            .join(',\n\n');

        return `// API Methods
const api = {
${apiMethods}
};`;
    }

    /**
     * イベントハンドラーの生成
     */
    generateEvents(eventsConfig) {
        const handlers = Object.entries(eventsConfig)
            .map(([eventKey, config]) => {
                const [event, selector] = eventKey.includes('#') 
                    ? eventKey.split('#') 
                    : [eventKey, 'document'];
                
                const actions = this.generateActions(config.actions || []);
                
                return `// Event: ${eventKey}
document.addEventListener('DOMContentLoaded', function() {
    const target = ${selector === 'document' ? 'document' : `document.querySelector('${selector}')`};
    if (target) {
        target.addEventListener('${event}', async function(event) {
${actions}
        });
    }
});`;
            })
            .join('\n\n');

        return `// Event Handlers\n${handlers}`;
    }

    /**
     * アクション配列をJavaScriptに変換
     */
    generateActions(actions) {
        return actions.map(action => {
            switch (action.type) {
                case 'alert':
                    return `            alert(${JSON.stringify(action.message)});`;
                
                case 'console':
                    return `            console.log(${JSON.stringify(action.message)});`;
                
                case 'setState':
                    const updates = JSON.stringify(action.updates || {});
                    return `            setState(${updates});`;
                
                case 'fetch':
                case 'api':
                    const apiName = action.api || 'fetch';
                    const params = action.params ? JSON.stringify(action.params) : '{}';
                    return `            await api.${apiName}(${params});`;
                
                case 'updateDOM':
                    const selector = action.selector;
                    const content = action.content || '';
                    return `            document.querySelector('${selector}').innerHTML = ${JSON.stringify(content)};`;
                
                case 'addClass':
                    return `            document.querySelector('${action.selector}').classList.add('${action.class}');`;
                
                case 'removeClass':
                    return `            document.querySelector('${action.selector}').classList.remove('${action.class}');`;
                
                case 'toggleClass':
                    return `            document.querySelector('${action.selector}').classList.toggle('${action.class}');`;
                
                case 'navigate':
                    return `            window.location.href = '${action.url}';`;
                
                case 'redirect':
                    return `            window.location.replace('${action.url}');`;
                
                case 'reload':
                    return `            window.location.reload();`;
                
                case 'submit':
                    return `            document.querySelector('${action.form}').submit();`;
                
                case 'custom':
                    return `            ${action.code}`;
                
                default:
                    return `            console.warn('Unknown action type: ${action.type}');`;
            }
        }).join('\n');
    }

    /**
     * バリデーション関数の生成
     */
    generateValidation(validationConfig) {
        const validators = Object.entries(validationConfig)
            .map(([field, rules]) => {
                const checks = [];
                
                if (rules.required) {
                    checks.push(`if (!value) return { valid: false, message: '${rules.message || field + 'は必須です'}' };`);
                }
                
                if (rules.type === 'email') {
                    checks.push(`if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) return { valid: false, message: '${rules.message || '有効なメールアドレスを入力してください'}' };`);
                }
                
                if (rules.minLength) {
                    checks.push(`if (value.length < ${rules.minLength}) return { valid: false, message: '${rules.message || field + 'は' + rules.minLength + '文字以上で入力してください'}' };`);
                }
                
                if (rules.maxLength) {
                    checks.push(`if (value.length > ${rules.maxLength}) return { valid: false, message: '${rules.message || field + 'は' + rules.maxLength + '文字以内で入力してください'}' };`);
                }
                
                if (rules.pattern) {
                    checks.push(`if (!new RegExp('${rules.pattern}').test(value)) return { valid: false, message: '${rules.message || field + 'の形式が正しくありません'}' };`);
                }
                
                return `    ${field}: function(value) {
        ${checks.join('\n        ')}
        return { valid: true };
    }`;
            })
            .join(',\n\n');

        return `// Validation
const validators = {
${validators}
};

function validate(field, value) {
    if (validators[field]) {
        return validators[field](value);
    }
    return { valid: true };
}

function validateForm(formData) {
    const errors = {};
    for (const [field, value] of Object.entries(formData)) {
        const result = validate(field, value);
        if (!result.valid) {
            errors[field] = result.message;
        }
    }
    return { valid: Object.keys(errors).length === 0, errors };
}`;
    }

    /**
     * ページ読み込み時の処理
     */
    generateOnLoad(onLoadActions) {
        const actions = this.generateActions(onLoadActions);
        return `// On Load
document.addEventListener('DOMContentLoaded', async function() {
${actions}
});`;
    }
}

module.exports = JsonToJS;
