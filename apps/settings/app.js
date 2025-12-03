const SettingsApp = (() => {
    const init = () => {
        console.log('⚙️ Settings Initialized');
        setupEventListeners();
        loadProfileSettings(); // Load settings when the app is opened
    };

    const setupEventListeners = () => {
        document.getElementById('saveProfileSettingsBtn')?.addEventListener('click', saveProfileSettings);
        document.getElementById('loadProfileSettingsBtn')?.addEventListener('click', loadProfileSettings);
        document.getElementById('logoUploadInput')?.addEventListener('change', uploadLogoFromSettings);

        document.querySelectorAll('.wallpaper-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                const wallpaper = preview.dataset.wallpaper;
                changeWallpaper(wallpaper);
                document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
                preview.classList.add('active');
                if (currentProfile) {
                    currentProfile.wallpaper = wallpaper;
                    StorageSystem.ProfileManager.updateProfile(currentProfile);
                }
            });
        });
    };

    const loadProfileSettings = () => {
        if (!window.currentProfile) {
            UI.Feedback.toast('Brak załadowanego profilu.', 'error');
            return;
        }

        const profile = window.currentProfile;
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileFullName').value = profile.fullName || '';
        document.getElementById('profileNip').value = profile.nip || '';
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileEmail').value = profile.email || '';
        document.getElementById('profileBankAccount').value = profile.bankAccount || '';
        document.getElementById('profileColor').value = profile.color || '#dc2626';

        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
            logoPreview.src = profile.logoData || 'assets/icons/image-placeholder.svg';
        }

        console.log('Profile settings loaded into form.');
    };

    const saveProfileSettings = async () => {
        if (!window.currentProfile) {
            UI.Feedback.toast('Brak załadowanego profilu.', 'error');
            return;
        }

        const updatedProfile = { ...window.currentProfile };
        updatedProfile.name = document.getElementById('profileName').value;
        updatedProfile.fullName = document.getElementById('profileFullName').value;
        updatedProfile.nip = document.getElementById('profileNip').value;
        updatedProfile.address = document.getElementById('profileAddress').value;
        updatedProfile.phone = document.getElementById('profilePhone').value;
        updatedProfile.email = document.getElementById('profileEmail').value;
        updatedProfile.bankAccount = document.getElementById('profileBankAccount').value;
        updatedProfile.color = document.getElementById('profileColor').value;

        try {
            await StorageSystem.ProfileManager.updateProfile(updatedProfile);
            window.currentProfile = updatedProfile; // Update the global profile object
            UI.Feedback.toast('Ustawienia profilu zostały zapisane!', 'success');
        } catch (error) {
            console.error('Error saving profile settings:', error);
            UI.Feedback.toast('Błąd podczas zapisywania ustawień.', 'error');
        }
    };

    const uploadLogoFromSettings = (event) => {
        const file = event.target.files[0];
        if (!file || !window.currentProfile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const logoData = e.target.result;
            window.currentProfile.logoData = logoData;
            const logoPreview = document.getElementById('logoPreview');
            if (logoPreview) {
                logoPreview.src = logoData;
            }
            UI.Feedback.toast('Logo zostało zaktualizowane. Zapisz zmiany.', 'info');
        };
        reader.readAsDataURL(file);
    };


    return {
        init
    };
})();
