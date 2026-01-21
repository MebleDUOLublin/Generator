/**
 * PESTECZKA OS - MAIN APPLICATION SCRIPT (REFACTORED)
 * Centralizes core functionalities and provides a stable API for plugins.
 */

(function() {
    // ============================================
    // INITIALIZATION
    // ============================================
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Pesteczka OS Main App Script Started');
        try {
            if (!PesteczkaOS.core.StorageSystem || !PesteczkaOS.core.PluginLoader) {
                throw new Error('Core systems not found.');
            }
            await Promise.all([
                PesteczkaOS.core.StorageSystem.init(),
                PesteczkaOS.core.PluginLoader.init()
            ]);
            await populateProfileSelector();
            console.log('✅ Pesteczka OS Initialized Successfully');
        } catch (error) {
            console.error('❌ CRITICAL ERROR during initialization:', error);
            document.body.innerHTML = `<div class="critical-error-container"><h1>Błąd krytyczny</h1><p>Nie można załadować aplikacji. Sprawdź konsolę (F12).</p><pre>${error.stack}</pre></div>`;
        }
    });

    // ============================================
    // CORE API & MANAGERS
    // ============================================

    const PDFManager = (() => {
        const loadScript = (src) => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.head.appendChild(script);
        });

        const generatePDF = async (options) => {
            try {
                await Promise.all([
                    loadScript('src/assets/vendor/pdfmake.min.js'),
                    loadScript('src/assets/vendor/html2canvas.min.js'),
                    loadScript('src/assets/vendor/jspdf.umd.min.js')
                ]);

                console.log('All PDF libraries loaded.');
                const {
                    orientation = 'portrait', format = 'a4', seller = {}, offerData = {}
                } = options;
                const {
                    pageBreaks,
                    template,
                    enrichedProducts
                } = _preparePdfData(options);
                const grandTotal = calculatePageTotals(enrichedProducts);
                const {
                    jsPDF
                } = window.jspdf;
                const pdf = new jsPDF({
                    orientation,
                    unit: 'mm',
                    format
                });
                const {
                    width: pageWidth,
                    height: pageHeight
                } = pdf.internal.pageSize;

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
                        grandTotal,
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

        const _preparePdfData = (options) => {
            const {
                products = [], orientation = 'portrait'
            } = options;
            const enrichedProducts = enrichProductData(products);
            return {
                enrichedProducts,
                pageBreaks: createPageBreakPoints(enrichedProducts, orientation),
                template: createPDFTemplate(),
            };
        };

        const enrichProductData = (products) => products.map((p, idx) => ({
            ...p,
            index: idx + 1,
            qty: parseFloat(p.qty) || 0,
            price: parseFloat(p.price) || 0,
            discount: parseFloat(p.discount) || 0,
            total: (parseFloat(p.qty) || 0) * ((parseFloat(p.price) || 0) * (1 - (parseFloat(p.discount) || 0) / 100))
        }));

        const calculatePageTotals = (pageProducts) => {
            const net = pageProducts.reduce((sum, p) => sum + p.total, 0);
            const vat = net * 0.23;
            const gross = net + vat;
            return {
                net,
                vat,
                gross
            };
        };

        const createPageBreakPoints = (products, orientation) => {
            const pageHeight = orientation === 'portrait' ? 1100 : 800;
            const breaks = [];
            let currentHeight = 200;
            let currentPage = [];
            products.forEach(product => {
                const productHeight = 120 + (product.desc ? product.desc.split('\n').length * 8 : 0);
                if ((currentHeight + productHeight > pageHeight) && currentPage.length > 0) {
                    breaks.push(currentPage);
                    currentPage = [];
                    currentHeight = 200;
                }
                currentPage.push(product);
                currentHeight += productHeight;
            });
            if (currentPage.length > 0) breaks.push(currentPage);
            return breaks;
        };

        const createPDFTemplate = () => ({
            name: 'OFERTA CENOWA',
            color: '#dc2626'
        });

        const renderPDFPage = async (pdf, pageWidth, pageHeight, options) => {
            const {
                pageProducts,
                pageNum,
                totalPages,
                isFirstPage,
                isLastPage,
                orientation,
                template,
                seller,
                offerData,
                grandTotal
            } = options;
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `position:fixed; left:-9999px; width:${orientation==='portrait' ? 794:1123}px; background:white; padding:20px; font-family: 'Inter', sans-serif;`;
            let pageHTML = '<div class="pdf-page">';
            if (isFirstPage) pageHTML += buildHeader(template, seller, offerData.buyer, offerData);
            pageHTML += buildProductsTable(pageProducts);
            if (isLastPage) {
                pageHTML += buildSummary(grandTotal, template);
                if (offerData.notes) pageHTML += buildNotes(offerData.notes);
                pageHTML += buildFooter(template, seller, offerData, pageNum, totalPages);
            }
            pageHTML += '</div>';
            tempContainer.innerHTML = `<style>${document.getElementById('pdf-styles').innerHTML}</style>${pageHTML}`;
            document.body.appendChild(tempContainer);
            try {
                const canvas = await html2canvas(tempContainer, {
                    scale: 2,
                    useCORS: true
                });
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
            } finally {
                document.body.removeChild(tempContainer);
            }
        };

        const buildHeader = (template, seller, buyer, offerData) => `
        <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
            <div style="flex: 1;"><img src="${seller.logo}" style="height: 60px; object-fit: contain;"></div>
            <div style="text-align: right; font-size: 11px;">
                <div style="font-weight: 700; font-size: 14px;">${seller.name}</div>
                <div>NIP: ${seller.nip}</div><div>${seller.address}</div>
            </div>
        </header>
        <div style="text-align: center; margin: 25px 0;">
            <h1 style="color: ${template.color}; font-size: 28px; margin: 0;">${template.name}</h1>
            <div style="margin-top: 10px; font-size: 12px; color: #4b5563;">
                <span>Nr: ${offerData.number}</span> | <span>Data: ${offerData.date}</span> | <span>Ważna do: ${offerData.validUntil}</span>
            </div>
        </div>
        <div style="background: #f9fafb; padding: 12px 15px; border-radius: 8px; margin-bottom: 25px;">
            <div>NABYWCA: <strong>${buyer.name}</strong></div>
        </div>`;

        const buildProductsTable = (products) => {
            let rows = products.map(p => `
            <tr>
                <td>${p.index}</td>
                <td><img src="${p.image || ''}" style="width: 50px; height: 50px; object-fit: contain;"></td>
                <td><strong>${p.name}</strong><br><small>${p.desc || ''}</small></td>
                <td>${p.qty}</td><td>${p.price.toFixed(2)} zł</td><td>${p.discount}%</td><td>${p.total.toFixed(2)} zł</td>
            </tr>`).join('');
            return `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                <thead><tr><th>Lp.</th><th>Zdjęcie</th><th>Produkt</th><th>Ilość</th><th>Cena</th><th>Rabat</th><th>Wartość</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
        };

        const buildSummary = (totals, template) => `
        <div style="text-align: right; margin-top: 20px;">
            <div>Wartość netto: ${totals.net.toFixed(2)} zł</div>
            <div>VAT 23%: ${totals.vat.toFixed(2)} zł</div>
            <div style="font-size: 16px; font-weight: bold; color: ${template.color};">RAZEM BRUTTO: ${totals.gross.toFixed(2)} zł</div>
        </div>`;
        const buildNotes = (notes) => `<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;"><strong>Uwagi:</strong><br>${notes}</div>`;
        const buildFooter = (template, seller, offerData, pageNum, totalPages) => `<footer style="margin-top: 30px; text-align: center; font-size: 9px; color: #999;">Strona ${pageNum} z ${totalPages}</footer>`;

        const setMetadata = (pdf, offerData, seller) => {
            pdf.setProperties({
                title: `Oferta ${offerData.number}`,
                author: seller.name,
                creator: 'Pesteczka OS'
            });
        };

        const savePDF = (pdf, filename) => pdf.save(filename || `Oferta_${Date.now()}.pdf`);

        return {
            generatePDF,
            savePDF
        };
    })();

    const UI = {
        Feedback: {
            toast: (message, type = 'info') => {
                const toastContainer = document.getElementById('toastContainer');
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.textContent = message;
                toastContainer.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            },
            confirm: (message) => new Promise(resolve => {
                const modal = UI.Modal.show('Potwierdzenie', `<p>${message}</p>`, 'confirmModal', [{
                    text: 'Anuluj',
                    className: 'btn-outline',
                    action: () => {
                        UI.Modal.hide('confirmModal');
                        resolve(false);
                    }
                }, {
                    text: 'Potwierdź',
                    className: 'btn-primary',
                    action: () => {
                        UI.Modal.hide('confirmModal');
                        resolve(true);
                    }
                }]);
            }),
            show: (title, message, type) => UI.Modal.show(title, `<p>${message}</p>`, 'feedbackModal')
        },
        Modal: {
            show: (title, content, id, buttons = []) => {
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.id = id;
                let footer = '';
                if (buttons.length > 0) {
                    footer = `<div class="modal-footer">${buttons.map((btn, i) => `<button class="btn ${btn.className}" id="${id}-btn-${i}">${btn.text}</button>`).join('')}</div>`;
                }
                modal.innerHTML = `
                <div class="modal-box">
                    <div class="modal-header"><h2>${title}</h2><button class="modal-close" id="${id}-close">✕</button></div>
                    <div class="modal-content">${content}</div>
                    ${footer}
                </div>`;
                document.body.appendChild(modal);
                document.getElementById(`${id}-close`).addEventListener('click', () => UI.Modal.hide(id));
                buttons.forEach((btn, i) => document.getElementById(`${id}-btn-${i}`).addEventListener('click', btn.action));
                return modal;
            },
            hide: (id) => {
                const modal = document.getElementById(id);
                if (modal) modal.remove();
            }
        }
    };

    function changeWallpaper(wallpaper) {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;
        const wallpapers = {
            default: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            wallpaper1: 'url(\'src/assets/userData/wallpapers/wallpaper1.jpg\')',
            wallpaper2: 'url(\'src/assets/userData/wallpapers/wallpaper2.jpg\')',
            wallpaper3: 'url(\'src/assets/userData/wallpapers/wallpaper3.jpg\')',
            wallpaper4: 'url(\'src/assets/userData/wallpapers/wallpaper4.jpg\')'
        };
        if (wallpapers[wallpaper]) {
            desktop.style.backgroundImage = wallpapers[wallpaper];
            localStorage.setItem('pesteczkaOS_wallpaper', wallpaper);
            UI.Feedback.toast('🖼️ Zmieniono tapetę', 'info');
        }
    }

    function renderUIForProfile() {
        if (!PesteczkaOS.state.currentProfile) return;
        const enabledApps = PesteczkaOS.state.AppRegistry.filter(app =>
            PesteczkaOS.state.currentProfile.enabledApps.includes(app.id)
        );
        const iconsContainer = document.getElementById('desktopIcons');
        iconsContainer.innerHTML = '';
        enabledApps.forEach(app => {
            const iconEl = document.createElement('div');
            iconEl.className = 'desktop-icon';
            iconEl.dataset.window = app.id;
            iconEl.innerHTML = `<div class="desktop-icon-image">${app.icon}</div><div class="desktop-icon-name">${app.name}</div>`;
            iconsContainer.appendChild(iconEl);
        });
        setupDesktopInteractions();
    }

    async function loginAs(profileKey) {
        try {
            const profile = await PesteczkaOS.core.StorageSystem.db.get('profiles', profileKey);
            if (!profile) throw new Error('Profil nie znaleziony');
            PesteczkaOS.state.currentProfile = profile;

            if (profile.theme) applyTheme(profile.theme);

            document.getElementById('userName').textContent = profile.name;
            document.getElementById('loginScreen').classList.add('hidden');
            document.body.classList.remove('login-page');

            renderUIForProfile();
            setupUI();
            changeWallpaper(localStorage.getItem('pesteczkaOS_wallpaper') || 'default');

            document.getElementById('desktop').classList.add('active');
            UI.Feedback.toast(`Witaj, ${profile.name}!`, 'success');

        } catch (error) {
            console.error('Login failed:', error);
            UI.Feedback.show('Błąd logowania', error.message, 'error');
        }
    }

    async function openWindow(windowId) {
        const app = PesteczkaOS.state.AppRegistry.find(a => a.id === windowId);
        if (!app) return;

        let win = document.getElementById(`window-${windowId}`);
        if (!win) {
            win = createWindow(app);
        }

        const pluginAssets = await PesteczkaOS.core.PluginLoader.loadPlugin(windowId);
        if (pluginAssets && pluginAssets.html) {
            win.querySelector('.window-content').innerHTML = pluginAssets.html;
        }

        const appObjectName = `${windowId.charAt(0).toUpperCase() + windowId.slice(1)}App`;
        if (window[appObjectName] && typeof window[appObjectName].init === 'function') {
            window[appObjectName].init(PesteczkaOS.state.currentProfile, win);
        }

        win.style.display = 'flex';
        focusWindow(win);
    }
    
    // Simplified stubs for other functions not directly involved in the fix
    function setupUI() { /*...*/ }
    function applyTheme(theme) { /*...*/ }
    function setupDesktopInteractions() { /*...*/ }
    function createWindow(app) {
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = `window-${app.id}`;
        windowEl.style.width = app.width || '800px';
        windowEl.style.height = app.height || '600px';
        windowEl.innerHTML = `
            <div class="window-header">
                <div>${app.name}</div>
                <button class="window-control-btn close" data-action="close">✕</button>
            </div>
            <div class="window-content"></div>`;
        document.getElementById('desktop').appendChild(windowEl);
        windowEl.querySelector('.close').addEventListener('click', () => closeWindow(app.id));
        windowEl.addEventListener('mousedown', () => focusWindow(windowEl));
        return windowEl;
     }
    function closeWindow(id) {
        const win = document.getElementById(`window-${id}`);
        if(win) win.style.display = 'none';
    }
    function focusWindow(win) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = ++PesteczkaOS.state.zIndexCounter;
    }
    async function populateProfileSelector() {
        const profiles = await PesteczkaOS.core.StorageSystem.db.getAll('profiles');
        const selector = document.querySelector('#profileSelector');
        selector.innerHTML = '';
        profiles.forEach(p => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `<img src="${p.logo}" class="profile-logo"><h2>${p.name}</h2>`;
            card.addEventListener('click', () => loginAs(p.key));
            selector.appendChild(card);
        });
    }

    // EXPOSE CORE API
    window.PesteczkaOS.core.openWindow = openWindow;
    window.PesteczkaOS.core.PDFManager = PDFManager;
    window.PesteczkaOS.core.UI = UI;
    window.PesteczkaOS.core.changeWallpaper = changeWallpaper;
    window.PesteczkaOS.core.renderUIForProfile = renderUIForProfile;

    console.log('✅ App.js loaded successfully');
})();
