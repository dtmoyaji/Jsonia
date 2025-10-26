// Template and component action handlers, plus helper methods

async function templateRenderFromJSON(action, event) {
    const templateData = this.resolveValue(action.template);
    const renderedElement = this.renderComponentFromJSON(templateData);
    if (action.output) this.setState(action.output, renderedElement);
    return renderedElement;
}

async function componentRenderList(action, event) {
    const componentsData = this.resolveValue(action.components);
    const iconMapData = this.resolveValue(action.iconMap);
    const categoryName = this.resolveTemplate(action.categoryName || '');
    const isShared = action.isShared || false;
    const categoryElement = this.createComponentCategory(categoryName, componentsData, iconMapData, isShared);
    if (action.output) this.setState(action.output, categoryElement);
    return categoryElement;
}

async function componentMethod(action, event) {
    const methodName = this.resolveTemplate(action.method);
    const params = {};
    if (action.params) for (const [key, value] of Object.entries(action.params)) params[key] = this.resolveValue(value);
    const result = await this.callMethod(methodName, params);
    if (action.output) this.setState(action.output, result);
    return result;
}

async function registerComponentMethods(action, event) {
    const components = this.resolveValue(action.components);
    if (!components || !Array.isArray(components)) { console.warn('⚠️ コンポーネント配列が見つかりません'); return; }
    let registeredCount = 0;
    components.forEach(component => {
        if (component.behavior && component.behavior.methods) {
            const componentName = component.name || component.type;
            for (const [methodName, methodDef] of Object.entries(component.behavior.methods)) {
                const fullMethodName = `${componentName}.${methodName}`;
                if (!this.methods) this.methods = {};
                this.methods[fullMethodName] = methodDef;
                if (!this.methods[methodName]) this.methods[methodName] = methodDef;
                registeredCount++;
            }
        }
    });
    console.log(`✅ ${registeredCount}個のコンポーネントメソッドを登録しました`);
}

async function registerComponentActions(action, event) {
    const components = this.resolveValue(action.components);
    if (!components || !Array.isArray(components)) { console.warn('⚠️ コンポーネント配列が見つかりません'); return; }
    let registeredCount = 0;
    components.forEach(component => {
        if (component.behavior && component.behavior.actions) {
            const componentName = component.name || component.type || 'unknown';
            for (const [actionName, actionDef] of Object.entries(component.behavior.actions)) {
                this.registerAction(actionName, async (params) => {
                    //console.log(`🎯 コンポーネントアクション実行: ${actionName} (from ${componentName})`);
                    const event = params && params.event;
                    await this.executeAction(actionDef, event);
                });
                registeredCount++;
                console.log(`📦 コンポーネントアクション登録: ${actionName} (from ${componentName})`);
            }
        }
    });
    if (registeredCount > 0) console.log(`✅ ${registeredCount}個のコンポーネントアクションを登録しました`);
}

async function sequenceExecute(action, event) {
    if (action.steps && Array.isArray(action.steps)) {
        for (const step of action.steps) await this.executeAction(step, event);
    }
}

async function dragSetData(action, event) { /* defined in utils file as well; kept for compatibility if needed */ }

async function dragGetData(action, event) { /* defined in utils file as well; kept for compatibility if needed */ }

// Helper methods (renderComponentFromJSON, createComponentCategory, createComponentItem, buildTreeHTML, insertIntoSlot, findSlot, findElementByPath, findElementByAttribute)

function addHelperMethods(JsoniaRuntimeClass) {
    JsoniaRuntimeClass.prototype.renderComponentFromJSON = function(componentData, childrenToInsert = null) {
        // componentData resolved for rendering
        if (componentData.extends) {
            const baseComponentName = componentData.extends;
            const baseComponent = this.loadSharedComponent(baseComponentName);
            if (baseComponent && baseComponent.template) {
                // Clone base template then overlay/merge any specific template keys from componentData
                const mergedTemplate = JSON.parse(JSON.stringify(baseComponent.template));
                // Preserve declared component type if present (so e.g. 'button' stays a button)
                if (componentData.type) mergedTemplate.type = componentData.type;
                // Merge attributes: component's attributes should override base attributes
                if (componentData.attributes) mergedTemplate.attributes = { ...mergedTemplate.attributes, ...componentData.attributes };
                // If the component provides its own template, let it override key parts of the base
                if (componentData.template) {
                    if (componentData.template.tag) mergedTemplate.tag = componentData.template.tag;
                    if (componentData.template.attributes) mergedTemplate.attributes = { ...mergedTemplate.attributes, ...componentData.template.attributes };
                    if (componentData.template.children) mergedTemplate.children = componentData.template.children;
                    if (componentData.template.text) mergedTemplate.text = componentData.template.text;
                }
                // Special handling for common shortcuts like header/content on components that extend accordion
                if (componentData.header) {
                    const headerElement = this.findElementByPath(mergedTemplate, '[data-accordion-header]');
                    if (headerElement && componentData.header.text) {
                        const textSpan = headerElement.children.find(c => !c.attributes || !c.attributes.class || !c.attributes.class.includes('accordion-icon'));
                        if (textSpan) textSpan.text = componentData.header.text;
                    }
                }
                if (componentData.content) {
                    const contentElement = this.findElementByPath(mergedTemplate, '[data-accordion-content]');
                    if (contentElement) {
                        if (componentData.content.id) contentElement.attributes.id = componentData.content.id;
                        if (componentData.content.children) contentElement.children = componentData.content.children;
                    }
                }
                return this.renderComponentFromJSON(mergedTemplate, childrenToInsert);
            } else {
                console.warn(`⚠️ 共有コンポーネント "${baseComponentName}" が見つかりません`);
            }
        }
        const template = componentData.template || componentData;
        const element = document.createElement(template.tag || 'div');
        let slotElement = null;
        if (template.attributes) {
            Object.entries(template.attributes).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'string') {
                    try { console.warn('⚠️ Inline `style` string in component template is not allowed and will be ignored.'); } catch (e) {}
                    return;
                }
                if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
                else element.setAttribute(key, value);
            });
        }
        if (template.children && Array.isArray(template.children)) {
            template.children.forEach((child, index) => {
                const childElement = this.renderComponentFromJSON(child);
                element.appendChild(childElement);
                if (child.attributes && child.attributes['data-slot'] === 'children') slotElement = childElement;
                if (!slotElement) {
                    const foundSlot = childElement.querySelector && childElement.querySelector('[data-slot="children"]');
                    if (foundSlot) slotElement = foundSlot;
                }
            });
        }
        if (template.text && (!template.children || template.children.length === 0)) element.textContent = template.text;
        if (childrenToInsert && childrenToInsert.length > 0) {
            const targetElement = slotElement || element;
            childrenToInsert.forEach(child => targetElement.appendChild(child));
        }
        const containerTypes = ['container','section','div','article','main','aside','nav','header','footer','form'];
        const componentType = componentData.type || template.tag;
        if (slotElement) {
            slotElement.setAttribute('data-drop-zone', 'true');
            slotElement.classList.add('slot-drop-zone');
            slotElement.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; slotElement.classList.add('drag-over-slot'); });
            slotElement.addEventListener('dragleave', (e) => { if (!slotElement.contains(e.relatedTarget)) slotElement.classList.remove('drag-over-slot'); });
            slotElement.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); slotElement.classList.remove('drag-over-slot'); const dropActions = this.getState('innerDropActions'); if (dropActions) { this.setState('currentDropZone', slotElement); await this.executeActions(dropActions, e); } });
            if (slotElement.children.length === 0) {
                const innerDropZone = document.createElement('div');
                innerDropZone.className = 'inner-drop-zone';
                innerDropZone.setAttribute('data-drop-zone', 'true');
                innerDropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
                innerDropZone.addEventListener('drop', async (e) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); const dropActions = this.getState('innerDropActions'); if (dropActions) { this.setState('currentDropZone', slotElement); await this.executeActions(dropActions, e); } });
                slotElement.appendChild(innerDropZone);
            }
        } else {
            if (containerTypes.includes(componentType)) {
                // コンテナ系だが slot が見つからない場合、編集用に内部ドロップゾーンを自動追加して
                // 後続の内部ドロップ(handleInnerDrop)を受け付けられるようにする
                try {
                    const innerDropZone = document.createElement('div');
                    innerDropZone.className = 'inner-drop-zone';
                    innerDropZone.setAttribute('data-drop-zone', 'true');
                    innerDropZone.style.minHeight = '30px';
                    innerDropZone.style.border = '1px dashed rgba(0,0,0,0.08)';
                    innerDropZone.style.margin = '8px 0';
                    innerDropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; innerDropZone.classList.add('drag-over-slot'); });
                    innerDropZone.addEventListener('dragleave', (e) => { if (!innerDropZone.contains(e.relatedTarget)) innerDropZone.classList.remove('drag-over-slot'); });
                    innerDropZone.addEventListener('drop', async (e) => {
                        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                        try {
                            innerDropZone.classList.remove('drag-over-slot');
                            const dropActions = this.getState('innerDropActions');
                            if (dropActions) {
                                this.setState('currentDropZone', element);
                                await this.executeActions(dropActions, e);
                            }
                        } catch (err) { console.warn('⚠️ innerDropZone drop handler error', err); }
                    });
                    element.appendChild(innerDropZone);
                } catch (err) {
                    console.warn('⚠️ 自動 inner-drop-zone の追加に失敗しました', err);
                }
            } else {
                console.log('⚠️ スロットが見つかりません。このコンポーネントには子要素を追加できません。', { componentType: componentType, className: element.className });
            }
        }
        return element;
    };

        /**
         * コンポーネントカテゴリ要素を作成
         */
        JsoniaRuntimeClass.prototype.createComponentCategory = function(categoryName, componentsData, iconMapData = {}, isShared = false) {
            const container = document.createElement('div');
            container.className = 'component-category';

            const header = document.createElement('div');
            header.className = 'component-category-header';
            header.textContent = categoryName || '';
            container.appendChild(header);

            const list = document.createElement('div');
            list.className = 'component-category-list';

            if (Array.isArray(componentsData)) {
                componentsData.forEach(comp => {
                    try {
                        const item = this.createComponentItem(comp, iconMapData, isShared);
                        list.appendChild(item);
                    } catch (e) {
                        console.warn('⚠️ createComponentCategory: failed to create item', comp, e);
                    }
                });
            }

            container.appendChild(list);
            return container;
        };

        /**
         * コンポーネント一覧用のアイテム要素を作成
         */
        JsoniaRuntimeClass.prototype.createComponentItem = function(component, iconMap = {}, isShared = false) {
            const item = document.createElement('div');
            item.className = 'component-item' + (isShared ? ' shared-component' : '');
            item.draggable = true;
            try { item.setAttribute('data-component-type', component.type || component.tag || 'unknown'); } catch (e) {}
            try {
                // component object used to create the draggable item
                const compJson = JSON.stringify(component);
                item.setAttribute('data-component', compJson);
            } catch (e) { console.warn('createComponentItem: failed to set data-component', e); }

            const icon = component.icon || iconMap[component.tag] || iconMap.default || '◼️';
            const name = component.name || component.tag || '';
            const description = component.description || '';

            item.innerHTML = `
                <span class="component-icon">${icon}</span>
                <div class="component-info">
                    <div class="component-name">${name}</div>
                    ${description ? `<div class="component-description">${description}</div>` : ''}
                </div>
            `;

            item.addEventListener('dragstart', async (e) => {
                try { e.currentTarget.classList.add('dragging'); } catch (err) {}
                const dragStartActions = this.getState('dragStartActions');
                if (dragStartActions) await this.executeActions(dragStartActions, e);
            });

            item.addEventListener('dragend', (e) => {
                try { e.currentTarget.classList.remove('dragging'); } catch (err) { try { e.currentTarget.style.opacity = '1'; } catch (e) {} }
            });

            return item;
        };

    JsoniaRuntimeClass.prototype.findSlot = function(element, slotName = 'children') {
        if (element.hasAttribute && element.hasAttribute('data-slot')) {
            const slot = element.getAttribute('data-slot');
            if (slot === slotName) return element;
        }
        const slotSelector = `[data-slot="${slotName}"]`;
        return element.querySelector(slotSelector);
    };

    JsoniaRuntimeClass.prototype.insertIntoSlot = function(container, children, slotName = 'children') {
        const slot = this.findSlot(container, slotName);
        const target = slot || container;
        const childArray = Array.isArray(children) ? children : [children];
        childArray.forEach(child => { if (child && child.nodeType === Node.ELEMENT_NODE) target.appendChild(child); });
        return !!slot;
    };

    JsoniaRuntimeClass.prototype.buildTreeHTML = function(element, level = 0, options = {}) {
        let html = '';
        if (element.id === 'drop-zone') {
            const children = element.children;
            for (let i = 0; i < children.length; i++) html += this.buildTreeHTML(children[i], level, options);
            return html;
        }
        if (element.classList.contains('canvas-component') || element.classList.contains('nested-component')) {
            const componentId = element.getAttribute('data-component-id');
            const actualComponent = element.querySelector(':scope > :not(.delete-component-btn)');
            if (actualComponent) {
                const tagName = actualComponent.tagName.toLowerCase();
                const classList = actualComponent.className ? `.${actualComponent.className.split(' ').join('.')}` : '';
                const id = actualComponent.id ? `#${actualComponent.id}` : '';
                html += `<div class="tree-node" style="padding: 4px 0 4px ${level * 20}px; cursor: pointer; font-family: monospace; font-size: 13px;" data-component-id="${componentId}">`;
                html += `<span style="color: #0066cc;">&lt;${tagName}${id}${classList}&gt;</span>`;
                if (actualComponent.childNodes.length === 1 && actualComponent.childNodes[0].nodeType === 3) {
                    const text = actualComponent.textContent.trim();
                    if (text.length > 30) html += ` <span style="color: #666;">${text.substring(0, 30)}...</span>`;
                    else if (text) html += ` <span style="color: #666;">${text}</span>`;
                }
                html += '</div>';
                const slotElements = actualComponent.querySelectorAll('[data-slot]');
                slotElements.forEach(slot => { const nestedComponents = slot.querySelectorAll(':scope > .canvas-component, :scope > .nested-component'); nestedComponents.forEach(nested => { html += this.buildTreeHTML(nested, level + 1, options); }); });
                if (slotElements.length === 0) {
                    const children = actualComponent.children;
                    for (let i = 0; i < children.length; i++) {
                        if (children[i].classList.contains('canvas-component') || children[i].classList.contains('nested-component')) html += this.buildTreeHTML(children[i], level + 1, options);
                    }
                }
            }
        }
        return html;
    };
}

// expose addHelperMethods globally so core can call it
if (typeof window !== 'undefined') {
    window.addJsoniaRuntimeHelpers = addHelperMethods;
}
