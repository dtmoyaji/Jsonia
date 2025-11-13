````markdown
# Behaviors (移行済みドキュメント)

注: 以前は `jsonia-editor/behaviors/editor.json` にエディタの動作定義を置いていましたが、現在はエディタ自体がコンポーネントとして再編され、主要な動作定義は `jsonia-editor/components/editor/behavior.json` に移動しています。

このファイルは元の `jsonia-editor/behaviors/README.md` の内容を保持するために移設したものです。

## 現在の構成

- エディタのメイン動作定義: `jsonia-editor/components/editor/behavior.json`
- その他の補助的な behavior 定義（必要に応じて）: `jsonia-editor/behaviors/` は廃止予定

## 使用方法（エディタ初期化の例）

エディタの初期化は現在次のように行います:

```javascript
const response = await fetch('/editor/components/editor/behavior.json');
const behavior = await response.json();
editorRuntime.init(behavior);
```

## 拡張方法

新しい動作パターンを追加する場合:

1. 必要なら `components/<your-component>/behavior.json` に定義を作成
2. state, events, apis を定義
3. 必要に応じてカスタムアクションを `jsonia-editor-extensions.js` に登録
4. 適切な場所から新しい動作定義を読み込む

## 注意

このファイルは移設済みのドキュメントです。将来的には `behaviors/` ディレクトリ自体を削除してリポジトリをクリーンにする予定です。
````
