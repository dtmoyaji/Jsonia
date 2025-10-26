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
        
        // アクションハンドラーを初期化
        if (this.initializeActionHandlers) {
            this.initializeActionHandlers();
        }
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

        // メソッドの登録
        if (definition.methods) {
            this.initMethods(definition.methods);
        }

        console.log('✅ JsoniaRuntime初期化完了');

        // 初期化アクションの実行
        if (definition.initialization) {
            // まず拡張アクションを事前登録（extensionsがstateにあれば）
            if (definition.state && definition.state.extensions) {
                this.registerExtensionsFromDefinition(definition.state.extensions);
            }
            
            this.executeActions(definition.initialization).then(() => {
                console.log('✅ Jsonia Editor 起動完了');
                // 動的に読み込まれたextensionsも登録
                this.registerExtensionsFromState();
            }).catch(error => {
                console.error('❌ 初期化エラー:', error);
            });
        } else {
            console.warn('⚠️ initialization配列が定義されていません');
        }
    }

    /**
     * 定義から直接extensionsを登録
     */
    registerExtensionsFromDefinition(extensions) {
        if (extensions && extensions.actions) {
            for (const [name, actionDef] of Object.entries(extensions.actions)) {
                this.registerAction(name, async (params) => {
                    // paramsには{event}が入っているので、event.eventで取り出す
                    const event = params && params.event;
                    await this.executeAction(actionDef, event);
                });
                // console.log(`✅ 拡張アクション事前登録: ${name}`);
            }
        }
    }

    /**
     * stateからextensionsを読み込んでアクション登録
     */
    registerExtensionsFromState() {
        const extensions = this.getState('extensions');
        if (extensions && extensions.actions) {
            for (const [name, actionDef] of Object.entries(extensions.actions)) {
                // 既に登録済みの場合はスキップ
                if (this[name]) {
                    console.log(`⏭️  既に登録済み: ${name}`);
                    continue;
                }
                this.registerAction(name, async (params) => {
                    // paramsには{event}が入っているので、event.eventで取り出す
                    const event = params && params.event;
                    await this.executeAction(actionDef, event);
                });
                // console.log(`✅ 拡張アクション登録: ${name}`);
            }
        }
    }

    /**
     * 状態管理の初期化
     */
    initState(stateDefinition) {
        this.state = { ...stateDefinition };
        // console.log('📊 State初期化:', this.state);
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
            // console.log('📝 State更新(複数):', key);
        } else {
            this.state[key] = value;
            // console.log('📝 State更新:', key, '=', value);
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
            // 否定演算子を処理: !{{variable}}
            const negationMatch = expr.match(/^!\{\{([\w.]+)\}\}$/);
            if (negationMatch) {
                const path = negationMatch[1];
                const keys = path.split('.');
                let value = this.getState(keys[0]);
                
                // ネストされたプロパティを解決
                for (let i = 1; i < keys.length; i++) {
                    if (value && typeof value === 'object') {
                        value = value[keys[i]];
                    } else {
                        value = undefined;
                        break;
                    }
                }
                
                return !value;
            }
            
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
                    // console.log(`🌐 API呼び出し: ${name}`, url, options);
                    const response = await fetch(url, options);
                    const data = await response.json();
                    // console.log(`✅ API成功: ${name}`, data);
                    return { success: true, data };
                } catch (error) {
                    console.error(`❌ API失敗: ${name}`, error);
                    return { success: false, error: error.message };
                }
            };
        }
        // console.log('🌐 APIs初期化:', Object.keys(this.apis));
    }

    /**
     * テンプレート文字列の解決
     */
    resolveTemplate(template, params = {}) {
        if (typeof template === 'string') {
            // support dotted paths like {{draggedComponent.type}}
            return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
                const keys = path.split('.');
                // try params first
                let value = params[keys[0]];
                if (value === undefined) value = this.getState(keys[0]);
                // resolve nested properties
                for (let i = 1; i < keys.length; i++) {
                    if (value && typeof value === 'object') value = value[keys[i]]; else { value = undefined; break; }
                }
                return value ?? '';
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
        // Prevent adding delegated listeners multiple times (initEvents may be called again)
        if (this.__jsoniaDelegationListenersAdded) {
            this.events = eventsDefinition;
            return;
        }
        this.events = eventsDefinition;

        // Use event delegation so dynamically rendered elements (e.g. components
        // added after initialization) still respond to registered events.
        for (const event of this.events) {
            // Attach a delegated listener at document level
            document.addEventListener(event.type, (e) => {
                try {
                    // For dragover and drop, always prevent default to allow drop handling
                    if (event.type === 'dragover' || event.type === 'drop') {
                        e.preventDefault();
                    }

                    // Find the nearest ancestor (including the event target itself)
                    // that matches the configured selector. If none, ignore.
                    const matched = e.target.closest ? e.target.closest(event.target) : null;
                    if (!matched) return;

                    // Debug log for non-frequent events
                    if (!['dragover', 'dragstart', 'dragend'].includes(event.type)) {
                        console.log(`⚡ Delegated Event: ${event.type} on ${event.target}`);
                    }

                    // Provide the matched element as the event.currentTarget by
                    // creating a proxy event that inherits from the native event
                    // but overrides currentTarget. This preserves methods like
                    // preventDefault/stopPropagation while ensuring action
                    // definitions that reference {{event.currentTarget}} work.
                    const proxyEvent = Object.create(e);
                    try {
                        Object.defineProperty(proxyEvent, 'currentTarget', {
                            value: matched,
                            writable: false,
                            enumerable: true,
                            configurable: true
                        });
                    } catch (err) {
                        // Fallback: assign directly if defineProperty fails in some envs
                        proxyEvent.currentTarget = matched;
                    }

                    // Support both legacy single "action" (string) and new "actions" (array)
                    try {
                        if (event.actions && Array.isArray(event.actions)) {
                            this.executeActions(event.actions, proxyEvent);
                        } else if (event.action) {
                            // If a single action name is provided, call it as a registered function on the runtime
                            // Build a small action wrapper that invokes the named function
                            const namedAction = { type: 'function', name: event.action };
                            this.executeActions([namedAction], proxyEvent);
                        } else {
                            // Nothing to run
                        }

                        // Mark the native event as handled by Jsonia to avoid duplicate handlers
                        try {
                            // prefer to set on the proxyEvent first (if consumer checks there)
                            proxyEvent.__jsoniaHandled = true;
                            // also set on the original native event for compatibility with other handlers
                            e.__jsoniaHandled = true;
                        } catch (flagErr) {
                            // ignore
                        }
                    } catch (err) {
                        console.error('❌ Error executing delegated event actions:', err);
                    }
                } catch (err) {
                    console.error('❌ Delegated event handler error:', err);
                }
            });
        }

        // console.log('⚡ Events登録:', this.events.length);
        // Expose a flag so that external fallback handlers can detect that
        // delegated event handling is active and avoid attaching duplicate handlers.
        try { if (typeof window !== 'undefined') window.__jsoniaDelegationActive = true; } catch (e) {}
        this.__jsoniaDelegationListenersAdded = true;
    }

    /**
     * メソッドの初期化
     */
    initMethods(methodsDefinition) {
        if (!this.methods) {
            this.methods = {};
        }

        for (const [methodName, methodDef] of Object.entries(methodsDefinition)) {
            this.methods[methodName] = methodDef;
            console.log(`📦 メソッド登録: ${methodName}`);
        }
    }

    /**
     * 登録されたメソッドを呼び出す
     */
    async callMethod(methodName, params = {}) {
        const methodDef = this.methods && this.methods[methodName];
        
        if (!methodDef) {
            console.error(`❌ メソッドが見つかりません: ${methodName}`);
            return;
        }

        // パラメータをstateに一時的に設定
        const tempState = {};
        if (methodDef.params && Array.isArray(methodDef.params)) {
            methodDef.params.forEach(paramName => {
                if (params[paramName] !== undefined) {
                    tempState[paramName] = params[paramName];
                    this.setState(paramName, params[paramName]);
                }
            });
        }

        console.log(`🎯 メソッド実行: ${methodName}`, params);

        // メソッドのstepsを実行
        if (methodDef.steps) {
            await this.executeActions(methodDef.steps);
        }

        // 一時的なstateをクリーンアップ
        Object.keys(tempState).forEach(key => {
            this.setState(key, undefined);
        });
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
        // デバッグログ: 必要に応じてコメント解除
        // console.log('🔧 Action:', action.type, action);

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
                            // Prefer class-based visibility control so CSS can manage transitions
                            try {
                                if (result.valid) {
                                    errorEl.classList.add('hidden');
                                } else {
                                    errorEl.classList.remove('hidden');
                                }
                            } catch (err) {
                                // Fallback for environments without classList
                                errorEl.style.display = result.valid ? 'none' : 'block';
                            }
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
                if (action.value !== undefined) {
                    console.log(this.resolveValue(action.value));
                } else {
                    console.log(this.resolveTemplate(action.message));
                }
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

            // シーケンス実行
            case 'sequence':
                if (action.steps && Array.isArray(action.steps)) {
                    for (const step of action.steps) {
                        await this.executeAction(step, event);
                    }
                }
                break;

            // 拡張アクション登録
            case 'registerExtensions':
                this.registerExtensionsFromState();
                break;

            // DOM操作、配列、オブジェクト、テンプレート、ドラッグなどはjsonia-runtime-actions.jsで定義
            default:
                // 登録済みアクションハンドラーを呼び出す
                if (this.actionHandlers && this.actionHandlers[action.type]) {
                    await this.actionHandlers[action.type].call(this, action, event);
                } else {
                    console.warn('⚠️ 未対応のアクション:', action.type);
                }
        }
    }

    /**
     * 値の解決（セレクタ文字列 or state変数）
     */
    resolveValue(value) {
        if (typeof value === 'string') {
            // {{variable}}形式の場合はstateから取得（ネストされたプロパティにも対応）
            const match = value.match(/^\{\{(.+)\}\}$/);
            if (match) {
                const path = match[1];
                const keys = path.split('.');
                let result = this.getState(keys[0]);
                
                // ネストされたプロパティを解決
                for (let i = 1; i < keys.length; i++) {
                    if (result && typeof result === 'object') {
                        result = result[keys[i]];
                    } else {
                        return undefined;
                    }
                }
                
                return result;
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
        // console.log(`✅ カスタムアクション登録: ${name}`);
    }

    /**
     * 共有・組み込みコンポーネント定義を名前で検索して返す。
     * name は component.name または component.type を想定します。
     */
    loadSharedComponent(name) {
        if (!name) return null;
        const lists = [ this.getState('componentsData'), this.getState('sharedComponents'), this.getState('editorComponents') ];
        for (const list of lists) {
            if (!Array.isArray(list)) continue;
            for (const comp of list) {
                if (!comp) continue;
                if (comp.name === name || comp.type === name) return comp;
                // Some entries may have filename like "tabs/component.json".
                // Be conservative when matching by filename to avoid false-positives: prefer exact filename in root or
                // a component.json whose parent folder matches the requested name.
                if (comp.filename) {
                    const parts = comp.filename.replace(/\\/g, '/').split('/');
                    const base = parts.pop();
                    const parent = parts.length > 0 ? parts[parts.length - 1] : null;
                    // Match when the file is exactly '<name>.json' at the root of the components list
                    if (base === `${name}.json` && parts.length === 0) return comp;
                    // Match when the file is a 'component.json' located in a folder named after the component
                    if (base === 'component.json' && parent === name) return comp;
                }
            }
        }
        // not found
        return null;
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
    
    // ヘルパーメソッド (renderComponentFromJSON, buildTreeHTML, createComponentCategory, createComponentItem) は
    // jsonia-runtime-actions.js で定義され、addJsoniaRuntimeHelpers() で追加されます
}

// ドロップ位置から最寄りの .sub-drop を解決して state に保存するユーティリティ
JsoniaRuntime.prototype.resolveDropZone = function(params = {}) {
    const event = params && params.event;
    try {
        // 優先的にクライアント座標を使う
        function safeRead(ev, prop) {
            try {
                return ev && ev[prop];
            } catch (err) {
                // proxy event の場合、ネイティブイベントはプロトタイプにあるのでそちらから読む
                try {
                    const proto = ev && Object.getPrototypeOf(ev);
                    return proto ? proto[prop] : undefined;
                } catch (err2) {
                    return undefined;
                }
            }
        }
        const touch = (safeRead(event, 'touches') && safeRead(event, 'touches')[0]) || null;
        const x = (safeRead(event, 'clientX') || (touch && touch.clientX)) || null;
        const y = (safeRead(event, 'clientY') || (touch && touch.clientY)) || null;
        let el = null;
        if (x !== null && y !== null) {
            el = document.elementFromPoint(x, y);
        }
        // DEBUG: ログ出力して座標と要素を確認
        try {
            console.log('🔎 resolveDropZone coords:', { x, y, eventTarget: event && event.target, eventCurrentTarget: event && event.currentTarget });
            console.log('🔎 elementFromPoint ->', el);
        } catch (e) { /* ignore logging issues */ }
        // fallback: event.target (if available) or the delegated currentTarget
        if (!el && event) {
            el = event.target || event.currentTarget || null;
        }
        const zone = el ? el.closest ? el.closest('.sub-drop') : null : null;
        // フォールバック：main-drop を使う
    const finalZone = zone || document.querySelector('#drop-zone .main-drop');
    try { console.log('🔎 resolved zone ->', finalZone); } catch (e) {}
        this.setState('dropZone', finalZone);
        return finalZone;
    } catch (err) {
        console.warn('⚠️ resolveDropZone error', err, params);
        const fallback = document.querySelector('#drop-zone .main-drop');
        this.setState('dropZone', fallback);
        return fallback;
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.JsoniaRuntime = JsoniaRuntime;
}

// Inject accordion style object (from /editor/components/accordion/style.json)
JsoniaRuntime.prototype.injectAccordionStyle = function(params = {}) {
    try {
        const styleObj = this.getState('accordionStyleResponse');
        if (!styleObj) return false;
        function camelToKebab(s) { return s.replace(/[A-Z]/g, function(m){ return '-' + m.toLowerCase(); }); }
        let css = '';
        for (const sel in styleObj) {
            if (!Object.prototype.hasOwnProperty.call(styleObj, sel)) continue;
            css += `${sel} {\n`;
            const rules = styleObj[sel] || {};
            for (const prop in rules) {
                if (!Object.prototype.hasOwnProperty.call(rules, prop)) continue;
                const val = rules[prop];
                const propName = camelToKebab(prop);
                css += `  ${propName}: ${val};\n`;
            }
            css += `}\n`;
        }
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-injected-by','jsonia-editor');
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
        console.log('✅ accordion style injected (via runtime)');
        return true;
    } catch (err) {
        console.warn('⚠️ injectAccordionStyle failed', err);
        return false;
    }
};

// Inject styles for editor-provided components (editorComponents[].style)
JsoniaRuntime.prototype.injectEditorComponentsStyles = function(params = {}) {
    try {
        const comps = this.getState('editorComponents');
        if (!Array.isArray(comps) || comps.length === 0) return false;
        function camelToKebab(s) { return s.replace(/[A-Z]/g, function(m){ return '-' + m.toLowerCase(); }); }
        comps.forEach(comp => {
            try {
                if (!comp || !comp.style || !comp.name) return;
                const marker = 'jsonia-editor-style:' + comp.name;
                const already = Array.from(document.querySelectorAll('style[data-injected-by]')).some(s => s.getAttribute('data-injected-by') === marker);
                if (already) return;
                let css = '';
                for (const sel in comp.style) {
                    if (!Object.prototype.hasOwnProperty.call(comp.style, sel)) continue;
                    css += `${sel} {\n`;
                    const rules = comp.style[sel] || {};
                    for (const prop in rules) {
                        if (!Object.prototype.hasOwnProperty.call(rules, prop)) continue;
                        const val = rules[prop];
                        css += `  ${camelToKebab(prop)}: ${val};\n`;
                    }
                    css += `}\n`;
                }
                const el = document.createElement('style');
                el.setAttribute('data-injected-by', marker);
                el.textContent = css;
                document.head.appendChild(el);
                console.log('✅ editor component style injected for', comp.name);
            } catch (err) { console.warn('⚠️ injectEditorComponentsStyles: failed for', comp && comp.name, err); }
        });
        return true;
    } catch (err) {
        console.warn('⚠️ injectEditorComponentsStyles failed', err);
        return false;
    }
};

// Auto-bootstrap editor behavior when running inside the editor page.
// If the DOM contains #drop-zone we assume this is the editor and attempt to fetch
// the editor behavior definition and initialize the runtime. This replaces the
// previous external `jsonia-editor-init.js` loader.
if (typeof window !== 'undefined') {
    try {
        // Only auto-init if there's an editor canvas present
        if (document && document.querySelector && document.querySelector('#drop-zone')) {
            (async function(){
                try {
                    const resp = await fetch('/editor/components/editor/behavior.json');
                    if (!resp.ok) { console.warn('⚠️ editor.behavior fetch failed', resp.status); return; }
                    const def = await resp.json();
                    window.jsoniaRuntime = new JsoniaRuntime();
                    window.jsoniaRuntime.init(def);
                } catch (err) {
                    console.error('❌ auto-init editor failed', err);
                }
            })();
        }
    } catch (err) {
        // ignore
    }
}
