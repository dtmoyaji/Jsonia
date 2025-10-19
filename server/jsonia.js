const express = require('express');
const path = require('path');
const fs = require('fs');
const JsonToEJS = require('./lib/json-to-ejs');

// CORSが利用可能な場合のみ使用
let cors;
try {
    cors = require('cors');
} catch (e) {
    cors = null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// ルーティングインタプリタクラス
class RouteInterpreter {
    constructor(app, projectsPath) {
        this.app = app;
        this.projectsPath = projectsPath;
        this.loadedProjects = new Map();
    }

    // 全プロジェクトのルートを読み込み
    loadAllProjectRoutes() {
        try {
            const projects = fs.readdirSync(this.projectsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && dirent.name !== 'shared')
                .map(dirent => dirent.name);

            for (const project of projects) {
                this.loadProjectRoutes(project);
            }

            console.log(`✅ ${this.loadedProjects.size} projects loaded successfully`);
        } catch (error) {
            console.error('❌ Error loading project routes:', error.message);
        }
    }

    // 個別プロジェクトのルートを読み込み
    loadProjectRoutes(projectName) {
        try {
            const routesPath = path.join(this.projectsPath, projectName, 'routes.json');
            
            if (!fs.existsSync(routesPath)) {
                console.warn(`⚠️  No routes.json found for project: ${projectName}`);
                return;
            }

            const routesData = fs.readFileSync(routesPath, 'utf8');
            const routesConfig = JSON.parse(routesData);

            // ルートを動的に登録
            for (const route of routesConfig.routes) {
                this.registerRoute(projectName, route);
            }

            this.loadedProjects.set(projectName, routesConfig);
            console.log(`📁 Project loaded: ${projectName} (${routesConfig.routes.length} routes)`);

        } catch (error) {
            console.error(`❌ Error loading routes for ${projectName}:`, error.message);
        }
    }

    // 個別ルートを登録
    registerRoute(projectName, route) {
        const method = route.method.toLowerCase();
        const routePath = route.path;
        
        this.app[method](routePath, (req, res) => {
            this.handleRoute(projectName, route, req, res);
        });
    }

    // ルートハンドラの実行
    async handleRoute(projectName, route, req, res) {
        try {
            // データの準備（パラメータ置換）
            let data = this.prepareRouteData(route.data || {}, req);
            
            switch (route.handler) {
                case 'renderPage':
                    await this.handleRenderPage(projectName, route, data, res);
                    break;
                    
                case 'renderEJS':
                    await this.handleRenderEJS(projectName, route, data, res);
                    break;
                    
                case 'json':
                    this.handleJson(route, data, res);
                    break;
                    
                case 'processForm':
                    await this.handleProcessForm(projectName, route, req, res);
                    break;
                    
                case 'saveProject':
                    await handleSaveProject(req, res);
                    break;
                    
                case 'listProjects':
                    await handleListProjects(req, res);
                    break;
                    
                case 'createProject':
                    await handleCreateProject(req, res);
                    break;
                    
                case 'getProject':
                    await handleGetProject(req, res);
                    break;
                    
                case 'updateProject':
                    await handleUpdateProject(req, res);
                    break;
                    
                case 'deleteProject':
                    await handleDeleteProject(req, res);
                    break;
                    
                default:
                    res.status(501).json({ error: `Handler not implemented: ${route.handler}` });
            }
        } catch (error) {
            console.error(`Route error [${route.method} ${route.path}]:`, error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    // データ準備（パラメータ・クエリ置換）
    prepareRouteData(data, req) {
        let dataStr = JSON.stringify(data);
        
        // URL パラメータ置換
        Object.keys(req.params || {}).forEach(key => {
            const regex = new RegExp(`{{params\\.${key}}}`, 'g');
            dataStr = dataStr.replace(regex, req.params[key]);
        });
        
        // クエリパラメータ置換
        Object.keys(req.query || {}).forEach(key => {
            const regex = new RegExp(`{{query\\.${key}}}`, 'g');
            dataStr = dataStr.replace(regex, req.query[key]);
        });
        
        // 特殊変数置換
        dataStr = dataStr.replace(/{{now}}/g, new Date().toISOString());
        
        return JSON.parse(dataStr);
    }

    // HTMLページレンダリング
    async handleRenderPage(projectName, route, data, res) {
        const templatePath = this.resolveTemplatePath(projectName, route.template);
        const templateConfig = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        const html = JsonToEJS.renderPage(templateConfig);
        res.send(html);
    }

    // EJSレンダリング
    async handleRenderEJS(projectName, route, data, res) {
        const templatePath = this.resolveTemplatePath(projectName, route.template);
        const templateConfig = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        const ejsTemplate = JsonToEJS.renderPage(templateConfig);
        
        // EJSを実際のHTMLにレンダリング
        const ejs = require('ejs');
        const renderedHtml = ejs.render(ejsTemplate, data);
        
        res.send(renderedHtml);
    }

    // JSONレスポンス
    handleJson(route, data, res) {
        if (route.template) {
            // テンプレートからJSONを読み込み
            const templatePath = this.resolveTemplatePath('shared', route.template);
            const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
            res.json(templateData);
        } else {
            res.json(data);
        }
    }

    // フォーム処理
    async handleProcessForm(projectName, route, req, res) {
        // バリデーション実装は省略
        res.json({ 
            success: true, 
            message: 'Form processed successfully',
            data: req.body 
        });
    }

    // プロジェクト保存
    async handleSaveProject(projectName, route, req, res) {
        // プロジェクト保存実装は省略
        res.json({ 
            success: true, 
            message: 'Project saved successfully' 
        });
    }

    // テンプレートパス解決
    resolveTemplatePath(projectName, templateName) {
        if (templateName.startsWith('../')) {
            // 共有テンプレートの場合
            return path.join(this.projectsPath, templateName);
        } else {
            // プロジェクト内テンプレートの場合
            return path.join(this.projectsPath, projectName, templateName);
        }
    }

    // プロジェクト情報取得
    getProjectsInfo() {
        const projects = Array.from(this.loadedProjects.entries()).map(([name, config]) => ({
            name,
            description: config.description,
            routes: config.routes.length,
            endpoints: config.routes.map(r => `${r.method} ${r.path}`)
        }));

        return {
            totalProjects: projects.length,
            projects,
            sharedComponents: '/projects/shared'
        };
    }
}

// ミドルウェア
if (cors) app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイル配信 (public, jsonia-editorフォルダ)
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/editor', express.static(path.join(__dirname, '../jsonia-editor')));

app.set('view engine', 'ejs');

// ルーティングインタプリタは使用しない（コマンドライン引数で制御）
// const projectsPath = path.join(__dirname, '../projects');
// const routeInterpreter = new RouteInterpreter(app, projectsPath);

// 注意: 古い静的APIエンドポイント（削除済み）
// ルーティングインタプリタシステムでは、すべてのAPIはprojects内のroutes.jsonで定義

// 注意: 旧版のWYSIWYGエディター（削除済み）
// 新しいシステムでは jsonia-editor/routes.json で定義されたルートを使用

// 注意: 古い静的エンドポイント群（削除済み）
// - /preview, /ejs-demo, /ejs-template/:project/:file, /json/:project/:file, /example
// ルーティングインタプリタシステムでは、これらはすべてprojects内のroutes.jsonで定義される

// 注意: 旧バージョンのAPI（削除済み）

// コマンドライン引数処理とサーバー起動
function startServer() {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0].startsWith('projects/')) {
        // 指定プロジェクトモード
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
        // jsonia-editorモード（デフォルト）
        console.log(`🎨 jsonia-editor モードで起動`);
        const editorPath = path.join(__dirname, '../jsonia-editor');
        
        if (!fs.existsSync(editorPath)) {
            console.error(`❌ jsonia-editor フォルダが見つかりません: ${editorPath}`);
            console.log(`📝 通常のプロジェクトモードで起動します`);
            // 通常モードで継続
        } else {
            loadEditorProject(editorPath);
        }
    }
}

// 単一プロジェクト読み込み
function loadSingleProject(projectName, projectPath) {
    try {
        const routesPath = path.join(projectPath, 'routes.json');
        const routesData = fs.readFileSync(routesPath, 'utf8');
        const routesConfig = JSON.parse(routesData);
        
        console.log(`📋 プロジェクト: ${routesConfig.project || projectName}`);
        console.log(`📝 説明: ${routesConfig.description || '説明なし'}`);
        
        // 単一プロジェクト用ルート登録
        for (const route of routesConfig.routes) {
            registerProjectRoute(projectPath, route);
        }
        
        console.log(`✅ ${routesConfig.routes.length} 個のルートを登録しました`);
        
        // プロジェクト情報API
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
        
        // デフォルトルート: プロジェクト情報を表示
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

// jsonia-editor読み込み
function loadEditorProject(editorPath) {
    try {
        const routesPath = path.join(editorPath, 'routes.json');
        const routesData = fs.readFileSync(routesPath, 'utf8');
        const routesConfig = JSON.parse(routesData);
        
        console.log(`🎨 jsonia-editor を読み込みました`);
        console.log(`📝 説明: ${routesConfig.description || 'WYSIWYGエディタ'}`);
        
        // エディタールート登録
        for (const route of routesConfig.routes) {
            registerProjectRoute(editorPath, route);
        }
        
        // エディター用追加API
        setupEditorAPIs();
        
        // デフォルトルート: / → /editor にリダイレクト
        app.get('/', (req, res) => {
            res.redirect('/editor');
        });
        
        console.log(`✅ ${routesConfig.routes.length} 個のエディタールートを登録しました`);
        
    } catch (error) {
        console.error(`❌ jsonia-editor読み込みエラー:`, error.message);
    }
}

// プロジェクトルート登録
function registerProjectRoute(projectPath, route) {
    const method = route.method.toLowerCase();
    
    app[method](route.path, (req, res) => {
        handleProjectRoute(projectPath, route, req, res);
    });
    
    console.log(`  🔗 ${route.method} ${route.path}`);
}

// プロジェクトルートハンドラ
function handleProjectRoute(projectPath, route, req, res) {
    try {
        switch (route.handler) {
            case 'renderPage':
            case 'renderTemplate':
                handleRenderTemplate(projectPath, route, req, res);
                break;
            case 'renderEJS':
                // support both renderEJS and renderTemplate style handlers
                handleRenderTemplate(projectPath, route, req, res);
                break;
            case 'listProjects':
                handleListProjects(req, res);
                break;
            case 'createProject':
                handleCreateProject(req, res);
                break;
            case 'getProject':
                handleGetProject(req, res);
                break;
            case 'updateProject':
                handleUpdateProject(req, res);
                break;
            case 'deleteProject':
                handleDeleteProject(req, res);
                break;
            case 'json':
                handleJsonResponse(projectPath, route, req, res);
                break;
            case 'saveProject':
                handleSaveProject(req, res);
                break;
            case 'loadComponentLibrary':
                handleLoadComponentLibrary(req, res);
                break;
            case 'loadEditorComponents':
                handleLoadEditorComponents(req, res);
                break;
            default:
                res.status(404).json({ error: `Handler not found: ${route.handler}` });
        }
    } catch (error) {
        console.error('Route handler error:', error);
        res.status(500).json({ error: error.message });
    }
}

// テンプレートレンダリング
function handleRenderTemplate(projectPath, route, req, res) {
    try {
        let templatePath = route.template;
        
        // パラメーター置換
        if (templatePath.includes('{{')) {
            templatePath = templatePath.replace(/\{\{params\.(\w+)\}\}/g, (match, param) => {
                return req.params[param] || match;
            });
        }
        
        const fullTemplatePath = path.join(projectPath, templatePath);
        
        if (!fs.existsSync(fullTemplatePath)) {
            return res.status(404).json({
                error: `Template not found: ${templatePath}`,
                path: fullTemplatePath
            });
        }
        
        const templateContent = fs.readFileSync(fullTemplatePath, 'utf8');
        const config = JSON.parse(templateContent);
        
        // データマージ
        const data = {
            ...route.data,
            ...req.query,
            ...req.params,
            ...req.body
        };
        
        // EJSテンプレート変数処理
        const processedConfig = processTemplateVariables(config, data);
        
        // basePath を渡して $include をサポート
        const renderOptions = {
            basePath: projectPath
        };
        const html = JsonToEJS.renderPage(processedConfig, renderOptions);
        
        res.send(html);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// JSON レスポンス処理
function handleJsonResponse(projectPath, route, req, res) {
    try {
        const templatePath = path.join(projectPath, route.template);
        
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: `JSON file not found: ${route.template}` });
        }
        
        const content = fs.readFileSync(templatePath, 'utf8');
        const data = JSON.parse(content);
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// コンポーネントライブラリ読み込み処理
function handleLoadComponentLibrary(req, res) {
    console.log('📡 /editor/api/components APIが呼ばれました');
    try {
        const componentsDir = path.join(__dirname, '..', 'components');
        
        if (!fs.existsSync(componentsDir)) {
            return res.status(404).json({ 
                error: 'Components directory not found',
                path: componentsDir 
            });
        }
        
        // componentsフォルダ内のすべてのJSONファイルを読み込む
        // component.jsonは基底クラスなので除外
        const files = fs.readdirSync(componentsDir)
            .filter(file => file.endsWith('.json') && file !== 'component.json');
        
        const components = [];
        
        for (const file of files) {
            try {
                const filePath = path.join(componentsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                // カテゴリ情報を追加
                components.push({
                    filename: file,
                    category: file.replace('.json', ''),
                    ...data
                });
                
            } catch (err) {
                console.warn(`⚠️  Failed to load component file: ${file}`, err.message);
            }
        }
        
        console.log(`✅ Loaded ${components.length} component files from /components`);
        
        res.json({
            success: true,
            componentsDir,
            components
        });
        
    } catch (error) {
        console.error('❌ Error loading component library:', error);
        res.status(500).json({ error: error.message });
    }
}

// エディターコンポーネント読み込み処理
function handleLoadEditorComponents(req, res) {
    console.log('📡 /editor/api/editor-components APIが呼ばれました');
    try {
        const componentsDir = path.join(__dirname, '..', 'jsonia-editor', 'components');
        
        if (!fs.existsSync(componentsDir)) {
            return res.status(404).json({ 
                error: 'Editor components directory not found',
                path: componentsDir 
            });
        }
        
        // jsonia-editor/componentsフォルダ内のすべてのJSONファイルを読み込む
        const files = fs.readdirSync(componentsDir)
            .filter(file => file.endsWith('.json'));
        
        const components = [];
        
        for (const file of files) {
            try {
                const filePath = path.join(componentsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                
                // コンポーネント名を追加
                components.push({
                    filename: file,
                    name: file.replace('.json', ''),
                    ...data
                });
                
            } catch (err) {
                console.warn(`⚠️  Failed to load editor component file: ${file}`, err.message);
            }
        }
        
        console.log(`✅ Loaded ${components.length} editor component files from /jsonia-editor/components`);
        
        res.json({
            success: true,
            componentsDir,
            components
        });
        
    } catch (error) {
        console.error('❌ Error loading editor components:', error);
        res.status(500).json({ error: error.message });
    }
}

// プロジェクト保存処理
function handleSaveProject(req, res) {
    try {
        const { projectName, content } = req.body;
        
        if (!projectName || !content) {
            return res.status(400).json({
                error: 'projectName and content are required'
            });
        }
        
        const projectsDir = path.join(__dirname, '../projects');
        if (!fs.existsSync(projectsDir)) {
            fs.mkdirSync(projectsDir, { recursive: true });
        }
        
        const newProjectPath = path.join(projectsDir, projectName);
        if (!fs.existsSync(newProjectPath)) {
            fs.mkdirSync(newProjectPath, { recursive: true });
        }
        
        // main.json保存
        const mainJsonPath = path.join(newProjectPath, 'main.json');
        fs.writeFileSync(mainJsonPath, JSON.stringify(content, null, 2));
        
        // routes.json作成
        const routesJson = {
            project: projectName,
            description: `Generated project: ${projectName}`,
            routes: [
                {
                    method: "GET",
                    path: `/${projectName}`,
                    handler: "renderTemplate",
                    template: "main.json",
                    data: { title: projectName }
                }
            ]
        };
        
        const routesPath = path.join(newProjectPath, 'routes.json');
        fs.writeFileSync(routesPath, JSON.stringify(routesJson, null, 2));
        
        res.json({
            success: true,
            message: `Project '${projectName}' saved successfully`,
            path: newProjectPath
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

    // プロジェクト一覧取得
    async function handleListProjects(req, res) {
        try {
            const projectsDir = path.join(__dirname, '..', 'projects');
            if (!fs.existsSync(projectsDir)) {
                return res.json([]);
            }

            const projects = [];
            const dirs = fs.readdirSync(projectsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory() && dirent.name !== 'shared');

            for (const dir of dirs) {
                const projectPath = path.join(projectsDir, dir.name);
                const routesPath = path.join(projectPath, 'routes.json');
                
                if (fs.existsSync(routesPath)) {
                    const routesData = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
                    const stats = fs.statSync(projectPath);
                    
                    projects.push({
                        name: dir.name,
                        description: routesData.description || '',
                        template: routesData.template || 'empty',
                        created: stats.birthtime,
                        modified: stats.mtime,
                        routes: routesData.routes ? routesData.routes.length : 0
                    });
                }
            }

            res.json(projects.sort((a, b) => b.modified - a.modified));
        } catch (error) {
            console.error('プロジェクト一覧取得エラー:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // プロジェクト作成
    async function handleCreateProject(req, res) {
        try {
            const { name, template = 'empty', description = '' } = req.body;
            
            if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
                return res.status(400).json({ 
                    error: 'プロジェクト名は英数字、ハイフン、アンダースコアのみ使用可能です' 
                });
            }

            const projectPath = path.join(__dirname, '..', 'projects', name);
            
            if (fs.existsSync(projectPath)) {
                return res.status(409).json({ 
                    error: 'そのプロジェクト名は既に存在します' 
                });
            }

            // プロジェクトディレクトリ作成
            fs.mkdirSync(projectPath, { recursive: true });

            // テンプレートに基づくroutes.json作成
            const routesData = createProjectTemplate(name, template, description);
            fs.writeFileSync(path.join(projectPath, 'routes.json'), JSON.stringify(routesData, null, 2));
            
            // テンプレートに応じた初期ファイル作成
            await createTemplateFiles(projectPath, template);

            res.json({
                success: true,
                message: `プロジェクト '${name}' が作成されました`,
                project: {
                    name,
                    template,
                    description,
                    path: projectPath
                }
            });
        } catch (error) {
            console.error('プロジェクト作成エラー:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // プロジェクト取得
    async function handleGetProject(req, res) {
        try {
            const projectName = req.params.name;
            const projectPath = path.join(__dirname, '..', 'projects', projectName);
            const routesPath = path.join(projectPath, 'routes.json');

            if (!fs.existsSync(routesPath)) {
                return res.status(404).json({ error: 'プロジェクトが見つかりません' });
            }

            const routesData = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
            const stats = fs.statSync(projectPath);

            res.json({
                name: projectName,
                ...routesData,
                created: stats.birthtime,
                modified: stats.mtime
            });
        } catch (error) {
            console.error('プロジェクト取得エラー:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // プロジェクト更新
    async function handleUpdateProject(req, res) {
        try {
            const projectName = req.params.name;
            const { routes, description } = req.body;
            const projectPath = path.join(__dirname, '..', 'projects', projectName);
            const routesPath = path.join(projectPath, 'routes.json');

            if (!fs.existsSync(routesPath)) {
                return res.status(404).json({ error: 'プロジェクトが見つかりません' });
            }

            const currentData = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
            const updatedData = {
                ...currentData,
                routes,
                description,
                modified: new Date().toISOString()
            };

            fs.writeFileSync(routesPath, JSON.stringify(updatedData, null, 2));

            res.json({
                success: true,
                message: `プロジェクト '${projectName}' が更新されました`
            });
        } catch (error) {
            console.error('プロジェクト更新エラー:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // プロジェクト削除
    async function handleDeleteProject(req, res) {
        try {
            const projectName = req.params.name;
            const projectPath = path.join(__dirname, '..', 'projects', projectName);

            if (!fs.existsSync(projectPath)) {
                return res.status(404).json({ error: 'プロジェクトが見つかりません' });
            }

            // プロジェクトフォルダを削除
            fs.rmSync(projectPath, { recursive: true, force: true });

            res.json({
                success: true,
                message: `プロジェクト '${projectName}' が削除されました`
            });
        } catch (error) {
            console.error('プロジェクト削除エラー:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // プロジェクトテンプレート作成
    function createProjectTemplate(name, template, description) {
        const baseTemplate = {
            project: name,
            description: description,
            template: template,
            created: new Date().toISOString(),
            routes: []
        };

        switch (template) {
            case 'blog':
                baseTemplate.routes = [
                    {
                        method: 'GET',
                        path: '/',
                        handler: 'renderPage',
                        template: 'index.json'
                    },
                    {
                        method: 'GET',
                        path: '/post/:id',
                        handler: 'renderPage',
                        template: 'post.json',
                        data: { postId: '{{params.id}}' }
                    }
                ];
                break;
            case 'form':
                baseTemplate.routes = [
                    {
                        method: 'GET',
                        path: '/',
                        handler: 'renderPage',
                        template: 'form.json'
                    },
                    {
                        method: 'POST',
                        path: '/submit',
                        handler: 'processForm',
                        template: 'success.json'
                    }
                ];
                break;
            case 'landing':
                baseTemplate.routes = [
                    {
                        method: 'GET',
                        path: '/',
                        handler: 'renderPage',
                        template: 'landing.json'
                    }
                ];
                break;
            default: // empty
                baseTemplate.routes = [
                    {
                        method: 'GET',
                        path: '/',
                        handler: 'renderPage',
                        template: 'index.json'
                    }
                ];
        }

        return baseTemplate;
    }

    // テンプレートファイル作成
    async function createTemplateFiles(projectPath, template) {
        const templates = {
            empty: {
                'index.json': {
                    title: 'New Project',
                    body: [
                        {
                            tag: 'h1',
                            text: 'Welcome to your new project!'
                        },
                        {
                            tag: 'p',
                            text: 'Start building something amazing.'
                        }
                    ]
                }
            },
            blog: {
                'index.json': {
                    title: 'My Blog',
                    body: [
                        { tag: 'h1', text: 'Blog Home' },
                        { tag: 'p', text: 'Latest posts will appear here.' }
                    ]
                },
                'post.json': {
                    title: 'Blog Post',
                    body: [
                        { tag: 'h1', text: '<%= postId %>' },
                        { tag: 'p', text: 'Post content here.' }
                    ]
                }
            },
            form: {
                'form.json': {
                    title: 'Contact Form',
                    body: [
                        { tag: 'h1', text: 'Contact Us' },
                        { tag: 'form', attributes: { action: '/submit', method: 'post' },
                          children: [
                            { tag: 'input', attributes: { type: 'text', name: 'name', placeholder: 'Name' }},
                            { tag: 'textarea', attributes: { name: 'message', placeholder: 'Message' }},
                            { tag: 'button', attributes: { type: 'submit' }, text: 'Send' }
                          ]
                        }
                    ]
                }
            },
            landing: {
                'landing.json': {
                    title: 'Landing Page',
                    body: [
                        { tag: 'h1', text: 'Welcome!' },
                        { tag: 'p', text: 'Your awesome landing page content.' }
                    ]
                }
            }
        };

        const templateFiles = templates[template] || templates.empty;
        
        for (const [filename, content] of Object.entries(templateFiles)) {
            fs.writeFileSync(
                path.join(projectPath, filename), 
                JSON.stringify(content, null, 2)
            );
        }
    }

// テンプレート変数処理
function processTemplateVariables(config, data) {
    const configStr = JSON.stringify(config);
    const processed = configStr.replace(/<%=\s*(\w+)\s*%>/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
    return JSON.parse(processed);
}

// 注意: エディター用API（削除済み）
// 新しいシステムでは、これらはjsonia-editor/routes.jsonで定義される
function setupEditorAPIs() {
    // 必要に応じてjsonia-editorプロジェクト専用のカスタムハンドラをここに追加
}

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