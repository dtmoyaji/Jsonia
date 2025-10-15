# Editor Project

WYSIWYGエディタ用のJSONテンプレート定義

## ファイル構成
- `main.json` - WYSIWYGエディタのUI定義
- `config.json` - エディタの設定とイベントハンドラ
- 将来の拡張: プラグイン、カスタムコンポーネントなど

## 機能
- ドラッグ&ドロップUI構築
- リアルタイムプレビュー  
- EJSテンプレート出力
- コンポーネントライブラリ

## 使用方法
```
GET /editor
GET /json/editor-project/main
GET /json/editor-project/config
```