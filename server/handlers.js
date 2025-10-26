const path = require('path');
const fs = require('fs');
const JsonToEJS = require('./lib/json-to-ejs');

module.exports = function(app) {
    // エクスポートするハンドラ群を返す
    return {
        registerProjectRoute: function(projectPath, route) {
            const method = route.method.toLowerCase();
            app[method](route.path, (req, res) => {
                this.handleProjectRoute(projectPath, route, req, res);
            });
            console.log(`  🔗 ${route.method} ${route.path}`);
        },

        handleProjectRoute: function(projectPath, route, req, res) {
            try {
                switch (route.handler) {
                    case 'renderPage':
                    case 'renderTemplate':
                        this.handleRenderTemplate(projectPath, route, req, res);
                        break;
                    case 'renderEJS':
                        this.handleRenderTemplate(projectPath, route, req, res);
                        break;
                    case 'listProjects':
                        this.handleListProjects(req, res);
                        break;
                    case 'createProject':
                        this.handleCreateProject(req, res);
                        break;
                    case 'getProject':
                        this.handleGetProject(req, res);
                        break;
                    case 'updateProject':
                        this.handleUpdateProject(req, res);
                        break;
                    case 'deleteProject':
                        this.handleDeleteProject(req, res);
                        break;
                    case 'json':
                        this.handleJsonResponse(projectPath, route, req, res);
                        break;
                    case 'saveProject':
                        this.handleSaveProject(req, res);
                        break;
                    case 'loadComponentLibrary':
                        this.handleLoadComponentLibrary(req, res);
                        break;
                    case 'loadEditorComponents':
                        this.handleLoadEditorComponents(req, res);
                        break;
                    default:
                        res.status(404).json({ error: `Handler not found: ${route.handler}` });
                }
            } catch (error) {
                console.error('Route handler error:', error);
                res.status(500).json({ error: error.message });
            }
        },

        handleRenderTemplate: function(projectPath, route, req, res) {
            try {
                let templatePath = route.template;
                
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
                
                const data = {
                    ...route.data,
                    ...req.query,
                    ...req.params,
                    ...req.body
                };
                
                const processedConfig = this.processTemplateVariables(config, data);
                
                const renderOptions = { basePath: projectPath };
                const html = JsonToEJS.renderPage(processedConfig, renderOptions);
                
                res.send(html);
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },

        handleJsonResponse: function(projectPath, route, req, res) {
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
        },

        handleLoadComponentLibrary: function(req, res) {
            console.log('📡 /editor/api/components APIが呼ばれました');
            try {
                const componentsDir = path.join(__dirname, '..', 'components');

                if (!fs.existsSync(componentsDir)) {
                    return res.status(404).json({ 
                        error: 'Components directory not found',
                        path: componentsDir 
                    });
                }

                // 再帰的に componentsDir を走査して .json ファイルを集める（ただしルートの component.json は除外）
                const found = [];
                function walk(dir) {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    for (const e of entries) {
                        const full = path.join(dir, e.name);
                        if (e.isDirectory()) {
                            walk(full);
                        } else if (e.isFile() && e.name.endsWith('.json')) {
                            // skip root base component.json
                            if (path.resolve(full) === path.resolve(path.join(componentsDir, 'component.json'))) continue;
                            found.push(full);
                        }
                    }
                }
                walk(componentsDir);

                const components = [];
                for (const filePath of found) {
                    try {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const data = JSON.parse(content);

                        // カテゴリは componentsDir からの相対パスの最初のディレクトリ名を使う
                        const rel = path.relative(componentsDir, filePath).replace(/\\/g, '/');
                        const parts = rel.split('/');
                        const category = parts.length > 1 ? parts[0] : path.basename(rel, '.json');

                        components.push({
                            filename: rel,
                            category,
                            ...data
                        });
                    } catch (err) {
                        console.warn(`⚠️  Failed to load component file: ${filePath}`, err.message);
                    }
                }

                console.log(`✅ Loaded ${components.length} component files from /components (recursive)`);

                res.json({
                    success: true,
                    componentsDir,
                    components
                });

            } catch (error) {
                console.error('❌ Error loading component library:', error);
                res.status(500).json({ error: error.message });
            }
        },

        handleLoadEditorComponents: function(req, res) {
            console.log('📡 /editor/api/editor-components APIが呼ばれました');
            try {
                const componentsDir = path.join(__dirname, '..', 'jsonia-editor', 'components');
                
                if (!fs.existsSync(componentsDir)) {
                    return res.status(404).json({ 
                        error: 'Editor components directory not found',
                        path: componentsDir 
                    });
                }
                
                const files = fs.readdirSync(componentsDir)
                    .filter(file => file.endsWith('.json'));
                
                const components = [];
                
                for (const file of files) {
                    try {
                        const filePath = path.join(componentsDir, file);
                        const content = fs.readFileSync(filePath, 'utf8');
                        const data = JSON.parse(content);
                        
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
        },

        handleSaveProject: function(req, res) {
            try {
                const { projectName, content } = req.body;

                if (!projectName || !content) {
                    return res.status(400).json({
                        error: 'projectName and content are required'
                    });
                }

                const projectsDir = path.join(__dirname, '..', 'projects');
                if (!fs.existsSync(projectsDir)) {
                    fs.mkdirSync(projectsDir, { recursive: true });
                }

                const newProjectPath = path.join(projectsDir, projectName);
                if (!fs.existsSync(newProjectPath)) {
                    fs.mkdirSync(newProjectPath, { recursive: true });
                }

                const mainJsonPath = path.join(newProjectPath, 'main.json');
                fs.writeFileSync(mainJsonPath, JSON.stringify(content, null, 2));

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
        },

        handleListProjects: async function(req, res) {
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
        },

        handleCreateProject: async function(req, res) {
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

                fs.mkdirSync(projectPath, { recursive: true });

                const routesData = this.createProjectTemplate(name, template, description);
                fs.writeFileSync(path.join(projectPath, 'routes.json'), JSON.stringify(routesData, null, 2));
                
                await this.createTemplateFiles(projectPath, template);

                res.json({
                    success: true,
                    message: `プロジェクト '${name}' が作成されました`,
                    project: { name, template, description, path: projectPath }
                });
            } catch (error) {
                console.error('プロジェクト作成エラー:', error);
                res.status(500).json({ error: error.message });
            }
        },

        handleGetProject: async function(req, res) {
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
        },

        handleUpdateProject: async function(req, res) {
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

                res.json({ success: true, message: `プロジェクト '${projectName}' が更新されました` });
            } catch (error) {
                console.error('プロジェクト更新エラー:', error);
                res.status(500).json({ error: error.message });
            }
        },

        handleDeleteProject: async function(req, res) {
            try {
                const projectName = req.params.name;
                const projectPath = path.join(__dirname, '..', 'projects', projectName);

                if (!fs.existsSync(projectPath)) {
                    return res.status(404).json({ error: 'プロジェクトが見つかりません' });
                }

                fs.rmSync(projectPath, { recursive: true, force: true });

                res.json({ success: true, message: `プロジェクト '${projectName}' が削除されました` });
            } catch (error) {
                console.error('プロジェクト削除エラー:', error);
                res.status(500).json({ error: error.message });
            }
        },

        createProjectTemplate: function(name, template, description) {
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
                default:
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
        },

        createTemplateFiles: async function(projectPath, template) {
            const templates = {
                empty: {
                    'index.json': {
                        title: 'New Project',
                        body: [
                            { tag: 'h1', text: 'Welcome to your new project!' },
                            { tag: 'p', text: 'Start building something amazing.' }
                        ]
                    }
                },
                blog: {
                    'index.json': { title: 'My Blog', body: [ { tag: 'h1', text: 'Blog Home' }, { tag: 'p', text: 'Latest posts will appear here.' } ] },
                    'post.json': { title: 'Blog Post', body: [ { tag: 'h1', text: '<%= postId %>' }, { tag: 'p', text: 'Post content here.' } ] }
                },
                form: {
                    'form.json': {
                        title: 'Contact Form',
                        body: [
                            { tag: 'h1', text: 'Contact Us' },
                            { tag: 'form', attributes: { action: '/submit', method: 'post' }, children: [
                                { tag: 'input', attributes: { type: 'text', name: 'name', placeholder: 'Name' }},
                                { tag: 'textarea', attributes: { name: 'message', placeholder: 'Message' }},
                                { tag: 'button', attributes: { type: 'submit' }, text: 'Send' }
                              ]
                            }
                        ]
                    }
                },
                landing: {
                    'landing.json': { title: 'Landing Page', body: [ { tag: 'h1', text: 'Welcome!' }, { tag: 'p', text: 'Your awesome landing page content.' } ] }
                }
            };

            const templateFiles = templates[template] || templates.empty;
            
            for (const [filename, content] of Object.entries(templateFiles)) {
                fs.writeFileSync(path.join(projectPath, filename), JSON.stringify(content, null, 2));
            }
        },

        processTemplateVariables: function(config, data) {
            const configStr = JSON.stringify(config);
            const processed = configStr.replace(/<%=\s*(\w+)\s*%>/g, (match, key) => {
                return data[key] !== undefined ? data[key] : match;
            });
            return JSON.parse(processed);
        },

        setupEditorAPIs: function() {
            // placeholder for editor specific APIs
        }
    };
};
