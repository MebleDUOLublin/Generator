// src/core/pluginLoader.js

const PluginLoader = {
    async init() {
        console.log("Initializing Plugin Loader...");
        window.AppRegistry = await this.discoverPlugins();
        console.log("App Registry populated:", window.AppRegistry);
    },

    async discoverPlugins() {
        // In a real Node.js/Electron app, we'd use the 'fs' module here.
        // For this browser-based version, we'll simulate discovery by
        // fetching a manifest list. In a future step, this could be
        // a `manifest-list.json` file. For now, we hardcode the known plugins.

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
                if (!response.ok) {
                    throw new Error(`Failed to fetch manifest at ${path}: ${response.statusText}`);
                }
                const manifest = await response.json();

                // Store the path to the app's root directory for later use
                manifest.basePath = path.substring(0, path.lastIndexOf('/'));

                apps.push(manifest);
            } catch (error) {
                console.error(`Error loading plugin from ${path}:`, error);
                // In DEV_MODE, we could show a toast notification here.
            }
        }

        return apps;
    },

    async loadPlugin(appId) {
        const app = window.AppRegistry.find(a => a.id === appId);
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

            // Load and execute JS
            const jsPath = `${app.basePath}/${app.entrypoints.js}`;

            // Check if the script is already loaded
            if (document.querySelector(`script[src="${jsPath}"]`)) {
                return { html: htmlContent, jsPath: jsPath };
            }

            // --- FIX for Race Condition ---
            // Wrap script loading in a promise to ensure it's loaded and parsed
            // before we try to use any functions from it (like the app's init()).
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = jsPath;
                script.type = 'text/javascript'; // Using module could create scope issues, stick to simple script
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${jsPath}`));
                document.head.appendChild(script);
            });
            // --- END FIX ---

            return { html: htmlContent, jsPath: jsPath };

        } catch (error) {
            console.error(`Error loading plugin assets for "${appId}":`, error);
            return null;
        }
    }
};

window.PluginLoader = PluginLoader;
