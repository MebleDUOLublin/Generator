
const DomatorApp = (() => {
    const domatorApp = document.getElementById('domator-app');
    if (!domatorApp) return { init: () => {} };

    let products = [];
    let productIdCounter = 0;

    const productCountEl = document.getElementById('domatorProductCount');
    const sumNettoEl = document.getElementById('domatorSumNetto');
    const sumBruttoEl = document.getElementById('domatorSumBrutto');
    const statusEl = document.getElementById('domatorStatus');
    const totalNettoEl = document.getElementById('domatorTotalNetto');
    const totalBruttoEl = document.getElementById('domatorTotalBrutto');
    const productsBodyEl = document.getElementById('domatorProductsBody');

    const init = () => {
        console.log('🚚 Initializing Domator App...');
        bindEvents();
        loadFromStorage();
        if (products.length === 0) {
            addProduct();
        }
        updateStats();
    };

    const bindEvents = () => {
        document.getElementById('addDomatorProductBtn').addEventListener('click', addProduct);
        document.getElementById('domatorClearBtn').addEventListener('click', clearForm);
        document.getElementById('domatorSaveBtn').addEventListener('click', saveToStorage);
        document.getElementById('loadDomatorTemplateBtn').addEventListener('click', loadTemplate);
        document.getElementById('domatorExportEmailBtn').addEventListener('click', exportToEmail);
        document.getElementById('domatorExportPdfBtn').addEventListener('click', exportToPdf);
        document.getElementById('domatorCopyHtmlBtn').addEventListener('click', copyHtml);

        // Add input event listeners to all form fields for auto-saving
        domatorApp.querySelectorAll('input, textarea').forEach(el => {
            el.addEventListener('input', updateStats);
        });
    };

    const VAT_RATE = 1.23;

    // Utility to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value || 0);
    };

    const addProduct = () => {
        productIdCounter++;
        const newProduct = {
            id: productIdCounter,
            sku: '',
            ean: '',
            name: '',
            qty: 1,
            netto: 0,
            brutto: 0,
        };
        products.push(newProduct);
        renderProducts();
        updateStats();
        UI.Feedback.toast('➕ Dodano nowy produkt', 'success');
    };

    const removeProduct = async (id) => {
        if (await UI.Feedback.confirm('Czy na pewno usunąć ten produkt?')) {
            products = products.filter(p => p.id !== id);
            renderProducts();
            updateStats();
            UI.Feedback.toast('🗑️ Produkt usunięty', 'info');
        }
    };

    const renderProducts = () => {
        if (products.length === 0) {
            productsBodyEl.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state" style="padding: var(--space-8);">
                            <div class="empty-state-icon">📦</div>
                            <div class="empty-state-title">Brak produktów</div>
                            <div class="empty-state-desc">Kliknij "Dodaj produkt" aby rozpocząć</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        productsBodyEl.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: center; font-weight: 600; color: var(--gray-500);">${index + 1}</td>
                <td><input type="text" class="form-input" value="${product.sku || ''}" data-id="${product.id}" data-field="sku"></td>
                <td><input type="text" class="form-input" value="${product.ean || ''}" data-id="${product.id}" data-field="ean"></td>
                <td><input type="text" class="form-input" value="${product.name || ''}" data-id="${product.id}" data-field="name"></td>
                <td><input type="number" class="form-input" value="${product.qty}" data-id="${product.id}" data-field="qty" style="text-align: center;" min="0"></td>
                <td><input type="number" class="form-input" value="${product.netto.toFixed(2)}" data-id="${product.id}" data-field="netto" style="text-align: right;" step="0.01"></td>
                <td><input type="number" class="form-input" value="${product.brutto.toFixed(2)}" data-id="${product.id}" data-field="brutto" style="text-align: right;" step="0.01"></td>
                <td style="text-align: center;">
                    <button class="btn btn-danger btn-sm">
                        <span style="font-size: 1.2rem;">🗑️</span>
                    </button>
                </td>
            `;
            row.querySelector('button').addEventListener('click', () => removeProduct(product.id));
            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', handleProductInputChange);
            });
            productsBodyEl.appendChild(row);
        });
    };

    const handleProductInputChange = (e) => {
        const { id, field } = e.target.dataset;
        const value = e.target.value;
        const product = products.find(p => p.id === parseInt(id));

        if (product) {
            const numericValue = parseFloat(value) || 0;
            if (field === 'qty') product.qty = parseInt(value) || 0;
            else if (field === 'netto') product.netto = numericValue;
            else if (field === 'brutto') product.brutto = numericValue;
            else product[field] = value;

            if (field === 'netto') {
                product.brutto = product.netto * VAT_RATE;
                const bruttoInput = e.target.parentElement.nextElementSibling.querySelector('input');
                if (bruttoInput) bruttoInput.value = product.brutto.toFixed(2);
            } else if (field === 'brutto') {
                product.netto = product.brutto / VAT_RATE;
                const nettoInput = e.target.parentElement.previousElementSibling.querySelector('input');
                if (nettoInput) nettoInput.value = product.netto.toFixed(2);
            }
        }
        updateStats();
    };

    const updateStats = () => {
        let totalNetto = 0;
        let totalBrutto = 0;
        let totalItems = 0;

        products.forEach(p => {
            const qty = p.qty || 0;
            totalNetto += (p.netto || 0) * qty;
            totalBrutto += (p.brutto || 0) * qty;
            totalItems += qty;
        });

        productCountEl.textContent = totalItems;
        sumNettoEl.textContent = formatCurrency(totalNetto);
        sumBruttoEl.textContent = formatCurrency(totalBrutto);
        totalNettoEl.textContent = formatCurrency(totalNetto);
        totalBruttoEl.textContent = formatCurrency(totalBrutto);

        const clientName = document.getElementById('domatorClientName').value.trim();
        if (clientName && totalItems > 0) {
            statusEl.innerHTML = '<span class="badge badge-success">Gotowe</span>';
        } else if (clientName || totalItems > 0) {
            statusEl.innerHTML = '<span class="badge badge-warning">W edycji</span>';
        } else {
            statusEl.innerHTML = '<span class="badge">Nowe</span>';
        }

        saveToStorage();
    };

    const clearForm = async () => {
        if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić cały formularz zamówienia? Tej operacji nie można cofnąć.')) {
            products = [];
            productIdCounter = 0;
            const formElements = domatorApp.querySelectorAll('input, textarea');
            formElements.forEach(el => {
                if (el.type !== 'button' && el.type !== 'submit') {
                    el.value = '';
                }
            });
            renderProducts();
            addProduct();
            updateStats();
            UI.Feedback.toast('🗑️ Formularz został wyczyszczony', 'warning');
        }
    };

    const collectData = () => {
        const data = {
            client: {
                name: document.getElementById('domatorClientName').value,
                street: document.getElementById('domatorStreet').value,
                postCode: document.getElementById('domatorPostCode').value,
                city: document.getElementById('domatorCity').value,
                phone: document.getElementById('domatorPhone').value,
                email: document.getElementById('domatorEmail').value,
            },
            products: products,
            notes: document.getElementById('domatorNotes').value,
        };
        return data;
    };

    const saveToStorage = async () => {
        const data = collectData();
        await StorageSystem.db.set(StorageSystem.db.STORES.domator, { id: 'domatorOrder', ...data });
    };

    const loadFromStorage = async () => {
        const data = await StorageSystem.db.get(StorageSystem.db.STORES.domator, 'domatorOrder');
        if (data) {
            if (data.client) {
                for (const key in data.client) {
                    const el = document.getElementById(`domatorClient${key.charAt(0).toUpperCase() + key.slice(1)}`);
                    if (el) el.value = data.client[key];
                }
            }
            if (data.products && data.products.length > 0) {
                products = data.products;
                productIdCounter = Math.max(...products.map(p => p.id));
                renderProducts();
            }
            if(data.notes){
                 document.getElementById('domatorNotes').value = data.notes;
            }
        }
        updateStats();
    };

    const loadTemplate = () => {
        document.getElementById('domatorClientName').value = 'Jan Kowalski';
        document.getElementById('domatorStreet').value = 'ul. Przykładowa 123';
        document.getElementById('domatorPostCode').value = '00-001';
        document.getElementById('domatorCity').value = 'Warszawa';
        document.getElementById('domatorPhone').value = '+48 123 456 789';
        document.getElementById('domatorEmail').value = 'jan.kowalski@example.com';

        products = [
            { id: 1, sku: 'DIABLO-X-RAY-2.0', ean: '5902560334231', name: 'Fotel gamingowy Diablo X-Ray 2.0 Normal Size', qty: 2, netto: 899.00, brutto: 1105.77 },
            { id: 2, sku: 'DIABLO-V-COMMANDER', ean: '5902560334248', name: 'Fotel biurowy Diablo V-Commander', qty: 1, netto: 1299.00, brutto: 1597.77 },
        ];
        productIdCounter = 2;

        renderProducts();
        updateStats();
        UI.Feedback.toast('📋 Szablon wczytany', 'success');
    };

    const generateHtmlOrder = (data) => {
        let productRows = data.products.map((p, index) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${p.sku}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${p.ean || ''}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.qty}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.netto.toFixed(2)} zł</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.brutto.toFixed(2)} zł</td>
            </tr>
        `).join('');

        let totalNetto = data.products.reduce((sum, p) => sum + p.netto * p.qty, 0);
        let totalBrutto = data.products.reduce((sum, p) => sum + p.brutto * p.qty, 0);

        return `
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
            <thead>
                <tr>
                    <th colspan="7" style="background-color: #f2f2f2; padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">
                        <h2 style="margin: 0; font-size: 1.5em;">Zamówienie</h2>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="4" style="padding: 12px; vertical-align: top;">
                        <h3 style="margin-top: 0; color: #333;">Adres dostawy:</h3>
                        <p style="margin: 0;">
                            <strong>${data.client.name}</strong><br>
                            ${data.client.street}<br>
                            ${data.client.postCode} ${data.client.city}<br>
                            Tel: ${data.client.phone}<br>
                            Email: ${data.client.email}
                        </p>
                    </td>
                    <td colspan="3" style="padding: 12px; vertical-align: top; text-align: right;">
                        <h3 style="margin-top: 0; color: #333;">Data zamówienia:</h3>
                        <p style="margin: 0;">${new Date().toLocaleDateString('pl-PL')}</p>
                    </td>
                </tr>
                <tr>
                    <td colspan="7" style="padding: 12px;">
                        <h3 style="margin-top: 16px; margin-bottom: 8px; color: #333;">📦 Lista produktów:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f8f8f8;">
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">#</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">SKU</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">EAN</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nazwa</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Ilość</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Cena netto</th>
                                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Cena brutto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productRows}
                            </tbody>
                            <tfoot>
                                <tr style="font-weight: bold; background-color: #f8f8f8;">
                                    <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right;">SUMA:</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalNetto.toFixed(2)} zł</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalBrutto.toFixed(2)} zł</td>
                                </tr>
                            </tfoot>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="7" style="padding: 12px;">
                        <h3 style="margin-top: 0; color: #333;">Dodatkowe informacje:</h3>
                        <p style="margin: 0; border: 1px solid #ddd; padding: 8px; background-color: #fdfdfd;">
                            ${data.notes || 'Brak uwag.'}
                        </p>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="7" style="padding: 12px; text-align: center; font-size: 0.9em; color: #777;">
                        <p>Dziękujemy za złożenie zamówienia!</p>
                    </td>
                </tr>
            </tfoot>
        </table>
        `;
    };

    const exportToEmail = () => {
        const data = collectData();
        if (!data.client.name || data.products.length === 0) {
            UI.Feedback.toast('Wypełnij dane klienta i dodaj produkty.', 'error');
            return;
        }

        const subject = `Zamówienie ${data.client.name}`;
        const body = generateHtmlOrder(data);

        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        UI.Feedback.toast('✉️ Przygotowano maila', 'success');
    };

    const exportToPdf = () => {
        const data = collectData();
        if (!data.client.name || data.products.length === 0) {
            UI.Feedback.toast('Wypełnij dane klienta i dodaj produkty.', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Zamówienie', 14, 22);

        doc.setFontSize(12);
        doc.text('Adres dostawy:', 14, 32);
        doc.text(data.client.name, 14, 38);
        doc.text(data.client.street, 14, 44);
        doc.text(`${data.client.postCode} ${data.client.city}`, 14, 50);
        doc.text(`Tel: ${data.client.phone}`, 14, 56);
        doc.text(`Email: ${data.client.email}`, 14, 62);

        const tableColumn = ["#", "SKU", "Nazwa produktu", "Ilość", "Cena netto", "Cena brutto"];
        const tableRows = [];

        data.products.forEach((p, index) => {
            const productData = [
                index + 1,
                p.sku,
                p.name,
                p.qty,
                `${p.netto.toFixed(2)} zł`,
                `${p.brutto.toFixed(2)} zł`
            ];
            tableRows.push(productData);
        });

        doc.autoTable(tableColumn, tableRows, { startY: 75 });

        let finalY = doc.lastAutoTable.finalY || 75;
        doc.setFontSize(12);
        doc.text('Dodatkowe informacje:', 14, finalY + 10);
        doc.text(data.notes || 'Brak uwag.', 14, finalY + 16);

        doc.save(`Zamowienie_${data.client.name.replace(/ /g, '_')}.pdf`);
        UI.Feedback.toast('📄 Wygenerowano PDF', 'success');
    };

    const copyHtml = () => {
        const data = collectData();
        if (!data.client.name || data.products.length === 0) {
            UI.Feedback.toast('Wypełnij dane klienta i dodaj produkty.', 'error');
            return;
        }

        const html = generateHtmlOrder(data);
        const blob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({ 'text/html': blob });

        navigator.clipboard.write([item]).then(() => {
            UI.Feedback.toast('📋 Skopiowano HTML do schowka', 'success');
        }, (err) => {
            console.error('Clipboard write failed:', err);
            UI.Feedback.toast('Nie udało się skopiować HTML', 'error');
        });
    };

    return {
        init,
    };
})();
