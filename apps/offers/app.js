import { state } from '/js/state.js';

let pastedImageData = null;

function handlePaste(event) {
    const offerWindow = document.getElementById('window-offers');
    // Proceed only if the offers window is active and visible
    if (!offerWindow || offerWindow.style.display === 'none' || !offerWindow.classList.contains('focused')) {
        return;
    }

    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                pastedImageData = e.target.result;
                showPasteImageModal(pastedImageData);
            };
            reader.readAsDataURL(file);
            event.preventDefault(); // Prevent the browser's default paste behavior
        }
    }
}

function showPasteImageModal(imageData) {
    // First, remove any existing modal
    const existingModal = document.getElementById('pasteImageModal');
    if (existingModal) {
        existingModal.remove();
    }

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
            <p>Do którego produktu chcesz przypisać ten obraz?</p>
            <div class="paste-image-preview" style="text-align: center; margin: 1rem 0;">
                <img src="${imageData}" alt="Pasted image preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
            </div>
            <div class="paste-image-actions">
                <div class="form-group">
                    <label for="pasteProductSelect">Wybierz produkt z listy:</label>
                    <select class="form-select" id="pasteProductSelect">
                        <option value="">-- Wybierz --</option>
                        ${productOptions}
                    </select>
                </div>
                <button class="btn btn-primary" id="pasteToSelectedProductBtn" disabled>Przypisz do wybranego produktu</button>
            </div>
            <button class="btn btn-outline" style="margin-top: 1rem;" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
        </div>
    `;

    document.body.appendChild(modal);

    const select = modal.querySelector('#pasteProductSelect');
    const pasteBtn = modal.querySelector('#pasteToSelectedProductBtn');

    select.addEventListener('change', () => {
        pasteBtn.disabled = !select.value;
    });

    pasteBtn.addEventListener('click', () => {
        const productId = select.value;
        if (productId) {
            // This is a simplified way to update the image.
            // A more robust solution would use the command pattern like in the original app.js.
            state.productImages[productId] = pastedImageData;
            const preview = document.getElementById(`productImagePreview-${productId}`);
            if (preview) {
                preview.innerHTML = `<img src="${pastedImageData}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            }
            modal.remove();
        }
    });
}

export function init() {
    console.log("Offer Generator App Initialized");
    // Add the paste event listener to the document
    document.addEventListener('paste', handlePaste);
}
