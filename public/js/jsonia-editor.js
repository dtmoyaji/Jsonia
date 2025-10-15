/**
 * Jsonia Editor - 設定駆動型エディタークラス
 */
class JsoniaEditor {
    constructor() {
        this.config = null;
        this.history = [];
        this.historyIndex = -1;
        this.selectedElement = null;
    }

    async init() {
        try {
            // config.jsonを読み込み
            const response = await fetch('/editor/config.json');
            this.config = await response.json();
            
            console.log('✅ エディター設定読み込み完了:', this.config.editor.name);
            
            // コンポーネントパネルの初期化
            this.renderComponentsPanel();
            
            // イベントハンドラーの設定
            this.setupEventHandlers();
            
            // ドロップゾーンの設定
            this.setupDropZone();
            
            this.updateStatus('Ready');
        } catch (error) {
            console.error('❌ エディター初期化エラー:', error);
            this.updateStatus('エラー: 設定ファイルの読み込みに失敗しました');
        }
    }

    renderComponentsPanel() {
        const panel = document.querySelector('.components-panel');
        if (!panel) return;

        const components = [
            { icon: '📦', name: 'Container', tag: 'div', type: 'container', description: 'コンテナ要素' },
            { icon: '🔤', name: 'Heading', tag: 'h2', type: 'heading', description: '見出し' },
            { icon: '📝', name: 'Paragraph', tag: 'p', type: 'paragraph', description: 'テキスト段落' },
            { icon: '🔘', name: 'Button', tag: 'button', type: 'button', description: 'ボタン' },
            { icon: '📥', name: 'Input', tag: 'input', type: 'input', description: '入力フィールド' },
            { icon: '📋', name: 'Form', tag: 'form', type: 'container', description: 'フォーム' },
            { icon: '🖼️', name: 'Image', tag: 'img', type: 'container', description: '画像' },
            { icon: '🔗', name: 'Link', tag: 'a', type: 'container', description: 'リンク' },
            { icon: '📊', name: 'Table', tag: 'table', type: 'container', description: 'テーブル' },
            { icon: '📃', name: 'List', tag: 'ul', type: 'container', description: 'リスト' },
            { icon: '🎨', name: 'Section', tag: 'section', type: 'container', description: 'セクション' },
            { icon: '🏷️', name: 'Label', tag: 'label', type: 'container', description: 'ラベル' }
        ];

        const container = document.createElement('div');
        components.forEach(comp => {
            const item = document.createElement('div');
            item.className = 'component-item';
            item.draggable = true;
            item.innerHTML = `
                <span style="font-size: 20px;">${comp.icon}</span>
                <div>
                    <strong>${comp.name}</strong><br>
                    <small style="color: #7f8c8d;">${comp.description}</small>
                </div>
            `;
            
            const componentData = {
                tag: comp.tag,
                type: comp.type,
                attributes: { class: comp.tag + '-element' }
            };

            // デフォルトプロパティを設定
            if (comp.type === 'heading') {
                componentData.text = '見出し';
            } else if (comp.type === 'paragraph') {
                componentData.text = '段落のテキストです。';
            } else if (comp.type === 'button') {
                componentData.text = 'ボタン';
                componentData.attributes.type = 'button';
            }

            item.dataset.component = JSON.stringify(componentData);
            item.dataset.componentType = comp.type;

            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            container.appendChild(item);
        });

        panel.appendChild(container);
    }

    setupEventHandlers() {
        // data-action属性を持つボタンのクリックイベント
        document.addEventListener('click', (e) => {
            const actionElement = e.target.closest('[data-action]');
            if (actionElement) {
                const action = actionElement.dataset.action;
                this.handleAction(action);
            }
        });
    }

    setupDropZone() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // キャンバス内の要素クリックで選択
        dropZone.addEventListener('click', (e) => {
            if (e.target !== dropZone && e.target.closest('.drop-zone')) {
                this.selectElement(e.target);
            }
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('component', e.currentTarget.dataset.component);
        e.dataTransfer.setData('componentType', e.currentTarget.dataset.componentType);
        e.currentTarget.style.opacity = '0.5';
    }

    handleDragEnd(e) {
        e.currentTarget.style.opacity = '1';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.style.background = '#e8f4f8';
        e.currentTarget.style.borderColor = '#3498db';
    }

    handleDragLeave(e) {
        e.currentTarget.style.background = '';
        e.currentTarget.style.borderColor = '#bdc3c7';
    }

    handleDrop(e) {
        e.preventDefault();
        const dropZone = e.currentTarget;
        dropZone.style.background = '';
        dropZone.style.borderColor = '#bdc3c7';

        const data = e.dataTransfer.getData('component');
        const componentType = e.dataTransfer.getData('componentType');
        
        if (data) {
            try {
                const component = JSON.parse(data);
                const element = JsonToHtml.createElement(component);
                
                // データ属性を追加
                element.dataset.componentType = componentType;
                element.style.cursor = 'pointer';
                element.style.padding = '8px';
                element.style.margin = '4px';
                element.style.border = '1px dashed transparent';
                
                // ホバー効果
                element.addEventListener('mouseenter', function() {
                    this.style.borderColor = '#3498db';
                    this.style.background = '#f8f9fa';
                });
                element.addEventListener('mouseleave', function() {
                    if (!this.classList.contains('selected')) {
                        this.style.borderColor = 'transparent';
                        this.style.background = '';
                    }
                });

                if (dropZone.textContent.includes('ドラッグ&ドロップ')) {
                    dropZone.innerHTML = '';
                }
                
                dropZone.appendChild(element);
                this.saveHistory();
                this.updateStatus('✅ コンポーネントを追加しました');
            } catch (err) {
                console.error('コンポーネント追加エラー:', err);
                this.updateStatus('❌ エラー: コンポーネントを追加できませんでした');
            }
        }
    }

    selectElement(element) {
        // 以前の選択を解除
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement.style.outline = '';
        }

        // 新しい要素を選択
        this.selectedElement = element;
        element.classList.add('selected');
        element.style.outline = '2px solid #3498db';

        // プロパティパネルを表示
        this.showProperties(element);
    }

    showProperties(element) {
        const propertiesContent = document.getElementById('properties-content');
        if (!propertiesContent) return;

        const componentType = element.dataset.componentType || 'container';
        const propertyConfig = this.config?.editor.propertyPanels[componentType];

        if (!propertyConfig) {
            propertiesContent.innerHTML = '<div class="empty-state">このコンポーネントのプロパティはありません</div>';
            return;
        }

        propertiesContent.innerHTML = '';
        
        propertyConfig.properties.forEach(prop => {
            const group = document.createElement('div');
            group.className = 'property-group';

            const label = document.createElement('label');
            label.className = 'property-label';
            label.textContent = prop.label;

            let input;
            if (prop.type === 'select') {
                input = document.createElement('select');
                input.className = 'property-input';
                prop.options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    input.appendChild(opt);
                });
            } else if (prop.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'property-input';
                input.rows = 3;
            } else if (prop.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.style.width = 'auto';
            } else {
                input = document.createElement('input');
                input.type = prop.type || 'text';
                input.className = 'property-input';
            }

            // 現在の値を設定
            if (prop.name === 'text') {
                input.value = element.textContent || prop.default || '';
            } else if (prop.name === 'tag') {
                input.value = element.tagName.toLowerCase();
            } else {
                input.value = element.getAttribute(prop.name) || prop.default || '';
            }

            // 変更イベント
            input.addEventListener('change', (e) => {
                this.updateElementProperty(element, prop.name, e.target.value);
            });

            group.appendChild(label);
            group.appendChild(input);
            propertiesContent.appendChild(group);
        });
    }

    updateElementProperty(element, propName, value) {
        if (propName === 'text') {
            element.textContent = value;
        } else if (propName === 'tag') {
            // タグ変更は複雑なので後で実装
            console.log('タグ変更:', value);
        } else {
            element.setAttribute(propName, value);
        }
        this.saveHistory();
        this.updateStatus('✅ プロパティを更新しました');
    }

    handleAction(action) {
        const actionConfig = this.config?.editor.actions[action];
        
        if (!actionConfig) {
            console.warn('未定義のアクション:', action);
            return;
        }

        switch (actionConfig.type) {
            case 'export':
                this.exportContent(actionConfig.format, actionConfig.filename);
                break;
            case 'storage':
                if (actionConfig.method === 'save') {
                    this.saveToStorage();
                } else if (actionConfig.method === 'load') {
                    this.loadFromStorage();
                }
                break;
            case 'history':
                if (actionConfig.method === 'undo') {
                    this.undo();
                } else if (actionConfig.method === 'redo') {
                    this.redo();
                }
                break;
            case 'canvas':
                if (actionConfig.method === 'clear') {
                    this.clearCanvas();
                }
                break;
            default:
                console.log('アクション実行:', action, actionConfig);
        }
    }

    exportContent(format, filename) {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        let content = '';
        if (format === 'json') {
            // JSON形式でエクスポート
            const elements = Array.from(dropZone.children).map(el => this.elementToJson(el));
            content = JSON.stringify({ body: elements }, null, 2);
        } else if (format === 'html') {
            content = dropZone.innerHTML;
        }

        // ダウンロード
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this.updateStatus(`✅ ${format.toUpperCase()}をエクスポートしました`);
    }

    elementToJson(element) {
        return {
            tag: element.tagName.toLowerCase(),
            text: element.textContent,
            attributes: Object.fromEntries(
                Array.from(element.attributes).map(attr => [attr.name, attr.value])
            )
        };
    }

    saveToStorage() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        const content = dropZone.innerHTML;
        localStorage.setItem('jsonia-editor-content', content);
        this.updateStatus('✅ 保存しました');
    }

    loadFromStorage() {
        const content = localStorage.getItem('jsonia-editor-content');
        if (content) {
            const dropZone = document.getElementById('drop-zone');
            if (dropZone) {
                dropZone.innerHTML = content;
                this.updateStatus('✅ 読み込みました');
            }
        }
    }

    saveHistory() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        const content = dropZone.innerHTML;
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(content);
        this.historyIndex++;

        // 最大履歴サイズを制限
        const maxSize = this.config?.editor.config.undoRedo.maxHistorySize || 50;
        if (this.history.length > maxSize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const dropZone = document.getElementById('drop-zone');
            if (dropZone) {
                dropZone.innerHTML = this.history[this.historyIndex];
                this.updateStatus('↶ 元に戻しました');
            }
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const dropZone = document.getElementById('drop-zone');
            if (dropZone) {
                dropZone.innerHTML = this.history[this.historyIndex];
                this.updateStatus('↷ やり直しました');
            }
        }
    }

    clearCanvas() {
        if (confirm('キャンバスをクリアしますか?')) {
            const dropZone = document.getElementById('drop-zone');
            if (dropZone) {
                dropZone.innerHTML = '🎨 コンポーネントをここにドラッグ&ドロップしてください';
                this.saveHistory();
                this.updateStatus('✅ キャンバスをクリアしました');
            }
        }
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = message;
            if (!message.includes('Ready')) {
                setTimeout(() => {
                    status.textContent = 'Ready';
                }, 3000);
            }
        }
    }
}

// グローバルインスタンス
window.jsoniaEditor = new JsoniaEditor();

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Jsonia WYSIWYG Editor 起動中...');
    window.jsoniaEditor.init();
});
