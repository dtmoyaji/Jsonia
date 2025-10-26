const path = require('path');
const fs = require('fs');
const JsonToEJS = require('./json-to-ejs');

// RouteInterpreter クラスを分離
class RouteInterpreter {
    constructor(app, projectsPath) {
        this.app = app;
        this.projectsPath = projectsPath;
        this.loadedProjects = new Map();
    }

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

    registerRoute(projectName, route) {
        const method = route.method.toLowerCase();
        const routePath = route.path;
        
        this.app[method](routePath, (req, res) => {
            this.handleRoute(projectName, route, req, res);
        });
    }

    async handleRoute(projectName, route, req, res) {
        try {
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
                
                default:
                    res.status(501).json({ error: `Handler not implemented: ${route.handler}` });
            }
        } catch (error) {
            console.error(`Route error [${route.method} ${route.path}]:`, error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }

    prepareRouteData(data, req) {
        let dataStr = JSON.stringify(data);
        
        Object.keys(req.params || {}).forEach(key => {
            const regex = new RegExp(`{{params\\.${key}}}`, 'g');
            dataStr = dataStr.replace(regex, req.params[key]);
        });
        
        Object.keys(req.query || {}).forEach(key => {
            const regex = new RegExp(`{{query\\.${key}}}`, 'g');
            dataStr = dataStr.replace(regex, req.query[key]);
        });
        
        dataStr = dataStr.replace(/{{now}}/g, new Date().toISOString());
        
        return JSON.parse(dataStr);
    }

    async handleRenderPage(projectName, route, data, res) {
        const templatePath = this.resolveTemplatePath(projectName, route.template);
        const templateConfig = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        const html = JsonToEJS.renderPage(templateConfig);
        res.send(html);
    }

    async handleRenderEJS(projectName, route, data, res) {
        const templatePath = this.resolveTemplatePath(projectName, route.template);
        const templateConfig = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        
        const ejsTemplate = JsonToEJS.renderPage(templateConfig);
        const ejs = require('ejs');
        const renderedHtml = ejs.render(ejsTemplate, data);
        
        res.send(renderedHtml);
    }

    handleJson(route, data, res) {
        if (route.template) {
            const templatePath = this.resolveTemplatePath('shared', route.template);
            const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
            res.json(templateData);
        } else {
            res.json(data);
        }
    }

    async handleProcessForm(projectName, route, req, res) {
        res.json({ 
            success: true, 
            message: 'Form processed successfully',
            data: req.body 
        });
    }

    resolveTemplatePath(projectName, templateName) {
        if (templateName.startsWith('../')) {
            return path.join(this.projectsPath, templateName);
        } else {
            return path.join(this.projectsPath, projectName, templateName);
        }
    }

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

module.exports = RouteInterpreter;
