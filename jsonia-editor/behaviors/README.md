# Behaviors

このディレクトリには、エディターの動作定義(behavior definitions)を格納します。

## ファイル構成

### editor.json

メインエディターの動作定義。以下の要素を含みます:

- **state**: エディターの状態管理
  - `selectedElement`: 選択中の要素
  - `selectedTab`: 現在のタブ(structure/styles/behavior/data)
  - `config`: エディター設定
  - `history`: 操作履歴
  - `historyIndex`: 履歴のインデックス
  - `draggedComponent`: ドラッグ中のコンポーネント

- **computed**: 計算プロパティ(現在は未使用)

- **apis**: API定義
  - `loadConfig`: config.jsonを読み込むAPI

- **events**: イベント定義
  - タブクリック → `switchTab`
  - アコーディオンクリック → `toggleAccordion`
  - アクションボタンクリック → `handleAction`
  - ドラッグ&ドロップ → `handleDragStart`, `handleDragEnd`, `handleDragOver`, `handleDrop`

## 使用方法

動作定義は`jsonia-editor-extensions.js`によって読み込まれ、`JsoniaRuntime`エンジンで実行されます:

```javascript
const response = await fetch('/editor/behaviors/editor.json');
const behavior = await response.json();
editorRuntime.init(behavior);
```

## 拡張方法

新しい動作パターンを追加する場合:

1. `behaviors/`に新しいJSONファイルを作成
2. state, events, apisを定義
3. 必要に応じてカスタムアクションを`jsonia-editor-extensions.js`に登録
4. 適切なページから動作定義を読み込む

## アーキテクチャ

```text
editor.json (動作定義)
    ↓
jsonia-editor-extensions.js (カスタムアクション登録)
    ↓
jsonia-runtime.js (実行エンジン)
    ↓
DOM操作 & イベント処理
```
