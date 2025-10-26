// Utility, array/object/string and drag handlers for JsoniaRuntime

async function arrayForEach(action, event) {
    const forEachArray = this.resolveValue(action.array);
    if (Array.isArray(forEachArray) && action.do) {
        for (let i = 0; i < forEachArray.length; i++) {
            const item = forEachArray[i];
            const oldValue = this.getState(action.item);
            const oldIndex = this.getState(action.index || 'index');
            this.setState(action.item, item);
            if (action.index) this.setState(action.index, i);
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
        if (action.storeIn) this.setState(action.storeIn, result);
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
            if (condition) result.push(item);
            if (oldValue !== undefined) this.setState(action.item, oldValue);
        }
        if (action.storeIn) this.setState(action.storeIn, result);
        return result;
    }
}

async function arrayLength(action, event) {
    const array = this.resolveValue(action.array);
    const length = Array.isArray(array) ? array.length : 0;
    if (action.output) this.setState(action.output, length);
    return length;
}

async function objectSet(action, event) {
    const obj = this.resolveValue(action.object) || {};
    obj[action.key] = this.resolveValue(action.value);
    if (action.storeIn) this.setState(action.storeIn, obj);
}

async function objectGet(action, event) {
    const getObj = this.resolveValue(action.object);
    const value = getObj ? getObj[action.key] : undefined;
    if (action.storeIn) this.setState(action.storeIn, value);
    return value;
}

async function stringTemplate(action, event) {
    const templated = this.resolveTemplate(action.template);
    if (action.storeIn) this.setState(action.storeIn, templated);
    return templated;
}

async function stringConcat(action, event) {
    const parts = action.parts.map(p => this.resolveTemplate(p));
    const concatenated = parts.join(action.separator || '');
    if (action.storeIn) this.setState(action.storeIn, concatenated);
    return concatenated;
}

async function utilParseJSON(action, event) {
    const jsonString = this.resolveTemplate(action.json);
    if (!jsonString || jsonString === 'undefined' || jsonString === 'null') {
        console.warn('⚠️ utilParseJSON: JSONデータが空です', { jsonString });
        if (action.output) this.setState(action.output, null);
        return null;
    }
    try {
        const parsed = JSON.parse(jsonString);
        if (action.output) this.setState(action.output, parsed);
        return parsed;
    } catch (error) {
        console.error('❌ JSON parse error:', error, { jsonString });
        if (action.output) this.setState(action.output, null);
        return null;
    }
}

async function utilTimestamp(action, event) {
    const timestamp = Date.now();
    if (action.output) this.setState(action.output, timestamp);
    return timestamp;
}

async function utilDelay(action, event) {
    const ms = action.ms || 100;
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function utilGetAttribute(action, event) {
    let targetElement = this.resolveValue(action.target);
    if (!targetElement && typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1];
            const keys = path.split('.');
            targetElement = event[keys[0]];
            for (let i = 1; i < keys.length; i++) {
                if (targetElement && typeof targetElement === 'object') {
                    targetElement = targetElement[keys[i]];
                } else { targetElement = undefined; break; }
            }
        }
    }
    if (action.attribute === 'closest' && targetElement && targetElement.closest) {
        const closestElement = targetElement.closest(action.selector);
        if (action.output) this.setState(action.output, closestElement);
        return closestElement;
    }
    if (targetElement && targetElement.getAttribute) {
        const attrValue = targetElement.getAttribute(action.name || action.attribute);
        if (action.output) this.setState(action.output, attrValue);
        return attrValue;
    }
    console.warn('⚠️ utilGetAttribute: 要素が見つからないか、メソッドがありません', { target: action.target, resolvedElement: targetElement, event: event });
    return null;
}

async function utilClosest(action, event) {
    let targetElement = this.resolveValue(action.target);
    if (!targetElement && typeof action.target === 'string' && event) {
        const eventMatch = action.target.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1];
            const keys = path.split('.');
            targetElement = event[keys[0]];
            for (let i = 1; i < keys.length; i++) {
                if (targetElement && typeof targetElement === 'object') targetElement = targetElement[keys[i]];
            }
        }
    }
    if (targetElement && targetElement.closest) {
        const closestElement = targetElement.closest(action.selector);
        if (action.output) this.setState(action.output, closestElement);
        return closestElement;
    }
    console.warn('⚠️ utilClosest: 要素が見つからないか、closestメソッドがありません', { target: action.target, selector: action.selector });
    return null;
}

async function utilQuerySelector(action, event) {
    let parent = this.resolveValue(action.parent);
    if (!parent && typeof action.parent === 'string' && event) {
        const eventMatch = action.parent.match(/^\{\{event\.(.+)\}\}$/);
        if (eventMatch) {
            const path = eventMatch[1];
            const keys = path.split('.');
            parent = event[keys[0]];
            for (let i = 1; i < keys.length; i++) {
                if (parent && typeof parent === 'object') parent = parent[keys[i]]; else parent = undefined; break;
            }
        }
    }
    if (parent && parent.querySelector) {
        const element = parent.querySelector(action.selector);
        if (action.output) this.setState(action.output, element);
        return element;
    }
    console.warn('⚠️ utilQuerySelector: 親要素が見つからないか、querySelectorメソッドがありません', { parent: action.parent, selector: action.selector, resolvedParent: parent });
    return null;
}

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
        if (action.output) this.setState(action.output, parsedData);
        return parsedData;
    }
}

// end utils
