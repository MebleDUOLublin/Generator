// /js/diablo.js

// Stan modułu Diablo
let diabloProductId = 0;
let currentExportHTML = '';

function initializeDiablo() {
    if (document.getElementById('diabloProductsBody').children.length === 0) {
        addDiabloProduct();
    }
    loadDiabloFromStorage();
    console.log('Moduł Diablo zainicjalizowany.');
}

function addDiabloProduct() {
    diabloProductId++;
    const productRow = document.createElement('tr');
    productRow.id = `diabloProduct-${diabloProductId}`;
    productRow.innerHTML = `
        <td style="text-align: center; font-weight: 600;">${diabloProductId}</td>
        <td contenteditable="true" oninput="updateDiabloStats()"></td>
        <td contenteditable="true" oninput="updateDiabloStats()"></td>
        <td contenteditable="true" style="text-align: center;" oninput="calculateDiabloPrices(${diabloProductId})">1</td>
        <td contenteditable="true" style="text-align: right;" oninput="calculateDiabloPrices(${diabloProductId})">0,00</td>
        <td contenteditable="true" style="text-align: right;" oninput="calculateDiabloPrices(${diabloProductId})">0,00</td>
        <td style="text-align: center;">
            <button onclick="removeDiabloProduct(${diabloProductId})" class="btn btn-danger btn-sm">Usuń</button>
        </td>
    `;
    document.getElementById('diabloProductsBody').appendChild(productRow);
    updateDiabloStats();
}

function removeDiabloProduct(id) {
    if (confirm('Czy na pewno usunąć ten produkt?')) {
        document.getElementById(`diabloProduct-${id}`).remove();
        updateDiabloStats();
        showNotification('Produkt usunięty', 'warning');
    }
}

function calculateDiabloPrices(id) {
    const row = document.getElementById(`diabloProduct-${id}`);
    if (!row) return;

    const cells = row.getElementsByTagName('td');
    const qty = parseFloat(cells[3].textContent.replace(',', '.')) || 0;
    const netPrice = parseFloat(cells[4].textContent.replace(',', '.')) || 0;

    const grossPrice = netPrice * 1.23;
    cells[5].textContent = grossPrice.toFixed(2).replace('.', ',');

    updateDiabloStats();
}

function updateDiabloStats() {
    let totalNetto = 0;
    let totalBrutto = 0;
    let productCount = 0;

    const rows = document.querySelectorAll('#diabloProductsBody tr');
    rows.forEach(row => {
        const cells = row.getElementsByTagName('td');
        const qty = parseFloat(cells[3].textContent.replace(',', '.')) || 0;
        const netto = parseFloat(cells[4].textContent.replace(',', '.')) || 0;

        if (qty > 0 && netto > 0) {
            productCount += qty;
            totalNetto += netto * qty;
            totalBrutto += (netto * 1.23) * qty;
        }
    });

    document.getElementById('diabloProductCount').textContent = productCount;
    document.getElementById('diabloSumNetto').textContent = formatCurrency(totalNetto);
    document.getElementById('diabloSumBrutto').textContent = formatCurrency(totalBrutto);
    document.getElementById('diabloTotalNetto').textContent = formatCurrency(totalNetto);
    document.getElementById('diabloTotalBrutto').textContent = formatCurrency(totalBrutto);

    const clientName = document.getElementById('diabloClientName').textContent;
    document.getElementById('diabloStatus').textContent = (clientName && productCount > 0) ? '✅ Gotowe' : '📝 Edycja';

    saveDiabloToStorage();
}

function exportDiabloToEmail() {
    currentExportHTML = generateDiabloHTML();
    document.getElementById('exportPreview').innerHTML = currentExportHTML;
    document.getElementById('exportModal').classList.add('show');
}

function generateDiabloHTML() {
    const clientName = document.getElementById('diabloClientName').textContent || 'Brak danych';
    const street = document.getElementById('diabloStreet').textContent || '';
    const postCode = document.getElementById('diabloPostCode').textContent || '';
    const city = document.getElementById('diabloCity').textContent || '';
    const phone = document.getElementById('diabloPhone').textContent || '';
    const email = document.getElementById('diabloEmail').textContent || '';
    const notes = document.getElementById('diabloNotes').value || '';

    let productsHTML = '';
    const rows = document.querySelectorAll('#diabloProductsBody tr');
    rows.forEach((row, index) => {
        const cells = row.getElementsByTagName('td');
        if (cells[2].textContent) {
            productsHTML += `
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">${index + 1}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${cells[1].textContent}</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">${cells[2].textContent}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${cells[3].textContent}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${cells[4].textContent} zł</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${cells[5].textContent} zł</td>
                </tr>
            `;
        }
    });

    return `
        <div style="font-family: Arial, sans-serif; font-size: 14px;">
            <h2>Zamówienie Foteli Diablo</h2>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pl-PL')}</p>
            <h3>Adres dostawy:</h3>
            <p>
                ${clientName}<br>
                ${street}<br>
                ${postCode} ${city}<br>
                Tel: ${phone}<br>
                Email: ${email}
            </p>
            <h3>Produkty:</h3>
            <table style="border-collapse: collapse; width: 100%;">
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="border: 1px solid #ccc; padding: 8px;">Lp.</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">SKU/EAN</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Nazwa</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Ilość</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Cena netto</th>
                        <th style="border: 1px solid #ccc; padding: 8px;">Cena brutto</th>
                    </tr>
                </thead>
                <tbody>${productsHTML}</tbody>
                <tfoot>
                    <tr style="font-weight: bold;">
                        <td colspan="4" style="text-align: right; padding: 8px;">SUMA:</td>
                        <td style="text-align: right; padding: 8px;">${document.getElementById('diabloTotalNetto').textContent}</td>
                        <td style="text-align: right; padding: 8px;">${document.getElementById('diabloTotalBrutto').textContent}</td>
                    </tr>
                </tfoot>
            </table>
            ${notes ? `<p><strong>Uwagi:</strong> ${notes.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
    `;
}

function copyExportHTML() {
    navigator.clipboard.writeText(currentExportHTML).then(() => {
        showNotification('HTML skopiowany do schowka!', 'success');
        closeExportModal();
    });
}

function downloadExportHTML() {
    const blob = new Blob([currentExportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zamowienie_diablo.html`;
    a.click();
    URL.revokeObjectURL(url);
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function exportDiabloToPDF() {
    showNotification('Generowanie PDF...', 'info');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const html = generateDiabloHTML();

    const container = document.createElement('div');
    container.innerHTML = html;

    await pdf.html(container, {
        callback: function(doc) {
            doc.save('zamowienie_diablo.pdf');
        },
        x: 10,
        y: 10,
        width: 180,
        windowWidth: 800
    });
    showNotification('PDF wygenerowany!', 'success');
}

function exportDiabloToExcel() {
    const data = collectDiabloData();
    const ws_data = [
        ["Zamówienie Diablo"],
        ["Data", data.date],
        [],
        ["Adres Dostawy"],
        ["Nazwa", data.client.name],
        ["Ulica", data.client.street],
        ["Kod i Miasto", `${data.client.postCode} ${data.client.city}`],
        ["Telefon", data.client.phone],
        ["Email", data.client.email],
        [],
        ["Produkty"],
        ["SKU", "Nazwa", "Ilość", "Cena Netto", "Cena Brutto"]
    ];

    data.products.forEach(p => {
        ws_data.push([p.sku, p.name, p.qty, p.netto, p.brutto]);
    });

    ws_data.push([]);
    ws_data.push(["", "", "SUMA:", data.totals.netto, data.totals.brutto]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Zamówienie");
    XLSX.writeFile(wb, "zamowienie_diablo.xlsx");
    showNotification('Eksport do Excel zakończony', 'success');
}

function saveDiabloOrder() {
    const data = collectDiabloData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diablo_order_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Zamówienie zapisane do pliku JSON.', 'success');
}

function clearDiabloForm() {
    if (!confirm('Czy na pewno wyczyścić formularz Diablo?')) return;
    document.getElementById('diabloClientName').textContent = '';
    document.getElementById('diabloStreet').textContent = '';
    document.getElementById('diabloPostCode').textContent = '';
    document.getElementById('diabloCity').textContent = '';
    document.getElementById('diabloPhone').textContent = '';
    document.getElementById('diabloEmail').textContent = '';
    document.getElementById('diabloNotes').value = '';
    document.getElementById('diabloProductsBody').innerHTML = '';
    diabloProductId = 0;
    addDiabloProduct();
    updateDiabloStats();
}

function loadDiabloTemplate() {
    clearDiabloForm();
    document.getElementById('diabloClientName').textContent = 'Przykładowy Klient';
    document.getElementById('diabloStreet').textContent = 'Ulica Testowa 1';
    document.getElementById('diabloPostCode').textContent = '00-000';
    document.getElementById('diabloCity').textContent = 'Warszawa';
    document.getElementById('diabloPhone').textContent = '123456789';
    document.getElementById('diabloEmail').textContent = 'test@example.com';

    const sampleProducts = [
        { sku: 'DXR-001', name: 'Fotel Diablo X-Ray', qty: '1', netto: '812.20', brutto: '1000.00' },
        { sku: 'DCH-002', name: 'Fotel Diablo Chairs', qty: '2', netto: '405.69', brutto: '499.00' }
    ];

    document.getElementById('diabloProductsBody').innerHTML = '';
    diabloProductId = 0;
    sampleProducts.forEach(p => {
        addDiabloProduct();
        const newRow = document.getElementById(`diabloProduct-${diabloProductId}`);
        const cells = newRow.getElementsByTagName('td');
        cells[1].textContent = p.sku;
        cells[2].textContent = p.name;
        cells[3].textContent = p.qty;
        cells[4].textContent = p.netto;
        cells[5].textContent = p.brutto;
    });
    updateDiabloStats();
    showNotification('Szablon zamówienia Diablo wczytany.', 'success');
}

function collectDiabloData() {
    const productsData = [];
    document.querySelectorAll('#diabloProductsBody tr').forEach(row => {
        const cells = row.getElementsByTagName('td');
        if (cells[2].textContent.trim()) {
            productsData.push({
                sku: cells[1].textContent,
                name: cells[2].textContent,
                qty: cells[3].textContent,
                netto: cells[4].textContent,
                brutto: cells[5].textContent
            });
        }
    });

    return {
        date: new Date().toISOString(),
        client: {
            name: document.getElementById('diabloClientName').textContent,
            street: document.getElementById('diabloStreet').textContent,
            postCode: document.getElementById('diabloPostCode').textContent,
            city: document.getElementById('diabloCity').textContent,
            phone: document.getElementById('diabloPhone').textContent,
            email: document.getElementById('diabloEmail').textContent,
        },
        products: productsData,
        notes: document.getElementById('diabloNotes').value,
        totals: {
            netto: document.getElementById('diabloTotalNetto').textContent,
            brutto: document.getElementById('diabloTotalBrutto').textContent
        }
    };
}

function saveDiabloToStorage() {
    const data = collectDiabloData();
    localStorage.setItem('diabloOrder', JSON.stringify(data));
}

function loadDiabloFromStorage() {
    const saved = localStorage.getItem('diabloOrder');
    if (!saved) return;

    const data = safeJSONParse(saved);
    if (!data) return;

    const client = data.client || {};
    document.getElementById('diabloClientName').textContent = client.name || '';
    document.getElementById('diabloStreet').textContent = client.street || '';
    document.getElementById('diabloPostCode').textContent = client.postCode || '';
    document.getElementById('diabloCity').textContent = client.city || '';
    document.getElementById('diabloPhone').textContent = client.phone || '';
    document.getElementById('diabloEmail').textContent = client.email || '';
    document.getElementById('diabloNotes').value = data.notes || '';

    if (data.products && data.products.length > 0) {
        const productsBody = document.getElementById('diabloProductsBody');
        productsBody.innerHTML = '';
        diabloProductId = 0;
        data.products.forEach(p => {
            if (p.name) {
                diabloProductId++;
                const productRow = document.createElement('tr');
                productRow.id = `diabloProduct-${diabloProductId}`;
                productRow.innerHTML = `
                    <td style="text-align: center; font-weight: 600;">${diabloProductId}</td>
                    <td contenteditable="true" oninput="updateDiabloStats()">${p.sku}</td>
                    <td contenteditable="true" oninput="updateDiabloStats()">${p.name}</td>
                    <td contenteditable="true" style="text-align: center;" oninput="calculateDiabloPrices(${diabloProductId})">${p.qty}</td>
                    <td contenteditable="true" style="text-align: right;" oninput="calculateDiabloPrices(${diabloProductId})">${p.netto}</td>
                    <td contenteditable="true" style="text-align: right;" oninput="calculateDiabloPrices(${diabloProductId})">${p.brutto}</td>
                    <td style="text-align: center;">
                        <button onclick="removeDiabloProduct(${diabloProductId})" class="btn btn-danger btn-sm">Usuń</button>
                    </td>
                `;
                productsBody.appendChild(productRow);
            }
        });
    }
    updateDiabloStats();
}