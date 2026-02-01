/**
 * PESTECZKA OS - AUTH MANAGER
 * Handles user login, profile selection, and theme application.
 */

const AuthManager = (() => {
    let currentProfile = null;

    const init = async () => {
        await populateProfileSelector();
    };

    const populateProfileSelector = async () => {
        try {
            const profiles = await StorageSystem.ProfileManager.getAllProfiles();
            const selector = document.querySelector('.profile-selector');
            if (!selector) return;

            selector.innerHTML = '';

            if (!profiles || profiles.length === 0) {
                selector.innerHTML = '<p style="color: white;">Nie znaleziono profili. Sprawdź plik profiles.json.</p>';
                return;
            }

            profiles.forEach((profile, index) => {
                const profileCard = document.createElement('div');
                profileCard.className = 'profile-card';
                profileCard.dataset.profileKey = profile.key;
                profileCard.style.setProperty('--card-delay', `${index * 100}ms`);

                const logoPath = profile.logo || '';
                const logoHtml = logoPath
                    ? `<img src="${logoPath}" alt="${profile.name} Logo" class="profile-logo">`
                    : `<div class="profile-logo">${profile.name ? profile.name.substring(0, 1) : 'P'}</div>`;

                profileCard.innerHTML = `
                    ${logoHtml}
                    <h2 class="profile-name">${profile.name || 'Profil'}</h2>
                    <p class="profile-desc">${profile.fullName || ''}</p>
                    <button class="btn btn-primary">Zaloguj</button>
                `;

                profileCard.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    loginAs(profile.key);
                });

                profileCard.addEventListener('click', () => {
                    loginAs(profile.key);
                });

                selector.appendChild(profileCard);
            });
        } catch (error) {
            console.error('❌ Failed to populate profile selector:', error);
        }
    };

    const loginAs = async (profileKey) => {
        try {
            currentProfile = await StorageSystem.db.get(StorageSystem.db.STORES.profiles, profileKey);

            if (!currentProfile) {
                UI.Feedback.toast('Profil nie znaleziony', 'error');
                return;
            }

            if (currentProfile.theme) {
                applyTheme(currentProfile.theme);
            }

            updateUserUI();

            document.getElementById('loginScreen').classList.add('hidden');
            document.body.classList.remove('login-page');

            window.App.onLoginSuccess(currentProfile);

            UI.Feedback.toast(`Witaj, ${currentProfile.name}!`, 'success');
        } catch (error) {
            console.error('Login failed:', error);
            UI.Feedback.show('Błąd logowania', 'Nie można załadować profilu: ' + error.message, 'error');
        }
    };

    const logout = () => {
        currentProfile = null;
        document.getElementById('desktop').classList.remove('active');
        document.body.classList.add('login-page');
        setTimeout(() => {
            document.getElementById('loginScreen').classList.remove('hidden');
        }, 500);
    };

    const applyTheme = (theme) => {
        const root = document.documentElement;
        if (!root || !theme) return;

        const themeColors = {
            '--primary-500': theme.primary,
            '--primary-600': theme.accent,
            '--primary-700': theme.accent,
            '--accent-500': theme.accent,
            '--accent-600': theme.primary,
            '--shadow-glow': `0 0 40px -10px ${theme.primary}`
        };

        for (const [key, value] of Object.entries(themeColors)) {
            if (value) root.style.setProperty(key, value);
        }
    };

    const updateUserUI = () => {
        if (!currentProfile) return;
        document.getElementById('userName').textContent = currentProfile.name || 'Użytkownik';
        document.getElementById('userEmail').textContent = currentProfile.email || '';
        document.getElementById('userAvatar').textContent = (currentProfile.name || 'U').substring(0, 2).toUpperCase();
    };

    return {
        init,
        loginAs,
        logout,
        getCurrentProfile: () => currentProfile,
        applyTheme
    };
})();

window.AuthManager = AuthManager;
