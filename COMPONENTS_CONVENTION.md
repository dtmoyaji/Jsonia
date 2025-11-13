# Jsonia コンポーネント規約 (簡潔版)

## 目的
コンポーネント構造を統一して可読性・保守性を高めるための最小限の規約です。`components/` と `jsonia-editor/components/` の両方に適用します。

## 基本ルール（要点）

- 1コンポーネント = 1フォルダ。
- 各コンポーネントは必ず `component.json` を持つ（必須）。
- `behavior.json` / `style.json` は必要に応じて作成（任意）。

## 推奨ファイル構成（例）

```
components/
  button/
    component.json
    behavior.json   # 任意
    style.json      # 任意
  card/
    component.json
    style.json

jsonia-editor/components/
  sidebar/
    component.json
    behavior.json
    style.json
  tabs/
    component.json
```

## 命名と参照ルール

- フォルダ名は英小文字・ケバブケース推奨（例: `primary-button`）。
- 参照は常にサブフォルダ経由で行う（例: `components/accordion/component.json`）。
- 既存の `components/xxx.json` の直置きは避け、フォルダ化して移行する。

## 基底ファイル（ルート）の扱い

- ルート直下の `components/component.json`、`behavior.json`、`style.json` はプロジェクト共通の基底設定として残すこと。
- これらを空にしたり削除してはいけません。共通テンプレートやユーティリティを定義してください。

## 移行と互換性

- 既存プロジェクトは段階的にフォルダ構成へリファクタすること。重大な破壊的変更を行う場合は手順をドキュメント化してレビューを行ってください。

## 実践的な注意点

- 小さなコンポーネントでも `component.json` は必ず用意する（将来の拡張対応）。
- 大きな共通ロジックは `components/` の基底ファイルに集約する。

## 付録: 最小 `component.json` の例

```json
{
  "name": "primary-button",
  "props": {
    "label": { "type": "string", "default": "Button" }
  },
  "slots": {},
  "template": { "type": "element", "tag": "button" }
}
```

この規約に従うことで拡張性・保守性・可読性が向上します。
