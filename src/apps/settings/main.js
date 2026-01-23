// src/apps/settings/main.js

const SettingsApp = {
    // App state
    profile: null,
    windowEl: null,

    // Helper for scoped queries
    $: (selector) => SettingsApp.windowEl.querySelector(selector),
    $$: (selector) => SettingsApp.windowEl.querySelectorAll(selector),

    init(profile, windowEl) {
        console.log("Settings App Initialized (Refactored)");
        this.profile = profile;
        this.windowEl = windowEl;

        this.setupEventListeners();
        this.loadProfileSettings(); // Initial population
        this.populateAppManagementList();
    },

    setupEventListeners() {
        // --- Self-contained Tab Switching ---
        this.$$('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.currentTarget));
        });

        // --- Profile Settings ---
        this.$('#saveProfileSettingsBtn')?.addEventListener('click', () => this.saveProfileSettings());
        this.$('#loadProfileSettingsBtn')?.addEventListener('click', () => this.loadProfileSettings());
        this.$('#logoUploadInput')?.addEventListener('change', (e) => this.uploadLogo(e));

        // --- Wallpaper Selection ---
        this.$$('#personalization-tab .wallpaper-preview').forEach(preview => {
            preview.addEventListener('click', (e) => this.changeWallpaper(e.currentTarget));
        });

        // --- App Management ---
        this.$('#saveAppSettingsBtn')?.addEventListener('click', () => this.saveAppSettings());
    },

    switchTab(clickedTab) {
        // Remove active class from all tabs and content within this window
        this.$$('.tab').forEach(tab => tab.classList.remove('active'));
        this.$$('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to the clicked tab and corresponding content
        clickedTab.classList.add('active');
        const tabId = clickedTab.dataset.tab;
        this.$(`#${tabId}-tab`)?.classList.add('active');
    },

    loadProfileSettings() {
        if (!this.profile) return;

        const fields = {
            'settingsName': 'name', 'settingsFullName': 'fullName', 'settingsNIP': 'nip',
            'settingsPhone': 'phone', 'settingsAddress': 'address', 'settingsEmail': 'email',
            'settingsBankAccount': 'bankAccount', 'settingsSellerName': 'sellerName',
            'settingsSellerPosition': 'sellerPosition', 'settingsSellerPhone': 'sellerPhone',
            'settingsSellerEmail': 'sellerEmail'
        };

        for (const [elementId, profileKey] of Object.entries(fields)) {
            const el = this.$(`#${elementId}`);
            if (el) el.value = this.profile[profileKey] || '';
        }

        const preview = this.$('#logoPreview');
        if (preview) {
            preview.innerHTML = this.profile.logoData
                ? `<img src="${this.profile.logoData}" alt="Logo Preview" style="width: 100%; height: 100%; object-fit: contain;">`
                : '📋';
        }
    },

    async saveProfileSettings() {
        if (!this.profile) return;

        // Update profile object directly
        this.profile.name = this.$('#settingsName')?.value;
        this.profile.fullName = this.$('#settingsFullName')?.value;
        this.profile.nip = this.$('#settingsNIP')?.value;
        this.profile.phone = this.$('#settingsPhone')?.value;
        this.profile.address = this.$('#settingsAddress')?.value;
        this.profile.email = this.$('#settingsEmail')?.value;
        this.profile.bankAccount = this.$('#settingsBankAccount')?.value;
        this.profile.sellerName = this.$('#settingsSellerName')?.value;
        this.profile.sellerPosition = this.$('#settingsSellerPosition')?.value;
        this.profile.sellerPhone = this.$('#settingsSellerPhone')?.value;
        this.profile.sellerEmail = this.$('#settingsSellerEmail')?.value;

        try {
            await window.StorageSystem.ProfileManager.saveProfile(this.profile);
            // The global currentProfile must also be updated
            window.currentProfile = this.profile;

            UI.Feedback.toast('Ustawienia profilu zostały zaktualizowane.', 'success');
            if (window.closeWindow) window.closeWindow('settings');
        } catch (error) {
            console.error('Save profile error:', error);
            UI.Feedback.toast('Błąd: ' + error.message, 'error');
        }
    },

    uploadLogo(event) {
        const file = event.target.files[0];
        if (!file || !this.profile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.profile.logoData = e.target.result;
            this.$('#logoPreview').innerHTML = `<img src="${e.target.result}" alt="Logo Preview" style="width: 100%; height: 100%; object-fit: contain;">`;
            UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
        };
        reader.readAsDataURL(file);
    },

    populateAppManagementList() {
        const container = this.$('#app-management-list');
        if (!container || !window.AppRegistry || !this.profile) return;

        container.innerHTML = ''; // Clear previous list

        window.AppRegistry.forEach(app => {
            const isEnabled = this.profile.enabledApps?.includes(app.id);

            const appToggleEl = document.createElement('div');
            appToggleEl.className = 'app-toggle';
            appToggleEl.innerHTML = `
                <div class="app-toggle-info">
                    <span class="app-toggle-icon">${app.icon}</span>
                    <div>
                        <div class="app-toggle-name">${app.name}</div>
                        <div class="app-toggle-desc">${app.description}</div>
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

    async saveAppSettings() {
        if (!this.profile) return;

        const newEnabledApps = Array.from(this.$$('input[data-app-id]:checked')).map(cb => cb.dataset.appId);
        this.profile.enabledApps = newEnabledApps;

        try {
            await window.StorageSystem.ProfileManager.saveProfile(this.profile);
            window.currentProfile = this.profile;

            // Re-render the main OS UI to reflect changes
            if (window.renderUIForProfile) window.renderUIForProfile();

            UI.Feedback.toast('Ustawienia aplikacji zostały zaktualizowane.', 'success');
            if (window.closeWindow) window.closeWindow('settings');
        } catch (error) {
            console.error('Save app settings error:', error);
            UI.Feedback.toast('Błąd: ' + error.message, 'error');
        }
    },

    changeWallpaper(previewElement) {
        const wallpaperId = previewElement.dataset.wallpaper;
        if (window.changeWallpaper) {
            window.changeWallpaper(wallpaperId);
        }
        this.$$('#personalization-tab .wallpaper-preview').forEach(p => p.classList.remove('active'));
        previewElement.classList.add('active');
    }
};

window.SettingsApp = SettingsApp;
