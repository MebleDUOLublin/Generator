
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

    const addProduct = () => {
        productIdCounter++;
        const newProduct = {
            id: productIdCounter,
            sku: '',
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
        const value = e.target.value;
        const product = products.find(p => p.id === parseInt(id));
        if (product) {
            product[field] = field === 'qty' ? parseInt(value) : (field === 'netto' || field === 'brutto' ? parseFloat(value) : value);
            if (field === 'netto') {
                product.brutto = product.netto * 1.23;
                const bruttoInput = e.target.parentElement.nextElementSibling.querySelector('input');
                if (bruttoInput) bruttoInput.value = product.brutto.toFixed(2);
            }
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
            client: {},
            products: [],
            notes: ''
        };
        domatorApp.querySelectorAll('input, textarea').forEach(el => {
            if (el.id.startsWith('domator')) {
                const keyPart = el.id.substring('domator'.length); // e.g., 'ClientName', 'Notes'
                if (keyPart.startsWith('Client')) {
                    const clientField = keyPart.substring('Client'.length); // 'Name'
                    const finalKey = clientField.charAt(0).toLowerCase() + clientField.slice(1); // 'name'
                    data.client[finalKey] = el.value;
                } else {
                    const finalKey = keyPart.charAt(0).toLowerCase() + keyPart.slice(1); // 'notes'
                    data[finalKey] = el.value;
                }
            }
        });
        data.products = products;
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
            { id: 1, sku: 'DIABLO-X-RAY-2.0', name: 'Fotel gamingowy Diablo X-Ray 2.0 Normal Size', qty: 2, netto: 899.00, brutto: 1105.77 },
            { id: 2, sku: 'DIABLO-V-COMMANDER', name: 'Fotel biurowy Diablo V-Commander', qty: 1, netto: 1299.00, brutto: 1597.77 },
        ];
        productIdCounter = 2;

        renderProducts();
        updateStats();
        UI.Feedback.toast('📋 Szablon wczytany', 'success');
    };

    const generateHtmlOrder = (data) => {
        let productRows = data.products.map((p, index) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${p.sku}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${p.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.qty}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.netto.toFixed(2)} zł</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.brutto.toFixed(2)} zł</td>
            </tr>
        `).join('');

        let totalNetto = data.products.reduce((sum, p) => sum + p.netto * p.qty, 0);
        let totalBrutto = data.products.reduce((sum, p) => sum + p.brutto * p.qty, 0);

        return `
            <p>Dzień dobry,</p>
            <p>przesyłam zamówienie.</p>
            <br>
            <h3 style="color: #333;">Adres dostawy:</h3>
            <p>
                ${data.client.name}<br>
                ${data.client.street}<br>
                ${data.client.postCode} ${data.client.city}<br>
                Tel: ${data.client.phone}<br>
                Email: ${data.client.email}
            </p>
            <br>
            <h3 style="color: #333;">Zamówione produkty:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">#</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">SKU</th>
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
                    <tr style="font-weight: bold;">
                        <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;">SUMA:</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalNetto.toFixed(2)} zł</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${totalBrutto.toFixed(2)} zł</td>
                    </tr>
                </tfoot>
            </table>
            <br>
            <h3 style="color: #333;">Dodatkowe informacje:</h3>
            <p>${data.notes || 'Brak uwag.'}</p>
            <br>
            <p>Pozdrawiam</p>
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
