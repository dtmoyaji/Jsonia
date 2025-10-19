# Jsonia Components - 汎用コンポーネントライブラリ

## 概要
このディレクトリには、再利用可能なJSONコンポーネント定義が含まれています。
各コンポーネントは構造(HTML)と振る舞い(Behavior)を含む完全なパッケージです。

## Behavior付きコンポーネント

### 1. tabs-with-behavior.json
**目的**: タブUI(構造 + タブ切り替え動作)

**使い方**:
```json
{
  "$include": "components/tabs-with-behavior.json",
  "defaultTab": "tab1",
  "tabs": [
    {"tag": "button", "text": "タブ1", "attributes": {"data-tab-button": "tab1", "class": "active"}},
    {"tag": "button", "text": "タブ2", "attributes": {"data-tab-button": "tab2"}}
  ],
  "panels": [
    {"tag": "div", "text": "パネル1の内容", "attributes": {"data-tab-panel": "tab1"}},
    {"tag": "div", "text": "パネル2の内容", "attributes": {"data-tab-panel": "tab2", "class": "hidden"}}
  ]
}
```

**含まれる動作**:
- タブクリックで自動切り替え
- アクティブタブのハイライト
- パネルの表示/非表示制御

---

### 2. accordion-with-behavior.json
**目的**: アコーディオンUI(構造 + 開閉動作)

**使い方**:
```json
{
  "$include": "components/accordion-with-behavior.json",
  "sections": [
    {
      "tag": "div",
      "children": [
        {"tag": "div", "text": "セクション1", "attributes": {"data-accordion-header": "true", "data-accordion-id": "s1"}},
        {"tag": "div", "text": "コンテンツ1", "attributes": {"data-accordion-content": "s1"}}
      ]
    }
  ]
}
```

**含まれる動作**:
- ヘッダークリックで開閉
- 複数セクション対応
- 開閉状態の管理

---

### 3. dropdown-with-behavior.json
**目的**: ドロップダウンメニュー(構造 + 選択動作)

**使い方**:
```json
{
  "$include": "components/dropdown-with-behavior.json",
  "label": "選択してください",
  "items": [
    {"tag": "div", "text": "項目1", "attributes": {"data-dropdown-item": "true", "data-value": "item1"}},
    {"tag": "div", "text": "項目2", "attributes": {"data-dropdown-item": "true", "data-value": "item2"}}
  ]
}
```

**含まれる動作**:
- メニューの開閉
- 項目選択時のイベント発行(emit)
- 選択後の自動クローズ

---

### 4. modal-with-behavior.json
**目的**: モーダルダイアログ(構造 + 開閉動作)

**使い方**:
```json
{
  "$include": "components/modal-with-behavior.json",
  "modalId": "myModal",
  "title": "確認",
  "content": [
    {"tag": "p", "text": "本当に実行しますか?"}
  ],
  "actions": [
    {"tag": "button", "text": "OK", "attributes": {"data-modal-close": "true"}},
    {"tag": "button", "text": "キャンセル", "attributes": {"data-modal-close": "true"}}
  ]
}
```

**含まれる動作**:
- open/close API
- 背景クリックでクローズ
- ×ボタンでクローズ

---

## 従来の静的コンポーネント

### button.json
単純なボタンスタイル(動作なし)

### text.json, header.json, footer.json
静的なテキスト/レイアウトコンポーネント

---

## コンポーネント設計パターン

### パターン1: 構造のみ(静的コンポーネント)
```json
{
  "tag": "div",
  "attributes": {...},
  "children": [...]
}
```

### パターン2: 構造 + Behavior(動的コンポーネント)
```json
{
  "tag": "div",
  "attributes": {...},
  "children": [...],
  "behavior": {
    "state": {...},
    "events": [...],
    "apis": {...}
  }
}
```

### パターン3: $include + パラメータ(再利用)
```json
{
  "$include": "components/tabs-with-behavior.json",
  "defaultTab": "tab1",
  "tabs": [...]
}
```

---

## Behaviorの構造

```json
"behavior": {
  "state": {
    "変数名": "初期値"
  },
  "events": [
    {
      "target": "CSSセレクタ",
      "type": "イベント名",
      "actions": [アクション配列]
    }
  ],
  "apis": {
    "メソッド名": {
      "url": "エンドポイント",
      "method": "GET/POST"
    }
  },
  "initialization": [初期化時のアクション配列]
}
```

---

## 利点

1. **完全な再利用性**: 構造と動作が1ファイルに
2. **型安全性**: JSON Schemaで検証可能
3. **視覚的編集可能**: GUI エディタで編集できる
4. **JavaScriptゼロ**: 全てJSON定義
5. **コンポーネント指向**: React/Vue的な設計

---

## JsoniaRuntimeとの統合

JsoniaRuntimeは各コンポーネントの`behavior`プロパティを自動認識し:
1. stateを登録
2. eventsをDOM要素にバインド
3. apisを非同期メソッドとして登録
4. initializationを実行

完全に宣言的なコンポーネントシステムを実現。
