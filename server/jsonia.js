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

app.set('view engine', 'ejs');

// 分割済みモジュールを読み込む
const RouteInterpreter = require('./lib/routeInterpreter');
const createHandlers = require('./handlers');

const handlers = createHandlers(app);

// エントリロジック（既存の startServer ロジックを引き継ぐ）
function startServer() {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0].startsWith('projects/')) {
        const projectPath = args[0];
        const projectName = path.basename(projectPath);
        const fullProjectPath = path.join(__dirname, '..', projectPath);

        console.log(`🎯 プロジェクト指定モード: ${projectName}`);
        console.log(`📁 パス: ${fullProjectPath}`);

        if (!fs.existsSync(fullProjectPath)) {
            console.error(`❌ プロジェクトが見つかりません: ${fullProjectPath}`);
            process.exit(1);
        }

        const routesPath = path.join(fullProjectPath, 'routes.json');
        if (!fs.existsSync(routesPath)) {
            console.error(`❌ routes.json が見つかりません: ${routesPath}`);
            process.exit(1);
        }

        // 指定プロジェクトのみを読み込み
        loadSingleProject(projectName, fullProjectPath);
    } else {
        console.log(`🎨 jsonia-editor モードで起動`);
        const editorPath = path.join(__dirname, '../jsonia-editor');

        if (!fs.existsSync(editorPath)) {
            console.error(`❌ jsonia-editor フォルダが見つかりません: ${editorPath}`);
            console.log(`📝 通常のプロジェクトモードで起動します`);
        } else {
            loadEditorProject(editorPath);
        }
    }
}

function loadSingleProject(projectName, projectPath) {
    try {
        const routesPath = path.join(projectPath, 'routes.json');
        const routesData = fs.readFileSync(routesPath, 'utf8');
        const routesConfig = JSON.parse(routesData);

        console.log(`📋 プロジェクト: ${routesConfig.project || projectName}`);
        console.log(`📝 説明: ${routesConfig.description || '説明なし'}`);

        for (const route of routesConfig.routes) {
            handlers.registerProjectRoute(projectPath, route);
        }

        console.log(`✅ ${routesConfig.routes.length} 個のルートを登録しました`);

        app.get('/api/project-info', (req, res) => {
            res.json({
                projectName,
                projectPath,
                routes: routesConfig.routes.map(r => ({
                    method: r.method,
                    path: r.path,
                    handler: r.handler
                }))
            });
        });

        app.get('/', (req, res) => {
            const mainRoute = routesConfig.routes.find(r => r.method === 'GET');
            if (mainRoute) {
                res.redirect(mainRoute.path);
            } else {
                res.json({
                    project: projectName,
                    description: routesConfig.description,
                    availableRoutes: routesConfig.routes.map(r => `${r.method} ${r.path}`),
                    message: 'プロジェクトが正常に起動しました。利用可能なルートをご確認ください。'
                });
            }
        });

    } catch (error) {
        console.error(`❌ プロジェクト読み込みエラー:`, error.message);
        process.exit(1);
    }
}

function loadEditorProject(editorPath) {
    try {
        const routesPath = path.join(editorPath, 'routes.json');
        const routesData = fs.readFileSync(routesPath, 'utf8');
        const routesConfig = JSON.parse(routesData);

        console.log(`🎨 jsonia-editor を読み込みました`);
        console.log(`📝 説明: ${routesConfig.description || 'WYSIWYGエディタ'}`);

        for (const route of routesConfig.routes) {
            handlers.registerProjectRoute(editorPath, route);
        }

        handlers.setupEditorAPIs();

        app.get('/', (req, res) => {
            res.redirect('/editor');
        });

        console.log(`✅ ${routesConfig.routes.length} 個のエディタールートを登録しました`);

    } catch (error) {
        console.error(`❌ jsonia-editor読み込みエラー:`, error.message);
    }
}

// テンプレート変数処理は handlers に委譲している

// メイン実行部分
if (require.main === module) {
    startServer();
}

app.listen(PORT, () => {
    console.log(`\n🚀 Jsonia Server 起動完了！`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📝 WYSIWYG Editor: http://localhost:${PORT}/editor`);
    console.log(`📊 Projects API: http://localhost:${PORT}/projects`);
    console.log(`📋 Example: http://localhost:${PORT}/example`);
    console.log(`✅ 準備完了！\n`);
});