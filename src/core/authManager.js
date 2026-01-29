// src/core/authManager.js
// Manages user authentication and profile loading.

const AuthManager = {
    async populateProfileSelector() {
        try {
            const profiles = await StorageSystem.ProfileManager.getAllProfiles();
            console.log('Profiles fetched for UI rendering:', JSON.stringify(profiles, null, 2));

            if (!profiles || profiles.length === 0) {
                console.warn('⚠️ No profiles found in DB for UI rendering.');
                const selector = document.querySelector('.profile-selector');
                if(selector) selector.innerHTML = '<p style="color: white;">Nie znaleziono profili. Sprawdź plik profiles.json i konsolę.</p>';
                return;
            }

            const selector = document.querySelector('.profile-selector');
            if (!selector) {
                console.error('Profile selector element not found in HTML');
                return;
            }

            selector.innerHTML = '';

            profiles.forEach((profile, index) => {
                const profileCard = document.createElement('div');
                profileCard.className = 'profile-card';
                profileCard.dataset.profileKey = profile.key;
                if (profile.key === 'pesteczka') {
                    profileCard.id = 'pesteczka-profile-card';
                }
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
                    this.loginAs(profile.key);
                });

                profileCard.addEventListener('click', () => {
                    this.loginAs(profile.key);
                });

                selector.appendChild(profileCard);
            });
        } catch (error) {
            console.error('❌ Failed to populate profile selector:', error);
            const selector = document.querySelector('.profile-selector');
            if(selector) selector.innerHTML = '<p style="color: red;">Błąd ładowania profili. Sprawdź konsolę.</p>';
        }
    },

    async loginAs(profileKey) {
        try {
            currentProfile = await StorageSystem.db.get(StorageSystem.db.STORES.profiles, profileKey);

            if (!currentProfile) {
                UI.Feedback.show('Błąd', 'Profil nie znaleziony', 'error');
                return;
            }

            // Apply the theme BEFORE rendering the rest of the UI
            if (currentProfile.theme) {
                console.log("Applying theme:", currentProfile.theme);
                applyTheme(currentProfile.theme);
            } else {
                console.log("No theme found for profile. Using default.");
            }

            document.getElementById('userName').textContent = currentProfile.name || 'Użytkownik';
            document.getElementById('userEmail').textContent = currentProfile.email || '';
            document.getElementById('userAvatar').textContent = (currentProfile.name || 'U').substring(0, 2).toUpperCase();

            if (!currentProfile.logoData && currentProfile.logo) {
                await this.loadLogoAsBase64(currentProfile.logo);
            } else if (!currentProfile.logoData) {
                this.setLogoPlaceholder();
            }

            document.getElementById('loginScreen').classList.add('hidden');
            document.body.classList.remove('login-page');
            // Setup the main UI and apply wallpaper only AFTER login is successful
            setupUI();
            DesktopManager.applySavedWallpaper();

            document.getElementById('desktop').classList.add('active');
            UI.Feedback.toast(`Witaj, ${currentProfile.name}!`, 'success');
            DesktopManager.renderUIForProfile();
        } catch (error) {
            console.error('Login failed:', error);
            UI.Feedback.show('Błąd logowania', 'Nie można załadować profilu: ' + error.message, 'error');
        }
    },

    logout() {
        currentProfile = null;
        document.getElementById('desktop').classList.remove('active');
        document.body.classList.add('login-page');
        setTimeout(() => {
            document.getElementById('loginScreen').classList.remove('hidden');
        }, 500);
    },

    async loadLogoAsBase64(logoPath) {
        try {
            const response = await fetch(logoPath);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = () => {
                    currentProfile.logoData = reader.result;
                    StorageSystem.db.set(StorageSystem.db.STORES.profiles, currentProfile);
                    resolve(reader.result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn(`⚠️ Could not load logo from path "${logoPath}". Using placeholder.`);
            this.setLogoPlaceholder();
        }
    },

    setLogoPlaceholder() {
        if (!currentProfile) return;

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = currentProfile.color || '#dc2626';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((currentProfile.name || 'U').substring(0, 2).toUpperCase(), 100, 50);

        currentProfile.logoData = canvas.toDataURL('image/png');
    }
};
