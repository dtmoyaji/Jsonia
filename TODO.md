# TODO: 開発優先タスク (このシステム向け)

以下はこのリポジトリ（Jsonia）を実運用／開発しやすくするための、優先度付き開発タスクです。まずは「高」→「中」→「低」の順で着手してください。

## 高優先 (必須)

- (高) ルーティング／プロジェクト読み込みの堅牢化
  - 目的: `server/jsonia.js` のプロジェクト分離ロジックを堅牢化（未存在プロジェクト・パス改竄対策）。
  - 具体作業:
    - 引数検証の追加、エラーハンドリング強化
    - 大きなプロジェクトをロードしたときのメモリ使用量観察と改善

- (高) ドキュメント・メタデータ整備
  - 目的: `package.json` の `author` / `repository` / `bugs` を埋め、`LICENSE` を追加。
  - コマンド例:
    - `git add LICENSE package.json && git commit -m "chore: add LICENSE and package metadata"`

## 中優先 (推奨)

- (中) CI と自動テスト導入
  - 目的: GitHub Actions で `npm ci`, `npm test`, `npm run build` を実行するワークフローを追加。
  - まずは `ci.yml` を追加して PR ごとにチェックが回るようにする。

- (中) テスト／品質ツールの導入
  - 目的: `jest` (または `mocha`), `eslint`, `prettier` を導入し、コード品質を保つ。
  - 推奨手順:
    1. `npm install -D jest eslint prettier`
    2. `package.json` に `scripts`: `test`, `lint`, `format`

- (中) エディタ機能と UI/UX 改善（jsonia-editor）
  - 目的: WYSIWYG エディタの保存／復元、差分表示、Undo/Redo を改善。
  - 具体作業: editor の state 管理を見直し、保存時の JSON 検証を追加。

- (中) コンポーネントライブラリの整備
  - 目的: `components/` 下のコンポーネントをモジュール化し、テスト可能にする。
  - 具体作業: 各 `component.json` にスキーマと最小のサンプルを追加。

## 低優先 (任意だが望ましい)

- (低) 依存関係・セキュリティ管理
  - 目的: `npm audit` と Dependabot/renovate を導入し、脆弱性通知を自動化。

- (低) JSON スキーマと型定義
  - 目的: AJV などで JSON スキーマ検証を導入し、エディタの補完を改善。

- (低) リリースワークフロー
  - 目的: `CHANGELOG.md` を用意し、semantic-release の導入を検討。

## 推奨実行フロー（短期）

1. ローカルで依存を入れる

```pwsh
npm install
```

2. ブランチ作成 → 最初はドキュメント/CI と依存整備

```pwsh
git checkout -b chore/init-ci-and-metadata
# 変更を行う
git add .
git commit -m "chore: add LICENSE, package metadata and CI scaffold"
git push --set-upstream origin chore/init-ci-and-metadata
```

3. PR を作って CI を通し、ランタイムのユニットテスト→エディタ改善→コンポーネント整備 の順で進める。

---

作成日: 2025-11-13

メモ: 優先度はプロジェクトの公開・チーム構成により調整してください。まずは「コアランタイムの安定化」と「CI/テスト導入」を同時並行で進めると早期に品質が向上します。

---

推奨の初動ワークフロー（例）:

1. ローカル準備

```pwsh
npm install
git checkout -b chore/docs-and-ci
```

2. 基本改善（LICENSE・package metadata）

```pwsh
# 例: LICENSE 追加・package.json 更新
git add LICENSE package.json
git commit -m "chore: add LICENSE and package metadata"
```

3. CI と品質ツールを追加 → PR を作成してレビュー

```pwsh
git push --set-upstream origin chore/docs-and-ci
# then open PR on GitHub
```

作成日: 2025-11-13

メモ: 優先度は公開／配布やチーム運用の有無で調整してください。まずは `LICENSE`・`package.json` の整備と CI の導入を推奨します。
