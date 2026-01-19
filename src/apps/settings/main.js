// src/apps/settings/main.js

function init() {
    console.log("Settings App Initialized");
    setupEventListeners();
}

function setupEventListeners() {
    // Note: Event listeners are now scoped to the settings window
    const settingsWindow = document.getElementById('window-settings');
    if (!settingsWindow) {
        console.error("Settings window not found, cannot attach listeners.");
        return;
    }

    // Tab switching logic
    const tabs = settingsWindow.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // This relies on the global switchTab function in app.js
            // A more advanced implementation would make this self-contained.
            if (window.switchTab) {
                window.switchTab(tab.dataset.tab, e);
            }
        });
    });

    // Profile settings
    document.getElementById('saveProfileSettingsBtn')?.addEventListener('click', saveProfileSettings);
    document.getElementById('loadProfileSettingsBtn')?.addEventListener('click', loadProfileSettings);
    document.getElementById('logoUploadInput')?.addEventListener('change', uploadLogoFromSettings);

    // Wallpaper selection
    document.querySelectorAll('.wallpaper-preview').forEach(preview => {
        preview.addEventListener('click', () => {
            if (window.changeWallpaper) {
                window.changeWallpaper(preview.dataset.wallpaper);
            }
            document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
            preview.classList.add('active');
        });
    });

    // App Management
    document.getElementById('saveAppSettingsBtn')?.addEventListener('click', saveAppSettings);
    populateAppManagementList();
}


function loadProfileSettings() {
    if (!window.currentProfile) return;
    const { currentProfile } = window;

    const fields = {
        'settingsName': currentProfile.name, 'settingsFullName': currentProfile.fullName,
        'settingsNIP': currentProfile.nip, 'settingsPhone': currentProfile.phone,
        'settingsAddress': currentProfile.address, 'settingsEmail': currentProfile.email,
        'settingsBankAccount': currentProfile.bankAccount, 'settingsSellerName': currentProfile.sellerName,
        'settingsSellerPosition': currentProfile.sellerPosition, 'settingsSellerPhone': currentProfile.sellerPhone,
        'settingsSellerEmail': currentProfile.sellerEmail
    };
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    });
    const preview = document.getElementById('logoPreview');
    if (preview) {
        preview.innerHTML = currentProfile.logoData ? `<img src="${currentProfile.logoData}" style="width: 100%; height: 100%; object-fit: contain;">` : '📋';
    }
}

async function saveProfileSettings() {
    if (!window.currentProfile) return;

    const updatedProfile = {
        ...window.currentProfile,
        name: document.getElementById('settingsName')?.value,
        fullName: document.getElementById('settingsFullName')?.value,
        nip: document.getElementById('settingsNIP')?.value,
        phone: document.getElementById('settingsPhone')?.value,
        address: document.getElementById('settingsAddress')?.value,
        email: document.getElementById('settingsEmail')?.value,
        bankAccount: document.getElementById('settingsBankAccount')?.value,
        sellerName: document.getElementById('settingsSellerName')?.value,
        sellerPosition: document.getElementById('settingsSellerPosition')?.value,
        sellerPhone: document.getElementById('settingsSellerPhone')?.value,
        sellerEmail: document.getElementById('settingsSellerEmail')?.value,
    };

    try {
        await window.StorageSystem.ProfileManager.saveProfile(updatedProfile);
        window.currentProfile = updatedProfile;

        // Also update the main seller name field in the offers app if it exists
        const mainSellerNameEl = document.getElementById('sellerName');
        if (mainSellerNameEl) {
            mainSellerNameEl.value = updatedProfile.fullName || '';
        }

        UI.Feedback.toast('Ustawienia profilu zostały zaktualizowane.', 'success');
        if (window.closeWindow) window.closeWindow('settings');
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
        document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
        UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
    };
    reader.readAsDataURL(file);
}

function populateAppManagementList() {
    const container = document.getElementById('app-management-list');
    if (!container || !window.AppRegistry || !window.currentProfile) return;

    container.innerHTML = ''; // Clear previous list

    window.AppRegistry.forEach(app => {
        const isEnabled = window.currentProfile.enabledApps && window.currentProfile.enabledApps.includes(app.id);

        const appToggleEl = document.createElement('div');
        appToggleEl.className = 'app-toggle';
        appToggleEl.innerHTML = `
            <div class="app-toggle-info">
                <span class="app-toggle-icon">${app.icon}</span>
                <div>
                    <div class="app-toggle-name">${app.name}</div>
                    <div class.app-toggle-desc">${app.description}</div>
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
    document.querySelectorAll('#app-management-list input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.checked) {
            newEnabledApps.push(checkbox.dataset.appId);
        }
    });

    window.currentProfile.enabledApps = newEnabledApps;

    try {
        await window.StorageSystem.ProfileManager.saveProfile(window.currentProfile);

        // Re-render the main UI to reflect changes
        if(window.renderUIForProfile) window.renderUIForProfile();

        UI.Feedback.toast('Ustawienia aplikacji zostały zaktualizowane.', 'success');
        if (window.closeWindow) window.closeWindow('settings');
    } catch (error) {
        console.error('Save app settings error:', error);
        UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień aplikacji.', 'error');
    }
}


// Expose the init function to the global scope so the plugin loader can call it
window.SettingsApp = {
  init: init
};
