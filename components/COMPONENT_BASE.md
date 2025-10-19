# Component.json - 基底コンポーネント

全てのコンポーネントの基底クラスです。共通の振る舞いとメソッドを定義しています。

## 概要

`component.json`は、Jsoniaフレームワークにおける全てのコンポーネントのベースとなる基底クラスです。DOM操作、イベント処理、ライフサイクル管理などの共通機能を提供します。

## 使用方法

他のコンポーネントから`extends`を使って継承できます:

```json
{
  "extends": "component",
  "name": "my-component",
  "template": {
    "tag": "div",
    "attributes": {
      "class": "my-component"
    }
  }
}
```

## 提供メソッド

### DOM操作メソッド

#### `getAttribute(elementId, attributeName)`
要素から属性値を取得します。

```json
{
  "type": "component.method",
  "method": "getAttribute",
  "params": {
    "elementId": "my-element",
    "attributeName": "data-value"
  },
  "output": "attrValue"
}
```

#### `setAttribute(elementId, attributeName, attributeValue)`
要素に属性値を設定します。

```json
{
  "type": "component.method",
  "method": "setAttribute",
  "params": {
    "elementId": "my-element",
    "attributeName": "data-value",
    "attributeValue": "new-value"
  }
}
```

#### `addClass(elementId, className)`
要素にクラスを追加します。

```json
{
  "type": "component.method",
  "method": "addClass",
  "params": {
    "elementId": "my-element",
    "className": "active"
  }
}
```

#### `removeClass(elementId, className)`
要素からクラスを削除します。

```json
{
  "type": "component.method",
  "method": "removeClass",
  "params": {
    "elementId": "my-element",
    "className": "active"
  }
}
```

#### `toggleClass(elementId, className)`
要素のクラスをトグルします。

```json
{
  "type": "component.method",
  "method": "toggleClass",
  "params": {
    "elementId": "my-element",
    "className": "expanded"
  }
}
```

### 表示制御メソッド

#### `show(elementId)`
要素を表示します（`hidden`クラスを削除）。

```json
{
  "type": "component.method",
  "method": "show",
  "params": {
    "elementId": "my-element"
  }
}
```

#### `hide(elementId)`
要素を非表示にします（`hidden`クラスを追加）。

```json
{
  "type": "component.method",
  "method": "hide",
  "params": {
    "elementId": "my-element"
  }
}
```

### コンテンツ操作メソッド

#### `setText(elementId, text)`
要素のテキストを設定します。

```json
{
  "type": "component.method",
  "method": "setText",
  "params": {
    "elementId": "my-element",
    "text": "新しいテキスト"
  }
}
```

#### `setHTML(elementId, html)`
要素のHTMLを設定します。

```json
{
  "type": "component.method",
  "method": "setHTML",
  "params": {
    "elementId": "my-element",
    "html": "<strong>太字</strong>"
  }
}
```

### イベント処理メソッド

#### `on(elementId, eventType, actionName)`
要素にイベントリスナーを追加します。

```json
{
  "type": "component.method",
  "method": "on",
  "params": {
    "elementId": "my-button",
    "eventType": "click",
    "actionName": "handleClick"
  }
}
```

#### `emit(elementId, eventName, eventData)`
カスタムイベントを発火します。

```json
{
  "type": "component.method",
  "method": "emit",
  "params": {
    "elementId": "my-element",
    "eventName": "customEvent",
    "eventData": { "value": 123 }
  }
}
```

### 検索メソッド

#### `query(selector)`
セレクタで要素を検索します（単一要素）。

```json
{
  "type": "component.method",
  "method": "query",
  "params": {
    "selector": ".my-class"
  },
  "output": "element"
}
```

#### `queryAll(selector)`
セレクタで複数の要素を検索します。

```json
{
  "type": "component.method",
  "method": "queryAll",
  "params": {
    "selector": ".my-class"
  },
  "output": "elements"
}
```

## 提供アクション

### `log`
コンソールにログを出力します。

```json
{
  "type": "function",
  "name": "log",
  "params": {
    "message": "デバッグメッセージ"
  }
}
```

## ライフサイクル

基底コンポーネントは以下のライフサイクルフックを提供します:

- `onCreate`: コンポーネント作成時
- `onMount`: コンポーネントがDOMにマウントされた時
- `onUpdate`: コンポーネントが更新された時
- `onDestroy`: コンポーネントが破棄される時

```json
{
  "extends": "component",
  "behavior": {
    "lifecycle": {
      "onCreate": [
        { "type": "console", "message": "コンポーネント作成" }
      ],
      "onMount": [
        { "type": "console", "message": "マウント完了" }
      ]
    }
  }
}
```

## 継承の例

### シンプルな継承

```json
{
  "extends": "component",
  "name": "button",
  "template": {
    "tag": "button",
    "attributes": {
      "class": "btn btn-primary"
    },
    "text": "クリック"
  },
  "behavior": {
    "events": [
      {
        "type": "click",
        "actions": [
          { "type": "console", "message": "ボタンクリック！" }
        ]
      }
    ]
  }
}
```

### メソッドのオーバーライド

```json
{
  "extends": "component",
  "name": "custom-button",
  "behavior": {
    "methods": {
      "show": {
        "description": "カスタム表示処理",
        "params": ["elementId"],
        "steps": [
          { "type": "console", "message": "カスタム表示: {{elementId}}" },
          { "type": "component.method", "method": "component.addClass", "params": { "elementId": "{{elementId}}", "className": "visible" } }
        ]
      }
    }
  }
}
```

## ベストプラクティス

1. **基底メソッドを活用**: 独自にDOM操作を実装する前に、基底メソッドで実現できないか確認
2. **メソッドの組み合わせ**: 複数の基底メソッドを組み合わせて複雑な処理を実現
3. **命名規則**: メソッドやアクションは明確で一貫した命名を使用
4. **ライフサイクルの活用**: 初期化処理は`onCreate`や`onMount`で実行

## 関連ドキュメント

- [accordion-with-behavior.json](./accordion-with-behavior.json) - アコーディオンコンポーネント
- [button.json](./button.json) - ボタンコンポーネント
- [form.json](./form.json) - フォームコンポーネント
