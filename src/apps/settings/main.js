// src/apps/settings/main.js

window.SettingsApp = {
    // Store context from the main app
    profile: null,
    windowEl: null,

    // Store a copy of the logo data to avoid modifying the global profile directly
    tempLogoData: null,

    // Predefined themes
    themes: [
        { id: 'pesteczka', name: 'Pesteczka', primary: '#7c3aed', accent: '#00d1ff' },
        { id: 'mebleduo', name: 'Meble Duo', primary: '#dc2626', accent: '#111827' },
        { id: 'classic', name: 'Klasyczny', primary: '#2563eb', accent: '#f59e0b' },
        { id: 'forest', name: 'Leśny', primary: '#166534', accent: '#facc15' },
        { id: 'ocean', name: 'Ocean', primary: '#0891b2', accent: '#93c5fd' },
    ],

    init: function(profile, windowEl) {
        console.log("Settings App Initialized with context");
        this.profile = profile;
        this.windowEl = windowEl;
        this.tempLogoData = profile.logoData;

        this.setupEventListeners();
        this.loadProfileSettings();
        this.populateAppManagementList();
        this.populateThemeSelector();
    },

    setupEventListeners: function() {
        // Tab switching
        this.windowEl.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Actions
        this.windowEl.querySelector('#saveProfileSettingsBtn')?.addEventListener('click', () => this.saveProfileSettings());
        this.windowEl.querySelector('#loadProfileSettingsBtn')?.addEventListener('click', () => this.loadProfileSettings());
        this.windowEl.querySelector('#logoUploadInput')?.addEventListener('change', (e) => this.handleLogoUpload(e));
        this.windowEl.querySelector('#saveAppSettingsBtn')?.addEventListener('click', () => this.saveAppSettings());

        // Wallpaper selection
        this.windowEl.querySelectorAll('.wallpaper-preview').forEach(preview => {
            preview.addEventListener('click', () => this.handleWallpaperChange(preview.dataset.wallpaper));
        });
    },

    handleTabSwitch: function(event) {
        const tabButton = event.target.closest('.tab');
        if (!tabButton) return;

        const tabId = tabButton.dataset.tab;

        // Deactivate all tabs and content
        this.windowEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.windowEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Activate clicked tab and corresponding content
        tabButton.classList.add('active');
        this.windowEl.querySelector(`#${tabId}-tab`)?.classList.add('active');
    },

    handleWallpaperChange: function(wallpaperId) {
        if (window.changeWallpaper) {
            window.changeWallpaper(wallpaperId);
        }
        this.windowEl.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
        this.windowEl.querySelector(`.wallpaper-preview[data-wallpaper="${wallpaperId}"]`)?.classList.add('active');
    },

    loadProfileSettings: function() {
        if (!this.profile) return;

        const fields = {
            'settingsName': this.profile.name, 'settingsFullName': this.profile.fullName,
            'settingsNIP': this.profile.nip, 'settingsPhone': this.profile.phone,
            'settingsAddress': this.profile.address, 'settingsEmail': this.profile.email,
            'settingsBankAccount': this.profile.bankAccount, 'settingsSellerName': this.profile.sellerName,
            'settingsSellerPosition': this.profile.sellerPosition, 'settingsSellerPhone': this.profile.sellerPhone,
            'settingsSellerEmail': this.profile.sellerEmail
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = this.windowEl.querySelector(`#${id}`);
            if (el) el.value = value || '';
        }

        const preview = this.windowEl.querySelector('#logoPreview');
        if (preview) {
            preview.innerHTML = this.tempLogoData ? `<img src="${this.tempLogoData}" alt="Logo Preview">` : '📋';
        }
    },

    saveProfileSettings: async function() {
        if (!this.profile) return;

        const updatedProfileData = {
            name: this.windowEl.querySelector('#settingsName').value,
            fullName: this.windowEl.querySelector('#settingsFullName').value,
            nip: this.windowEl.querySelector('#settingsNIP').value,
            phone: this.windowEl.querySelector('#settingsPhone').value,
            address: this.windowEl.querySelector('#settingsAddress').value,
            email: this.windowEl.querySelector('#settingsEmail').value,
            bankAccount: this.windowEl.querySelector('#settingsBankAccount').value,
            sellerName: this.windowEl.querySelector('#settingsSellerName').value,
            sellerPosition: this.windowEl.querySelector('#settingsSellerPosition').value,
            sellerPhone: this.windowEl.querySelector('#settingsSellerPhone').value,
            sellerEmail: this.windowEl.querySelector('#settingsSellerEmail').value,
            logoData: this.tempLogoData,
            theme: this.profile.theme // Theme is saved separately
        };

        try {
            // Merge changes into the main profile object
            const updatedProfile = { ...this.profile, ...updatedProfileData };
            await window.StorageSystem.ProfileManager.saveProfile(updatedProfile);

            // Crucially, update the globally active profile
            window.currentProfile = updatedProfile;

            UI.Feedback.toast('Profil zaktualizowany!', 'success');
        } catch (error) {
            console.error('Save profile error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień.', 'error');
        }
    },

    handleLogoUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.tempLogoData = e.target.result;
            this.windowEl.querySelector('#logoPreview').innerHTML = `<img src="${this.tempLogoData}" alt="Logo Preview">`;
            UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
        };
        reader.readAsDataURL(file);
    },

    populateAppManagementList: function() {
        const container = this.windowEl.querySelector('#app-management-list');
        if (!container || !window.AppRegistry || !this.profile) return;

        container.innerHTML = '';
        window.AppRegistry.forEach(app => {
            const isEnabled = this.profile.enabledApps?.includes(app.id);
            const appToggleEl = document.createElement('div');
            appToggleEl.className = 'app-toggle';
            appToggleEl.innerHTML = `
                <div class="app-toggle-info">
                    <span class="app-toggle-icon">${app.icon}</span>
                    <div>
                        <div class="app-toggle-name">${app.name}</div>
                        <div class="app-toggle-desc">${app.description || 'Brak opisu'}</div>
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" data-app-id="${app.id}" ${isEnabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            `;
            container.appendChild(appToggleEl);
        });
    },

    populateThemeSelector: function() {
        const container = this.windowEl.querySelector('.theme-selector');
        if (!container) return;

        container.innerHTML = '';
        this.themes.forEach(theme => {
            const themeEl = document.createElement('div');
            themeEl.className = 'theme-preview';
            themeEl.dataset.themeId = theme.id;
            themeEl.title = theme.name;
            themeEl.innerHTML = `
                <div class="theme-color-block" style="background-color: ${theme.primary};"></div>
                <div class="theme-color-block" style="background-color: ${theme.accent};"></div>
            `;
            if (this.profile.theme?.primary === theme.primary) {
                themeEl.classList.add('active');
            }
            themeEl.addEventListener('click', () => this.handleThemeChange(theme));
            container.appendChild(themeEl);
        });
    },

    handleThemeChange: async function(theme) {
        if (!this.profile) return;

        // Update UI
        this.windowEl.querySelectorAll('.theme-preview').forEach(p => p.classList.remove('active'));
        this.windowEl.querySelector(`.theme-preview[data-theme-id="${theme.id}"]`)?.classList.add('active');

        // Apply theme globally
        if (window.applyTheme) window.applyTheme(theme);

        // Save theme to profile
        this.profile.theme = { primary: theme.primary, accent: theme.accent };
        try {
            await window.StorageSystem.ProfileManager.saveProfile(this.profile);
            window.currentProfile = this.profile; // Keep global profile in sync
            UI.Feedback.toast(`Zmieniono motyw na ${theme.name}`, 'info');
        } catch (error) {
            console.error('Save theme error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać motywu.', 'error');
        }
    },

    saveAppSettings: async function() {
        if (!this.profile) return;

        const newEnabledApps = [];
        this.windowEl.querySelectorAll('#app-management-list input:checked').forEach(checkbox => {
            newEnabledApps.push(checkbox.dataset.appId);
        });

        this.profile.enabledApps = newEnabledApps;

        try {
            await window.StorageSystem.ProfileManager.saveProfile(this.profile);
            window.currentProfile = this.profile; // Sync global profile

            // Re-render the main desktop UI
            if (window.renderUIForProfile) window.renderUIForProfile();

            UI.Feedback.toast('Ustawienia aplikacji zaktualizowane!', 'success');
        } catch (error) {
            console.error('Save app settings error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień.', 'error');
        }
    }
};
