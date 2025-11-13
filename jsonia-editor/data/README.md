# Data

このディレクトリには、エディターで使用するデータ定義(JSON 形式)を格納します。

## ファイル構成

### components.json

エディターで使用可能なコンポーネントの定義。

**構造:**

```json
{
  "components": [
    {
      "icon": "📦",
      "name": "Container",
      "tag": "div",
      "type": "container",
      "description": "コンテナ要素",
      "defaultText": "デフォルトテキスト (オプション)",
      "defaultAttributes": {
        "type": "button"
      }
    }
  ],
  "iconMap": {
    "div": "📦",
    "p": "📝",
    "default": "◼️"
  }
}
```

**フィールド説明:**

- **components**: コンポーネント定義の配列

  - `icon`: コンポーネントアイコン(絵文字)
  - `name`: 表示名
  - `tag`: HTML タグ名
  - `type`: コンポーネントタイプ(container, heading, button, etc.)
  - `description`: 説明文
  - `defaultText`: デフォルトテキスト(オプション)
  - `defaultAttributes`: デフォルト属性(オプション)

- **iconMap**: タグ名とアイコンのマッピング
  - 構造ツリーで使用
  - `default`: デフォルトアイコン

## 使用方法

データは`jsonia-editor-plugin.js`によって読み込まれます:

```javascript
const response = await fetch('/editor/data/components.json');
const data = await response.json();
this.components = data.components;
this.iconMap = data.iconMap;
```

## 拡張方法

新しいコンポーネントを追加する場合:

1. `components.json`の`components`配列に新しい定義を追加
2. 必要に応じて`iconMap`に新しいタグのアイコンを追加
3. ブラウザをリロード(コンパイル不要)

**例:**

```json
{
  "icon": "🎬",
  "name": "Video",
  "tag": "video",
  "type": "media",
  "description": "動画プレイヤー",
  "defaultAttributes": {
    "controls": "true"
  }
}
```

## アーキテクチャ

```text
components.json (データ定義)
    ↓
jsonia-editor-plugin.js (プラグインが読み込み)
    ↓
renderComponents() (UIにレンダリング)
    ↓
コンポーネントリスト表示
```

## メリット

- ✅ **JSON 形式**: コンパイル不要、即座に変更反映
- ✅ **データとロジックの分離**: データは JSON、処理は JavaScript
- ✅ **拡張性**: 新しいコンポーネントを簡単に追加可能
- ✅ **保守性**: 定義が一箇所に集約
