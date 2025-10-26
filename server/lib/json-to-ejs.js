// ファサード: 分割した実装を委譲して互換性を維持する
// 既存のファイル名とフォルダ名が同じため、明示的に index.js を指定して循環参照を避ける
module.exports = require('./json-to-ejs/index.js');