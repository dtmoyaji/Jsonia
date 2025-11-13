const express = require('express');
const path = require('path');
const fs = require('fs');

// CORSが利用可能な場合のみ使用
let cors;
try {
  cors = require('cors');
} catch (e) {
  cors = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// 安全上の定数
const MAX_ROUTES_FILE_SIZE = 5 * 1024 * 1024; // 5MB: routes.json の最大許容サイズ
const MAX_ROUTES_COUNT = 2000; // 極端に多いルートは弾く

// ミドルウェア
if (cors) app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイル配信 (public, jsonia-editorフォルダ)
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/editor', express.static(path.join(__dirname, '../jsonia-editor')));
// Serve project components under /editor/components so editor can fetch component assets
app.use('/editor/components', express.static(path.join(__dirname, '../components')));

// EJS-rendered editor canvas (also available as static /editor/canvas.html)
app.get('/editor/canvas', (req, res) => {
  res.render('canvas', { title: 'Jsonia - Editor Canvas' });
});

app.set('view engine', 'ejs');
// Allow rendering editor pages using EJS templates located in jsonia-editor
app.set('views', path.join(__dirname, '../jsonia-editor'));

// 分割済みモジュールを読み込む
// RouteInterpreter is not currently used here — keep module available if needed later
// const RouteInterpreter = require('./lib/routeInterpreter');
const createHandlers = require('./handlers');

const handlers = createHandlers(app);

// エントリロジック（既存の startServer ロジックを引き継ぐ）
function startServer() {
  const args = process.argv.slice(2);
  // 引数がある場合はプロジェクト指定モードへ入る。
  if (args.length > 0) {
    // Allow either 'projects/<name>' or just '<name>' as convenience.
    let projectArg = args[0];
    // Basic sanity: disallow null bytes and obvious traversal patterns
    if (typeof projectArg !== 'string' || projectArg.indexOf('\u0000') !== -1) {
      console.error('❌ 無効なプロジェクト引数が指定されました');
      process.exit(1);
    }
    if (!projectArg.startsWith('projects/')) {
      projectArg = path.join('projects', projectArg);
    }

    const projectName = path.basename(projectArg);
    // 名前は英数字とハイフン・アンダースコアのみ許可（過度に寛容にするとパス攻撃の恐れ）
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      console.error(`❌ 無効なプロジェクト名: ${projectName}`);
      process.exit(1);
    }

    const fullProjectPath = path.resolve(path.join(__dirname, '..', projectArg));
    const allowedRoot = path.resolve(path.join(__dirname, '..', 'projects'));

    console.log(`🎯 プロジェクト指定モード: ${projectName}`);
    console.log(`📁 指定パス (resolved): ${fullProjectPath}`);

    // Prevent path traversal: ensure fullProjectPath is inside allowedRoot
    const rel = path.relative(allowedRoot, fullProjectPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      console.error(
        `❌ 不正なプロジェクトパスが指定されました (path traversal の疑い): ${fullProjectPath}`
      );
      process.exit(1);
    }

    if (!fs.existsSync(fullProjectPath) || !fs.statSync(fullProjectPath).isDirectory()) {
      console.error(`❌ プロジェクトが見つかりません: ${fullProjectPath}`);
      process.exit(1);
    }

    const routesPath = path.join(fullProjectPath, 'routes.json');
    if (!fs.existsSync(routesPath)) {
      console.error(`❌ routes.json が見つかりません: ${routesPath}`);
      process.exit(1);
    }

    // サイズチェック: 非常に大きな routes.json は読み込みを拒否
    try {
      const st = fs.statSync(routesPath);
      if (st.size > MAX_ROUTES_FILE_SIZE) {
        console.error(
          `❌ routes.json が大きすぎます (${st.size} bytes)。上限: ${MAX_ROUTES_FILE_SIZE} bytes`
        );
        process.exit(1);
      }
    } catch (stErr) {
      console.error('❌ routes.json のサイズ確認に失敗しました:', stErr && stErr.message);
      process.exit(1);
    }

    // 指定プロジェクトのみを読み込み
    loadSingleProject(projectName, fullProjectPath);
    // サーバ起動
    startListening();
    return;
  } else {
    console.log(`🎨 jsonia-editor モードで起動`);
    const editorPath = path.join(__dirname, '../jsonia-editor');

    if (!fs.existsSync(editorPath)) {
      console.error(`❌ jsonia-editor フォルダが見つかりません: ${editorPath}`);
      console.log(`📝 通常のプロジェクトモードで起動します`);
    } else {
      loadEditorProject(editorPath);
      // サーバ起動
      startListening();
    }
  }
}

function loadSingleProject(projectName, projectPath) {
  try {
    const routesPath = path.join(projectPath, 'routes.json');
    const routesData = fs.readFileSync(routesPath, 'utf8');
    let routesConfig;
    try {
      routesConfig = JSON.parse(routesData);
    } catch (jsonErr) {
      console.error(`❌ routes.json の解析に失敗しました: ${routesPath}`, jsonErr.message);
      process.exit(1);
    }

    console.log(`📋 プロジェクト: ${routesConfig.project || projectName}`);
    console.log(`📝 説明: ${routesConfig.description || '説明なし'}`);

    if (!Array.isArray(routesConfig.routes)) {
      console.error(`❌ routes.json の routes フィールドが配列ではありません: ${routesPath}`);
      process.exit(1);
    }

    if (routesConfig.routes.length > MAX_ROUTES_COUNT) {
      console.error(
        `❌ routes.json のルート数が多すぎます: ${routesConfig.routes.length} 個 (上限: ${MAX_ROUTES_COUNT})`
      );
      console.error('💡 必要であればプロジェクトを分割してください');
      // メモリ状況をログに出す
      console.error('🧠 現在のメモリ使用状況:', process.memoryUsage());
      process.exit(1);
    }

    let registered = 0;
    for (const route of routesConfig.routes) {
      // Basic validation for route shape
      if (!route || typeof route !== 'object' || !route.method || !route.path) {
        console.warn(`⚠️ 無効なルート定義をスキップします: ${JSON.stringify(route)}`);
        continue;
      }
      // method と path を厳格に検査
      if (typeof route.method !== 'string' || typeof route.path !== 'string') {
        console.warn(
          `⚠️ ルートの method/path が文字列ではありません。スキップ: ${JSON.stringify(route)}`
        );
        continue;
      }
      try {
        handlers.registerProjectRoute(projectPath, route);
        registered++;
      } catch (regErr) {
        console.error(`❌ ルート登録中にエラー: ${route.path}`, regErr && regErr.message);
        // continue with remaining routes
      }
    }

    console.log(`✅ ${registered} 個のルートを登録しました`);

    app.get('/api/project-info', (req, res) => {
      res.json({
        projectName,
        projectPath,
        routes: routesConfig.routes.map((r) => ({
          method: r.method,
          path: r.path,
          handler: r.handler,
        })),
      });
    });

    app.get('/', (req, res) => {
      const mainRoute = routesConfig.routes.find((r) => r.method === 'GET');
      if (mainRoute) {
        res.redirect(mainRoute.path);
      } else {
        res.json({
          project: projectName,
          description: routesConfig.description,
          availableRoutes: routesConfig.routes.map((r) => `${r.method} ${r.path}`),
          message: 'プロジェクトが正常に起動しました。利用可能なルートをご確認ください。',
        });
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`❌ プロジェクト読み込みエラー:`, error.message);
    }
    process.exit(1);
  }
}

function loadEditorProject(editorPath) {
  try {
    const routesPath = path.join(editorPath, 'routes.json');
    const routesData = fs.readFileSync(routesPath, 'utf8');
    let routesConfig;
    try {
      routesConfig = JSON.parse(routesData);
    } catch (jsonErr) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`❌ editor/routes.json の解析に失敗しました: ${routesPath}`, jsonErr.message);
      }
      return;
    }

    console.log(`🎨 jsonia-editor を読み込みました`);
    console.log(`📝 説明: ${routesConfig.description || 'WYSIWYGエディタ'}`);

    if (!Array.isArray(routesConfig.routes)) {
      console.warn(`⚠️ editor routes.json の routes が配列ではありません: ${routesPath}`);
      return;
    }

    if (routesConfig.routes.length > MAX_ROUTES_COUNT) {
      console.warn(
        `⚠️ editor routes.json のルート数が多すぎます: ${routesConfig.routes.length} 個 (上限: ${MAX_ROUTES_COUNT})`
      );
      console.warn('エディタ用の routes.json を軽量化してください');
      return;
    }

    let registered = 0;
    for (const route of routesConfig.routes) {
      if (!route || typeof route !== 'object' || !route.method || !route.path) {
        console.warn(`⚠️ 無効なエディタールートをスキップ: ${JSON.stringify(route)}`);
        continue;
      }
      try {
        handlers.registerProjectRoute(editorPath, route);
        registered++;
      } catch (err) {
        console.error('❌ エディタールート登録エラー:', err && err.message);
      }
    }

    handlers.setupEditorAPIs();

    app.get('/', (req, res) => {
      res.redirect('/editor');
    });

    console.log(`✅ ${registered} 個のエディタールートを登録しました`);
  } catch (error) {
    console.error(`❌ jsonia-editor読み込みエラー:`, error.message);
  }
}

// テンプレート変数処理は handlers に委譲している

// メイン実行部分
if (require.main === module) {
  startServer();
}

function startListening() {
  app.listen(PORT, () => {
    console.log(`\n🚀 Jsonia Server 起動完了！`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📝 WYSIWYG Editor: http://localhost:${PORT}/editor`);
    console.log(`📊 Projects API: http://localhost:${PORT}/projects`);
    console.log(`📋 Example: http://localhost:${PORT}/example`);
    console.log(`✅ 準備完了！\n`);
  });
}

// Export functions for testing and external control
try {
  module.exports = module.exports || {};
  module.exports.startServer = startServer;
  module.exports.loadSingleProject = loadSingleProject;
  module.exports.loadEditorProject = loadEditorProject;
} catch (e) {
  // ignore in environments where module.exports is not writable
}
