# Jsonia Components 作成規約

## ディレクトリ構成
- コントロール（コンポーネント）1つにつき、1つのフォルダを作成する。
- ルート `components/` および `jsonia-editor/components/` 配下ともに同じ規約を適用する。

## フォルダ内ファイル
- `component.json`（必須）: UI構造・属性・slot定義など、コンポーネント本体の定義。
- `behavior.json`（任意）: イベントやアクション、状態管理などの振る舞い定義。
- `style.json`（任意）: CSS-in-JS形式でのスタイル定義。

## 例
```
components/
  button/
    component.json
    behavior.json   # 省略可
    style.json      # 省略可
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

## 命名・パス規則
- 各includeや参照は `components/xxx/component.json` のように、必ずサブフォルダ＋ファイル名で指定する。
- サブフォルダ名はコントロール名（英小文字・ケバブケース推奨）とする。
- `component.json` 以外は必要な場合のみ作成。

## 注意事項
- 旧来の `components/xxx.json` 直置きは禁止。
- ルート/サブディレクトリ問わず、全てこの構成に統一する。
- 既存プロジェクトも順次この規約にリファクタすること。

## 基底ファイルの扱い（2025-10-26追記）
- `components/component.json`・`behavior.json`・`style.json` は「全てのコンポーネントの基底」として必ず残すこと。
    - これらはスタブ化・空ファイル化してはならない。
    - 共通のテンプレート・メソッド・スタイルを定義し、各コンポーネントはこれを継承・参照する。
- 各コンポーネントは必ず自身のフォルダ内に `component.json` を持つこと。
- ルート直下の基底ファイルを削除・無効化したり、内容を消す行為は禁止。

---
この規約に従うことで、拡張性・保守性・可読性が向上します。
