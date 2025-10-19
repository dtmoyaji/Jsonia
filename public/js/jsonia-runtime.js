/**
 * Jsonia Runtime Engine
 * クライアントサイドでJSON定義を解釈・実行するエンジン
 */
class JsoniaRuntime {
    constructor(config = {}) {
        this.state = {};
        this.computed = {};
        this.apis = {};
        this.events = [];
        this.validators = {};
        this.config = config;
        
        console.log('✅ JsoniaRuntime初期化');
    }

    /**
     * JSON定義から初期化
     */
    init(definition) {
        if (!definition) {
            console.error('❌ 定義が指定されていません');
            return;
        }

        // 状態の初期化
        if (definition.state) {
            this.initState(definition.state);
        }

        // Computed プロパティの初期化
        if (definition.computed) {
            this.initComputed(definition.computed);
        }

        // APIの初期化
        if (definition.apis) {
            this.initAPIs(definition.apis);
        }

        // バリデーションの初期化
        if (definition.validation) {
            this.initValidation(definition.validation);
        }

        // イベントの登録
        if (definition.events) {
            this.initEvents(definition.events);
        }

        console.log('✅ JsoniaRuntime初期化完了', {
            state: Object.keys(this.state).length,
            computed: Object.keys(this.computed).length,
            apis: Object.keys(this.apis).length,
            events: this.events.length,
            validators: Object.keys(this.validators).length
        });

        // 初期化アクションの実行
        if (definition.initialization) {
            console.log('🔄 初期化アクション開始:', definition.initialization.length, '個のアクション');
            this.executeActions(definition.initialization).then(() => {
                console.log('✅ 初期化アクション完了');
                // extensions登録
                this.registerExtensionsFromState();
            }).catch(error => {
                console.error('❌ 初期化アクションエラー:', error);
            });
        } else {
            console.warn('⚠️ initialization配列が定義されていません');
        }
    }

    /**
     * stateからextensionsを読み込んでアクション登録
     */
    registerExtensionsFromState() {
        const extensions = this.getState('extensions');
        if (extensions && extensions.actions) {
            for (const [name, actionDef] of Object.entries(extensions.actions)) {
                this.registerAction(name, async (params, event) => {
                    await this.executeAction(actionDef, event);
                });
                console.log(`✅ 拡張アクション登録: ${name}`);
            }
        }
    }

    /**
     * 状態管理の初期化
     */
    initState(stateDefinition) {
        this.state = { ...stateDefinition };
        console.log('📊 State初期化:', this.state);
        this.updateStateDisplay();
    }

    /**
     * 状態の取得
     */
    getState(key) {
        if (key === undefined) {
            return this.state;
        }
        return this.state[key];
    }

    /**
     * 状態の設定
     */
    setState(key, value) {
        if (typeof key === 'object') {
            // オブジェクトで複数同時設定
            Object.assign(this.state, key);
            console.log('📝 State更新(複数):', key);
        } else {
            this.state[key] = value;
            console.log('📝 State更新:', key, '=', value);
        }
        
        // Computedプロパティを再計算
        this.updateComputed();
        
        // 状態表示を更新
        this.updateStateDisplay();
    }

    /**
     * 状態表示の更新
     */
    updateStateDisplay() {
        const stateDisplay = document.getElementById('stateDisplay');
        if (stateDisplay) {
            stateDisplay.textContent = JSON.stringify(this.state, null, 2);
        }
    }

    /**
     * Computedプロパティの初期化
     */
    initComputed(computedDefinition) {
        for (const [key, expr] of Object.entries(computedDefinition)) {
            this.computed[key] = expr;
        }
        this.updateComputed();
    }

    /**
     * Computedプロパティの更新
     */
    updateComputed() {
        for (const [key, expr] of Object.entries(this.computed)) {
            try {
                this.state[key] = this.evaluateExpression(expr);
            } catch (error) {
                console.error(`❌ Computed "${key}" の計算エラー:`, error);
            }
        }
    }

    /**
     * Expression評価エンジン
     */
    evaluateExpression(expr) {
        if (typeof expr === 'string') {
            // テンプレート変数を展開: {{key}} または {{key.nested.property}}
            // 文字列全体がテンプレート変数の場合は、値をそのまま返す
            const fullMatch = expr.match(/^\{\{([\w.]+)\}\}$/);
            if (fullMatch) {
                const path = fullMatch[1];
                const keys = path.split('.');
                let value = this.getState(keys[0]);
                
                // ネストされたプロパティを解決
                for (let i = 1; i < keys.length; i++) {
                    if (value && typeof value === 'object') {
                        value = value[keys[i]];
                    } else {
                        return undefined;
                    }
                }
                
                return value;
            }
            
            // 文字列中にテンプレート変数が埋め込まれている場合は文字列として展開
            return expr.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
                const keys = path.split('.');
                let value = this.getState(keys[0]);
                
                // ネストされたプロパティを解決
                for (let i = 1; i < keys.length; i++) {
                    if (value && typeof value === 'object') {
                        value = value[keys[i]];
                    } else {
                        return '';
                    }
                }
                
                return value ?? '';
            });
        }

        if (typeof expr !== 'object' || expr === null) {
            return expr;
        }

        // 演算子ベースの式評価
        if (expr.sum) {
            const values = expr.sum.map(e => this.evaluateExpression(e));
            return values.reduce((a, b) => Number(a) + Number(b), 0);
        }

        if (expr.add) {
            return expr.add.map(e => this.evaluateExpression(e)).reduce((a, b) => Number(a) + Number(b));
        }

        if (expr.subtract) {
            const [a, b] = expr.subtract.map(e => this.evaluateExpression(e));
            return Number(a) - Number(b);
        }

        if (expr.multiply) {
            return expr.multiply.map(e => this.evaluateExpression(e)).reduce((a, b) => Number(a) * Number(b));
        }

        if (expr.divide) {
            const [a, b] = expr.divide.map(e => this.evaluateExpression(e));
            return Number(a) / Number(b);
        }

        if (expr.gt) {
            const [a, b] = expr.gt.map(e => this.evaluateExpression(e));
            return Number(a) > Number(b);
        }

        if (expr.lt) {
            const [a, b] = expr.lt.map(e => this.evaluateExpression(e));
            return Number(a) < Number(b);
        }

        if (expr.gte) {
            const [a, b] = expr.gte.map(e => this.evaluateExpression(e));
            return Number(a) >= Number(b);
        }

        if (expr.lte) {
            const [a, b] = expr.lte.map(e => this.evaluateExpression(e));
            return Number(a) <= Number(b);
        }

        if (expr.eq) {
            const [a, b] = expr.eq.map(e => this.evaluateExpression(e));
            return a == b;
        }

        if (expr.neq) {
            const [a, b] = expr.neq.map(e => this.evaluateExpression(e));
            return a != b;
        }

        if (expr.and) {
            return expr.and.map(e => this.evaluateExpression(e)).every(v => v);
        }

        if (expr.or) {
            return expr.or.map(e => this.evaluateExpression(e)).some(v => v);
        }

        if (expr.not) {
            return !this.evaluateExpression(expr.not);
        }

        if (expr.notNull) {
            return this.evaluateExpression(expr.notNull) != null;
        }

        if (expr.map) {
            const [array, mapExpr] = expr.map;
            const arr = this.evaluateExpression(array);
            if (!Array.isArray(arr)) return [];
            return arr.map(item => this.evaluateExpression(mapExpr));
        }

        return expr;
    }

    /**
     * APIの初期化
     */
    initAPIs(apisDefinition) {
        for (const [name, apiDef] of Object.entries(apisDefinition)) {
            this.apis[name] = async (params = {}) => {
                const url = this.resolveTemplate(apiDef.url, params);
                const options = {
                    method: apiDef.method || 'GET',
                    headers: apiDef.headers || {}
                };

                if (apiDef.body) {
                    options.body = JSON.stringify(this.resolveTemplate(apiDef.body, params));
                    options.headers['Content-Type'] = 'application/json';
                }

                try {
                    console.log(`🌐 API呼び出し: ${name}`, url, options);
                    const response = await fetch(url, options);
                    const data = await response.json();
                    console.log(`✅ API成功: ${name}`, data);
                    return { success: true, data };
                } catch (error) {
                    console.error(`❌ API失敗: ${name}`, error);
                    return { success: false, error: error.message };
                }
            };
        }
        console.log('🌐 APIs初期化:', Object.keys(this.apis));
    }

    /**
     * テンプレート文字列の解決
     */
    resolveTemplate(template, params = {}) {
        if (typeof template === 'string') {
            return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return params[key] ?? this.getState(key) ?? '';
            });
        }
        if (typeof template === 'object' && template !== null) {
            const resolved = {};
            for (const [key, value] of Object.entries(template)) {
                resolved[key] = this.resolveTemplate(value, params);
            }
            return resolved;
        }
        return template;
    }

    /**
     * バリデーションの初期化
     */
    initValidation(validationDefinition) {
        for (const [field, rules] of Object.entries(validationDefinition)) {
            this.validators[field] = (value) => {
                const errors = [];
                
                for (const rule of rules) {
                    if (rule.required && !value) {
                        errors.push(rule.message || `${field}は必須です`);
                        continue;
                    }

                    if (rule.minLength && value.length < rule.minLength) {
                        errors.push(rule.message || `${field}は${rule.minLength}文字以上必要です`);
                    }

                    if (rule.maxLength && value.length > rule.maxLength) {
                        errors.push(rule.message || `${field}は${rule.maxLength}文字以下必要です`);
                    }

                    if (rule.pattern) {
                        const regex = new RegExp(rule.pattern);
                        if (!regex.test(value)) {
                            errors.push(rule.message || `${field}の形式が正しくありません`);
                        }
                    }

                    if (rule.type === 'email') {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(value)) {
                            errors.push(rule.message || '有効なメールアドレスを入力してください');
                        }
                    }

                    if (rule.type === 'number') {
                        if (isNaN(Number(value))) {
                            errors.push(rule.message || '数値を入力してください');
                        }
                    }

                    if (rule.min !== undefined && Number(value) < rule.min) {
                        errors.push(rule.message || `${rule.min}以上の値を入力してください`);
                    }

                    if (rule.max !== undefined && Number(value) > rule.max) {
                        errors.push(rule.message || `${rule.max}以下の値を入力してください`);
                    }
                }

                return { valid: errors.length === 0, errors };
            };
        }
        console.log('✅ Validation初期化:', Object.keys(this.validators));
    }

    /**
     * バリデーション実行
     */
    validate(field, value) {
        if (!this.validators[field]) {
            return { valid: true, errors: [] };
        }
        return this.validators[field](value);
    }

    /**
     * 全フィールドのバリデーション
     */
    validateAll(data) {
        const results = {};
        let allValid = true;

        for (const [field, value] of Object.entries(data)) {
            const result = this.validate(field, value);
            results[field] = result;
            if (!result.valid) {
                allValid = false;
            }
        }

        return { valid: allValid, results };
    }

    /**
     * イベントの初期化
     */
    initEvents(eventsDefinition) {
        this.events = eventsDefinition;

        for (const event of this.events) {
            const elements = document.querySelectorAll(event.target);
            
            elements.forEach(element => {
                element.addEventListener(event.type, (e) => {
                    console.log(`⚡ Event: ${event.type} on ${event.target}`);
                    this.executeActions(event.actions, e);
                });
            });
        }

        console.log('⚡ Events登録:', this.events.length);
    }

    /**
     * アクションの実行
     */
    async executeActions(actions, event = null) {
        for (const action of actions) {
            try {
                await this.executeAction(action, event);
            } catch (error) {
                console.error('❌ Action実行エラー:', action, error);
            }
        }
    }

    /**
     * 単一アクションの実行
     */
    async executeAction(action, event = null) {
        console.log('🔧 Action:', action.type, action);

        switch (action.type) {
            case 'alert':
                alert(this.resolveTemplate(action.message));
                break;

            case 'setState':
                this.setState(action.key, this.evaluateExpression(action.value));
                break;

            case 'updateDOM':
                const target = document.querySelector(action.target);
                if (target) {
                    const content = this.resolveTemplate(action.content);
                    if (action.attribute) {
                        target.setAttribute(action.attribute, content);
                    } else {
                        target.textContent = content;
                    }
                }
                break;

            case 'addClass':
                document.querySelectorAll(action.target).forEach(el => {
                    el.classList.add(action.className);
                });
                break;

            case 'removeClass':
                document.querySelectorAll(action.target).forEach(el => {
                    el.classList.remove(action.className);
                });
                break;

            case 'toggleClass':
                document.querySelectorAll(action.target).forEach(el => {
                    el.classList.toggle(action.className);
                });
                break;

            case 'navigate':
                window.location.href = this.resolveTemplate(action.url);
                break;

            case 'api':
                if (this.apis[action.name]) {
                    const params = this.resolveTemplate(action.params || {});
                    const result = await this.apis[action.name](params);
                    
                    if (action.onSuccess && result.success) {
                        await this.executeActions(action.onSuccess, event);
                    }
                    if (action.onError && !result.success) {
                        await this.executeActions(action.onError, event);
                    }
                    if (action.storeIn) {
                        this.setState(action.storeIn, result.data);
                    }
                }
                break;

            case 'validate':
                if (event && event.target) {
                    const field = event.target.name || action.field;
                    const value = event.target.value;
                    const result = this.validate(field, value);
                    
                    if (action.errorTarget) {
                        const errorEl = document.querySelector(action.errorTarget);
                        if (errorEl) {
                            errorEl.textContent = result.errors.join(', ');
                            errorEl.style.display = result.valid ? 'none' : 'block';
                        }
                    }
                }
                break;

            case 'submit':
                if (event) {
                    event.preventDefault();
                    const form = event.target.closest('form');
                    if (form) {
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        
                        const validationResult = this.validateAll(data);
                        if (validationResult.valid) {
                            if (action.onValid) {
                                await this.executeActions(action.onValid, event);
                            }
                        } else {
                            if (action.onInvalid) {
                                await this.executeActions(action.onInvalid, event);
                            }
                        }
                    }
                }
                break;

            case 'console':
                console.log(this.resolveTemplate(action.message));
                break;

            case 'if':
                const condition = this.evaluateExpression(action.condition);
                if (condition) {
                    await this.executeActions(action.then, event);
                } else if (action.else) {
                    await this.executeActions(action.else, event);
                }
                break;

            case 'function':
                // カスタム関数呼び出し
                const functionParams = { ...(action.params || {}), event };
                if (action.name && this[action.name]) {
                    await this[action.name](functionParams);
                } else if (action.name && window[action.name]) {
                    await window[action.name](functionParams);
                }
                break;

            case 'emit':
                // カスタムイベントの発火
                const customEvent = new CustomEvent(action.name, { detail: action.data });
                document.dispatchEvent(customEvent);
                break;

            // DOM操作アクション
            case 'dom.select':
                const selected = document.querySelector(this.resolveTemplate(action.selector));
                if (action.output) {
                    this.setState(action.output, selected);
                }
                return selected;

            case 'dom.selectAll':
                const selectedAll = Array.from(document.querySelectorAll(this.resolveTemplate(action.selector)));
                if (action.output) {
                    this.setState(action.output, selectedAll);
                }
                return selectedAll;

            case 'dom.createElement':
                const newElement = document.createElement(action.tag || 'div');
                if (action.output) {
                    this.setState(action.output, newElement);
                }
                return newElement;

            case 'dom.setInnerHTML':
                const htmlTarget = this.resolveValue(action.target);
                if (htmlTarget) {
                    htmlTarget.innerHTML = this.resolveTemplate(action.value);
                }
                break;

            case 'dom.setTextContent':
                const textTarget = this.resolveValue(action.target);
                if (textTarget) {
                    textTarget.textContent = this.resolveTemplate(action.value);
                }
                break;

            case 'dom.setAttribute':
                const attrTarget = this.resolveValue(action.target);
                if (attrTarget) {
                    attrTarget.setAttribute(action.name, this.resolveTemplate(action.value));
                }
                break;

            case 'dom.addClass':
                const addClassTarget = this.resolveValue(action.target);
                if (addClassTarget) {
                    addClassTarget.classList.add(action.className);
                }
                break;

            case 'dom.removeClass':
                const removeClassTarget = this.resolveValue(action.target);
                if (removeClassTarget) {
                    removeClassTarget.classList.remove(action.className);
                }
                break;

            case 'dom.toggleClass':
                const toggleClassTarget = this.resolveValue(action.target);
                if (toggleClassTarget) {
                    toggleClassTarget.classList.toggle(action.className);
                }
                break;

            case 'dom.appendChild':
                const parent = this.resolveValue(action.parent);
                const child = this.resolveValue(action.child);
                if (parent && child) {
                    parent.appendChild(child);
                }
                break;

            case 'dom.removeChild':
                const removeParent = this.resolveValue(action.parent);
                const removeChild = this.resolveValue(action.child);
                if (removeParent && removeChild) {
                    removeParent.removeChild(removeChild);
                }
                break;

            case 'dom.addEventListener':
                const eventTarget = this.resolveValue(action.target);
                if (eventTarget && action.event && action.actions) {
                    eventTarget.addEventListener(action.event, (e) => {
                        this.executeActions(action.actions, e);
                    });
                }
                break;

            // 配列操作アクション
            case 'array.forEach':
                const forEachArray = this.resolveValue(action.array);
                if (Array.isArray(forEachArray) && action.do) {
                    for (let i = 0; i < forEachArray.length; i++) {
                        const item = forEachArray[i];
                        // 一時的に変数を保存
                        const oldValue = this.getState(action.item);
                        const oldIndex = this.getState(action.index || 'index');
                        
                        this.setState(action.item, item);
                        if (action.index) {
                            this.setState(action.index, i);
                        }
                        
                        await this.executeActions(action.do, event);
                        
                        // 元に戻す
                        if (oldValue !== undefined) this.setState(action.item, oldValue);
                        if (oldIndex !== undefined) this.setState(action.index || 'index', oldIndex);
                    }
                }
                break;

            case 'array.map':
                const mapArray = this.resolveValue(action.array);
                if (Array.isArray(mapArray)) {
                    const result = [];
                    for (let i = 0; i < mapArray.length; i++) {
                        const item = mapArray[i];
                        const oldValue = this.getState(action.item);
                        this.setState(action.item, item);
                        
                        await this.executeActions(action.do, event);
                        const mappedValue = this.getState(action.output);
                        result.push(mappedValue);
                        
                        if (oldValue !== undefined) this.setState(action.item, oldValue);
                    }
                    if (action.storeIn) {
                        this.setState(action.storeIn, result);
                    }
                    return result;
                }
                break;

            case 'array.filter':
                const filterArray = this.resolveValue(action.array);
                if (Array.isArray(filterArray)) {
                    const result = [];
                    for (const item of filterArray) {
                        const oldValue = this.getState(action.item);
                        this.setState(action.item, item);
                        
                        const condition = this.evaluateExpression(action.condition);
                        if (condition) {
                            result.push(item);
                        }
                        
                        if (oldValue !== undefined) this.setState(action.item, oldValue);
                    }
                    if (action.storeIn) {
                        this.setState(action.storeIn, result);
                    }
                    return result;
                }
                break;

            // オブジェクト操作
            case 'object.set':
                const obj = this.resolveValue(action.object) || {};
                obj[action.key] = this.resolveValue(action.value);
                if (action.storeIn) {
                    this.setState(action.storeIn, obj);
                }
                break;

            case 'object.get':
                const getObj = this.resolveValue(action.object);
                const value = getObj ? getObj[action.key] : undefined;
                if (action.storeIn) {
                    this.setState(action.storeIn, value);
                }
                return value;

            // 文字列操作
            case 'string.template':
                const templated = this.resolveTemplate(action.template);
                if (action.storeIn) {
                    this.setState(action.storeIn, templated);
                }
                return templated;

            case 'string.concat':
                const parts = action.parts.map(p => this.resolveTemplate(p));
                const concatenated = parts.join(action.separator || '');
                if (action.storeIn) {
                    this.setState(action.storeIn, concatenated);
                }
                return concatenated;

            // シーケンス実行
            case 'sequence':
                if (action.steps && Array.isArray(action.steps)) {
                    for (const step of action.steps) {
                        await this.executeAction(step, event);
                    }
                }
                break;

            default:
                console.warn('⚠️ 未対応のアクション:', action.type);
        }
    }

    /**
     * 値の解決（セレクタ文字列 or state変数）
     */
    resolveValue(value) {
        if (typeof value === 'string') {
            // {{variable}}形式の場合はstateから取得
            const match = value.match(/^\{\{(.+)\}\}$/);
            if (match) {
                return this.getState(match[1]);
            }
            // それ以外はセレクタとして扱う
            return document.querySelector(value);
        }
        return value;
    }

    /**
     * カスタムアクションの登録
     */
    registerAction(name, handler) {
        this[name] = handler;
        console.log(`✅ カスタムアクション登録: ${name}`);
    }

    /**
     * 動的にイベントを追加
     */
    addEventListener(target, type, actions) {
        const elements = document.querySelectorAll(target);
        elements.forEach(element => {
            element.addEventListener(type, (e) => {
                this.executeActions(actions, e);
            });
        });
    }

    /**
     * デバッグ情報の出力
     */
    debug() {
        console.group('🔍 JsoniaRuntime Debug Info');
        console.log('State:', this.state);
        console.log('Computed:', this.computed);
        console.log('APIs:', Object.keys(this.apis));
        console.log('Events:', this.events);
        console.log('Validators:', Object.keys(this.validators));
        console.groupEnd();
    }
}

// グローバルに公開
window.JsoniaRuntime = JsoniaRuntime;
