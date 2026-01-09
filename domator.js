
const DomatorApp = (() => {
    const domatorApp = document.getElementById('domator-app');
    if (!domatorApp) return { init: () => {} };

    const VAT_RATE = 1.23;
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

    const removeProduct = (id) => {
        if (confirm('Czy na pewno usunąć ten produkt?')) {
            products = products.filter(p => p.id !== id);
            renderProducts();
            updateStats();
            UI.Feedback.toast('🗑️ Produkt usunięty', 'info');
        }
    };

    const renderProducts = () => {
        productsBodyEl.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                <td><input type="text" class="form-input" value="${product.sku}" data-id="${product.id}" data-field="sku"></td>
                <td><input type="text" class="form-input" value="${product.ean || ''}" data-id="${product.id}" data-field="ean"></td>
                <td><input type="text" class="form-input" value="${product.name}" data-id="${product.id}" data-field="name"></td>
                <td><input type="number" class="form-input" value="${product.qty}" data-id="${product.id}" data-field="qty" style="text-align: center;"></td>
                <td><input type="number" class="form-input" value="${product.netto.toFixed(2)}" data-id="${product.id}" data-field="netto" style="text-align: right;"></td>
                <td><input type="number" class="form-input" value="${product.brutto.toFixed(2)}" data-id="${product.id}" data-field="brutto" style="text-align: right;"></td>
                <td style="text-align: center;">
                    <button class="btn btn-danger btn-sm">Usuń</button>
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
        let value = e.target.value;
        const product = products.find(p => p.id === parseInt(id));

        if (!product) return;

        // Walidacja dla pól numerycznych
        if (field === 'qty' || field === 'netto' || field === 'brutto') {
            const parsedValue = parseFloat(value);
            if (isNaN(parsedValue) || parsedValue < 0) {
                value = 0;
                e.target.value = value.toFixed(2);
            } else {
                value = parsedValue;
            }
        }

        product[field] = value;

        const row = e.target.closest('tr');
        const nettoInput = row.querySelector('[data-field="netto"]');
        const bruttoInput = row.querySelector('[data-field="brutto"]');

        // Dwukierunkowe obliczanie ceny netto/brutto
        if (field === 'netto') {
            product.brutto = product.netto * VAT_RATE;
            if (bruttoInput) bruttoInput.value = product.brutto.toFixed(2);
        } else if (field === 'brutto') {
            product.netto = product.brutto / VAT_RATE;
            if (nettoInput) nettoInput.value = product.netto.toFixed(2);
        }

        updateStats();
    };

    const updateStats = () => {
        let totalNetto = 0;
        let totalBrutto = 0;
        let totalQty = 0;

        products.forEach(p => {
            totalNetto += (p.netto || 0) * (p.qty || 0);
            totalBrutto += (p.brutto || 0) * (p.qty || 0);
            totalQty += p.qty || 0;
        });

        productCountEl.textContent = totalQty;
        sumNettoEl.textContent = `${totalNetto.toFixed(2)} zł`;
        sumBruttoEl.textContent = `${totalBrutto.toFixed(2)} zł`;
        totalNettoEl.textContent = `${totalNetto.toFixed(2)} zł`;
        totalBruttoEl.textContent = `${totalBrutto.toFixed(2)} zł`;

        const clientName = document.getElementById('domatorClientName').value;
        statusEl.textContent = clientName && totalQty > 0 ? '✅ Gotowe' : '📝 Edycja';

        saveToStorage();
    };

    const clearForm = () => {
        if (confirm('Czy na pewno wyczyścić wszystkie dane?')) {
            products = [];
            productIdCounter = 0;
            domatorApp.querySelectorAll('input, textarea').forEach(el => {
                if (el.id !== 'addDomatorProductBtn') { // Don't clear buttons
                    el.value = '';
                }
            });
            addProduct();
            updateStats();
            UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'warning');
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
                <td style="border: 1px solid #eee; padding: 10px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #eee; padding: 10px;">${p.sku}</td>
                <td style="border: 1px solid #eee; padding: 10px;">${p.ean || ''}</td>
                <td style="border: 1px solid #eee; padding: 10px;">${p.name}</td>
                <td style="border: 1px solid #eee; padding: 10px; text-align: center;">${p.qty}</td>
                <td style="border: 1px solid #eee; padding: 10px; text-align: right;">${p.netto.toFixed(2)} zł</td>
                <td style="border: 1px solid #eee; padding: 10px; text-align: right;">${p.brutto.toFixed(2)} zł</td>
            </tr>
        `).join('');

        let totalNetto = data.products.reduce((sum, p) => sum + p.netto * p.qty, 0);
        let totalBrutto = data.products.reduce((sum, p) => sum + p.brutto * p.qty, 0);

        return `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 2em; color: #2c3e50;">Zamówienie do Domator</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="font-size: 1.2em; color: #34495e; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
                    📍 Adres dostawy
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #555; width: 150px;"><strong>Nazwa odbiorcy:</strong></td>
                        <td style="padding: 8px 0;">${data.client.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>Adres:</strong></td>
                        <td style="padding: 8px 0;">${data.client.street}, ${data.client.postCode} ${data.client.city}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>Telefon:</strong></td>
                        <td style="padding: 8px 0;">${data.client.phone}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #555;"><strong>Email:</strong></td>
                        <td style="padding: 8px 0;">${data.client.email}</td>
                    </tr>
                </table>

                <h2 style="font-size: 1.2em; color: #34495e; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px;">
                    📦 Lista produktów
                </h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background-color: #f1f3f5;">
                            <th style="border: 1px solid #eee; padding: 10px; text-align: center;">#</th>
                            <th style="border: 1px solid #eee; padding: 10px; text-align: left;">SKU</th>
                            <th style="border: 1px solid #eee; padding: 10px; text-align: left;">EAN</th>
                            <th style="border: 1px solid #eee; padding: 10px; text-align: left;">Nazwa produktu</th>
                            <th style="border: 1px solid #eee; padding: 10px; text-align: center;">Ilość</th>
                            <th style="border: 1px solid #eee; padding: 10px; text-align: right;">Cena netto</th>
                            <th style="border: 1px solid #eee; padding: 10px; text-align: right;">Cena brutto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background-color: #f1f3f5;">
                            <td colspan="5" style="border: 1px solid #eee; padding: 10px; text-align: right;">SUMA:</td>
                            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">${totalNetto.toFixed(2)} zł</td>
                            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">${totalBrutto.toFixed(2)} zł</td>
                        </tr>
                    </tfoot>
                </table>

                <h2 style="font-size: 1.2em; color: #34495e; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px;">
                    📝 Dodatkowe informacje
                </h2>
                <div style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; font-style: italic;">
                    ${data.notes || 'Brak uwag.'}
                </div>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 0.8em; color: #777;">
                Wygenerowano z PesteczkaOS @ ${new Date().toLocaleString('pl-PL')}
            </div>
        </div>
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
