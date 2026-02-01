// src/apps/domator/main.js

(function() {
    let appProfile = null;
    let appWindow = null;
    let products = [];
    let autosaveTimer = null;
    const VAT_RATE = 0.23;

    const $ = (selector) => appWindow.querySelector(selector);
    const $$ = (selector) => appWindow.querySelectorAll(selector);

    async function init(profile, windowEl) {
        console.log("Domator App Initialized");
        appProfile = profile;
        appWindow = windowEl;

        bindEvents();
        await loadState();
        updateUI();
    }

    function bindEvents() {
        $('#addDomatorProductBtn')?.addEventListener('click', () => addProduct());
        $('#domatorClearBtn')?.addEventListener('click', () => clearForm());
        $('#domatorSaveBtn')?.addEventListener('click', () => saveState(true));

        // Autosave on input change for address fields
        const fieldsToAutosave = [
            'domatorClientName', 'domatorStreet', 'domatorPostCode',
            'domatorCity', 'domatorPhone', 'domatorEmail', 'domatorNotes'
        ];

        fieldsToAutosave.forEach(id => {
            $(`#${id}`)?.addEventListener('input', () => scheduleAutosave());
        });

        // Additional buttons
        $('#domatorExportEmailBtn')?.addEventListener('click', exportToEmail);
        $('#domatorExportPdfBtn')?.addEventListener('click', () => UI.Feedback.toast('Generowanie PDF będzie dostępne wkrótce', 'info'));
        $('#domatorCopyHtmlBtn')?.addEventListener('click', copyHtml);
        $('#loadDomatorTemplateBtn')?.addEventListener('click', loadTemplate);
    }

    function addProduct(product = { sku: '', ean: '', name: '', qty: 1, netto: 0 }) {
        products.push(product);
        updateUI();
        scheduleAutosave();
    }

    function removeProduct(index) {
        products.splice(index, 1);
        updateUI();
        scheduleAutosave();
    }

    function updateUI() {
        const body = $('#domatorProductsBody');
        if (!body) return;

        body.innerHTML = '';
        let totalNet = 0;

        products.forEach((p, index) => {
            const row = document.createElement('tr');
            const netto = parseFloat(p.netto) || 0;
            const brutto = netto * (1 + VAT_RATE);
            totalNet += netto * (parseInt(p.qty) || 0);

            row.innerHTML = `
                <td style="text-align: center;">${index + 1}</td>
                <td><input type="text" class="form-input-table" data-index="${index}" data-field="sku" value="${p.sku}"></td>
                <td><input type="text" class="form-input-table" data-index="${index}" data-field="ean" value="${p.ean}"></td>
                <td><input type="text" class="form-input-table" data-index="${index}" data-field="name" value="${p.name}"></td>
                <td style="text-align: center;"><input type="number" class="form-input-table" style="text-align: center;" data-index="${index}" data-field="qty" value="${p.qty}"></td>
                <td style="text-align: right;"><input type="number" step="0.01" class="form-input-table" style="text-align: right;" data-index="${index}" data-field="netto" value="${netto.toFixed(2)}"></td>
                <td style="text-align: right; padding: 4px 8px; font-size: 0.85rem;">${brutto.toFixed(2)} zł</td>
                <td style="text-align: center;"><button class="btn btn-sm btn-danger" data-index="${index}">&times;</button></td>
            `;

            body.appendChild(row);
        });

        const totalBrutto = totalNet * (1 + VAT_RATE);

        if ($('#domatorProductCount')) $('#domatorProductCount').textContent = products.length;
        if ($('#domatorSumNetto')) $('#domatorSumNetto').textContent = `${totalNet.toFixed(2)} zł`;
        if ($('#domatorSumBrutto')) $('#domatorSumBrutto').textContent = `${totalBrutto.toFixed(2)} zł`;
        if ($('#domatorTotalNetto')) $('#domatorTotalNetto').textContent = `${totalNet.toFixed(2)} zł`;
        if ($('#domatorTotalBrutto')) $('#domatorTotalBrutto').textContent = `${totalBrutto.toFixed(2)} zł`;

        // Add event listeners for new inputs
        body.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => handleProductInputChange(e));
        });
        body.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (btn) removeProduct(parseInt(btn.dataset.index));
            });
        });
    }

    function handleProductInputChange(e) {
        const { index, field } = e.target.dataset;
        let value = e.target.value;
        if (field === 'netto' || field === 'qty') value = parseFloat(value) || 0;

        products[index][field] = value;

        if (field === 'netto' || field === 'qty') {
            updateUI(); // Full update to recalculate sums
        }
        scheduleAutosave();
    }

    function scheduleAutosave() {
        const statusEl = $('#domatorStatus');
        if (statusEl) statusEl.textContent = '💾 Zapisywanie...';

        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
            saveState();
            if (statusEl) statusEl.textContent = '✅ Zapisano';
        }, 1500);
    }

    async function saveState(manual = false) {
        if (!appProfile) return;

        const state = {
            id: `domator_${appProfile.key}`,
            profileKey: appProfile.key,
            clientName: $('#domatorClientName')?.value,
            street: $('#domatorStreet')?.value,
            postCode: $('#domatorPostCode')?.value,
            city: $('#domatorCity')?.value,
            phone: $('#domatorPhone')?.value,
            email: $('#domatorEmail')?.value,
            notes: $('#domatorNotes')?.value,
            products: products,
            timestamp: new Date().toISOString()
        };

        try {
            await StorageSystem.db.set(StorageSystem.db.STORES.domator, state);
            if (manual) UI.Feedback.toast('Stan aplikacji Domator został zapisany.', 'success');
        } catch (error) {
            console.error("Domator save error:", error);
            if (manual) UI.Feedback.show('Błąd', 'Nie udało się zapisać stanu.', 'error');
        }
    }

    async function loadState() {
        if (!appProfile) return;

        try {
            const state = await StorageSystem.db.get(StorageSystem.db.STORES.domator, `domator_${appProfile.key}`);
            if (state) {
                if ($('#domatorClientName')) $('#domatorClientName').value = state.clientName || '';
                if ($('#domatorStreet')) $('#domatorStreet').value = state.street || '';
                if ($('#domatorPostCode')) $('#domatorPostCode').value = state.postCode || '';
                if ($('#domatorCity')) $('#domatorCity').value = state.city || '';
                if ($('#domatorPhone')) $('#domatorPhone').value = state.phone || '';
                if ($('#domatorEmail')) $('#domatorEmail').value = state.email || '';
                if ($('#domatorNotes')) $('#domatorNotes').value = state.notes || '';
                products = state.products || [];
                console.log("Domator state loaded from StorageSystem.");
            }
        } catch (error) {
            console.error("Domator load error:", error);
        }
    }

    async function clearForm() {
        if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić cały formularz?')) {
            products = [];
            const fieldsToClear = [
                'domatorClientName', 'domatorStreet', 'domatorPostCode',
                'domatorCity', 'domatorPhone', 'domatorEmail', 'domatorNotes'
            ];
            fieldsToClear.forEach(id => {
                const el = $(`#${id}`);
                if (el) el.value = '';
            });
            updateUI();
            saveState();
            UI.Feedback.toast('Formularz wyczyszczony', 'info');
        }
    }

    function exportToEmail() {
        const clientName = $('#domatorClientName')?.value || 'Klient';
        const subject = encodeURIComponent(`Zamówienie Domator - ${clientName}`);

        let bodyText = `Dane dostawy:\n`;
        bodyText += `${$('#domatorClientName')?.value}\n`;
        bodyText += `${$('#domatorStreet')?.value}\n`;
        bodyText += `${$('#domatorPostCode')?.value} ${$('#domatorCity')?.value}\n`;
        bodyText += `Tel: ${$('#domatorPhone')?.value}\n\n`;
        bodyText += `Lista produktów:\n`;

        products.forEach((p, i) => {
            bodyText += `${i+1}. ${p.name} (SKU: ${p.sku}) - ${p.qty} szt. x ${p.netto} zł netto\n`;
        });

        bodyText += `\nUwagi: ${$('#domatorNotes')?.value}\n`;

        window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`);
    }

    function copyHtml() {
        let html = `<table border="1" style="border-collapse: collapse; width: 100%;">`;
        html += `<tr style="background: #eee;"><th>#</th><th>Nazwa</th><th>SKU</th><th>Ilość</th><th>Cena netto</th></tr>`;
        products.forEach((p, i) => {
            html += `<tr><td>${i+1}</td><td>${p.name}</td><td>${p.sku}</td><td>${p.qty}</td><td>${p.netto} zł</td></tr>`;
        });
        html += `</table>`;

        navigator.clipboard.writeText(html).then(() => {
            UI.Feedback.toast('HTML skopiowany do schowka', 'success');
        });
    }

    function loadTemplate() {
        const templateProducts = [
            { sku: 'DOM-001', ean: '5901234567890', name: 'Krzesło Biurowe Ergonomic', qty: 1, netto: 450.00 },
            { sku: 'DOM-002', ean: '5901234567891', name: 'Biurko Regulowane Loft', qty: 1, netto: 1200.00 }
        ];
        products = templateProducts;
        updateUI();
        UI.Feedback.toast('Załadowano szablon przykładowy', 'info');
    }

    window.DomatorApp = { init };
})();
