# Jsonia - JSON-Driven Web Development Framework

**JavaScriptコードを一切書かずに**、JSONだけで完全なWebアプリケーションを構築できる革新的なフレームワークです。

## 📖 目次

- [主な特徴](#-主な特徴)
````markdown
# Jsonia - JSON-Driven Web Development Framework

Build full web applications using only JSON — no project-specific JavaScript required.

## 📖 Table of Contents

- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Benefits of Jsonia](#-benefits-of-jsonia)
- [Quickstart](#-quickstart)
- [JSON Definitions](#-json-definitions)
- [Componentization](#-componentization)
- [CSS Management](#-css-management)
- [Behavioral Components](#-behavioral-components)
- [License](#-license)

---

## ✨ Key Features

### 🎯 Zero JavaScript Development

- **Pure JSON definitions**: Describe HTML structure, CSS, behavior and APIs entirely in JSON
- **Split runtime**: Core engine runs in `jsonia-runtime.js`, with action implementations moved to `jsonia-runtime-actions.js` for clearer separation of concerns and easier extension
- **No project-specific JS**: Application logic lives entirely in JSON files

### ⚡ Component-Oriented

- **Behavioral components**: Combine structure and behavior similar to React/Vue components
- **40+ action types**: Define DOM operations, state management and API calls in JSON
- **Reusable building blocks**: Tabs, modals, accordions and other standard components included

### Development Efficiency

- **No build step**: Interpreter execution enables instant preview
- **Componentization**: Reuse components with the `$include` directive
- **Project isolation**: Run projects independently for security and performance

## 🚀 Getting Started

### jsonia-editor mode (default)

```bash
# Run the jsonia-editor project
node server/jsonia.js
# or
npm start
```

- Provides a WYSIWYG editor
- Create and save new projects from the editor
- `http://localhost:3000/` redirects to `/editor`

### Run a specific project

```bash
# Run only a specific project
node server/jsonia.js projects/<project-name>

# Examples:
node server/jsonia.js projects/blog-project
node server/jsonia.js projects/form-project
```

- Only the specified project's routes and assets are loaded
- Other projects are not loaded into memory (better security & performance)

### Install dependencies

```bash
npm install
```

## 📚 Project Structure

Each project is isolated. At runtime only the chosen project is loaded:

```text
Jsonia/
├── server/
│   └── jsonia.js           # JSON-driven routing interpreter
├── jsonia-editor/          # WYSIWYG editing environment
│   ├── routes.json         # Editor routes
│   └── *.ejs               # Editor templates
├── projects/               # Project folders
│   ├── blog-project/
│   │   ├── routes.json     # Blog route definitions
│   │   └── *.ejs           # Blog templates
│   ├── form-project/
│   │   ├── routes.json     # Form project routes
│   │   └── *.ejs           # Form templates
│   └── <your-project>/
│       ├── routes.json     # Custom routes
│       └── *.ejs           # Custom templates
├── public/
│   └── js/
│       └── jsonia-client.js # Client library
└── package.json
```

### Project isolation model

- **jsonia-editor mode**: only `jsonia-editor/` is loaded
- **project mode**: only the specified `projects/<name>/` is loaded
- **Other projects**: never loaded into memory (security & performance)

## 🔧 JSON Routing Definitions

### Example `routes.json`

```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/blog",
      "handler": "renderTemplate",
      "template": "main.json",
      "data": {
        "title": "Blog Page",
        "content": "Blog content"
      }
    },
    {
      "method": "POST",
      "path": "/api/blog",
      "handler": "processData",
      "template": "api-response.json"
    }
  ]
}
```

### EJS template generation (server-side)

```javascript
// Convert JSON to an EJS fragment on the server
const JsonToEJS = require('./server/lib/json-to-ejs');

const config = {
    tag: 'div',
    attributes: { class: 'container' },
    children: [
        {
            tag: 'h1',
            text: '<%= title %>'
        },
        {
            tag: 'p',
            text: '<%= content %>'
        }
    ]
};

const ejsTemplate = JsonToEJS.render(config);
// Output: <div class="container"><h1><%= title %></h1><p><%= content %></p></div>
```

### Client-side HTML rendering

```javascript
const config = {
    tag: 'div',
    attributes: { class: 'card' },
    children: [
        {
            tag: 'h3',
            text: 'Title'
        },
        {
            tag: 'p',
            text: 'Content'
        }
    ]
};

// Render into a DOM element
JsoniaClient.render('#container', config);
```

## 🏗️ JSON Schema

### Basic element

```json
{
    "tag": "div",
    "attributes": {
        "class": "container",
        "id": "main"
    },
    "text": "Some text",
    "children": [
        {
            "tag": "p",
            "text": "Child element"
        }
    ]
}
```

### Full page example

```json
{
    "title": "Page Title",
    "meta": {
        "charset": "UTF-8",
        "viewport": "width=device-width, initial-scale=1.0"
    },
    "styles": [
        "/css/style.css",
        {
            "content": "body { margin: 0; }"
        }
    ],
    "body": [
        {
            "tag": "h1",
            "text": "Main content"
        }
    ],
    "scripts": [
        "/js/app.js",
        {
            "content": "console.log('inline script');"
        }
    ]
}
```

## 💡 Benefits of Jsonia

### Comparison with traditional HTML development

| Traditional | Jsonia | Effect |
|------------|--------|--------|
| Separate HTML/CSS/JS | Unified JSON format | 🔄 Single source of truth |
| Build required | Interpreter execution | ⚡ Zero build time |
| Manual reload | Automatic preview | 👀 Immediate feedback |
| React/Vue bundle | JSON definitions | 📦 No bundler required |
| JavaScript required | Pure JSON | 🪶 Lower learning curve |

### Key advantages

#### Development speed

- ⏰ Reduce development time by ~60–80%
- 🚀 Very fast prototyping to production
- 📋 Clear requirements using JSON schemas
- 🧪 Easier testing and validation

#### Maintainability

- 👁️ Clear structure expressed in JSON
- 🔁 Single change can propagate across pages
- 📊 Enables automated analysis and validation
- 🔄 Git diffs are easy to review

#### Security

- 🔒 Automatic XSS protection (text is escaped)
- ✅ Type-safety via JSON schema
- 🚫 Restricted tag set for safety
- 📝 Full traceability

#### Team collaboration

- 👥 Non-engineers can author UI
- 🎨 Designers can contribute directly
- 📚 No deep full-stack knowledge required
- 🔍 Structured code reviews

## ⚡ Quickstart

### Install

```bash
npm install
```

### Start development server

```bash
# jsonia-editor mode (WYSIWYG editor)
npm start

# Run a single project only
node server/jsonia.js projects/blog-project
```

### Create a new project

1. Create a folder `projects/<new-project-name>/`
2. Define routes in `routes.json`
3. Create page definitions in `main.json`
4. Restart the server and the project will be detected automatically

## 🧩 Componentization with JSON

### $include directive

You can reuse JSON fragments like EJS includes:

```json
{
  "body": [
    {
      "$include": "shared/components/header"
    },
    {
      "tag": "main",
      "children": [
        {
          "tag": "h1",
          "text": "Content"
        }
      ]
    },
    {
      "$include": "shared/components/footer"
    }
  ]
}
```

### Path resolution rules

- **`shared/components/xxx`** resolves to `projects/shared/components/xxx.json`
- **`components/xxx`** resolves to the project's `components/xxx.json`
- **`/xxx`** is an absolute path from the project root

### Example shared header (`projects/shared/components/header.json`)

```json
{
  "tag": "header",
  "attributes": {
    "class": "site-header",
    "style": "background: #2c3e50; color: white; padding: 20px;"
  },
  "children": [
    {
      "tag": "h1",
      "text": "{{title}}"
    },
    {
      "tag": "nav",
      "children": [
        {
          "tag": "a",
          "attributes": { "href": "/" },
          "text": "Home"
        }
      ]
    }
  ]
}
```

#### Usage example

```json
{
  "title": "My Site",
  "body": [
    {
      "$include": "shared/components/header"
    }
  ]
}
```

### Componentization benefits

- 🔄 Reusability: centralize shared components
- 🎨 Consistency: keep UI design consistent
- 🛠️ Maintainability: change once, update everywhere
- 📦 Modularity: split complex UIs into small parts

## 🎨 CSS as external JSON files

### $include in the `styles` array

Styles can also be managed as external JSON files:

```json
{
  "title": "My Page",
  "styles": [
    {
      "$include": "css.json"
    }
  ],
  "body": [...]
}
```

### Shared style library

Provide a basic utility class set:

```json
{
  "styles": [
    {
      "$include": "shared/styles/base.json"
    }
  ]
}
```

Available classes:

- Layout: `.container`, `.flex`, `.grid`, `.grid-cols-2/3/4`
- Spacing: `.mt-1/2/3/4`, `.mb-1/2/3/4`, `.p-1/2/3/4`
- Buttons: `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`
- Cards: `.card`, `.card-header`
- Text: `.text-center`, `.text-left`, `.text-right`

### Project-specific CSS

Place project-specific styles under each project:

```text
projects/
  my-project/
    css.json          # project styles
    main.json
    routes.json
```

```json
{
  "styles": [
    {
      "$include": "shared/styles/base.json"
    },
    {
      "$include": "css.json"
    }
  ]
}
```

### CSS benefits

- 📁 Separation: keep styles separate from content
- 🔄 Reuse: share styles across pages
- 🎯 Maintainability: change styles in one place
- 📦 Modularity: split styles by purpose

## ⚡ Behavioral components

### Interactive UI without JavaScript

The core value of Jsonia is that you can build interactive components similar to React/Vue without writing any JavaScript.

### Basic structures

Static component (structure only):

```json
{
  "tag": "div",
  "children": [{ "tag": "h1", "text": "Title" }]
}
```

Dynamic component (structure + behavior):

```json
{
  "tag": "div",
  "children": [...],
  "behavior": {
    "state": { "activeTab": "tab1" },
    "events": [
      {
        "target": "[data-tab]",
        "type": "click",
        "actions": [
          { "type": "setState", "key": "activeTab", "value": "{{tabId}}" },
          { "type": "dom.addClass", "element": "{{button}}", "className": "active" }
        ]
      }
    ],
    "apis": {
      "loadData": { "url": "/api/data", "method": "GET" }
    },
    "initialization": [
      { "type": "api", "name": "loadData", "storeIn": "data" }
    ]
  }
}
```

### Built-in components

| Component | File | Function |
|-----------|------|----------|
| Tabs UI | `tabs-with-behavior.json` | Tab switching and state management |
| Accordion | `accordion-with-behavior.json` | Open/close control, multiple sections |
| Dropdown | `dropdown-with-behavior.json` | Menu open/close and item selection |
| Modal | `modal-with-behavior.json` | Dialog display with backdrop close |

Example usage:

```json
{
  "$include": "components/tabs-with-behavior.json",
  "defaultTab": "tab1",
  "tabs": [
    { "tag": "button", "text": "Tab 1", "attributes": { "data-tab-button": "tab1" } }
  ],
  "panels": [
    { "tag": "div", "text": "Content 1", "attributes": { "data-tab-panel": "tab1" } }
  ]
}
```

### 40+ action types

DOM operations: select, selectAll, createElement, appendChild, setInnerHTML, setAttribute, addClass, removeClass, toggleClass

Data operations: array.forEach, array.map, array.filter, object.set, object.get

String: string.template, string.concat

Flow: if, sequence

State: setState, getState

Network: api, emit

Other: alert, console, navigate, validate, submit

### Zero-JavaScript architecture

The `jsonia-editor` project itself demonstrates the approach:

```text
public/js/
└── jsonia-runtime.js (core runtime) and jsonia-runtime-actions.js (action library)
  ↑ core engine + separate action implementations for modularity and easier maintenance

jsonia-editor/
├── behaviors/editor.json    # behavior definitions
├── extensions.json          # custom actions
└── data/components.json     # component data
```

- Project-specific JavaScript: **0 lines**
- All logic: JSON definitions
- Type safety: JSON schema validation

See `components/README.md` for details.

## 📝 License

MIT License

````
