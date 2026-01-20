// src/apps/settings/main.js

const SettingsApp = {
    // Store references to the current profile and window element
    profile: null,
    windowEl: null,

    // Initialize the settings app
    init(profile, windowEl) {
        console.log("Settings App Initialized with profile:", profile);
        this.profile = profile;
        this.windowEl = windowEl;
        this.setupEventListeners();
        this.loadProfileSettings(); // Load settings when the app opens
        this.populateAppManagementList(); // Populate the app list
    },

    // Set up all event listeners within the settings window
    setupEventListeners() {
        if (!this.windowEl) {
            console.error("Settings window element not found, cannot attach listeners.");
            return;
        }

        // Use a single event delegate for better performance and simplicity
        this.windowEl.addEventListener('click', (e) => {
            const target = e.target;
            const action = target.closest('[data-action]')?.dataset.action;

            if (action) {
                // Call the corresponding method based on the data-action attribute
                this[action]?.(e);
            }
        });

        // Specific listener for logo upload, as it's a 'change' event
        const logoUpload = this.windowEl.querySelector('#logoUploadInput');
        logoUpload?.addEventListener('change', (e) => this.uploadLogo(e));
    },

    // Load current profile data into the form fields
    loadProfileSettings() {
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

        this.updateLogoPreview();
    },

    // Save updated profile settings
    async saveProfile() {
        if (!this.profile) return;

        // Update the profile object with values from the form
        const fieldsToUpdate = [
            'name', 'fullName', 'nip', 'phone', 'address', 'email',
            'bankAccount', 'sellerName', 'sellerPosition', 'sellerPhone', 'sellerEmail'
        ];
        fieldsToUpdate.forEach(field => {
            const el = this.windowEl.querySelector(`#settings${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (el) this.profile[field] = el.value;
        });

        try {
            // Use the centralized StorageSystem to save the profile
            await PesteczkaOS.core.StorageSystem.db.set('profiles', this.profile);

            // Update the global state
            PesteczkaOS.state.currentProfile = this.profile;

            PesteczkaOS.core.UI.Feedback.toast('Ustawienia profilu zostały zaktualizowane.', 'success');
        } catch (error) {
            console.error('Save profile error:', error);
            PesteczkaOS.core.UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień.', 'error');
        }
    },

    // Handle logo file selection and preview
    uploadLogo(event) {
        const file = event.target.files[0];
        if (!file || !this.profile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.profile.logoData = e.target.result;
            this.updateLogoPreview();
            PesteczkaOS.core.UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
        };
        reader.readAsDataURL(file);
    },

    // Update the logo preview element
    updateLogoPreview() {
        const preview = this.windowEl.querySelector('#logoPreview');
        if (preview) {
            preview.innerHTML = this.profile.logoData
                ? `<img src="${this.profile.logoData}" alt="Logo Preview" style="width: 100%; height: 100%; object-fit: contain;">`
                : '📋';
        }
    },

    // Populate the list of applications for management
    populateAppManagementList() {
        const container = this.windowEl.querySelector('#app-management-list');
        if (!container || !PesteczkaOS.state.AppRegistry || !this.profile) return;

        container.innerHTML = ''; // Clear previous list

        PesteczkaOS.state.AppRegistry.forEach(app => {
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
                    <input type="checkbox" data-app-id="${app.id}" ${isEnabled ? 'checked' : ''} data-action="toggleApp">
                    <span class="slider"></span>
                </label>
            `;
            container.appendChild(appToggleEl);
        });
    },

    // Save the new list of enabled applications
    async saveApps() {
        if (!this.profile) return;

        const newEnabledApps = Array.from(this.windowEl.querySelectorAll('#app-management-list input:checked'))
                                    .map(checkbox => checkbox.dataset.appId);

        this.profile.enabledApps = newEnabledApps;

        try {
            await PesteczkaOS.core.StorageSystem.db.set('profiles', this.profile);
            PesteczkaOS.state.currentProfile = this.profile;

            // Re-render the main UI to reflect changes
            PesteczkaOS.core.renderUIForProfile();

            PesteczkaOS.core.UI.Feedback.toast('Ustawienia aplikacji zostały zaktualizowane.', 'success');
        } catch (error) {
            console.error('Save app settings error:', error);
            PesteczkaOS.core.UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień aplikacji.', 'error');
        }
    },

    // Handle wallpaper selection
    selectWallpaper(e) {
        const preview = e.target.closest('.wallpaper-preview');
        if (!preview) return;

        const wallpaperId = preview.dataset.wallpaper;
        PesteczkaOS.core.changeWallpaper(wallpaperId);

        this.windowEl.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
        preview.classList.add('active');
    },

    // Switch tabs within the settings window
    switchTab(e) {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const tabId = tab.dataset.tab;
        const tabsContainer = tab.closest('.tabs');
        const contentContainer = this.windowEl.querySelector('.window-content');

        tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        contentContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        contentContainer.querySelector(`#${tabId}-tab`)?.classList.add('active');
    }
};

// Expose the init function to the global scope so the plugin loader can call it
window.SettingsApp = {
    init: SettingsApp.init.bind(SettingsApp)
};
