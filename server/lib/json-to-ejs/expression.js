/**
 * convertToEJSExpression, isEJSExpression
 */
function convertToEJSExpression(text, options = {}) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // {{variable}} -> <%= variable %> or <%- variable %> when raw
    let ejsText = text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const trimmedVar = variable.trim();
        if (options.raw && options.raw.includes && options.raw.includes(trimmedVar)) {
            return `<%- ${trimmedVar} %>`;
        }
        return `<%= ${trimmedVar} %>`;
    });

    // {{% code %}} -> <% code %>
    ejsText = ejsText.replace(/\{\{%([^%]+)%\}\}/g, (match, code) => {
        return `<% ${code.trim()} %>`;
    });

    // if/else/each helpers
    ejsText = ejsText.replace(/\{\{#if\s+([^}]+)\}\}/g, '<% if ($1) { %>');
    ejsText = ejsText.replace(/\{\{#else\}\}/g, '<% } else { %>');
    ejsText = ejsText.replace(/\{\{\/if\}\}/g, '<% } %>');
    ejsText = ejsText.replace(/\{\{#each\s+([^}]+)\}\}/g, '<% $1.forEach(function(item, index) { %>');
    ejsText = ejsText.replace(/\{\{\/each\}\}/g, '<% }); %>');

    return ejsText;
}

function isEJSExpression(text) {
    return typeof text === 'string' && (
        text.includes('{{') ||
        text.includes('<%') ||
        text.includes('{%')
    );
}

module.exports = {
    convertToEJSExpression,
    isEJSExpression
};
