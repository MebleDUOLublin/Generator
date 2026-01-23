// src/core/pluginLoader.js

const PluginLoader = {
    async init() {
        console.log("Initializing Plugin Loader...");
        window.AppRegistry = await this.discoverPlugins();
        console.log("App Registry populated:", window.AppRegistry);
    },

    async discoverPlugins() {
        console.log('Discovering plugins from API...');
        try {
            const response = await fetch('/api/apps');
            if (!response.ok) {
                throw new Error(`Failed to fetch app list: ${response.statusText}`);
            }
            const pluginManifestPaths = await response.json();
            console.log('Found manifests:', pluginManifestPaths);

            const apps = [];
            for (const path of pluginManifestPaths) {
                try {
                    const manifestResponse = await fetch(path);
                    if (!manifestResponse.ok) {
                        throw new Error(`Failed to fetch manifest at ${path}`);
                    }
                    const manifest = await manifestResponse.json();
                    manifest.basePath = path.substring(0, path.lastIndexOf('/'));
                    apps.push(manifest);
                } catch (error) {
                    console.error(`Error loading individual plugin from ${path}:`, error);
                }
            }
            return apps;
        } catch (error) {
            console.error('Failed to discover plugins:', error);
            // Fallback to a hardcoded list or show a critical error
            UI.Feedback.show(
                'Błąd Krytyczny',
                'Nie można załadować listy aplikacji z serwera. Upewnij się, że serwer (`run.py`) jest uruchomiony.',
                'error'
            );
            return []; // Return empty array on failure
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
                script.type = 'text/javascript';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load script: ${jsPath}`));
                document.head.appendChild(script);
            });
            // --- END FIX ---

            // Construct the conventional app object name (e.g., "settings" -> "SettingsApp")
            const appObjectName = `${appId.charAt(0).toUpperCase() + appId.slice(1)}App`;
            const appObject = window[appObjectName];

            if (!appObject) {
                console.warn(`Plugin ${appObjectName} loaded, but the main object was not found on the window.`);
            }

            return { html: htmlContent, appObject: appObject };

        } catch (error) {
            console.error(`Error loading plugin assets for "${appId}":`, error);
            return null;
        }
    }
};

window.PluginLoader = PluginLoader;
