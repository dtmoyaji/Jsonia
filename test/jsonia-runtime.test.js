/**
 * Basic unit tests for JsoniaRuntime evaluateExpression and resolveTemplate
 */

// Ensure jsdom environment is available (Jest uses jsdom by default)
require('../public/js/jsonia-runtime.js');

describe('JsoniaRuntime core functions', () => {
    let JsoniaRuntime;

    beforeAll(() => {
        JsoniaRuntime = global.JsoniaRuntime || window.JsoniaRuntime;
    });

    test('evaluateExpression: template and arithmetic', () => {
        const r = new JsoniaRuntime();
        r.initState({ a: 2, b: 3, text: 'hello' });

        // template full match
        expect(r.evaluateExpression('{{a}}')).toBe(2);
        // template embedded
        expect(r.evaluateExpression('value: {{text}}')).toBe('value: hello');
        // sum
        expect(r.evaluateExpression({ sum: ['{{a}}', '{{b}}', 5] })).toBe(10);
        // add
        expect(r.evaluateExpression({ add: ['{{a}}', 4] })).toBe(6);
        // negation !{{a}} -> false
        r.setState('flag', true);
        expect(r.evaluateExpression('!{{flag}}')).toBe(false);
    });

    test('resolveTemplate: string and object templates', () => {
        const r = new JsoniaRuntime();
        r.initState({ user: { name: 'Alice', id: 42 } });

        const resolved = r.resolveTemplate('/api/user/{{user.id}}');
        expect(resolved).toBe('/api/user/42');

        const obj = { url: '/api/{{user.id}}', body: { name: '{{user.name}}' } };
        const resolvedObj = r.resolveTemplate(obj);
        expect(resolvedObj.url).toBe('/api/42');
        expect(resolvedObj.body.name).toBe('Alice');
    });
});
