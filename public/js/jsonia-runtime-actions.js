/**
 * Jsonia Runtime Actions Library
 * アクション実装をJsoniaRuntimeに追加するミックスイン
 */

/**
 * JsoniaRuntimeにアクションハンドラーを追加
 */
function extendJsoniaRuntimeWithActions(JsoniaRuntimeClass) {
    
    /**
     * 拡張executeActionメソッド - アクションハンドラーをディスパッチ
     */
    const originalExecuteAction = JsoniaRuntimeClass.prototype.executeAction;
    
    JsoniaRuntimeClass.prototype.executeAction = async function(action, event = null) {
        // カスタムアクションハンドラーを先にチェック
        const handler = this.actionHandlers && this.actionHandlers[action.type];
        if (handler) {
            return await handler.call(this, action, event);
        }
        
        // 元のexecuteActionにフォールバック
        return await originalExecuteAction.call(this, action, event);
    };
    
    /**
     * アクションハンドラー登録
     */
    JsoniaRuntimeClass.prototype.registerActionHandler = function(type, handler) {
        if (!this.actionHandlers) {
            this.actionHandlers = {};
        }
        this.actionHandlers[type] = handler;
    };
    
    /**
     * すべてのアクションハンドラーを登録
     */
    JsoniaRuntimeClass.prototype.initializeActionHandlers = function() {
        // DOM操作
        this.registerActionHandler('dom.select', domSelect);
        this.registerActionHandler('dom.selectAll', domSelectAll);
        this.registerActionHandler('dom.createElement', domCreateElement);
        this.registerActionHandler('dom.setInnerHTML', domSetInnerHTML);
        this.registerActionHandler('dom.setTextContent', domSetTextContent);
        this.registerActionHandler('dom.setAttribute', domSetAttribute);
        this.registerActionHandler('dom.addClass', domAddClass);
        this.registerActionHandler('dom.removeClass', domRemoveClass);
        this.registerActionHandler('dom.toggleClass', domToggleClass);
        this.registerActionHandler('dom.appendChild', domAppendChild);
        this.registerActionHandler('dom.insertIntoSlot', domInsertIntoSlot);
        this.registerActionHandler('dom.removeChild', domRemoveChild);
        this.registerActionHandler('dom.remove', domRemove);
        this.registerActionHandler('dom.removeInnerDropZone', domRemoveInnerDropZone);
        this.registerActionHandler('dom.stopPropagation', domStopPropagation);
        this.registerActionHandler('dom.preventDefault', domPreventDefault);
        this.registerActionHandler('dom.addEventListener', domAddEventListener);
        this.registerActionHandler('dom.createFromHTML', domCreateFromHTML);
        this.registerActionHandler('dom.buildTree', domBuildTree);
        
        // 配列操作
        this.registerActionHandler('array.forEach', arrayForEach);
        this.registerActionHandler('array.map', arrayMap);
        this.registerActionHandler('array.filter', arrayFilter);
        this.registerActionHandler('array.length', arrayLength);
        
        // オブジェクト操作
        this.registerActionHandler('object.set', objectSet);
        this.registerActionHandler('object.get', objectGet);
        
        // 文字列操作
        this.registerActionHandler('string.template', stringTemplate);
        this.registerActionHandler('string.concat', stringConcat);
        
        // ユーティリティ
        this.registerActionHandler('util.parseJSON', utilParseJSON);
        this.registerActionHandler('util.timestamp', utilTimestamp);
        this.registerActionHandler('util.delay', utilDelay);
        this.registerActionHandler('util.getAttribute', utilGetAttribute);
        this.registerActionHandler('util.closest', utilClosest);
        this.registerActionHandler('util.querySelector', utilQuerySelector);
        
        // テンプレート・コンポーネント
        this.registerActionHandler('template.renderFromJSON', templateRenderFromJSON);
        this.registerActionHandler('component.renderList', componentRenderList);
                this.registerActionHandler('component.method', componentMethod.bind(this));
        this.registerActionHandler('registerComponentMethods', registerComponentMethods.bind(this));
        this.registerActionHandler('registerComponentActions', registerComponentActions.bind(this));
        
        // ドラッグ&ドロップ
        this.registerActionHandler('drag.setData', dragSetData);
        this.registerActionHandler('drag.getData', dragGetData);
    };
}

// =====================================================
// DOM操作アクション
// =====================================================

async function domSelect(action, event) {
    const selected = document.querySelector(this.resolveTemplate(action.selector));
    if (action.output) {
        this.setState(action.output, selected);
    }
    return selected;
}

async function domSelectAll(action, event) {
    const selectedAll = Array.from(document.querySelectorAll(this.resolveTemplate(action.selector)));
    if (action.output) {
        this.setState(action.output, selectedAll);
    }
    return selectedAll;
}

async function domCreateElement(action, event) {
    const newElement = document.createElement(action.tag || 'div');
    if (action.output) {
        this.setState(action.output, newElement);
    }
    return newElement;
}

async function domSetInnerHTML(action, event) {
    const htmlTarget = this.resolveValue(action.target);
    if (htmlTarget) {
        htmlTarget.innerHTML = this.resolveTemplate(action.value);
    }
}

async function domSetTextContent(action, event) {
    const textTarget = this.resolveValue(action.target);
    if (textTarget) {
        textTarget.textContent = this.resolveTemplate(action.value);
    }
}

async function domSetAttribute(action, event) {
    const attrTarget = this.resolveValue(action.target);
    if (attrTarget) {
        attrTarget.setAttribute(action.name, this.resolveTemplate(action.value));
    }
}

async function domAddClass(action, event) {
    const addClassTarget = this.resolveValue(action.target);
    if (addClassTarget) {
        addClassTarget.classList.add(action.className);
    }
}

async function domRemoveClass(action, event) {
    const removeClassTarget = this.resolveValue(action.target);
    if (removeClassTarget) {
        removeClassTarget.classList.remove(action.className);
    }
}

async function domToggleClass(action, event) {
    const toggleClassTarget = this.resolveValue(action.target);
    if (toggleClassTarget) {
        toggleClassTarget.classList.toggle(action.className);
    }
}

async function domAppendChild(action, event) {
    const parent = this.resolveValue(action.parent);
    const child = this.resolveValue(action.child);
    if (parent && child) {
        parent.appendChild(child);
    }
}

async function domInsertIntoSlot(action, event) {
    const container = this.resolveValue(action.container);
    const children = this.resolveValue(action.children);
    const slotName = action.slotName || 'children';
    
    if (container && children) {
        const success = this.insertIntoSlot(container, children, slotName);
        if (success) {
            console.log(`✅ スロット "${slotName}" に要素を挿入しました`);
        } else {
            console.log(`⚠️ スロット "${slotName}" が見つかりません。コンテナに直接挿入しました`);
        }
        
        if (action.output) {
            this.setState(action.output, success);
        }
        return success;
    }
    return false;
}

async function domRemoveChild(action, event) {
    const removeParent = this.resolveValue(action.parent);
    const removeChild = this.resolveValue(action.child);
    if (removeParent && removeChild) {
        removeParent.removeChild(removeChild);
    }
}

async function domRemove(action, event) {
    const element = this.resolveValue(action.target);
    if (element && element.remove) {
        element.remove();
    }
}

async function domRemoveInnerDropZone(action, event) {
    const parent = this.resolveValue(action.parent);
    if (parent) {
        const innerDropZone = parent.querySelector('.inner-drop-zone');
        if (innerDropZone) {
            innerDropZone.remove();
            console.log('🗑️ 内部ドロップゾーンを削除しました');
        }
    }
}

async function domStopPropagation(action, event) {
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
}

async function domPreventDefault(action, event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
}

async function domAddEventListener(action, event) {
    const eventTarget = this.resolveValue(action.target);
    if (eventTarget && action.event && action.actions) {
        eventTarget.addEventListener(action.event, (e) => {
            this.executeActions(action.actions, e);
        });
    }
}

async function domCreateFromHTML(action, event) {
    const htmlString = this.resolveTemplate(action.html);
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlString;
    const createdElement = tempContainer.firstChild;
    if (action.output) {
        this.setState(action.output, createdElement);
    }
    return createdElement;
}

async function domBuildTree(action, event) {
    const rootElement = this.resolveValue(action.root);
    const startLevel = action.level || 0;
    const treeHTML = this.buildTreeHTML(rootElement, startLevel, action.options || {});
    if (action.output) {
        this.setState(action.output, treeHTML);
    }
    return treeHTML;
}

// =====================================================
// 配列操作アクション
// =====================================================

async function arrayForEach(action, event) {
    const forEachArray = this.resolveValue(action.array);
    if (Array.isArray(forEachArray) && action.do) {
        for (let i = 0; i < forEachArray.length; i++) {
            const item = forEachArray[i];
            const oldValue = this.getState(action.item);
            const oldIndex = this.getState(action.index || 'index');
            
            this.setState(action.item, item);
            if (action.index) {
                this.setState(action.index, i);
            }
            
            await this.executeActions(action.do, event);
            
            if (oldValue !== undefined) this.setState(action.item, oldValue);
            if (oldIndex !== undefined) this.setState(action.index || 'index', oldIndex);
        }
    }
}

async function arrayMap(action, event) {
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
}

async function arrayFilter(action, event) {
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
}

async function arrayLength(action, event) {
    const array = this.resolveValue(action.array);
    const length = Array.isArray(array) ? array.length : 0;
    if (action.output) {
        this.setState(action.output, length);
    }
    return length;
}

// =====================================================
// オブジェクト操作アクション
// =====================================================

async function objectSet(action, event) {
    const obj = this.resolveValue(action.object) || {};
    obj[action.key] = this.resolveValue(action.value);
    if (action.storeIn) {
        this.setState(action.storeIn, obj);
    }
}

async function objectGet(action, event) {
    const getObj = this.resolveValue(action.object);
    const value = getObj ? getObj[action.key] : undefined;
    if (action.storeIn) {
        this.setState(action.storeIn, value);
    }
    return value;
}

// =====================================================
// 文字列操作アクション
// =====================================================

async function stringTemplate(action, event) {
    const templated = this.resolveTemplate(action.template);
    if (action.storeIn) {
        this.setState(action.storeIn, templated);
    }
    return templated;
}

async function stringConcat(action, event) {
    const parts = action.parts.map(p => this.resolveTemplate(p));
    const concatenated = parts.join(action.separator || '');
    if (action.storeIn) {
        this.setState(action.storeIn, concatenated);
    }
    return concatenated;
}

// =====================================================
// ユーティリティアクション
// =====================================================

async function utilParseJSON(action, event) {
    const jsonString = this.resolveTemplate(action.json);
    
    // 空文字列やundefinedの場合はnullを返す
    if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
        console.warn('⚠️ utilParseJSON: JSONデータが空です', { jsonString });
        if (action.output) {
            this.setState(action.output, null);
        }
        return null;
    }
    
    try {
        const parsed = JSON.parse(jsonString);
        if (action.output) {
            this.setState(action.output, parsed);
        }
        return parsed;
    } catch (error) {
        console.error('❌ JSON parse error:', error, { jsonString });
        if (action.output) {
            this.setState(action.output, null);
        }
        return null;
    }
}

async function utilTimestamp(action, event) {
    const timestamp = Date.now();
    if (action.output) {
        this.setState(action.output, timestamp);
    }
    return timestamp;
}

async function utilDelay(action, event) {
    const ms = action.ms || 100;
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function utilGetAttribute(action, event) {
    let targetElement = this.resolveValue(action.target);
    
    // {{event.currentTarget}}のような場合、eventオブジェクトから直接取得
    if (!targetElement && typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1];
            const keys = path.split('.');
            targetElement = event[keys[0]];
            for (let i = 1; i < keys.length; i++) {
                if (targetElement && typeof targetElement === 'object') {
                    targetElement = targetElement[keys[i]];
                } else {
                    targetElement = undefined;
                    break;
                }
            }
        }
    }
    
    // attribute === 'closest' の場合は closest() メソッドを呼び出す
    if (action.attribute === 'closest' && targetElement && targetElement.closest) {
        const closestElement = targetElement.closest(action.selector);
        if (action.output) {
            this.setState(action.output, closestElement);
        }
        return closestElement;
    }
    
    // 通常の getAttribute
    if (targetElement && targetElement.getAttribute) {
        const attrValue = targetElement.getAttribute(action.name || action.attribute);
        if (action.output) {
            this.setState(action.output, attrValue);
        }
        return attrValue;
    }
    
    console.warn('⚠️ utilGetAttribute: 要素が見つからないか、メソッドがありません', {
        target: action.target,
        resolvedElement: targetElement,
        event: event
    });
    return null;
}

async function utilClosest(action, event) {
    let targetElement = this.resolveValue(action.target);
    
    // {{event.currentTarget}}のような場合
    if (!targetElement && typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1];
            const keys = path.split('.');
            targetElement = event[keys[0]];
            for (let i = 1; i < keys.length; i++) {
                if (targetElement && typeof targetElement === 'object') {
                    targetElement = targetElement[keys[i]];
                }
            }
        }
    }
    
    if (targetElement && targetElement.closest) {
        const closestElement = targetElement.closest(action.selector);
        if (action.output) {
            this.setState(action.output, closestElement);
        }
        return closestElement;
    }
    
    console.warn('⚠️ utilClosest: 要素が見つからないか、closestメソッドがありません', {
        target: action.target,
        selector: action.selector
    });
    return null;
}

async function utilQuerySelector(action, event) {
    let parent = this.resolveValue(action.parent);
    
    // {{event.currentTarget}}のような場合、eventオブジェクトから直接取得
    if (!parent && typeof action.parent === 'string' && event) {
        const eventMatch = action.parent.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1];
            const keys = path.split('.');
            parent = event[keys[0]];
            for (let i = 1; i < keys.length; i++) {
                if (parent && typeof parent === 'object') {
                    parent = parent[keys[i]];
                } else {
                    parent = undefined;
                    break;
                }
            }
        }
    }
    
    if (parent && parent.querySelector) {
        const element = parent.querySelector(action.selector);
        if (action.output) {
            this.setState(action.output, element);
        }
        return element;
    }
    console.warn('⚠️ utilQuerySelector: 親要素が見つからないか、querySelectorメソッドがありません', {
        parent: action.parent,
        selector: action.selector,
        resolvedParent: parent
    });
    return null;
}

// =====================================================
// テンプレート・コンポーネントアクション
// =====================================================

async function templateRenderFromJSON(action, event) {
    const templateData = this.resolveValue(action.template);
    const renderedElement = this.renderComponentFromJSON(templateData);
    if (action.output) {
        this.setState(action.output, renderedElement);
    }
    return renderedElement;
}

async function componentRenderList(action, event) {
    const componentsData = this.resolveValue(action.components);
    const iconMapData = this.resolveValue(action.iconMap);
    const categoryName = this.resolveTemplate(action.categoryName || '');
    const isShared = action.isShared || false;
    
    const categoryElement = this.createComponentCategory(
        categoryName,
        componentsData,
        iconMapData,
        isShared
    );
    
    if (action.output) {
        this.setState(action.output, categoryElement);
    }
    return categoryElement;
}

async function componentMethod(action, event) {
    const methodName = this.resolveTemplate(action.method);
    const params = {};
    
    // paramsを解決
    if (action.params) {
        for (const [key, value] of Object.entries(action.params)) {
            params[key] = this.resolveValue(value);
        }
    }
    
    // メソッドを呼び出す
    const result = await this.callMethod(methodName, params);
    
    if (action.output) {
        this.setState(action.output, result);
    }
    
    return result;
}

async function registerComponentMethods(action, event) {
    const components = this.resolveValue(action.components);
    
    if (!components || !Array.isArray(components)) {
        console.warn('⚠️ コンポーネント配列が見つかりません');
        return;
    }
    
    let registeredCount = 0;
    
    components.forEach(component => {
        if (component.behavior && component.behavior.methods) {
            const componentName = component.name || component.type;
            
            for (const [methodName, methodDef] of Object.entries(component.behavior.methods)) {
                // コンポーネント名をプレフィックスとして付けたメソッド名で登録
                const fullMethodName = `${componentName}.${methodName}`;
                
                if (!this.methods) {
                    this.methods = {};
                }
                
                this.methods[fullMethodName] = methodDef;
                
                // プレフィックスなしでも登録（メソッド名の衝突に注意）
                if (!this.methods[methodName]) {
                    this.methods[methodName] = methodDef;
                }
                
                registeredCount++;
            }
        }
    });
    
    console.log(`✅ ${registeredCount}個のコンポーネントメソッドを登録しました`);
}

async function registerComponentActions(action, event) {
    const components = this.resolveValue(action.components);
    
    if (!components || !Array.isArray(components)) {
        console.warn('⚠️ コンポーネント配列が見つかりません');
        return;
    }
    
    let registeredCount = 0;
    
    components.forEach(component => {
        if (component.behavior && component.behavior.actions) {
            const componentName = component.name || component.type || 'unknown';
            
            for (const [actionName, actionDef] of Object.entries(component.behavior.actions)) {
                // アクションを登録
                this.registerAction(actionName, async (params) => {
                    console.log(`🎯 コンポーネントアクション実行: ${actionName} (from ${componentName})`);
                    const event = params && params.event;
                    await this.executeAction(actionDef, event);
                });
                
                registeredCount++;
                console.log(`📦 コンポーネントアクション登録: ${actionName} (from ${componentName})`);
            }
        }
    });
    
    if (registeredCount > 0) {
        console.log(`✅ ${registeredCount}個のコンポーネントアクションを登録しました`);
    }
}

// =====================================================
// ドラッグ&ドロップアクション
// =====================================================

async function dragSetData(action, event) {
    if (event && event.dataTransfer) {
        const dragData = this.resolveValue(action.data);
        event.dataTransfer.effectAllowed = action.effectAllowed || 'copy';
        event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    }
}

async function dragGetData(action, event) {
    if (event && event.dataTransfer) {
        const dragData = event.dataTransfer.getData('application/json');
        const parsedData = dragData ? JSON.parse(dragData) : null;
        if (action.output) {
            this.setState(action.output, parsedData);
        }
        return parsedData;
    }
}

// =====================================================
// ヘルパーメソッド
// =====================================================

/**
 * ヘルパーメソッドをJsoniaRuntimeに追加
 */
function addHelperMethods(JsoniaRuntimeClass) {
    /**
     * JSONコンポーネント定義からDOM要素をレンダリング
     */
    JsoniaRuntimeClass.prototype.renderComponentFromJSON = function(componentData, childrenToInsert = null) {
        // extends処理: 共有コンポーネントを継承
        if (componentData.extends) {
            console.log('🔄 extends検知:', componentData.extends);
            const baseComponentName = componentData.extends;
            const baseComponent = this.loadSharedComponent(baseComponentName);
            console.log('📦 ベースコンポーネント:', baseComponent);
            
            if (baseComponent && baseComponent.template) {
                console.log('✅ テンプレート発見、マージ開始');
                // ベーステンプレートをディープコピー
                const mergedTemplate = JSON.parse(JSON.stringify(baseComponent.template));
                
                // オーバーライド: attributes
                if (componentData.attributes) {
                    mergedTemplate.attributes = {
                        ...mergedTemplate.attributes,
                        ...componentData.attributes
                    };
                }
                
                // オーバーライド: header部分
                if (componentData.header) {
                    const headerElement = this.findElementByPath(mergedTemplate, '[data-accordion-header]');
                    if (headerElement && componentData.header.text) {
                        const textSpan = headerElement.children.find(c => !c.attributes || !c.attributes.class || !c.attributes.class.includes('accordion-icon'));
                        if (textSpan) {
                            textSpan.text = componentData.header.text;
                        }
                    }
                }
                
                // オーバーライド: content部分
                if (componentData.content) {
                    const contentElement = this.findElementByPath(mergedTemplate, '[data-accordion-content]');
                    if (contentElement) {
                        if (componentData.content.id) {
                            contentElement.attributes.id = componentData.content.id;
                        }
                        if (componentData.content.children) {
                            contentElement.children = componentData.content.children;
                        }
                    }
                }
                
                // マージされたテンプレートで再帰レンダリング
                return this.renderComponentFromJSON(mergedTemplate, childrenToInsert);
            } else {
                console.warn(`⚠️ 共有コンポーネント "${baseComponentName}" が見つかりません`);
                console.log('📋 利用可能なコンポーネント:', this.getState('sharedComponents'));
                // 継承失敗時は通常の処理に fallback
            }
        }
        
        const template = componentData.template || componentData;
        console.log('🏗️ レンダリング:', template.tag, template.attributes);
        const element = document.createElement(template.tag || 'div');
        
        // スロット要素を見つける変数
        let slotElement = null;
        
        // 属性を設定
        if (template.attributes) {
            Object.entries(template.attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key === 'style' && typeof value === 'string') {
                    // エディタモードでは display: none を無効化
                    const className = template.attributes.class || '';
                    const isHiddenContent = className.includes('accordion-content') || 
                                          className.includes('tab-panel') || 
                                          className.includes('modal-body');
                    
                    if (isHiddenContent) {
                        const styleWithoutHidden = value.replace(/display\s*:\s*none\s*;?/gi, '');
                        element.setAttribute(key, styleWithoutHidden);
                    } else {
                        element.setAttribute(key, value);
                    }
                } else {
                    element.setAttribute(key, value);
                }
            });
        }
        
        // 子要素を再帰的に追加し、スロット要素を探す
        if (template.children && Array.isArray(template.children)) {
            template.children.forEach((child, index) => {
                const childElement = this.renderComponentFromJSON(child);
                element.appendChild(childElement);
                
                // data-slot="children" を持つ要素をスロットとして記憶
                if (child.attributes && child.attributes['data-slot'] === 'children') {
                    slotElement = childElement;
                    console.log('🎯 スロット要素発見(直接):', {
                        index: index,
                        className: childElement.className,
                        element: childElement
                    });
                }
                // 再帰的にスロットを探す（まだ見つかっていない場合のみ）
                if (!slotElement) {
                    const foundSlot = childElement.querySelector('[data-slot="children"]');
                    if (foundSlot) {
                        slotElement = foundSlot;
                        console.log('🎯 スロット要素発見(再帰):', {
                            index: index,
                            parentClassName: childElement.className,
                            slotClassName: foundSlot.className,
                            element: foundSlot
                        });
                    }
                }
            });
        }
        
        // テキストコンテンツを設定
        if (template.text && (!template.children || template.children.length === 0)) {
            element.textContent = template.text;
        }
        
        // 外部から渡された子要素をスロットに挿入
        if (childrenToInsert && childrenToInsert.length > 0) {
            const targetElement = slotElement || element;
            childrenToInsert.forEach(child => {
                targetElement.appendChild(child);
            });
        }
        
        // コンテナ型コンポーネントの場合、内部ドロップゾーンを追加
        const containerTypes = ['container', 'section', 'div', 'article', 'main', 'aside', 'nav', 'header', 'footer', 'form'];
        const componentType = componentData.type || template.tag;
        
        if (slotElement) {
            console.log('📍 スロット要素をドロップゾーンとして設定:', {
                className: slotElement.className,
                tagName: slotElement.tagName,
                hasDataSlot: slotElement.hasAttribute('data-slot'),
                dataSlotValue: slotElement.getAttribute('data-slot'),
                element: slotElement
            });
            // スロット要素自体をドロップゾーンに設定
            slotElement.setAttribute('data-drop-zone', 'true');
            slotElement.classList.add('slot-drop-zone');
            
            // スロットにドラッグオーバーイベントを追加
            slotElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'copy';
                }
                slotElement.classList.add('drag-over-slot');
            });
            
            slotElement.addEventListener('dragleave', (e) => {
                // 子要素への移動は無視
                if (!slotElement.contains(e.relatedTarget)) {
                    slotElement.classList.remove('drag-over-slot');
                }
            });
            
            // スロットにドロップイベントを追加
            slotElement.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                slotElement.classList.remove('drag-over-slot');
                
                // handleInnerDropアクションを実行
                const dropActions = this.getState('innerDropActions');
                if (dropActions) {
                    this.setState('currentDropZone', slotElement);
                    await this.executeActions(dropActions, e);
                }
            });
            
            // スロットが空の場合は内部ドロップゾーンを追加（視覚的プレースホルダー）
            console.log('🔍 スロット要素の子要素数チェック:', {
                slotClassName: slotElement.className,
                childrenLength: slotElement.children.length,
                willCreateInnerDropZone: slotElement.children.length === 0
            });
            
            if (slotElement.children.length === 0) {
                console.log('✅ 内部ドロップゾーンを作成します');
                const innerDropZone = document.createElement('div');
                innerDropZone.className = 'inner-drop-zone';
                innerDropZone.setAttribute('data-drop-zone', 'true');
                
                // 内部ドロップゾーンにもイベントを設定
                innerDropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                });
                
                innerDropZone.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation(); // 他のリスナーを即座にブロック
                    
                    // handleInnerDropアクションを実行
                    const dropActions = this.getState('innerDropActions');
                    if (dropActions) {
                        this.setState('currentDropZone', slotElement); // 親スロットに追加
                        await this.executeActions(dropActions, e);
                    }
                });
                
                slotElement.appendChild(innerDropZone);
                console.log('🟣 内部ドロップゾーンを追加しました:', innerDropZone);
            } else {
                console.log('⏭️  スロット要素に既に子要素があるため、内部ドロップゾーンは作成しません');
            }
        } else {
            // スロットがない場合は警告を表示(コンテナタイプの場合のみ)
            if (containerTypes.includes(componentType)) {
                console.log('⚠️ スロットが見つかりません。このコンポーネントには子要素を追加できません。', {
                    componentType: componentType,
                    className: element.className
                });
            }
        }
        
        return element;
    };

    /**
     * 要素内のスロットを検索
     * @param {HTMLElement} element - 検索対象の要素
     * @param {string} slotName - スロット名 (デフォルト: 'children')
     * @returns {HTMLElement|null} - 見つかったスロット要素
     */
    JsoniaRuntimeClass.prototype.findSlot = function(element, slotName = 'children') {
        // 要素自体がスロットかチェック
        if (element.hasAttribute && element.hasAttribute('data-slot')) {
            const slot = element.getAttribute('data-slot');
            if (slot === slotName) {
                return element;
            }
        }
        
        // 子要素を再帰的に検索
        const slotSelector = `[data-slot="${slotName}"]`;
        return element.querySelector(slotSelector);
    };

    /**
     * スロットに子要素を挿入
     * @param {HTMLElement} container - コンテナ要素
     * @param {HTMLElement|HTMLElement[]} children - 挿入する子要素
     * @param {string} slotName - スロット名 (デフォルト: 'children')
     * @returns {boolean} - 挿入成功したか
     */
    JsoniaRuntimeClass.prototype.insertIntoSlot = function(container, children, slotName = 'children') {
        const slot = this.findSlot(container, slotName);
        const target = slot || container;
        
        // 配列でない場合は配列化
        const childArray = Array.isArray(children) ? children : [children];
        
        childArray.forEach(child => {
            if (child && child.nodeType === Node.ELEMENT_NODE) {
                target.appendChild(child);
            }
        });
        
        return !!slot;
    };

    /**
     * DOMツリーをHTML文字列として構築
     */
    JsoniaRuntimeClass.prototype.buildTreeHTML = function(element, level = 0, options = {}) {
        let html = '';
        
        // drop-zone自体はスキップ
        if (element.id === 'drop-zone') {
            const children = element.children;
            for (let i = 0; i < children.length; i++) {
                html += this.buildTreeHTML(children[i], level, options);
            }
            return html;
        }
        
        // canvas-component または nested-component ラッパーの場合
        if (element.classList.contains('canvas-component') || element.classList.contains('nested-component')) {
            const componentId = element.getAttribute('data-component-id');
            const actualComponent = element.querySelector(':scope > :not(.delete-component-btn)');
            
            if (actualComponent) {
                const tagName = actualComponent.tagName.toLowerCase();
                const classList = actualComponent.className ? `.${actualComponent.className.split(' ').join('.')}` : '';
                const id = actualComponent.id ? `#${actualComponent.id}` : '';
                
                html += `<div class="tree-node" style="padding: 4px 0 4px ${level * 20}px; cursor: pointer; font-family: monospace; font-size: 13px;" data-component-id="${componentId}">`;
                html += `<span style="color: #0066cc;">&lt;${tagName}${id}${classList}&gt;</span>`;
                
                // テキストコンテンツを表示
                if (actualComponent.childNodes.length === 1 && actualComponent.childNodes[0].nodeType === 3) {
                    const text = actualComponent.textContent.trim();
                    if (text.length > 30) {
                        html += ` <span style="color: #666;">${text.substring(0, 30)}...</span>`;
                    } else if (text) {
                        html += ` <span style="color: #666;">${text}</span>`;
                    }
                }
                
                html += '</div>';
                
                // スロット内のネストされたコンポーネントを検索
                const slotElements = actualComponent.querySelectorAll('[data-slot]');
                slotElements.forEach(slot => {
                    const nestedComponents = slot.querySelectorAll(':scope > .canvas-component, :scope > .nested-component');
                    nestedComponents.forEach(nested => {
                        html += this.buildTreeHTML(nested, level + 1, options);
                    });
                });
                
                // スロットがない場合は直接の子要素を処理(後方互換性)
                if (slotElements.length === 0) {
                    const children = actualComponent.children;
                    for (let i = 0; i < children.length; i++) {
                        if (children[i].classList.contains('canvas-component') || children[i].classList.contains('nested-component')) {
                            html += this.buildTreeHTML(children[i], level + 1, options);
                        }
                    }
                }
            }
        }
        
        return html;
    };

    /**
     * コンポーネントカテゴリを作成
     */
    JsoniaRuntimeClass.prototype.createComponentCategory = function(categoryName, components, iconMap, isShared = false) {
        const section = document.createElement('div');
        section.className = 'component-category' + (isShared ? ' shared-components' : '');
        
        const header = document.createElement('div');
        header.className = 'component-category-header';
        header.textContent = categoryName;
        section.appendChild(header);
        
        components.forEach(comp => {
            const item = this.createComponentItem(comp, iconMap, isShared);
            section.appendChild(item);
        });
        
        return section;
    };

    /**
     * コンポーネントアイテムを作成
     */
    JsoniaRuntimeClass.prototype.createComponentItem = function(component, iconMap, isShared = false) {
        const item = document.createElement('div');
        item.className = 'component-item' + (isShared ? ' shared-component' : '');
        item.draggable = true;
        item.setAttribute('data-component-type', component.type || component.tag);
        item.setAttribute('data-component', JSON.stringify(component));
        
        const icon = component.icon || iconMap[component.tag] || iconMap.default || '◼️';
        const name = component.name || component.tag;
        const description = component.description || '';
        
        item.innerHTML = `
            <span class="component-icon">${icon}</span>
            <div class="component-info">
                <div class="component-name">${name}</div>
                ${description ? `<div class="component-description">${description}</div>` : ''}
            </div>
        `;
        
        // ドラッグイベントをバインド
        item.addEventListener('dragstart', async (e) => {
            const dragStartActions = this.getState('dragStartActions');
            if (dragStartActions) {
                await this.executeActions(dragStartActions, e);
            }
        });
        
        item.addEventListener('dragend', (e) => {
            e.currentTarget.style.opacity = '1';
        });
        
        return item;
    };

    /**
     * 共有コンポーネントをロード
     */
    JsoniaRuntimeClass.prototype.loadSharedComponent = function(componentName) {
        const sharedComponents = this.getState('sharedComponents') || [];
        console.log('🔍 共有コンポーネント検索:', componentName, '件数:', sharedComponents.length);
        
        // components/フォルダのJSONファイル名で検索 (accordion-with-behavior)
        const component = sharedComponents.find(c => {
            const fileName = componentName;
            const matches = (
                c.type === fileName || 
                c.name === fileName ||
                c.type === fileName.replace(/-/g, '') ||
                (c.template && c.template.attributes && c.template.attributes.class && c.template.attributes.class.includes(fileName))
            );
            if (matches) {
                console.log('✅ マッチ:', c.name || c.type);
            }
            return matches;
        });
        
        if (!component) {
            console.log('📋 利用可能:', sharedComponents.map(c => c.name || c.type));
        }
        
        return component;
    };

    /**
     * テンプレート内から指定されたセレクタに一致する要素を探す
     */
    JsoniaRuntimeClass.prototype.findElementByPath = function(template, selector) {
        // data-accordion-header などの属性セレクタに対応
        const match = selector.match(/\[([^\]]+)\]/);
        if (match) {
            const attrName = match[1];
            return this.findElementByAttribute(template, attrName);
        }
        return null;
    };

    /**
     * テンプレート内から指定された属性を持つ要素を再帰的に探す
     */
    JsoniaRuntimeClass.prototype.findElementByAttribute = function(template, attrName) {
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
    };
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.extendJsoniaRuntimeWithActions = extendJsoniaRuntimeWithActions;
    window.addJsoniaRuntimeHelpers = addHelperMethods;
    
    // JsoniaRuntimeが既に定義されていれば、すぐに拡張を適用
    if (window.JsoniaRuntime) {
        extendJsoniaRuntimeWithActions(window.JsoniaRuntime);
        addHelperMethods(window.JsoniaRuntime);
    }
}
