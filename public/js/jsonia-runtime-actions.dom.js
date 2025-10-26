// DOM action handlers for JsoniaRuntime (extracted)

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
        const resolvedValue = this.resolveTemplate(action.value || '');
        if (action.name === 'style') {
            if (!resolvedValue || resolvedValue.trim() === '') {
                try { attrTarget.removeAttribute('style'); } catch (e) {}
                try { if (attrTarget.style) attrTarget.style.cssText = ''; } catch (e) {}
            } else {
                attrTarget.setAttribute('style', resolvedValue);
            }
        } else {
            attrTarget.setAttribute(action.name, resolvedValue);
        }
    }
}

async function domAddClass(action, event) {
    // Resolve template variables in target first (supports selectors containing {{var}})
    let resolved = action.target;
    if (typeof resolved === 'string') resolved = this.resolveTemplate(resolved);

    let addClassTarget = null;
    // If target references event properties like {{event.currentTarget}}
    if (typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1].split('.');
            addClassTarget = event[path[0]];
            for (let i = 1; i < path.length && addClassTarget; i++) addClassTarget = addClassTarget[path[i]];
        }
    }

    if (!addClassTarget) {
        if (typeof resolved === 'string') {
            // selector string -> apply to all matches
            const nodes = Array.from(document.querySelectorAll(resolved));
            nodes.forEach(n => n.classList.add(action.className));
            return;
        }
        addClassTarget = resolved || this.resolveValue(action.target);
    }

    if (addClassTarget) addClassTarget.classList.add(action.className);
}

async function domRemoveClass(action, event) {
    let resolved = action.target;
    if (typeof resolved === 'string') resolved = this.resolveTemplate(resolved);

    let removeClassTarget = null;
    if (typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1].split('.');
            removeClassTarget = event[path[0]];
            for (let i = 1; i < path.length && removeClassTarget; i++) removeClassTarget = removeClassTarget[path[i]];
        }
    }

    if (!removeClassTarget) {
        if (typeof resolved === 'string') {
            const nodes = Array.from(document.querySelectorAll(resolved));
            nodes.forEach(n => n.classList.remove(action.className));
            return;
        }
        removeClassTarget = resolved || this.resolveValue(action.target);
    }

    if (removeClassTarget) removeClassTarget.classList.remove(action.className);
}

async function domToggleClass(action, event) {
    // Resolve template variables in target first
    let resolved = action.target;
    if (typeof resolved === 'string') resolved = this.resolveTemplate(resolved);

    let toggleClassTarget = null;
    if (typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1].split('.');
            toggleClassTarget = event[path[0]];
            for (let i = 1; i < path.length && toggleClassTarget; i++) toggleClassTarget = toggleClassTarget[path[i]];
        }
    }

    // Debug: log resolved target to help diagnose why classes may not change
    try {
        console.log('dom.toggleClass: action.target=', action.target, 'resolved=', resolved, 'className=', action.className);
    } catch (e) {}

    if (!toggleClassTarget) {
        if (typeof resolved === 'string') {
            const nodes = Array.from(document.querySelectorAll(resolved));
            nodes.forEach(n => n.classList.toggle(action.className));
            return;
        }
        toggleClassTarget = resolved || this.resolveValue(action.target);
    }

    if (toggleClassTarget) toggleClassTarget.classList.toggle(action.className);
}

async function domAppendChild(action, event) {
    const parent = this.resolveValue(action.parent);
    const child = this.resolveValue(action.child);
    if (parent && child) parent.appendChild(child);
}

async function domInsertIntoSlot(action, event) {
    const container = this.resolveValue(action.container);
    const children = this.resolveValue(action.children);
    const slotName = action.slotName || 'children';
    if (container && children) {
        const success = this.insertIntoSlot(container, children, slotName);
        if (action.output) this.setState(action.output, success);
        return success;
    }
    return false;
}

async function domRemoveChild(action, event) {
    const removeParent = this.resolveValue(action.parent);
    const removeChild = this.resolveValue(action.child);
    if (removeParent && removeChild) removeParent.removeChild(removeChild);
}

async function domRemove(action, event) {
    const element = this.resolveValue(action.target);
    if (element && element.remove) element.remove();
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
    if (event && event.stopPropagation) event.stopPropagation();
}

async function domPreventDefault(action, event) {
    if (event && event.preventDefault) event.preventDefault();
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
    if (action.output) this.setState(action.output, createdElement);
    return createdElement;
}

async function domBuildTree(action, event) {
    const rootElement = this.resolveValue(action.root);
    const startLevel = action.level || 0;
    const treeHTML = this.buildTreeHTML(rootElement, startLevel, action.options || {});
    if (action.output) this.setState(action.output, treeHTML);
    return treeHTML;
}

// end of dom handlers
