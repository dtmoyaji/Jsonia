# 🚀 Jsonia ルーティングインタプリタ - クイックスタート

## 1分でスタート！

### 1. 基本起動
```bash
cd c:\misc\scripts\Jsonia
npm start
```

### 2. プロジェクトにアクセス
- **プロジェクト一覧**: http://localhost:3000/projects
- **ブログプロジェクト**: http://localhost:3000/blog
- **エディタープロジェクト**: http://localhost:3000/editor
- **フォームプロジェクト**: http://localhost:3000/form
- **サンプルプロジェクト**: http://localhost:3000/sample

## ✨ システム特徴

### � プロジェクトベース構造
各プロジェクトが独立したルーティング定義を持ちます：

```
projects/
├── blog-project/
│   ├── routes.json      # ブログのルート定義
│   └── main.json        # ブログテンプレート
├── editor-project/
│   ├── routes.json      # エディターのルート定義  
│   └── main.json        # エディターテンプレート
└── form-project/
    ├── routes.json      # フォームのルート定義
    └── main.json        # フォームテンプレート
```

### 🎯 JSON定義ルーティング
routes.jsonでルートを定義：
```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/blog",
      "handler": "renderTemplate",
      "template": "main.json",
      "data": {
        "title": "ブログページ"
      }
    }
  ]
}
```

### ⚡ EJSインタプリタ
JSON→EJS変換の自動実行：
```javascript
// JSONテンプレート
{
  "tag": "h1", 
  "text": "<%= title %>"
}

// 生成されるEJS
<h1><%= title %></h1>
```

## � 利用可能なプロジェクト

### ブログプロジェクト (/blog)
- メインページ、記事一覧、記事詳細の3ルート

### エディタープロジェクト (/editor) 
- エディター、プレビュー、保存、API の4ルート

### フォームプロジェクト (/form)
- フォーム表示、送信処理、完了画面の3ルート  

### サンプルプロジェクト (/sample)
- サンプル表示、データ処理、テスト、APIの4ルート

## 🎯 主な利点

- ✅ **JSON定義**: ルーティングをJSONで簡単定義
- ✅ **プロジェクト分離**: 独立したプロジェクト管理
- ✅ **EJSインタプリタ**: JSON→EJS自動変換
- ✅ **動的ロード**: 新プロジェクトの自動認識
- ✅ **API統合**: プロジェクト情報のREST API
- ✅ **スケーラブル**: プロジェクト単位での拡張

## 🚀 新しいプロジェクトを作る

### 1. プロジェクトフォルダ作成
```bash
mkdir projects/my-project
```

### 2. routes.json定義
```json
{
  "routes": [
    {
      "method": "GET",
      "path": "/my-project",
      "handler": "renderTemplate", 
      "template": "main.json",
      "data": {
        "title": "My Project"
      }
    }
  ]
}
```

### 3. テンプレートファイル作成 (main.json)
```json
{
  "tag": "div",
  "children": [
    {
      "tag": "h1",
      "text": "<%= title %>"
    }
  ]
}
```

### 4. サーバー再起動
```bash
npm start
```

**Happy Coding with Jsonia Routing Interpreter! �**