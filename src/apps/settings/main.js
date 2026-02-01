// src/apps/settings/main.js

(function() {
    let appProfile = null;
    let appWindow = null;

    const $ = (selector) => appWindow.querySelector(selector);
    const $$ = (selector) => appWindow.querySelectorAll(selector);

    function init(profile, windowEl) {
        console.log("Settings App Initialized");
        appProfile = profile;
        appWindow = windowEl;

        setupEventListeners();
        loadProfileSettings();
        populateAppManagementList();
        updateActiveThemePreview();
    }

    function setupEventListeners() {
        // Tab switching logic
        $$('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (window.switchTab) {
                    window.switchTab(tab.dataset.tab, e);
                }
            });
        });

        // Profile settings
        $('#saveProfileSettingsBtn')?.addEventListener('click', saveProfileSettings);
        $('#loadProfileSettingsBtn')?.addEventListener('click', loadProfileSettings);
        $('#logoUploadInput')?.addEventListener('change', uploadLogoFromSettings);

        // Wallpaper selection
        $$('.wallpaper-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                if (window.App && window.App.changeWallpaper) {
                    window.App.changeWallpaper(preview.dataset.wallpaper);
                }
                $$('.wallpaper-preview').forEach(p => p.classList.remove('active'));
                preview.classList.add('active');
            });
        });

        // Theme selection
        $$('.theme-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                const themeId = preview.dataset.theme;
                applyThemeFromSettings(themeId);
                $$('.theme-preview').forEach(p => p.classList.remove('active'));
                preview.classList.add('active');
            });
        });

        // App Management
        $('#saveAppSettingsBtn')?.addEventListener('click', saveAppSettings);
    }

    const themes = {
        red: { primary: '#ef4444', accent: '#991b1b' },
        blue: { primary: '#3b82f6', accent: '#1e40af' },
        purple: { primary: '#8b5cf6', accent: '#5b21b6' },
        green: { primary: '#10b981', accent: '#065f46' },
        dark: { primary: '#1f2937', accent: '#111827' }
    };

    function applyThemeFromSettings(themeId) {
        const theme = themes[themeId];
        if (theme && window.AuthManager) {
            window.AuthManager.applyTheme(theme);
            appProfile.theme = theme;
            StorageSystem.ProfileManager.saveProfile(appProfile);
            UI.Feedback.toast(`Zastosowano motyw: ${themeId}`, 'success');
        }
    }

    function updateActiveThemePreview() {
        if (!appProfile || !appProfile.theme) return;
        const currentPrimary = appProfile.theme.primary;

        $$('.theme-preview').forEach(preview => {
            const themeId = preview.dataset.theme;
            if (themes[themeId].primary === currentPrimary) {
                preview.classList.add('active');
            }
        });
    }

    function loadProfileSettings() {
        if (!appProfile) return;

        const fields = {
            'settingsName': appProfile.name, 'settingsFullName': appProfile.fullName,
            'settingsNIP': appProfile.nip, 'settingsPhone': appProfile.phone,
            'settingsAddress': appProfile.address, 'settingsEmail': appProfile.email,
            'settingsBankAccount': appProfile.bankAccount, 'settingsSellerName': appProfile.sellerName,
            'settingsSellerPosition': appProfile.sellerPosition, 'settingsSellerPhone': appProfile.sellerPhone,
            'settingsSellerEmail': appProfile.sellerEmail
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = $(`#${id}`);
            if (el) el.value = value || '';
        });

        const preview = $('#logoPreview');
        if (preview) {
            preview.innerHTML = appProfile.logoData ? `<img src="${appProfile.logoData}" style="width: 100%; height: 100%; object-fit: contain;">` : '📋';
        }
    }

    async function saveProfileSettings() {
        if (!appProfile) return;

        const updatedProfile = {
            ...appProfile,
            name: $('#settingsName')?.value,
            fullName: $('#settingsFullName')?.value,
            nip: $('#settingsNIP')?.value,
            phone: $('#settingsPhone')?.value,
            address: $('#settingsAddress')?.value,
            email: $('#settingsEmail')?.value,
            bankAccount: $('#settingsBankAccount')?.value,
            sellerName: $('#settingsSellerName')?.value,
            sellerPosition: $('#settingsSellerPosition')?.value,
            sellerPhone: $('#settingsSellerPhone')?.value,
            sellerEmail: $('#settingsSellerEmail')?.value,
        };

        try {
            await window.StorageSystem.ProfileManager.saveProfile(updatedProfile);
            appProfile = updatedProfile;
            UI.Feedback.toast('Ustawienia profilu zostały zaktualizowane.', 'success');
        } catch (error) {
            console.error('Save profile error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień.', 'error');
        }
    }

    function uploadLogoFromSettings(event) {
        const file = event.target.files[0];
        if (!file || !appProfile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            appProfile.logoData = e.target.result;
            $('#logoPreview').innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
            UI.Feedback.toast('📸 Logo załadowane', 'info');
        };
        reader.readAsDataURL(file);
    }

    function populateAppManagementList() {
        const container = $('#app-management-list');
        if (!container || !window.AppRegistry || !appProfile) return;

        container.innerHTML = '';

        window.AppRegistry.forEach(app => {
            const isEnabled = appProfile.enabledApps && appProfile.enabledApps.includes(app.id);

            const appToggleEl = document.createElement('div');
            appToggleEl.className = 'app-toggle';
            appToggleEl.innerHTML = `
                <div class="app-toggle-info" style="display: flex; align-items: center; gap: 1rem;">
                    <span class="app-toggle-icon" style="font-size: 1.5rem;">${app.icon}</span>
                    <div>
                        <div class="app-toggle-name" style="font-weight: 600;">${app.name}</div>
                        <div class="app-toggle-desc" style="font-size: 0.8rem; color: var(--gray-500);">${app.description}</div>
                    </div>
                </div>
                <label class="switch">
                    <input type="checkbox" data-app-id="${app.id}" ${isEnabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            `;
            container.appendChild(appToggleEl);
        });
    }

    async function saveAppSettings() {
        if (!appProfile) return;

        const newEnabledApps = [];
        $$('#app-management-list input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                newEnabledApps.push(checkbox.dataset.appId);
            }
        });

        appProfile.enabledApps = newEnabledApps;

        try {
            await window.StorageSystem.ProfileManager.saveProfile(appProfile);

            if(window.App && window.App.renderUIForProfile) {
                window.App.renderUIForProfile();
            }

            UI.Feedback.toast('Lista aplikacji została zaktualizowana.', 'success');
        } catch (error) {
            console.error('Save app settings error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień aplikacji.', 'error');
        }
    }

    window.SettingsApp = { init };
})();
