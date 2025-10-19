/**
 * Jsonia Editor 拡張機能
 * エディター固有のカスタム関数を定義
 */

// エディター用のグローバル関数を定義
window.editorExtensions = {
    /**
     * コンポーネントリストをレンダリング
     */
    renderComponentsList() {
        console.log('🔍 renderComponentsList() 呼び出し');
        
        const runtime = window.jsoniaRuntime;
        if (!runtime) {
            console.error('❌ JsoniaRuntimeが見つかりません');
            return;
        }
        
        console.log('✅ JsoniaRuntime取得成功');

        const container = document.getElementById('components-list');
        if (!container) {
            console.error('❌ components-list要素が見つかりません');
            return;
        }
        
        console.log('✅ container取得成功:', container);

        // ビルトインコンポーネントを取得
        const builtinComponents = runtime.getState('componentsData') || [];
        const iconMap = runtime.getState('iconMap') || {};

        // 共有コンポーネントを取得
        const sharedComponents = runtime.getState('sharedComponents') || [];

        console.log('📦 コンポーネント取得:', {
            builtin: builtinComponents.length,
            shared: sharedComponents.length,
            sharedComponentsRaw: sharedComponents
        });

        // コンテナをクリア
        container.innerHTML = '';

        // ビルトインコンポーネントセクション
        if (builtinComponents.length > 0) {
            const builtinSection = createComponentCategory('基本コンポーネント', builtinComponents, iconMap);
            container.appendChild(builtinSection);
        }

        // 共有コンポーネントセクション
        if (sharedComponents.length > 0) {
            const sharedSection = createSharedComponentsSection(sharedComponents, iconMap);
            container.appendChild(sharedSection);
        }

        console.log('✅ コンポーネントリスト表示完了');
    },

    /**
     * 構造ツリーを更新
     */
    updateStructureTree() {
        const runtime = window.jsoniaRuntime;
        if (!runtime) return;

        const container = document.getElementById('structure-tree');
        if (!container) {
            console.error('❌ structure-tree要素が見つかりません');
            return;
        }

        console.log('🌳 構造ツリー更新');
        
        // drop-zoneの内容を取得
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) {
            container.innerHTML = '<div style="padding: 10px; color: #999;">キャンバスが見つかりません</div>';
            return;
        }

        // コンポーネントを取得
        const components = dropZone.querySelectorAll('.canvas-component');
        
        if (components.length === 0) {
            container.innerHTML = '<div style="padding: 10px; color: #999;">コンポーネントがありません</div>';
            return;
        }

        // ツリー構造を構築
        const treeHTML = window.editorExtensions.buildTreeHTML(dropZone);
        container.innerHTML = treeHTML;
        
        console.log('✅ 構造ツリー更新完了:', components.length, 'コンポーネント');
    },

    /**
     * ツリーHTMLを構築
     */
    buildTreeHTML(element, level = 0) {
        const indent = '  '.repeat(level);
        let html = '';
        
        // drop-zone自体はスキップ
        if (element.id === 'drop-zone') {
            const children = element.children;
            for (let i = 0; i < children.length; i++) {
                html += window.editorExtensions.buildTreeHTML(children[i], level);
            }
            return html;
        }
        
        // canvas-componentラッパーの場合
        if (element.classList.contains('canvas-component')) {
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
                
                // 子要素を再帰的に処理
                const children = actualComponent.children;
                for (let i = 0; i < children.length; i++) {
                    html += window.editorExtensions.buildTreeHTML(children[i], level + 1);
                }
            }
        } else {
            // 通常の要素
            const tagName = element.tagName.toLowerCase();
            const classList = element.className ? `.${element.className.split(' ').join('.')}` : '';
            const id = element.id ? `#${element.id}` : '';
            
            html += `<div class="tree-node" style="padding: 4px 0 4px ${level * 20}px; cursor: pointer; font-family: monospace; font-size: 13px;">`;
            html += `<span style="color: #0066cc;">&lt;${tagName}${id}${classList}&gt;</span>`;
            
            // テキストコンテンツを表示
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                const text = element.textContent.trim();
                if (text.length > 30) {
                    html += ` <span style="color: #666;">${text.substring(0, 30)}...</span>`;
                } else if (text) {
                    html += ` <span style="color: #666;">${text}</span>`;
                }
            }
            
            html += '</div>';
            
            // 子要素を再帰的に処理
            const children = element.children;
            for (let i = 0; i < children.length; i++) {
                html += window.editorExtensions.buildTreeHTML(children[i], level + 1);
            }
        }
        
        return html;
    },

    /**
     * タブ切り替え
     */
    switchTab(tabName) {
        const runtime = window.jsoniaRuntime;
        if (!runtime) return;

        runtime.setState('selectedTab', tabName);
        console.log(`📑 タブ切り替え: ${tabName}`);
    },

    /**
     * アコーディオン切り替え
     */
    toggleAccordion(event) {
        const header = event.currentTarget;
        const accordionId = header.getAttribute('data-accordion');
        const content = document.querySelector(`[data-accordion-content="${accordionId}"]`);
        
        if (!content) return;

        const isExpanded = header.classList.contains('expanded');
        
        if (isExpanded) {
            header.classList.remove('expanded');
            content.style.display = 'none';
            const icon = header.querySelector('.accordion-icon');
            if (icon) icon.textContent = '▶';
        } else {
            header.classList.add('expanded');
            content.style.display = 'block';
            const icon = header.querySelector('.accordion-icon');
            if (icon) icon.textContent = '▼';
        }
    },

    /**
     * アクション処理
     */
    handleAction(params) {
        const event = params?.event || params;
        if (!event || !event.currentTarget) return;
        
        const action = event.currentTarget.getAttribute('data-action');
        console.log(`🎬 アクション実行: ${action}`);
        
        switch (action) {
            case 'preview':
                alert('プレビュー機能は準備中です');
                break;
            case 'export-json':
                alert('JSON エクスポート機能は準備中です');
                break;
            case 'save':
                alert('保存機能は準備中です');
                break;
            default:
                console.warn(`⚠️  未実装のアクション: ${action}`);
        }
    },

    /**
     * ドラッグ開始
     */
    handleDragStart(params) {
        const event = params?.event || params;
        if (!event || !event.currentTarget) return;
        
        const runtime = window.jsoniaRuntime;
        if (!runtime) return;

        const componentType = event.currentTarget.getAttribute('data-component-type');
        const componentData = event.currentTarget.getAttribute('data-component');
        
        runtime.setState('draggedComponent', {
            type: componentType,
            data: componentData ? JSON.parse(componentData) : null
        });

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'copy';
        }
        event.currentTarget.style.opacity = '0.5';
        
        console.log('🎯 ドラッグ開始:', componentType);
    },

    /**
     * ドラッグ終了
     */
    handleDragEnd(params) {
        const event = params?.event || params;
        if (!event || !event.currentTarget) return;
        
        event.currentTarget.style.opacity = '1';
    },

    /**
     * ドラッグオーバー
     */
    handleDragOver(params) {
        const event = params?.event || params;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'copy';
            }
        }
    },

    /**
     * ドロップ
     */
    handleDrop(params) {
        const event = params?.event || params;
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        
        const runtime = window.jsoniaRuntime;
        if (!runtime) return;

        const draggedComponent = runtime.getState('draggedComponent');
        if (!draggedComponent) return;

        console.log('✅ ドロップ:', draggedComponent);
        
        // キャンバスにコンポーネントを追加
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) {
            console.error('❌ drop-zoneが見つかりません');
            return;
        }

        try {
            // コンポーネントデータを取得
            const componentData = draggedComponent.data;
            
            // JsoniaRuntimeを使ってコンポーネントをレンダリング
            const componentElement = window.editorExtensions.renderComponent(componentData);
            
            // 初回ドロップ時はプレースホルダーテキストを削除
            if (dropZone.textContent.includes('ドラッグ&ドロップ')) {
                dropZone.innerHTML = '';
            }
            
            // ラッパーを作成して追加
            const wrapper = document.createElement('div');
            wrapper.className = 'canvas-component';
            wrapper.setAttribute('data-component-id', Date.now());
            wrapper.setAttribute('data-component-type', draggedComponent.type);
            
            // 削除ボタンを追加
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️ 削除';
            deleteBtn.className = 'delete-component-btn';
            deleteBtn.onclick = () => {
                wrapper.remove();
                // 構造ツリーを更新
                if (window.updateStructureTree) {
                    window.updateStructureTree();
                }
            };
            
            wrapper.appendChild(deleteBtn);
            wrapper.appendChild(componentElement);
            dropZone.appendChild(wrapper);
            
            console.log('✅ コンポーネント追加完了');
            
            // 構造ツリーを更新
            if (window.updateStructureTree) {
                window.updateStructureTree();
            }
        } catch (error) {
            console.error('❌ コンポーネント追加エラー:', error);
            alert(`コンポーネント追加エラー: ${error.message}`);
        }
        
        runtime.setState('draggedComponent', null);
    },

    /**
     * コンポーネントをキャンバスにレンダリング
     */
    renderComponent(componentData) {
        const template = componentData.template || componentData;
        
        const element = document.createElement(template.tag || 'div');
        
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
                        // display: none を削除
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
        
        // 子要素を再帰的に追加
        if (template.children && Array.isArray(template.children)) {
            template.children.forEach(child => {
                const childElement = window.editorExtensions.renderComponent(child);
                element.appendChild(childElement);
            });
        }
        
        // テキストコンテンツを設定（子要素がない場合のみ）
        if (template.text && (!template.children || template.children.length === 0)) {
            element.textContent = template.text;
        }
        
        // コンテナ型コンポーネントの場合、内部ドロップゾーンを追加
        const containerTypes = ['container', 'section', 'div', 'article', 'main', 'aside', 'nav', 'header', 'footer', 'form'];
        const componentType = componentData.type || template.tag;
        
        if (containerTypes.includes(componentType) && (!template.children || template.children.length === 0)) {
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
            
            innerDropZone.addEventListener('dragleave', (e) => {
                e.stopPropagation();
            });
            
            innerDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                innerDropZone.style.background = 'rgba(200, 200, 255, 0.05)';
                
                if (window.handleDrop) {
                    // 内部ドロップゾーンに対するドロップ処理
                    window.editorExtensions.handleInnerDrop({ event: e, dropZone: innerDropZone });
                }
            });
            
            element.appendChild(innerDropZone);
        }
        
        return element;
    },

    /**
     * 内部ドロップゾーンへのドロップ処理
     */
    handleInnerDrop(params) {
        const event = params?.event;
        const dropZone = params?.dropZone;
        
        if (!dropZone) return;
        
        const runtime = window.jsoniaRuntime;
        if (!runtime) return;

        const draggedComponent = runtime.getState('draggedComponent');
        if (!draggedComponent) return;

        console.log('✅ 内部ドロップ:', draggedComponent);
        
        try {
            const componentData = draggedComponent.data;
            const componentElement = window.editorExtensions.renderComponent(componentData);
            
            // プレースホルダーテキストを削除
            if (dropZone.textContent.includes('ドロップ')) {
                dropZone.innerHTML = '';
            }
            
            // ラッパーを作成して追加
            const wrapper = document.createElement('div');
            wrapper.className = 'canvas-component nested-component';
            wrapper.setAttribute('data-component-id', Date.now());
            wrapper.setAttribute('data-component-type', draggedComponent.type);
            wrapper.style.cssText = 'margin: 8px 0; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; background: #fafafa;';
            
            // 削除ボタンを追加
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.className = 'delete-component-btn';
            deleteBtn.style.cssText = 'font-size: 14px;';
            deleteBtn.onclick = () => {
                wrapper.remove();
                if (window.updateStructureTree) {
                    window.updateStructureTree();
                }
            };
            
            wrapper.appendChild(deleteBtn);
            wrapper.appendChild(componentElement);
            dropZone.appendChild(wrapper);
            
            console.log('✅ 内部コンポーネント追加完了');
            
            // 構造ツリーを更新
            if (window.updateStructureTree) {
                window.updateStructureTree();
            }
        } catch (error) {
            console.error('❌ 内部コンポーネント追加エラー:', error);
        }
        
        runtime.setState('draggedComponent', null);
    }
};

/**
 * ビルトインコンポーネントのカテゴリを作成
 */
function createComponentCategory(categoryName, components, iconMap) {
    const section = document.createElement('div');
    section.className = 'component-category';
    
    const header = document.createElement('div');
    header.className = 'component-category-header';
    header.textContent = categoryName;
    section.appendChild(header);
    
    components.forEach(comp => {
        const item = createComponentItem(comp, iconMap);
        section.appendChild(item);
    });
    
    return section;
}

/**
 * 共有コンポーネントセクションを作成
 */
function createSharedComponentsSection(sharedComponents, iconMap) {
    const section = document.createElement('div');
    section.className = 'component-category shared-components';
    
    const header = document.createElement('div');
    header.className = 'component-category-header';
    header.textContent = '📚 共有コンポーネント';
    section.appendChild(header);
    
    sharedComponents.forEach(comp => {
        const categorySection = createSharedComponentCategorySection(comp, iconMap);
        section.appendChild(categorySection);
    });
    
    return section;
}

/**
 * 共有コンポーネントのカテゴリセクションを作成
 */
function createSharedComponentCategorySection(componentData, iconMap) {
    const section = document.createElement('div');
    section.className = 'shared-component-file';
    
    // コンポーネントアイテムを直接作成（各データは1つのコンポーネント定義）
    const item = createComponentItem(componentData, iconMap, true);
    section.appendChild(item);
    
    return section;
}

/**
 * コンポーネントアイテムを作成
 */
function createComponentItem(component, iconMap, isShared = false) {
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
    
    // ドラッグイベントを直接バインド
    item.addEventListener('dragstart', (e) => {
        if (window.handleDragStart) {
            window.handleDragStart({ event: e });
        }
    });
    
    item.addEventListener('dragend', (e) => {
        if (window.handleDragEnd) {
            window.handleDragEnd({ event: e });
        }
    });
    
    return item;
}

// JsoniaRuntimeへの登録 - 即座に実行
(function() {
    // グローバルに公開
    window.renderComponentsList = window.editorExtensions.renderComponentsList;
    window.updateStructureTree = window.editorExtensions.updateStructureTree;
    window.switchTab = window.editorExtensions.switchTab;
    window.toggleAccordion = window.editorExtensions.toggleAccordion;
    window.handleAction = window.editorExtensions.handleAction;
    window.handleDragStart = window.editorExtensions.handleDragStart;
    window.handleDragEnd = window.editorExtensions.handleDragEnd;
    window.handleDragOver = window.editorExtensions.handleDragOver;
    window.handleDrop = window.editorExtensions.handleDrop;
    
    console.log('✅ エディター拡張機能ロード完了 - グローバル関数登録済み');
})();
