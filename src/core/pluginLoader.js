// src/core/pluginLoader.js

const PluginLoader = {
    async init() {
        console.log("Initializing Plugin Loader...");
        window.AppRegistry = await this.discoverPlugins();
        console.log("App Registry populated:", window.AppRegistry);
    },

    async discoverPlugins() {
        console.log("Discovering plugins from server...");
        try {
            const response = await fetch('/api/apps');
            if (!response.ok) {
                throw new Error(`Failed to fetch plugin list: ${response.statusText}`);
            }
            const pluginManifestPaths = await response.json();
            console.log("Received manifest paths:", pluginManifestPaths);

            const apps = [];

            for (const path of pluginManifestPaths) {
                try {
                    const manifestResponse = await fetch(path);
                    if (!manifestResponse.ok) {
                        throw new Error(`Failed to fetch manifest at ${path}: ${manifestResponse.statusText}`);
                    }
                    const manifest = await manifestResponse.json();

                    // Store the path to the app's root directory for later use
                    manifest.basePath = path.substring(0, path.lastIndexOf('/'));

                    apps.push(manifest);
                } catch (error) {
                    console.error(`Error loading individual plugin from ${path}:`, error);
                }
            }
             console.log(`${apps.length} plugins discovered and loaded.`);
            return apps;

        } catch (error) {
            console.error("Fatal error during plugin discovery:", error);
            // Return an empty array or handle this more gracefully,
            // e.g., by showing a critical error message to the user.
            return [];
        }
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
