

コンポーネント別：細分化タスクリスト（検証・改善用）

作成日: 2025-11-14
更新者: 自動修正エージェント

目的: 各コンポーネントの「責務・設計パターンの妥当性・アクセシビリティ・テスト・ドキュメント・リファクタ候補」を最小単位で検証し、改善するための実行可能なチェックリストを作成する。

使い方:
- 各項目を順に実施し、完了したらその単位をチェックしてコミットする。
- 実装中に仕様変更や重要な発見があれば、該当項目の下に追加メモを残す。

---

## 共通チェック（すべての UI コンポーネントに適用）

- [ ] 責務定義: このコンポーネントが提供すべき機能を 1-2 行で明確化する。
- [ ] 設計パターン検証: "構造のみ" / "構造+Behavior" / "$include ベース" のどれが適切か決定し理由を記載する。
- [ ] API 面: 外部に公開する属性、data- 属性、イベントを列挙し API ドキュメントを追加する。
- [ ] アクセシビリティ: 必要な `role`, `aria-*`, キーボード操作一覧を作成し実装する。
- [ ] ユニットテスト: 主要ロジック（render, state changes, event handlers）を Jest で 1-3 件追加する。
- [ ] E2E シナリオ: ユーザーが行う主要操作（例: ドロップ → 選択 → 削除）を Puppeteer で 1 シナリオ用意する（CI では別ジョブ）。
- [ ] ドキュメント: `components/<name>/README.md` または `components/README.md` に使用例と注意点を追記。
- [ ] ベンチマーク/パフォーマンス: 必要なら DOM ノード数や再レンダリングコストを簡易計測し改善案を記載。

---

## 個別コンポーネントタスク（粒度: 作業1単位 = 1ファイル修正 or 1テスト追加）

以下は優先度順（上が高）で、各項目は最小の作業単位で分割しています。

<!-- `canvas` タスクは実装済みのためリストから削除しました -->

### 2) `sidebar` / `structure-tree`
- [ ] 責務: 構造ツリーの描画、選択連動、折りたたみ制御。
- [ ] パターン: `構造+Behavior`（ツリー構築は runtime の `dom.buildTree` を利用）。
- [ ] アクセシビリティ: ツリーに `role="tree"` / `role="treeitem"` の適用と keyboard navigation (ArrowUp/Down, Home/End, Enter) の追加。
- [ ] テスト: ツリークリックで canvas が選択されることのユニットテスト。
- [ ] UX: 大きなツリー向けに折りたたみ状態を保存する（localStorage）を検討。

### 3) `properties-panel`（プロパティパネル）
- [ ] 責務: 選択中コンポーネントのプロパティ表示・編集。
- [ ] API: `createPropertiesRenderer` の仕様と戻り値を厳密に定義。
- [ ] アクセシビリティ: フォーム要素にラベル紐付けと `aria-live` 更新を行う。
- [ ] テスト: プロパティの更新が DOM に反映され、`pushHistory` が呼ばれることをテスト。

### 4) `components/*`（個別パーツ: button, card, dropdown, tabs, accordion, modal, form, text, media, project-card 等）
共通最小タスク（各コンポーネントごとに繰り返す）:
- [ ] 責務定義を1文で記述（例: `button` は「クリック操作を発行するラベル付きボタン」）。
- [ ] アクセシビリティ: `button` は `<button>` を使う／`dropdown` は `aria-haspopup` 等を追加。
- [ ] キーボード: `tabs` は Arrowキーで切替。`accordion` は Enter/Space で開閉。
- [ ] ユニットテスト: レンダリング、イベント発火、state 変化を 1-2 件追加。
- [ ] ドキュメント: 使用例と注意点（スロット/children の取り扱い）を記載。
- [ ] リファクタ: 重複する DOM ビルドロジックや style を共通化できるか検討（例: `component.renderList` の拡張）。

コンポーネント別重点項目:
- `accordion`: 開閉アニメーションの非同期性テスト、開閉状態の障害対応。
- `tabs`: パネル初期化遅延（lazy loading）対応の検討。
- `dropdown`: フォーカス管理と外部クリックで閉じるテスト。
- `modal`: フォーカストラップ、スクリーンリーダ用のラベルと説明のチェック。

### 5) `editor` 内部 UI（behavior-panel, properties-panel, canvas-toolbar 等）
- [ ] 各パネルの初期化順序が race-condition を起こさないか検証。
- [ ] `registerComponentActions` / `registerComponentMethods` の重複登録や名前衝突を検出するテストを追加。

<!-- Tests & CI: 実施済み。ユニット/統合テストを追加し CI ワークフローを作成しました -->

<!-- Docs & README: 実施済み。components/README.md と jsonia-editor/README.md を更新しました -->

<!-- Accessibility audit: 実施済み。scripts/axe-audit.js を追加しました -->


### 9) リファクタリング候補（進行中）
- [ ] `createComponent` と runtime のテンプレート生成が重複している箇所を整理（進行中）。
- [ ] CSS 変数の統合（既に一部導入済み）を進め、テーマ対応を楽にする。

---

## 実施手順（推奨ワークフロー）

1. 優先度の高い `canvas` / `sidebar` / `properties-panel` をまず 1 サイクルで完了させる。
2. 各コンポーネントに対して「共通チェック」を適用し、issues を切る。
3. ユニットテストを追加して CI を通す。E2E は別ジョブで徐々に有効化。

---

更新履歴:
- 2025-11-14: 初期作成（自動修正エージェント）

