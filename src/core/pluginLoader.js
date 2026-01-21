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

            // The script loading logic is now simplified.
            // The check `!this.loadedScripts.has(jsPath)` is the key.
            if (!this.loadedScripts.has(jsPath)) {
                try {
                    // Using a more robust async/await pattern for script loading
                    await this.loadScriptAsync(jsPath);
                    this.loadedScripts.add(jsPath);
                    console.log(`Script loaded and registered: ${jsPath}`);
                } catch (error) {
                    console.error(`Failed to load script: ${jsPath}`, error);
                    // Re-throw to be caught by the outer catch block
                    throw error;
                }
            }

            return { html: htmlContent, jsPath: jsPath };

        } catch (error) {
            console.error(`Error loading plugin assets for "${appId}":`, error);
            return null;
        }
    },

    loadScriptAsync(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
};

// Assign to the global PesteczkaOS object instead of window
PesteczkaOS.core.PluginLoader = PluginLoader;
