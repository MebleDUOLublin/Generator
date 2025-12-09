
import { state } from './state.js';
import { generateOfferNumber, setTodayDate, showNotification } from './utils.js';
import { setupDesktopInteractions } from './uiManager.js';

export async function populateProfileSelector() {
    console.log('2a. Inside populateProfileSelector');
    try {
        const profiles = await StorageSystem.ProfileManager.getAllProfiles();
        console.log('2b. Profiles fetched from DB:', profiles);

        if (!profiles || profiles.length === 0) {
            console.warn('⚠️ No profiles found in DB.');
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

        profiles.forEach(profile => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            profileCard.onclick = () => loginAs(profile.key);

            const logoInitial = profile.name ? profile.name.substring(0, 1) : 'P';

            profileCard.innerHTML = `
                <div class="profile-logo">${logoInitial}</div>
                <h2 class="profile-name">${profile.name || 'Profil'}</h2>
                <p class="profile-desc">${profile.fullName || ''}</p>
            `;
            selector.appendChild(profileCard);
        });
        console.log('2c. ✅ Profile selector populated.');
    } catch (error) {
        console.error('❌ Failed to populate profile selector:', error);
        const selector = document.querySelector('.profile-selector');
        if(selector) selector.innerHTML = '<p style="color: red;">Błąd ładowania profili. Sprawdź konsolę.</p>';
    }
}

export async function loginAs(profileKey) {
    try {
        console.log('🔐 Logging in as:', profileKey);
        state.currentProfile = await StorageSystem.db.get(StorageSystem.db.STORES.profiles, profileKey);

        if (!state.currentProfile) {
            showNotification('Błąd', 'Profil nie znaleziony', 'error');
            return;
        }

        console.log('✅ Profile loaded:', state.currentProfile);

        const fieldMap = {
            sellerName: state.currentProfile.fullName,
            sellerNIP: state.currentProfile.nip,
            sellerAddress: state.currentProfile.address,
            sellerPhone: state.currentProfile.phone,
            sellerEmail: state.currentProfile.email,
            sellerBank: state.currentProfile.bankAccount,
            sellerContact: state.currentProfile.sellerName,
        };

        for (const [id, value] of Object.entries(fieldMap)) {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        }

        document.getElementById('userName').textContent = state.currentProfile.name || 'Użytkownik';
        document.getElementById('userEmail').textContent = state.currentProfile.email || '';
        document.getElementById('userAvatar').textContent = (state.currentProfile.name || 'U').substring(0, 2).toUpperCase();

        if (!state.currentProfile.logoData && state.currentProfile.logo) {
            await loadLogoAsBase64(state.currentProfile.logo);
        } else if (!state.currentProfile.logoData) {
            setLogoPlaceholder();
        }

        generateOfferNumber();
        setTodayDate();

        document.getElementById('loginScreen').classList.add('hidden');
        document.body.classList.remove('login-page');
        setTimeout(() => {
            document.getElementById('desktop').classList.add('active');
            showNotification('Witaj!', `Zalogowano jako ${state.currentProfile.name}`, 'success');
        }, 500);

        renderDesktop();

    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Błąd logowania', 'Nie można załadować profilu: ' + error.message, 'error');
    }
}

export function logout() {
    state.currentProfile = null;
    document.getElementById('desktop').classList.remove('active');
    setTimeout(() => {
        document.getElementById('loginScreen').classList.remove('hidden');
    }, 500);
}

async function loadLogoAsBase64(logoPath) {
    try {
        const response = await fetch(logoPath);
        if (!response.ok) throw new Error('Network response was not ok.');
        const blob = await response.blob();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                state.currentProfile.logoData = reader.result;
                StorageSystem.db.set(StorageSystem.db.STORES.profiles, state.currentProfile);
                console.log('✅ Logo loaded and converted to Base64');
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn(`⚠️ Could not load logo from path "${logoPath}". Using placeholder.`);
        setLogoPlaceholder();
    }
}

function setLogoPlaceholder() {
    if (!state.currentProfile) return;

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = state.currentProfile.color || '#dc2626';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((state.currentProfile.name || 'U').substring(0, 2).toUpperCase(), 100, 50);

    state.currentProfile.logoData = canvas.toDataURL('image/png');
    console.log('✅ Logo placeholder created');
}

function renderDesktop() {
    const { desktopIcons, startMenuItems } = state.currentProfile;

    const desktopIconsContainer = document.getElementById('desktopIcons');
    desktopIconsContainer.innerHTML = '';
    desktopIcons.forEach(icon => {
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.dataset.window = icon.id;
        iconEl.tabIndex = 0;
        iconEl.role = 'button';
        iconEl.setAttribute('aria-label', `Otwórz ${icon.name}`);
        iconEl.innerHTML = `
            <div class="desktop-icon-image">${icon.icon}</div>
            <div class="desktop-icon-name">${icon.name}</div>
        `;
        desktopIconsContainer.appendChild(iconEl);
    });

    const startMenuAppsContainer = document.getElementById('startMenuApps');
    startMenuAppsContainer.innerHTML = '';
    startMenuItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'start-app';
        itemEl.dataset.window = item.id;
        itemEl.tabIndex = 0;
        itemEl.role = 'menuitem';
        itemEl.innerHTML = `
            <div class="start-app-icon">${item.icon}</div>
            <div class="start-app-name">${item.name}</div>
        `;
        startMenuAppsContainer.appendChild(itemEl);
    });

    setupDesktopInteractions();
}
