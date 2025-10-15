/**
 * Jsonia Client - HTML生成専用ライブラリ
 * EJS生成はサーバーサイドに任せる、合理的な分離アーキテクチャ
 */

class JsonToHtml {
    static render(config) {
        if (typeof config === 'string') {
            return this.escapeHtml(config);
        }

        if (Array.isArray(config)) {
            return config.map(item => this.render(item)).join('');
        }

        if (!config || typeof config !== 'object') {
            return '';
        }

        if (config.text && !config.tag) {
            return this.escapeHtml(config.text);
        }

        const tag = config.tag || 'div';
        const attributes = this.renderAttributes(config.attributes || {});
        const children = config.children || [];
        const text = config.text || '';

        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
        if (selfClosingTags.includes(tag.toLowerCase())) {
            return `<${tag}${attributes} />`;
        }

        let html = `<${tag}${attributes}>`;
        
        if (text) {
            html += this.escapeHtml(text);
        }
        
        if (children.length > 0) {
            html += this.render(children);
        }
        
        html += `</${tag}>`;
        return html;
    }

    static renderAttributes(attributes) {
        if (!attributes || typeof attributes !== 'object') {
            return '';
        }

        return Object.entries(attributes)
            .filter(([key, value]) => value !== null && value !== undefined)
            .map(([key, value]) => {
                if (typeof value === 'boolean') {
                    return value ? key : '';
                }
                return `${key}="${this.escapeHtml(String(value))}"`;
            })
            .filter(attr => attr)
            .map(attr => ' ' + attr)
            .join('');
    }

    static escapeHtml(text) {
        if (typeof text !== 'string') {
            return String(text);
        }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    static createElement(config) {
        if (!config || typeof config !== 'object') {
            return document.createTextNode(String(config || ''));
        }

        if (config.text && !config.tag) {
            return document.createTextNode(config.text);
        }

        const tag = config.tag || 'div';
        const element = document.createElement(tag);
        const attributes = config.attributes || {};
        const children = config.children || [];
        const text = config.text || '';

        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (typeof value === 'boolean') {
                    if (value) element.setAttribute(key, '');
                } else {
                    element.setAttribute(key, String(value));
                }
            }
        });

        if (text) {
            element.textContent = text;
        }

        children.forEach(child => {
            const childElement = this.createElement(child);
            element.appendChild(childElement);
        });

        return element;
    }

    static renderToElement(target, config) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) {
            console.warn('Target element not found:', target);
            return;
        }

        if (Array.isArray(config)) {
            element.innerHTML = '';
            config.forEach(item => {
                const child = this.createElement(item);
                element.appendChild(child);
            });
        } else {
            const content = this.createElement(config);
            element.innerHTML = '';
            element.appendChild(content);
        }
    }
}

window.JsonToHtml = JsonToHtml;