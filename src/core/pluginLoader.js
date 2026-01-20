// src/core/pluginLoader.js

const PluginLoader = {
    // Keep track of loaded scripts to avoid re-injecting them
    loadedScripts: new Set(),

    async init() {
        console.log("Initializing Plugin Loader...");
        // Use the global state object instead of window
        PesteczkaOS.state.AppRegistry = await this.discoverPlugins();
        console.log("App Registry populated:", PesteczkaOS.state.AppRegistry);
    },

    async discoverPlugins() {
        const pluginManifestPaths = [
            'src/apps/settings/manifest.json',
            'src/apps/offers/manifest.json',
            'src/apps/dashboard/manifest.json',
            'src/apps/snake/manifest.json',
            'src/apps/domator/manifest.json'
        ];
        const apps = [];
        for (const path of pluginManifestPaths) {
            try {
                const response = await fetch(path);
                if (!response.ok) throw new Error(`Failed to fetch manifest at ${path}: ${response.statusText}`);
                const manifest = await response.json();
                manifest.basePath = path.substring(0, path.lastIndexOf('/'));
                apps.push(manifest);
            } catch (error) {
                console.error(`Error loading plugin from ${path}:`, error);
            }
        }
        return apps;
    },

    async loadPlugin(appId) {
        const app = PesteczkaOS.state.AppRegistry.find(a => a.id === appId);
        if (!app) {
            console.error(`App with ID "${appId}" not found in registry.`);
            return null;
        }

        try {
            // Load HTML content
            const htmlPath = `${app.basePath}/${app.entrypoints.html}`;
            const htmlResponse = await fetch(htmlPath);
            if (!htmlResponse.ok) throw new Error(`Failed to fetch HTML from ${htmlPath}`);
            const htmlContent = await htmlResponse.text();

            // Load JS content
            const jsPath = `${app.basePath}/${app.entrypoints.js}`;

            // If script has not been loaded before, load it
            if (!this.loadedScripts.has(jsPath)) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = jsPath;
                    script.onload = () => {
                        this.loadedScripts.add(jsPath);
                        console.log(`Script loaded and registered: ${jsPath}`);
                        resolve();
                    };
                    script.onerror = () => reject(new Error(`Failed to load script: ${jsPath}`));
                    document.head.appendChild(script);
                });
            }

            return { html: htmlContent, jsPath: jsPath };

        } catch (error) {
            console.error(`Error loading plugin assets for "${appId}":`, error);
            return null;
        }
    }
};

// Assign to the global PesteczkaOS object instead of window
PesteczkaOS.core.PluginLoader = PluginLoader;
