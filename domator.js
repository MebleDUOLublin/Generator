
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
                const key = el.id.replace('domator', '').charAt(0).toLowerCase() + el.id.replace('domator', '').slice(1);
                if (key.includes('Client')) {
                    data.client[key.replace('Client', '').toLowerCase()] = el.value;
                } else {
                    data[key] = el.value;
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

    return {
        init,
    };
})();
