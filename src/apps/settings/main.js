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
        applyCurrentWallpaperSelection();
    }

    function setupEventListeners() {
        $$('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (typeof window.switchTab === 'function') {
                    window.switchTab(tab.dataset.tab, e);
                }
            });
        });

        $('#saveProfileSettingsBtn')?.addEventListener('click', saveProfileSettings);
        $('#loadProfileSettingsBtn')?.addEventListener('click', loadProfileSettings);
        $('#logoUploadInput')?.addEventListener('change', uploadLogoFromSettings);
        $('#saveAppSettingsBtn')?.addEventListener('click', saveAppSettings);

        $$('.wallpaper-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                if (typeof window.changeWallpaper === 'function') {
                    window.changeWallpaper(preview.dataset.wallpaper);
                }
                $$('.wallpaper-preview').forEach(p => p.classList.remove('active'));
                preview.classList.add('active');
            });
        });
    }

    function loadProfileSettings() {
        const profile = window.currentProfile;
        if (!profile) return;

        const fields = {
            'settingsName': profile.name, 'settingsFullName': profile.fullName,
            'settingsNIP': profile.nip, 'settingsPhone': profile.phone,
            'settingsAddress': profile.address, 'settingsEmail': profile.email,
            'settingsBankAccount': profile.bankAccount, 'settingsSellerName': profile.sellerName,
            'settingsSellerPosition': profile.sellerPosition, 'settingsSellerPhone': profile.sellerPhone,
            'settingsSellerEmail': profile.sellerEmail
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = $(`#${id}`);
            if (el) el.value = value || '';
        });

        const preview = $('#logoPreview');
        if (preview) {
            preview.innerHTML = profile.logoData ? `<img src="${profile.logoData}" style="width: 100%; height: 100%; object-fit: contain;">` : '📋';
        }

        populateAppManagementList();
    }

    async function saveProfileSettings() {
        if (!window.currentProfile) return;

        const updatedProfile = {
            ...window.currentProfile,
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
            await StorageSystem.ProfileManager.saveProfile(updatedProfile);
            window.currentProfile = updatedProfile;

            // Update main UI if needed
            const userNameEl = document.getElementById('userName');
            if (userNameEl) userNameEl.textContent = updatedProfile.name;

            UI.Feedback.toast('✅ Ustawienia profilu zostały zapisane', 'success');
        } catch (error) {
            console.error('Save profile error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień.', 'error');
        }
    }

    function uploadLogoFromSettings(event) {
        const file = event.target.files[0];
        if (!file || !window.currentProfile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            window.currentProfile.logoData = e.target.result;
            const preview = $('#logoPreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
            }
            UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
        };
        reader.readAsDataURL(file);
    }

    function populateAppManagementList() {
        const container = $('#app-management-list');
        if (!container || !window.AppRegistry || !window.currentProfile) return;

        container.innerHTML = '';

        window.AppRegistry.forEach(app => {
            const isEnabled = window.currentProfile.enabledApps && window.currentProfile.enabledApps.includes(app.id);

            const appToggleEl = document.createElement('div');
            appToggleEl.className = 'app-toggle';
            appToggleEl.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--gray-100);';
            appToggleEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 1.5rem;">${app.icon}</span>
                    <div>
                        <div style="font-weight: 600; color: var(--gray-800);">${app.name}</div>
                        <div style="font-size: 0.8rem; color: var(--gray-500);">${app.description || ''}</div>
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
        if (!window.currentProfile) return;

        const newEnabledApps = [];
        $$('#app-management-list input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                newEnabledApps.push(checkbox.dataset.appId);
            }
        });

        window.currentProfile.enabledApps = newEnabledApps;

        try {
            await StorageSystem.ProfileManager.saveProfile(window.currentProfile);
            if (typeof window.renderUIForProfile === 'function') {
                window.renderUIForProfile();
            }
            UI.Feedback.toast('✅ Lista aplikacji została zaktualizowana', 'success');
        } catch (error) {
            console.error('Save app settings error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień aplikacji.', 'error');
        }
    }

    function applyCurrentWallpaperSelection() {
        const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
        $$('.wallpaper-preview').forEach(p => {
            if (p.dataset.wallpaper === savedWallpaper) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    }

    window.SettingsApp = { init };
})();
