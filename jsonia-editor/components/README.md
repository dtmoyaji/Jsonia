# Jsonia Editor Components

このディレクトリには、Jsonia WYSIWYG エディタの再利用可能なコンポーネントが含まれています。

## コンポーネント一覧

### 1. header.json

エディタのヘッダー部分

- タイトル表示
- アクションボタン (プロジェクト、プレビュー、JSON 出力、保存)

### 2. tabs.json

エディタのタブバー

- 構造タブ
- スタイルタブ
- 動作タブ
- データタブ

### 3. sidebar.json

左サイドバー (アコーディオン形式)

- 構造ツリーセクション
- コンポーネントリストセクション

### 4. canvas.json

メインキャンバスエリア

- ツールバー (元に戻す/やり直し)
- ドロップゾーン

### 5. behavior-panel.json

動作エディタパネル

- 動作エディタコンテナ

### 6. properties-panel.json

プロパティパネル

- 選択要素のプロパティ編集エリア

### 7. footer.json

フッター

- ステータス表示
- バージョン情報

## 使用方法

main.json で`$include`ディレクティブを使用してコンポーネントを読み込みます:

```json
{
  "body": [
    {
      "tag": "div",
      "children": [
        { "$include": "components/header/component.json" },
        { "$include": "components/tabs/component.json" },
        { "$include": "components/sidebar/component.json" }
      ]
    }
  ]
}
```

## 利点

- **保守性**: 各コンポーネントを個別に編集可能
- **再利用性**: 他のプロジェクトでも使用可能
- **可読性**: main.json がシンプルで理解しやすい
- **テスト性**: 各コンポーネントを単独でテスト可能

## カスタマイズ

各コンポーネントファイルを編集することで、エディタの UI をカスタマイズできます。
変更は即座に反映されます（サーバー再起動不要）。
