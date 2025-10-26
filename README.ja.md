# Jsonia - JSON-Driven Web Development Framework

**JavaScriptコードを一切書かずに**、JSONだけで完全なWebアプリケーションを構築できる革新的なフレームワークです。

## 📖 目次

- [主な特徴](#-主な特徴)
- [起動方法](#-起動方法)
- [プロジェクト構造](#-プロジェクト構造)
- [Jsoniaの利点](#-jsoniaの利点)
- [クイックスタート](#-クイックスタート)
- [JSON定義](#-json定義)
- [部品化機能](#-json部品化機能)
- [CSS管理](#-css定義の外部ファイル分離)
- [Behavior付きコンポーネント](#-behavior付きコンポーネント)
- [ライセンス](#-ライセンス)

---

## ✨ 主な特徴

### 🎯 ゼロJavaScript開発

- **完全JSON定義**: HTML構造、CSS、動作、APIをすべてJSONで記述
- **分割ランタイム**: コアエンジンは `jsonia-runtime.js` に、アクション実装は `jsonia-runtime-actions.js` に分離されており、責務の分離と拡張性が向上しています
- **プロジェクト固有コードゼロ**: アプリケーションロジックはすべてJSON定義

### ⚡ コンポーネント指向

- **Behavior付きコンポーネント**: React/Vue的な構造と振る舞いの統合
- **40+種類のアクション**: DOM操作、状態管理、API通信をJSONで定義
- **再利用可能**: タブ、モーダル、アコーディオンなど標準コンポーネント提供

### � 開発効率

- **ビルド不要**: インタプリタ実行で即座にプレビュー
- **部品化機能**: `$include`ディレクティブでコンポーネント再利用
- **プロジェクト分離**: 独立したプロジェクト管理でセキュア実行

## 🚀 起動方法

### jsonia-editorモード（デフォルト）

```bash
# jsonia-editorフォルダのプロジェクトを実行
node server/jsonia.js
# または
npm start
```

- WYSIWYGエディター機能
- 新プロジェクト作成・保存
- `http://localhost:3000/` → `/editor`自動リダイレクト

### 指定プロジェクトモード

```bash
# 特定プロジェクトのみを実行
node server/jsonia.js projects/<project-name>

# 例：
node server/jsonia.js projects/blog-project
node server/jsonia.js projects/form-project
```

- 指定プロジェクトのルートのみ有効
- 他プロジェクトは一切読み込まれない
- セキュア＆高パフォーマンス

### 依存関係のインストール

```bash
npm install
```

## 📚 プロジェクト構造

各プロジェクトは完全に独立し、実行時は指定プロジェクトのみがロードされます：

```text
Jsonia/
├── server/
│   └── jsonia.js           # 純粋JSONルーティングインタプリタ
├── jsonia-editor/          # WYSIWYG編集環境
│   ├── routes.json         # エディター専用ルート
│   └── *.ejs              # エディター用テンプレート
├── projects/               # プロジェクト分離フォルダ
│   ├── blog-project/
│   │   ├── routes.json     # ブログルート定義
│   │   └── *.ejs          # ブログ用テンプレート
│   ├── form-project/
│   │   ├── routes.json     # フォームルート定義
│   │   └── *.ejs          # フォーム用テンプレート
│   └── <your-project>/
│       ├── routes.json     # カスタムルート
│       └── *.ejs          # カスタムテンプレート
├── public/
│   └── js/
│       └── jsonia-client.js # クライアントライブラリ
└── package.json
```

### 🔐 プロジェクト分離の仕組み

- **jsonia-editorモード**: `jsonia-editor/`のみロード
- **プロジェクトモード**: 指定した`projects/<name>/`のみロード  
- **他プロジェクト**: 一切メモリに読み込まれない（セキュリティ＆パフォーマンス）

## 🔧 JSON ルーティング定義

### routes.json の例

```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/blog",
      "handler": "renderTemplate",
      "template": "main.json",
      "data": {
        "title": "ブログページ",
        "content": "ブログコンテンツ"
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

### EJSテンプレート生成

```javascript
// サーバーサイドでのEJS変換
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
// 出力: <div class="container"><h1><%= title %></h1><p><%= content %></p></div>
```

### クライアントサイドHTML生成

```javascript
const config = {
    tag: 'div',
    attributes: { class: 'card' },
    children: [
        {
            tag: 'h3',
            text: 'タイトル'
        },
        {
            tag: 'p',
            text: 'コンテンツ'
        }
    ]
};

// DOM要素に描画
JsoniaClient.render('#container', config);
```

## 🏗️ JSON スキーマ

### 基本要素

```json
{
    "tag": "div",
    "attributes": {
        "class": "container",
        "id": "main"
    },
    "text": "テキスト内容",
    "children": [
        {
            "tag": "p",
            "text": "子要素"
        }
    ]
}
```

### 完全なページ

```json
{
    "title": "ページタイトル",
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
            "text": "メインコンテンツ"
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

## 💡 Jsoniaの利点

### 従来のHTML開発との比較

| 従来の方法 | Jsonia | 効果 |
|-----------|---------|-----|
| HTML/CSS/JS分離 | JSON統一形式 | 🔄 一元管理 |
| ビルド必須 | インタプリタ実行 | ⚡ ビルド時間ゼロ |
| 手動リロード | 自動プレビュー | 👀 即座フィードバック |
| React/Vue | JSON定義 | � バンドル不要 |
| JavaScript必須 | 完全JSON | 🪶 学習コスト削減 |

### 主要メリット

#### 開発効率

- ⏰ 開発時間60-80%短縮
- 🚀 プロトタイプ→製品化が超高速
- 📋 JSONスキーマで要件定義が明確
- 🧪 テスト容易性の向上

#### 保守性

- 👁️ JSON形式で構造が一目瞭然
- � 一箇所の修正で全体に反映
- 📊 自動解析・バリデーション可能
- 🔄 Git差分が明確で管理しやすい

#### セキュリティ

- 🔒 自動XSS防止(全テキストエスケープ)
- ✅ JSONスキーマによる型安全性
- 🚫 制限されたタグセットで安全
- 📝 完全なトレーサビリティ

#### チーム協業

- 👥 非エンジニアでもUI作成可能
- 🎨 デザイナーとの協業が円滑
- 📚 フルスタック知識不要
- 🔍 コードレビューが構造的

## � クイックスタート

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
# jsonia-editorモード(WYSIWYG開発環境)
npm start

# 特定プロジェクトのみ実行
node server/jsonia.js projects/blog-project
```

### 新しいプロジェクト作成

1. `projects/新プロジェクト名/`フォルダを作成
2. `routes.json`でルーティングを定義
3. `main.json`でページを作成
4. サーバー再起動で自動認識

## 🧩 JSON部品化機能

### $include ディレクティブ

JSONファイルをEJSのように部品化して再利用できます：

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
          "text": "コンテンツ"
        }
      ]
    },
    {
      "$include": "shared/components/footer"
    }
  ]
}
```

### パス解決ルール

- **`shared/components/xxx`**: `projects/shared/components/xxx/component.json`
- **`components/xxx`**: プロジェクト内の`components/xxx/component.json`
- **`/xxx`**: プロジェクトルートからの絶対パス

### 共通コンポーネント作成例

#### ヘッダー (`projects/shared/components/header/component.json`)

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
          "text": "ホーム"
        }
      ]
    }
  ]
}
```

#### 使用例

```json
{
  "title": "マイサイト",
  "body": [
    {
      "$include": "shared/components/header"
    }
  ]
}
```

### 部品化のメリット

- 🔄 **再利用性**: 共通コンポーネントを一元管理
- 🎨 **一貫性**: デザインの統一が容易
- 🛠️ **保守性**: 修正箇所が1ヶ所で完結
- 📦 **モジュール化**: 複雑なUIを小さな部品に分解

## 🎨 CSS定義の外部ファイル分離

### styles配列での$include

スタイル定義も外部JSONファイルに分離して管理できます：

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

### 共通スタイルライブラリ

基本的なユーティリティクラスを提供：

```json
{
  "styles": [
    {
      "$include": "shared/styles/base.json"
    }
  ]
}
```

利用可能なクラス：

- **レイアウト**: `.container`, `.flex`, `.grid`, `.grid-cols-2/3/4`
- **スペーシング**: `.mt-1/2/3/4`, `.mb-1/2/3/4`, `.p-1/2/3/4`
- **ボタン**: `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`
- **カード**: `.card`, `.card-header`
- **テキスト**: `.text-center`, `.text-left`, `.text-right`

### プロジェクト専用CSS

各プロジェクトで独自のCSSファイルを作成：

```text
projects/
  my-project/
    css.json          # プロジェクト専用スタイル
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

注: 内蔵のWYSIWYGエディタ用スタイルは `jsonia-editor/components/editor/style.json` に統合済みです。
上記の `css.json` パターンはプロジェクト単位のスタイルには引き続き有効で、
`projects/<your-project>/css.json` にプロジェクト固有のスタイルを置くことができますが、
`jsonia-editor/css.json` は削除されています。

### CSSのメリット

- 📁 **分離管理**: スタイルとコンテンツを分離
- 🔄 **再利用**: 複数ページで同じスタイルを共有
- 🎯 **保守性**: スタイル変更が一箇所で完結
- 📦 **モジュール性**: 用途別にスタイルを分割

## ⚡ Behavior付きコンポーネント

### JavaScriptゼロでインタラクティブUIを実現

Jsoniaの最大の特徴は、**JavaScript一切不要**でReact/Vue的なインタラクティブコンポーネントを作成できることです。

### 基本構造

**静的コンポーネント** (構造のみ):

```json
{
  "tag": "div",
  "children": [{ "tag": "h1", "text": "タイトル" }]
}
```

**動的コンポーネント** (構造 + Behavior):

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

### 標準提供コンポーネント

| コンポーネント | ファイル | 機能 |
|------------|---------|------|
| タブUI | `tabs/component.json` | タブ切り替え、状態管理 |
| アコーディオン | `accordion/component.json` | 開閉制御、複数セクション |
| ドロップダウン | `dropdown/component.json` | メニュー開閉、項目選択 |
| モーダル | `modal/component.json` | ダイアログ表示、背景クローズ |

**使用例**:

```json
{
  "$include": "components/tabs/component.json",
  "defaultTab": "tab1",
  "tabs": [
    { "tag": "button", "text": "タブ1", "attributes": { "data-tab-button": "tab1", "class": "active" } }
  ],
  "panels": [
    { "tag": "div", "text": "内容1", "attributes": { "data-tab-panel": "tab1" } }
  ]
}
```
**状態管理**: setState, getState

**通信**: api, emit

**その他**: alert, console, navigate, validate, submit

### ゼロJavaScriptアーキテクチャ

jsonia-editorプロジェクト自体がその証明:

```text
public/js/
└── jsonia-runtime.js (コアランタイム) and jsonia-runtime-actions.js (アクション実装ライブラリ)
  ↑ コアエンジンとアクション実装が分離され、保守性と拡張性が向上

jsonia-editor/
├── components/editor/behavior.json    # 動作定義（エディタコンポーネント内に移動）
├── extensions.json                     # カスタムアクション
└── data/components.json                # データ定義
```

- プロジェクト固有のJavaScript: **0行**
- すべてのロジック: JSON定義
- 完全な型安全性: JSONスキーマ検証

詳細は `components/README.md` を参照してください。

## 📝 ライセンス

MIT License
