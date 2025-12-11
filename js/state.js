/**
 * PESTECZKA OS - CENTRALIZED STATE
 * A single source of truth for the application's state.
 * Avoids global variables and improves predictability.
 */

const state = {
    // The currently logged-in user profile object. Null if logged out.
    currentUser: null,

    // An object to store references to all active application instances.
    // e.g., { 'offers': OffersApp, 'dashboard': DashboardApp }
    apps: {},

    // Keeps track of the z-index for windows to ensure the active one is on top.
    zIndexCounter: 100,

    // Stores the configuration for all available profiles, loaded from profiles.json.
    profiles: []
};

// The state object is exported for use by other modules.
// IMPORTANT: Do not modify this object directly from outside.
// Use dedicated functions or event handlers to update state.
export { state };
