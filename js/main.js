
import { populateProfileSelector } from './profileManager.js';
import { setupDesktopInteractions, setupTaskbarAndStartMenu, changeWallpaper } from './uiManager.js';
import { handleWindowDrag, stopWindowDrag, focusWindow, startDrag, handleWindowAction } from './windowManager.js';
import { updateClock } from './utils.js';
import { state } from './state.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Pesteczka OS Main App Script Started');

    try {
        console.log('1. Awaiting Storage System initialization...');
        if (window.StorageSystem && typeof window.StorageSystem.init === 'function') {
            await window.StorageSystem.init();
        }

        console.log('2. Populating profile selector...');
        await populateProfileSelector();

        console.log('3. Setting up core UI...');
        setupUI();

        console.log('✅ Pesteczka OS Initialized Successfully');
    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        const loginSubtitle = document.querySelector('.login-subtitle');
        if (loginSubtitle) {
            loginSubtitle.innerHTML = '<span style="color: #ef4444;">Błąd krytyczny. Sprawdź konsolę (F12).</span>';
        }
    }
});

function setupUI() {
    console.log('🎨 Setting up UI event listeners...');

    updateClock();
    setInterval(updateClock, 1000);

    setupDesktopInteractions();
    setupTaskbarAndStartMenu();
    setupWindowManagement();
    setupGlobalEventListeners();

    console.log('✅ All UI event listeners attached!');
}

function setupWindowManagement() {
    document.getElementById('desktop').addEventListener('mousedown', (e) => {
        const win = e.target.closest('.window');
        if (!win) return;

        focusWindow(win);

        const header = e.target.closest('.window-header');
        if (header && !e.target.closest('.window-control-btn')) {
            const windowId = win.id.replace('window-', '');
            startDrag(e, windowId);
        }
    });

    document.getElementById('desktop').addEventListener('click', (e) => {
        const controlBtn = e.target.closest('.window-control-btn');
        if (controlBtn) {
            e.stopPropagation();
            const win = controlBtn.closest('.window');
            const windowId = win.id.replace('window-', '');
            handleWindowAction(controlBtn.dataset.action, windowId);
        }
    });
}

function setupGlobalEventListeners() {
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('startMenu');
        const startBtn = document.getElementById('startBtn');
        if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.classList.remove('active');
        }
        document.getElementById('contextMenu')?.classList.remove('active');
    });

    document.addEventListener('mousemove', handleWindowDrag);
    document.addEventListener('mouseup', stopWindowDrag);
    document.addEventListener('keydown', handleGlobalHotkeys);
    document.addEventListener('paste', handlePaste);
}

function handlePaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                state.pastedImageData = e.target.result;
                showPasteImageModal(state.pastedImageData);
            };
            reader.readAsDataURL(file);
        }
    }
}

function showPasteImageModal(imageData) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'pasteImageModal';

    const productOptions = state.products.map(id => {
        const name = document.getElementById(`productName-${id}`)?.value || `Produkt #${id}`;
        return `<option value="${id}">${name}</option>`;
    }).join('');

    modal.innerHTML = `
        <div class="modal-content" style="width: 500px;">
            <h2>Wklejony obraz</h2>
            <p>Co chcesz zrobić z tym obrazem?</p>
            <div class="paste-image-preview">
                <img src="${imageData}" alt="Pasted image preview">
            </div>
            <div class="paste-image-actions">
                <button class="btn btn-primary" id="pasteToNewProductBtn">Utwórz nowy produkt</button>
                <div class="paste-to-existing">
                    <select class="form-select" id="pasteProductSelect">
                        <option value="">Wybierz produkt...</option>
                        ${productOptions}
                    </select>
                    <button class="btn btn-secondary" id="pasteToExistingProductBtn" disabled>Wklej do istniejącego</button>
                </div>
            </div>
            <button class="btn btn-outline" style="margin-top: 1rem;" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
        </div>
    `;

    document.body.appendChild(modal);

    const select = modal.querySelector('#pasteProductSelect');
    const pasteToExistingBtn = modal.querySelector('#pasteToExistingProductBtn');
    const pasteToNewProductBtn = modal.querySelector('#pasteToNewProductBtn');

    select.addEventListener('change', () => {
        pasteToExistingBtn.disabled = !select.value;
    });

    pasteToNewProductBtn.addEventListener('click', () => {
        addProduct({ image: imageData });
        modal.remove();
    });

    pasteToExistingBtn.addEventListener('click', () => {
        const productId = select.value;
        if (productId) {
            const oldImage = state.productImages[productId];
            const command = new UpdateProductImageCommand(productId, imageData, oldImage, state.productImages);
            UI.Command.execute(command);
            modal.remove();
        }
    });
}

function handleGlobalHotkeys(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveOffer();
    }
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        generatePDF();
    }
    if (e.key === 'Escape') {
        document.getElementById('startMenu')?.classList.remove('active');
    }
}

// On load, check for saved wallpaper
document.addEventListener('DOMContentLoaded', () => {
    const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper');
    if (savedWallpaper) {
        changeWallpaper(savedWallpaper);
        const activePreview = document.querySelector(`.wallpaper-preview[data-wallpaper="${savedWallpaper}"]`);
        if (activePreview) {
            activePreview.classList.add('active');
        }
    } else {
        const defaultPreview = document.querySelector('.wallpaper-preview[data-wallpaper="default"]');
        if (defaultPreview) {
            defaultPreview.classList.add('active');
        }
    }
});
