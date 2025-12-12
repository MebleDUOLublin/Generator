/**
 * PESTECZKA OS - PROFILE MANAGER
 * Handles fetching user profiles, login/logout, and rendering profile-specific UI.
 */
import { state } from './state.js';
import * as UIManager from './uiManager.js';
import { WindowManager } from './windowManager.js';

const ProfileManager = {
    /**
     * Fetches profiles from the server and populates the login screen selector.
     */
    async populateSelector() {
        try {
            const response = await fetch('profiles.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch profiles: ${response.statusText}`);
            }
            state.profiles = await response.json();

            const selector = document.getElementById('profileSelector');
            if (!selector) return;

            if (!state.profiles || state.profiles.length === 0) {
                selector.innerHTML = '<p class="error-message">Nie znaleziono profili.</p>';
                return;
            }

            selector.innerHTML = ''; // Clear existing content
            state.profiles.forEach(profile => {
                const profileCard = document.createElement('div');
                profileCard.className = 'profile-card';
                profileCard.dataset.profileId = profile.id; // Use 'id' for matching

                profileCard.innerHTML = `
                    <div class="profile-logo" style="background-image: url('${profile.logo || 'assets/default-logo.png'}')"></div>
                    <h2 class="profile-name">${profile.name}</h2>
                `;

                profileCard.addEventListener('click', () => this.login(profile.id));
                selector.appendChild(profileCard);
            });
        } catch (error) {
            console.error('❌ Failed to populate profile selector:', error);
            const selector = document.getElementById('profileSelector');
            if (selector) {
                selector.innerHTML = '<p class="error-message">Błąd ładowania profili.</p>';
            }
        }
    },

    /**
     * Logs in the user with the specified profile ID.
     * @param {string} profileId The ID of the profile to log in as.
     */
    login(profileId) {
        const profile = state.profiles.find(p => p.id === profileId);
        if (!profile) {
            console.error(`Login failed: Profile with ID "${profileId}" not found.`);
            UIManager.showNotification('Błąd', 'Nie znaleziono wybranego profilu.', 'error');
            return;
        }

        state.currentUser = profile;
        this.renderDesktopUI();
        UIManager.transitionToDesktop();

        console.log(`✅ Logged in as ${profile.name}`);
        UIManager.showNotification('Witaj!', `Zalogowano jako ${profile.name}`, 'success');
    },

    /**
     * Renders the desktop icons and start menu based on the current user's profile.
     */
    renderDesktopUI() {
        const profile = state.currentUser;
        if (!profile) return;

        const desktopIconsContainer = document.getElementById('desktopIcons');
        const startMenuContainer = document.getElementById('startMenuHeader');

        // Clear previous user's UI
        desktopIconsContainer.innerHTML = '';
        startMenuContainer.innerHTML = '';

        // Render desktop icons
        profile.desktopIcons?.forEach(icon => {
            const iconEl = UIManager.createDOMElement('div', {
                className: 'desktop-icon',
                'data-window': icon.id,
                innerHTML: `
                    <div class="desktop-icon-image">${icon.icon}</div>
                    <div class="desktop-icon-name">${icon.name}</div>
                `
            });
            iconEl.addEventListener('dblclick', () => WindowManager.open(icon.id));
            desktopIconsContainer.appendChild(iconEl);
        });

        // Render start menu
        if (profile.startMenuItems) {
            const pinnedAppsGrid = UIManager.createDOMElement('div', { className: 'start-apps-grid' });
            profile.startMenuItems.forEach(item => {
                const itemEl = UIManager.createDOMElement('div', {
                    className: 'start-app',
                    'data-window': item.id,
                    innerHTML: `
                        <div class="start-app-icon">${item.icon}</div>
                        <div class="start-app-name">${item.name}</div>
                    `
                });
                itemEl.addEventListener('click', () => {
                    WindowManager.open(item.id);
                    UIManager.toggleStartMenu(false); // Force close
                });
                pinnedAppsGrid.appendChild(itemEl);
            });
            startMenuContainer.innerHTML = '<div class="start-apps-title">📌 Aplikacje</div>';
            startMenuContainer.appendChild(pinnedAppsGrid);
        }

        // Update user info in start menu footer
        UIManager.updateUserInfo(profile);
    },

    /**
     * Logs the current user out and returns to the login screen.
     */
    logout() {
        console.log(`🔒 Logging out ${state.currentUser?.name || 'user'}`);
        state.currentUser = null;
        WindowManager.closeAll();
        UIManager.transitionToLogin();
    }
};

export { ProfileManager };
