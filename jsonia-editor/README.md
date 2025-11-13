# Editor Project

WYSIWYG エディタ用の JSON テンプレート定義

## ファイル構成

- `main.json` - WYSIWYG エディタの UI 定義
- `config.json` - エディタの設定とイベントハンドラ
- 将来の拡張: プラグイン、カスタムコンポーネントなど

## 機能

- ドラッグ&ドロップ UI 構築
- リアルタイムプレビュー
- EJS テンプレート出力
- コンポーネントライブラリ

## 使用方法

```
GET /editor
GET /json/editor-project/main
GET /json/editor-project/config
```

## Public API (簡易リファレンス)

エディタ内部で提供する公開 API をまとめた簡易リファレンスです。外部ビューやプラグインからエディタ機能を再利用する際に参照してください。

- `JsoniaEditor.createElementFromTemplate(template)` — テンプレートから DOM 要素を生成して返す。
- `JsoniaEditor.createInteractions({ canvas, props, onSelect })` — キャンバスのドラッグ/リサイズ/選択/履歴を管理するユーティリティを作成する。
  - 返り値に以下のユーティリティが含まれます（代表例）:
    - `createPreview()` — ghost プレビュー管理オブジェクト（`show`, `move`, `hide`, `destroy`）
    - `createPlaceholderController()` — プレースホルダとハイライトを制御するコントローラ（`showAt(y)`, `clear()`, `highlight(el)`, `clearHighlight()`）
- `JsoniaEditor.createPropertiesRenderer(container)` — 指定コンテナにプロパティ UI を描画する `renderProperties(el)` を返す。
- `JsoniaEditor.saveProject(payload)` — 保存 API へデータを送るラッパー。
- `JsoniaEditor.loadComponents()` — コンポーネント一覧を取得するヘルパー。
- `JsoniaEditor.createEditorEvents({ canvas, paletteSelector, onDrop })` — パレットとキャンバスの drag/drop を共通化するハンドラを登録する。

Extension points and recommendations:

- `JsoniaEditor.createInteractions({ canvas, props, onSelect })`: returns helpers such as `attachDraggable`, `createPreview`, `createPlaceholderController`, `selectElement`, `pushHistory`, `undo`, `redo`.
- `JsoniaEditor.createPropertiesRenderer(propsContainer)`: returns a `renderProperties(el)` function to render and edit basic properties in the provided container.
- Prefer using `JsoniaEditor.createElementFromTemplate(template)` to create elements from component templates.
- When implementing `updateStructureTree`, prefer calling runtime-provided `updateStructureTree` behavior (if present) to avoid duplicate implementations; canvas.js already delegates when available.

Example: 既存の `canvas.js` から `createInteractions` のプレースホルダ API を利用する例:

```js
const interactions = JsoniaEditor.createInteractions({ canvas, props, onSelect });
const preview = interactions.createPreview();
const ph = interactions.createPlaceholderController();

// during dragover
ph.showAt(y);

// to highlight a candidate
ph.highlight(candidateEl);

// on drop
ph.clear();
```

簡単な利用例や設計方針はリポジトリの `jsonia-editor/README.md`（このファイル）を参照ください。
