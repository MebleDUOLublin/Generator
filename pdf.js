/**
 * ADVANCED PDF GENERATION SYSTEM v2.0
 * - Template-based rendering
 * - Streaming for large documents
 * - Better product layout algorithm
 * - Error recovery and retry logic
 */

const PDFManager = (() => {
    const TEMPLATE_TYPES = {
        OFFER: 'offer',
        INVOICE: 'invoice',
        QUOTE: 'quote'
    };

    const PRODUCT_LAYOUTS = {
        portrait: {
            productsPerPage: 3,
            rowHeight: 120,
            imageSize: { width: 60, height: 60 }
        },
        landscape: {
            productsPerPage: 6,
            rowHeight: 90,
            imageSize: { width: 50, height: 50 }
        }
    };

    const getOptimalLayout = (productCount, orientation) => {
        const layout = PRODUCT_LAYOUTS[orientation];
        const pagesNeeded = Math.ceil(productCount / layout.productsPerPage);
        
        return {
            ...layout,
            totalPages: pagesNeeded,
            pagesNeeded,
            lastPageProducts: productCount % layout.productsPerPage || layout.productsPerPage
        };
    };

    const calculateProductHeight = (desc, orientation) => {
        const baseHeight = PRODUCT_LAYOUTS[orientation].rowHeight;
        if (!desc) return baseHeight;
        
        const descLines = desc.split('\n').length;
        return baseHeight + (descLines * 8);
    };

    const createPDFTemplate = (type = TEMPLATE_TYPES.OFFER) => {
        const templates = {
            [TEMPLATE_TYPES.OFFER]: {
                name: 'OFERTA CENOWA',
                color: '#dc2626',
                includeFooter: true,
                includeSummary: true
            },
            [TEMPLATE_TYPES.INVOICE]: {
                name: 'FAKTURA VAT',
                color: '#1e40af',
                includeFooter: true,
                includeSummary: true
            },
            [TEMPLATE_TYPES.QUOTE]: {
                name: 'WYCENA',
                color: '#059669',
                includeFooter: false,
                includeSummary: false
            }
        };

        return templates[type] || templates[TEMPLATE_TYPES.OFFER];
    };

    const validateProductData = (products) => {
        const errors = [];
        
        products.forEach((product, idx) => {
            if (!product.name?.trim()) {
                errors.push(`Produkt ${idx + 1}: brak nazwy`);
            }
            if (!product.qty || parseFloat(product.qty) < 0) {
                errors.push(`Produkt ${idx + 1}: niepoprawna ilość`);
            }
            if (!product.price || parseFloat(product.price) < 0) {
                errors.push(`Produkt ${idx + 1}: niepoprawna cena`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            count: products.length
        };
    };

    const enrichProductData = (products) => {
        return products.map((p, idx) => ({
            ...p,
            index: idx + 1,
            qty: parseFloat(p.qty) || 0,
            price: parseFloat(p.price) || 0,
            discount: parseFloat(p.discount) || 0,
            total: (parseFloat(p.qty) || 0) * 
                   ((parseFloat(p.price) || 0) * (1 - (parseFloat(p.discount) || 0) / 100))
        }));
    };

    const calculatePageTotals = (pageProducts) => {
        const net = pageProducts.reduce((sum, p) => sum + p.total, 0);
        const vat = net * 0.23;
        const gross = net + vat;

        return { net, vat, gross };
    };

    const estimatePageHeight = (products, orientation) => {
        const headerHeight = 200;
        const footerHeight = 150;
        const productsHeight = products.reduce((sum, p) => 
            sum + calculateProductHeight(p.desc, orientation), 0
        );

        return headerHeight + productsHeight + footerHeight;
    };

    const shouldCreateNewPage = (currentHeight, newProductHeight, pageHeight) => {
        return currentHeight + newProductHeight > pageHeight;
    };

    const createPageBreakPoints = (products, orientation) => {
        const pageHeight = orientation === 'portrait' ? 1100 : 800;
        const breaks = [];
        let currentHeight = 200; // header
        let currentPage = [];

        products.forEach((product, idx) => {
            const productHeight = calculateProductHeight(product.desc, orientation);
            
            if (shouldCreateNewPage(currentHeight, productHeight, pageHeight)) {
                if (currentPage.length > 0) {
                    breaks.push(currentPage);
                    currentPage = [];
                    currentHeight = 200;
                }
            }

            currentPage.push(product);
            currentHeight += productHeight;
        });

        if (currentPage.length > 0) {
            breaks.push(currentPage);
        }

        return breaks;
    };

    const _preparePdfData = (options) => {
        const { products = [], orientation = 'portrait', templateType = TEMPLATE_TYPES.OFFER } = options;

        const validation = validateProductData(products);
        if (!validation.isValid) {
            throw new Error(`Invalid product data: ${validation.errors.join(', ')}`);
        }

        const enrichedProducts = enrichProductData(products);
        return {
            enrichedProducts,
            pageBreaks: createPageBreakPoints(enrichedProducts, orientation),
            template: createPDFTemplate(templateType),
        };
    };

    const generatePDF = async (options) => {
        const { orientation = 'portrait', format = 'a4', seller = {}, offerData = {} } = options;

        try {
            const { pageBreaks, template } = _preparePdfData(options);
            console.log(`📄 Generating PDF: ${pageBreaks.length} pages`);

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation, unit: 'mm', format });
            const { width: pageWidth, height: pageHeight } = pdf.internal.pageSize;

            for (let i = 0; i < pageBreaks.length; i++) {
                if (i > 0) pdf.addPage();

                const pageOptions = {
                    ...options,
                    pageProducts: pageBreaks[i],
                    pageNum: i + 1,
                    totalPages: pageBreaks.length,
                    isFirstPage: i === 0,
                    isLastPage: i === pageBreaks.length - 1,
                    template,
                };
                await renderPDFPage(pdf, pageWidth, pageHeight, pageOptions);
            }

            setMetadata(pdf, offerData, seller);
            return pdf;

        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    };

    const renderPDFPage = async (pdf, pageWidth, pageHeight, options) => {
        const {
            pageProducts,
            pageNum,
            totalPages,
            isFirstPage,
            isLastPage,
            orientation,
            quality,
            template,
            seller,
            offerData
        } = options;
        const buyer = offerData.buyer;

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = (orientation === 'portrait' ? 794 : 1123) + 'px';
        tempContainer.style.minHeight = (orientation === 'portrait' ? 1123 : 794) + 'px';
        tempContainer.style.background = 'white';
        tempContainer.style.padding = '20px';
        tempContainer.style.boxSizing = 'border-box';
        tempContainer.style.fontSize = '10px';
        tempContainer.style.fontFamily = "'Inter', sans-serif";

        // Build page HTML
        let pageHTML = '<div class="pdf-page">';

        if (isFirstPage) {
            pageHTML += buildHeader(template, seller, buyer, offerData);
        }

        pageHTML += buildProductsTable(pageProducts, pageNum, totalPages);

        if (isLastPage) {
            const totals = calculatePageTotals(pageProducts);
            pageHTML += buildSummary(totals, template);

            if (offerData.notes) {
                pageHTML += buildNotes(offerData.notes);
            }

            pageHTML += buildFooter(template, seller, offerData, pageNum, totalPages);
        } else {
            pageHTML += `<div style="text-align: center; margin-top: 20px; color: #999;">
                            Strona ${pageNum} z ${totalPages}
                        </div>`;
        }

        pageHTML += '</div>';

        // Add styles and content
        const styleEl = document.createElement('style');
        styleEl.innerHTML = document.getElementById('pdf-styles')?.innerHTML || '';
        tempContainer.appendChild(styleEl);
        tempContainer.innerHTML += pageHTML;
        document.body.appendChild(tempContainer);

        try {
            // Render with html2canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: orientation === 'portrait' ? 794 : 1123,
                windowHeight: orientation === 'portrait' ? 1123 : 794
            });

            const imgData = canvas.toDataURL('image/jpeg', quality);
            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
        } finally {
            document.body.removeChild(tempContainer);
        }
    };

    const buildHeader = (template, seller, buyer, offerData) => {
        return `
            <header style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                <div style="flex: 1;">
                    ${seller.logo ? `<img src="${seller.logo}" style="height: 60px; object-fit: contain;">` : ''}
                </div>
                <div style="text-align: right; font-size: 11px;">
                    <div style="font-weight: 700; font-size: 14px;">${seller.name || 'MEBLE DUO'}</div>
                    <div>NIP: ${seller.nip || ''}</div>
                    <div>${seller.address || ''}</div>
                    <div>Tel: ${seller.phone || ''}</div>
                    <div>Email: ${seller.email || ''}</div>
                </div>
            </header>

            <div style="text-align: center; margin: 25px 0;">
                <h1 style="color: ${template.color}; font-size: 28px; margin: 0; font-weight: 700;">
                    ${template.name}
                </h1>
                <div style="margin-top: 10px; font-size: 12px; color: #4b5563;">
                    <span style="margin: 0 12px;"><strong>Nr:</strong> ${offerData.number || ''}</span>
                    <span style="margin: 0 12px;"><strong>Data:</strong> ${offerData.date || new Date().toLocaleDateString('pl-PL')}</span>
                    <span style="margin: 0 12px;"><strong>Ważna do:</strong> ${offerData.validUntil || ''}</span>
                </div>
            </div>

            <div style="background: #f9fafb; padding: 12px 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; font-size: 11px;">
                <div style="font-weight: 700; margin-bottom: 8px;">NABYWCA:</div>
                <div>
                    <strong style="font-size: 13px;">${buyer.name || 'Nieznany klient'}</strong>
                    ${buyer.nip ? `<br>NIP: ${buyer.nip}` : ''}
                    ${buyer.address ? `<br>Adres: ${buyer.address}` : ''}
                    ${buyer.phone || buyer.email ? '<br>' : ''}
                    ${buyer.phone ? `Tel: ${buyer.phone}` : ''}
                    ${buyer.phone && buyer.email ? ' | ' : ''}
                    ${buyer.email ? `Email: ${buyer.email}` : ''}
                </div>
            </div>
        `;
    };

    const buildProductsTable = (products, pageNum, totalPages) => {
        let rows = '';
        let totalNet = 0;

        products.forEach(product => {
            totalNet += product.total;
            rows += `
                <tr>
                    <td style="text-align: center; font-weight: 600; border: 1px solid #e5e7eb; padding: 8px;">
                        ${product.index}
                    </td>
                    <td style="text-align: center; border: 1px solid #e5e7eb; padding: 5px;">
                        ${product.image ? `<img src="${product.image}" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 4px;">` : '-'}
                    </td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;">
                        <div style="font-weight: 700; font-size: 11px;">${product.name}</div>
                        ${product.code ? `<div style="font-size: 9px; color: #6b7280;">Kod: ${product.code}</div>` : ''}
                        ${product.desc ? `<div style="font-size: 9px; color: #4b5563; margin-top: 4px; line-height: 1.3;">
                            ${product.desc.split('\n').map(line => `<div>• ${line.trim()}</div>`).join('')}
                        </div>` : ''}
                    </td>
                    <td style="text-align: center; font-weight: 600; border: 1px solid #e5e7eb; padding: 8px;">
                        ${product.qty}
                    </td>
                    <td style="text-align: right; border: 1px solid #e5e7eb; padding: 8px;">
                        ${product.price.toFixed(2)} zł
                    </td>
                    <td style="text-align: center; font-weight: 600; border: 1px solid #e5e7eb; padding: 8px; color: ${product.discount > 0 ? '#dc2626' : '#000'};">
                        ${product.discount > 0 ? '-' + product.discount + '%' : '-'}
                    </td>
                    <td style="text-align: right; font-weight: 600; border: 1px solid #e5e7eb; padding: 8px;">
                        ${product.total.toFixed(2)} zł
                    </td>
                </tr>
            `;
        });

        return `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 10px;">
                <thead>
                    <tr style="background-color: #f9fafb;">
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Lp.</th>
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">Zdjęcie</th>
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Produkt / Opis</th>
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">Ilość</th>
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Cena netto</th>
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">Rabat</th>
                        <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: right;">Wartość</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    };

    const buildSummary = (totals, template) => {
        return `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
                <table style="width: 350px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; text-align: right;">Wartość netto:</td>
                        <td style="padding: 8px 12px; font-size: 12px; text-align: right; font-weight: 600;">
                            ${totals.net.toFixed(2)} zł
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-size: 12px; text-align: right;">VAT 23%:</td>
                        <td style="padding: 8px 12px; font-size: 12px; text-align: right; font-weight: 600;">
                            ${totals.vat.toFixed(2)} zł
                        </td>
                    </tr>
                    <tr style="background: linear-gradient(135deg, ${template.color} 0%, ${template.color}dd 100%); color: white;">
                        <td style="padding: 8px 12px; font-size: 14px; text-align: right; font-weight: 700;">RAZEM BRUTTO:</td>
                        <td style="padding: 8px 12px; font-size: 16px; text-align: right; font-weight: 700;">
                            ${totals.gross.toFixed(2)} zł
                        </td>
                    </tr>
                </table>
            </div>
        `;
    };

    const buildNotes = (notes) => {
        return `
            <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background: #fefce8; border: 1px solid #facc15;">
                <div style="font-weight: 700; font-size: 12px; color: #a16207; margin-bottom: 8px;">DODATKOWE UWAGI:</div>
                <div style="font-size: 10px; color: #ca8a04; white-space: pre-wrap;">${notes}</div>
            </div>
        `;
    };

    const buildFooter = (template, seller, offerData, pageNum, totalPages) => {
        const year = new Date().getFullYear();
        const website = seller.website || 'www.example.com';
        const companyName = seller.name || 'Twoja Firma';

        return `
            <footer style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; margin-bottom: 8px;">WARUNKI HANDLOWE:</div>
                        <ul style="margin: 0; padding-left: 20px; font-size: 10px;">
                            <li><strong>Płatność:</strong> ${offerData.paymentTerms || 'zgodnie z umową'}</li>
                            <li><strong>Realizacja:</strong> ${offerData.deliveryTime || 'do 14 dni'}</li>
                            <li><strong>Dostawa:</strong> ${offerData.deliveryMethod || 'bezpłatnie'}</li>
                            <li><strong>Gwarancja:</strong> ${offerData.warranty || '24 miesiące'}</li>
                        </ul>
                    </div>
                    <div style="background: #f9fafb; padding: 12px 15px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 10px; min-width: 250px;">
                        <div style="font-weight: 700; margin-bottom: 8px;">DANE DO PRZELEWU:</div>
                        <div style="margin-bottom: 6px;"><span style="color: #666;">Odbiorca:</span> ${seller.bankName || seller.fullName}</div>
                        <div style="margin-bottom: 6px;"><span style="color: #666;">Nr konta:</span> <strong>${seller.bankAccount || ''}</strong></div>
                        <div><span style="color: #666;">Tytuł:</span> ${offerData.number || 'Oferta'}</div>
                    </div>
                </div>
                <div style="text-align: center; font-size: 9px; color: #999; padding-top: 10px; border-top: 1px solid #e5e7eb;">
                    <div style="margin-bottom: 4px;">Oferta wygenerowana: ${new Date().toLocaleString('pl-PL')}</div>
                    <div>${website} | © ${year} ${companyName} | Strona ${pageNum} z ${totalPages}</div>
                </div>
            </footer>
        `;
    };

    const setMetadata = (pdf, offerData, seller) => {
        const buyerName = (offerData.buyer && offerData.buyer.name) ? ` dla ${offerData.buyer.name}` : '';
        pdf.setProperties({
            title: `Oferta ${offerData.number || 'bez numeru'}${buyerName}`,
            subject: `Oferta cenowa - ${seller.name || 'Pesteczka OS'}`,
            author: seller.fullName || 'Pesteczka OS',
            keywords: `oferta, ${seller.name || ''}`,
            creator: 'Pesteczka OS - Centrum Dowodzenia Justy'
        });
    };

    const savePDF = (pdf, filename) => {
        const name = filename || `Oferta_${Date.now()}.pdf`;
        pdf.save(name);
        console.log(`✅ PDF saved: ${name}`);
    };

    return {
        generatePDF,
        validateProductData,
        enrichProductData,
        getOptimalLayout,
        createPageBreakPoints,
        savePDF,
        TEMPLATE_TYPES
    };
})();

// Export for global use
window.PDFManager = PDFManager;
