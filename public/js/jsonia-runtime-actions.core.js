// Core: extend JsoniaRuntime with action dispatch and registration
function extendJsoniaRuntimeWithActions(JsoniaRuntimeClass) {
    const originalExecuteAction = JsoniaRuntimeClass.prototype.executeAction;

    JsoniaRuntimeClass.prototype.executeAction = async function(action, event = null) {
        if (typeof action === 'string') {
            const componentAction = this.actions && this.actions[action];
            if (componentAction) return await componentAction({ event });
        }

        const handler = this.actionHandlers && this.actionHandlers[action.type];
        if (handler) return await handler.call(this, action, event);

        return await originalExecuteAction.call(this, action, event);
    };

    JsoniaRuntimeClass.prototype.registerActionHandler = function(type, handler) {
        if (!this.actionHandlers) this.actionHandlers = {};
        this.actionHandlers[type] = handler;
    };

    JsoniaRuntimeClass.prototype.registerAction = function(name, handler) {
        if (!this.actions) this.actions = {};
        this.actions[name] = handler;
        try {
            this[name] = async (params) => { return await handler.call(this, params); };
        } catch (e) { console.warn('registerAction: could not set instance method', name, e); }
    };

    JsoniaRuntimeClass.prototype.initializeActionHandlers = function() {
        // DOM
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

        // Array
        this.registerActionHandler('array.forEach', arrayForEach);
        this.registerActionHandler('array.map', arrayMap);
        this.registerActionHandler('array.filter', arrayFilter);
        this.registerActionHandler('array.length', arrayLength);

        // Object
        this.registerActionHandler('object.set', objectSet);
        this.registerActionHandler('object.get', objectGet);

        // String
        this.registerActionHandler('string.template', stringTemplate);
        this.registerActionHandler('string.concat', stringConcat);

        // Utils
        this.registerActionHandler('util.parseJSON', utilParseJSON);
        this.registerActionHandler('util.timestamp', utilTimestamp);
        this.registerActionHandler('util.delay', utilDelay);
        this.registerActionHandler('util.getAttribute', utilGetAttribute);
        this.registerActionHandler('util.closest', utilClosest);
        this.registerActionHandler('util.querySelector', utilQuerySelector);

        // Template / Component
        this.registerActionHandler('template.renderFromJSON', templateRenderFromJSON);
        this.registerActionHandler('component.renderList', componentRenderList);
        this.registerActionHandler('component.method', componentMethod.bind(this));
        this.registerActionHandler('registerComponentMethods', registerComponentMethods.bind(this));
        this.registerActionHandler('registerComponentActions', registerComponentActions.bind(this));

        // Sequence
        this.registerActionHandler('sequence', sequenceExecute);

        // Drag & Drop
        this.registerActionHandler('drag.setData', dragSetData);
        this.registerActionHandler('drag.getData', dragGetData);
    };
}

// expose to global and auto-apply if runtime present
if (typeof window !== 'undefined') {
    window.extendJsoniaRuntimeWithActions = extendJsoniaRuntimeWithActions;
    // addJsoniaRuntimeHelpers is defined in template file and exposed there
    if (window.JsoniaRuntime) {
        extendJsoniaRuntimeWithActions(window.JsoniaRuntime);
        if (window.addJsoniaRuntimeHelpers) addJsoniaRuntimeHelpers(window.JsoniaRuntime);
    }
}
