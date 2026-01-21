// src/apps/settings/main.js
(function() {
    const SettingsApp = {
        profile: null,
        windowEl: null,

        init(profile, windowEl) {
            this.profile = profile;
            this.windowEl = windowEl;
            this.setupEventListeners();
            this.loadProfileSettings();
            this.populateAppManagementList();
        },

        setupEventListeners() {
            if (!this.windowEl) return;
            this.windowEl.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.dataset.action;
                if (action && typeof this[action] === 'function') {
                    this[action](e);
                }
            });
            this.windowEl.querySelector('#logoUploadInput')?.addEventListener('change', (e) => this.uploadLogo(e));
        },

        loadProfileSettings() {
            if (!this.profile) return;
            const fields = {
                'settingsName': 'name', 'settingsFullName': 'fullName', 'settingsNIP': 'nip',
                'settingsPhone': 'phone', 'settingsAddress': 'address', 'settingsEmail': 'email',
                'settingsBankAccount': 'bankAccount', 'settingsSellerName': 'sellerName'
            };
            for (const [id, key] of Object.entries(fields)) {
                const el = this.windowEl.querySelector(`#${id}`);
                if (el) el.value = this.profile[key] || '';
            }
            this.updateLogoPreview();
        },

        async saveProfile() {
            if (!this.profile) return;
            const fieldsToUpdate = ['name', 'fullName', 'nip', 'phone', 'address', 'email', 'bankAccount', 'sellerName'];
            fieldsToUpdate.forEach(field => {
                const el = this.windowEl.querySelector(`#settings${field.charAt(0).toUpperCase() + field.slice(1)}`);
                if (el) this.profile[field] = el.value;
            });
            try {
                await PesteczkaOS.core.StorageSystem.db.set('profiles', this.profile);
                PesteczkaOS.state.currentProfile = this.profile;
                PesteczkaOS.core.UI.Feedback.toast('Ustawienia zapisane.', 'success');
            } catch (error) {
                PesteczkaOS.core.UI.Feedback.show('Błąd', 'Nie udało się zapisać.', 'error');
            }
        },

        uploadLogo(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.profile.logoData = e.target.result;
                this.updateLogoPreview();
            };
            reader.readAsDataURL(file);
        },

        updateLogoPreview() {
            const preview = this.windowEl.querySelector('#logoPreview');
            if (preview) {
                preview.innerHTML = this.profile.logoData ? `<img src="${this.profile.logoData}" alt="Logo Preview">` : '📋';
            }
        },

        populateAppManagementList() {
            const container = this.windowEl.querySelector('#app-management-list');
            if (!container || !PesteczkaOS.state.AppRegistry) return;
            container.innerHTML = '';
            PesteczkaOS.state.AppRegistry.forEach(app => {
                const isEnabled = this.profile.enabledApps?.includes(app.id);
                const appToggleEl = document.createElement('div');
                appToggleEl.className = 'app-toggle';
                appToggleEl.innerHTML = `
                    <div>${app.icon} ${app.name}</div>
                    <label class="switch"><input type="checkbox" data-app-id="${app.id}" ${isEnabled ? 'checked' : ''} data-action="toggleApp"><span class="slider"></span></label>`;
                container.appendChild(appToggleEl);
            });
        },

        toggleApp(e) {
            // This is handled by saveApps, but you could add instant feedback here if needed
        },

        async saveApps() {
            if (!this.profile) return;
            const newEnabledApps = Array.from(this.windowEl.querySelectorAll('#app-management-list input:checked'))
                .map(checkbox => checkbox.dataset.appId);
            this.profile.enabledApps = newEnabledApps;
            try {
                await PesteczkaOS.core.StorageSystem.db.set('profiles', this.profile);
                PesteczkaOS.state.currentProfile = this.profile;
                PesteczkaOS.core.renderUIForProfile();
                PesteczkaOS.core.UI.Feedback.toast('Ustawienia aplikacji zapisane.', 'success');
            } catch (error) {
                PesteczkaOS.core.UI.Feedback.show('Błąd', 'Nie udało się zapisać.', 'error');
            }
        },

        selectWallpaper(e) {
            const wallpaperId = e.target.closest('.wallpaper-preview')?.dataset.wallpaper;
            if (!wallpaperId) return;
            PesteczkaOS.core.changeWallpaper(wallpaperId);
            this.windowEl.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
            e.target.closest('.wallpaper-preview').classList.add('active');
        },

        switchTab(e) {
            const tab = e.target.closest('.tab');
            if (!tab) return;
            const tabId = tab.dataset.tab;
            tab.closest('.tabs').querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            this.windowEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.windowEl.querySelector(`#${tabId}-tab`)?.classList.add('active');
        }
    };

    window.SettingsApp = {
        init: SettingsApp.init.bind(SettingsApp)
    };
})();
