// src/core/globals.js
// src/core/globals.js

/**
 * Defines the global namespace `PesteczkaOS` which will hold all
 * core modules and application state to avoid polluting the window object.
 */
window.PesteczkaOS = {
    // Core modules like Storage, UI, PluginLoader will be attached here.
    core: {},

    // Global reactive state for the application.
    state: {
        currentProfile: null,
        draggedWindow: null,
        dragOffset: { x: 0, y: 0 },
        pastedImageData: null,
        zIndexCounter: 1000,
        AppRegistry: [], // Holds the manifests of all discovered plugins.
    },

    // A space for utility functions that might be used across different modules.
    utils: {},
};
