/**
 * ADVANCED UI SYSTEM v2.0
 * - Reactive field updates
 * - Command pattern for undo/redo
 * - Smart form synchronization
 * - Real-time validation display
 */

// ============================================
// COMMAND PATTERN - UNDO/REDO
// ============================================
const CommandManager = (() => {
    let history = [];
    let currentIndex = -1;
    const maxHistorySize = 100;
    const subscribers = new Set();

    const execute = (command) => {
        try {
            command.execute();
            
            // Remove any redo history
            history = history.slice(0, currentIndex + 1);
            
            // Add new command
            history.push(command);
            currentIndex++;

            // Limit history size
            if (history.length > maxHistorySize) {
                history.shift();
                currentIndex--;
            }

            notifySubscribers();
        } catch (e) {
            console.error('Command execution failed:', e);
        }
    };

    const undo = () => {
        if (currentIndex > 0) {
            currentIndex--;
            history[currentIndex + 1].undo?.();
            notifySubscribers();
        }
    };

    const redo = () => {
        if (currentIndex < history.length - 1) {
            currentIndex++;
            history[currentIndex].execute();
            notifySubscribers();
        }
    };

    const clear = () => {
        history = [];
        currentIndex = -1;
        notifySubscribers();
    };

    const subscribe = (callback) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
    };

    const notifySubscribers = () => {
        subscribers.forEach(cb => {
            try {
                cb({
                    canUndo: currentIndex > 0,
                    canRedo: currentIndex < history.length - 1,
                    historySize: history.length
                });
            } catch (e) {
                console.error('Subscriber callback error:', e);
            }
        });
    };

    return { execute, undo, redo, clear, subscribe };
})();

// ============================================
// HELPER FUNCTIONS
// ============================================
function _createProductCard(productId) {
    const createEl = (tag, props = {}, children = []) => {
        const el = document.createElement(tag);
        Object.assign(el, props);
        children.forEach(child => el.appendChild(child));
        return el;
    };

    const createFormGroup = (label, input) => createEl('div', { className: 'form-group' }, [createEl('label', { className: 'form-label', textContent: label }), input]);
    const createInput = (id, type, value, oninput) => createEl('input', { id, type, value, oninput, className: 'form-input' });
    const createButton = (text, onclick, className) => createEl('button', { textContent: text, onclick, className });

    const productCard = createEl('div', {
        id: `product-${productId}`,
        className: 'product-card',
        draggable: true,
        ondragstart: (e) => dragStart(e, productId),
        ondragover: dragOver,
        ondrop: (e) => drop(e, productId)
    });

    const imageZone = createEl('div', { className: 'product-image-zone' }, [
        createEl('div', { id: `productImagePreview-${productId}`, className: 'product-image-preview', textContent: '📷' }),
        createEl('input', { id: `productImage-${productId}`, type: 'file', accept: 'image/*', style: 'display:none', onchange: (e) => uploadProductImage(productId, e) })
    ]);
    imageZone.onclick = () => document.getElementById(`productImage-${productId}`).click();

    const productDetails = createEl('div', { className: 'product-details' }, [
        createFormGroup('Nazwa produktu', createInput(`productName-${productId}`, 'text', '', updateSummary)),
        createEl('div', { className: 'form-grid-inner' }, [
            createFormGroup('Kod', createInput(`productCode-${productId}`, 'text', '', null)),
            createFormGroup('Ilość', createInput(`productQty-${productId}`, 'number', 1, updateSummary)),
            createFormGroup('Cena netto', createInput(`productPrice-${productId}`, 'number', 0, updateSummary)),
            createFormGroup('Rabat (%)', createInput(`productDiscount-${productId}`, 'number', 0, updateSummary)),
        ])
    ]);

    productCard.append(
        createEl('div', { className: 'drag-handle', textContent: '☰' }),
        createEl('div', { className: 'product-content-wrapper' }, [imageZone, productDetails]),
        createFormGroup('Opis produktu', createEl('textarea', { id: `productDesc-${productId}`, className: 'form-textarea', rows: 2, placeholder: '• Cecha 1\n• Cecha 2' })),
        createEl('div', { className: 'product-actions' }, [
            createButton('📋 Duplikuj', () => duplicateProduct(productId), 'btn btn-outline'),
            createButton('🗑️ Usuń', () => removeProduct(productId), 'btn btn-outline btn-danger')
        ])
    );

    return productCard;
}


// ============================================
// PRODUCT COMMANDS
// ============================================
class ProductCommand {
    constructor(action, productData) {
        this.action = action;
        this.productData = productData;
    }

    execute() {
        switch (this.action) {
            case 'add':
                this._addProduct();
                break;
            case 'remove':
                this._removeProduct();
                break;
        }
    }

    undo() {
        switch (this.action) {
            case 'add':
                this._removeProduct();
                break;
            case 'remove':
                this._addProduct();
                break;
        }
    }

    _addProduct() {
        const productId = this.productData.id || Date.now() + productIdCounter++;
        this.productData.id = productId;
        products.push(productId);
        const productCard = _createProductCard(productId);
        document.getElementById('productsList').appendChild(productCard);
        updateProductView();
        updateSummary();
        UI.Feedback.toast('➕ Dodano produkt', 'success');
    }

    _removeProduct() {
        const { id } = this.productData;
        const el = document.getElementById(`product-${id}`);
        if (el) el.remove();
        products = products.filter(pId => pId !== id);
        delete productImages[id];
        updateProductView();
        updateSummary();
        UI.Feedback.toast('🗑️ Usunięto produkt', 'info');
    }
}

class DuplicateProductCommand {
    constructor(originalProductId) {
        this.originalProductId = originalProductId;
        this.newProductId = null;
    }

    execute() {
        const originalData = {
            name: document.getElementById(`productName-${this.originalProductId}`)?.value || '',
            code: document.getElementById(`productCode-${this.originalProductId}`)?.value || '',
            qty: document.getElementById(`productQty-${this.originalProductId}`)?.value || '1',
            price: document.getElementById(`productPrice-${this.originalProductId}`)?.value || '0',
            discount: document.getElementById(`productDiscount-${this.originalProductId}`)?.value || '0',
            desc: document.getElementById(`productDesc-${this.originalProductId}`)?.value || '',
            image: productImages[this.originalProductId]
        };

        this.newProductId = Date.now() + productIdCounter++;
        products.push(this.newProductId);

        const productCard = _createProductCard(this.newProductId);
        document.getElementById('productsList').appendChild(productCard);

        document.getElementById(`productName-${this.newProductId}`).value = originalData.name + " (Kopia)";
        document.getElementById(`productCode-${this.newProductId}`).value = originalData.code;
        document.getElementById(`productQty-${this.newProductId}`).value = originalData.qty;
        document.getElementById(`productPrice-${this.newProductId}`).value = originalData.price;
        document.getElementById(`productDiscount-${this.newProductId}`).value = originalData.discount;
        document.getElementById(`productDesc-${this.newProductId}`).value = originalData.desc;

        if (originalData.image) {
            productImages[this.newProductId] = originalData.image;
            updateProductImage(this.newProductId);
        }

        updateProductView();
        updateSummary();
        UI.Feedback.toast('📋 Produkt zduplikowany', 'info');
    }

    undo() {
        const el = document.getElementById(`product-${this.newProductId}`);
        if (el) el.remove();
        products = products.filter(pId => pId !== this.newProductId);
        delete productImages[this.newProductId];
        updateProductView();
        updateSummary();
        UI.Feedback.toast('Cofnięto duplikację', 'info');
    }
}

class FieldChangeCommand {
    constructor(fieldId, oldValue, newValue) {
        this.fieldId = fieldId;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.timestamp = Date.now();
    }

    execute() {
        const element = document.getElementById(this.fieldId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = this.newValue;
            } else {
                element.value = this.newValue;
            }
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    undo() {
        const element = document.getElementById(this.fieldId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = this.oldValue;
            } else {
                element.value = this.oldValue;
            }
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// ============================================
// REACTIVE FORM SYSTEM
// ============================================
const ReactiveForm = (() => {
    const fieldSubscribers = new Map();
    const validationErrors = new Map();
    const debounceTimers = new Map();

    const createField = (fieldId, options = {}) => {
        const element = document.getElementById(fieldId);
        if (!element) return null;

        const {
            onChange,
            onValidate,
            debounceDelay = 300,
            enableHistory = true
        } = options;

        let previousValue = getValue(fieldId);

        // Handle input events
        element.addEventListener('input', (e) => {
            const newValue = e.target.value;
            
            // Debounce for expensive operations
            clearTimeout(debounceTimers.get(fieldId));
            debounceTimers.set(fieldId, setTimeout(() => {
                if (enableHistory && newValue !== previousValue) {
                    const command = new FieldChangeCommand(fieldId, previousValue, newValue);
                    CommandManager.execute(command);
                    previousValue = newValue;
                }

                if (onChange) onChange(newValue, previousValue);
                if (onValidate) validateField(fieldId, onValidate);
            }, debounceDelay));
        });

        // Handle change events
        element.addEventListener('change', (e) => {
            const newValue = e.target.value;
            if (onValidate) validateField(fieldId, onValidate);
        });

        // Setup subscribers
        if (!fieldSubscribers.has(fieldId)) {
            fieldSubscribers.set(fieldId, new Set());
        }

        return {
            onChange: (callback) => {
                fieldSubscribers.get(fieldId).add(callback);
                return () => fieldSubscribers.get(fieldId).delete(callback);
            },
            getError: () => validationErrors.get(fieldId),
            clearError: () => validationErrors.delete(fieldId),
            setValue: (value) => {
                element.value = value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            },
            getValue: () => getValue(fieldId),
            focus: () => element.focus(),
            blur: () => element.blur()
        };
    };

    const getValue = (fieldId) => {
        const element = document.getElementById(fieldId);
        if (!element) return null;
        
        if (element.type === 'checkbox') {
            return element.checked;
        }
        return element.value;
    };

    const validateField = (fieldId, validator) => {
        const value = getValue(fieldId);
        const error = validator(value);
        
        if (error) {
            validationErrors.set(fieldId, error);
            displayFieldError(fieldId, error);
        } else {
            validationErrors.delete(fieldId);
            clearFieldError(fieldId);
        }

        return !error;
    };

    const displayFieldError = (fieldId, error) => {
        const element = document.getElementById(fieldId);
        if (!element) return;

        element.style.borderColor = '#dc2626';
        element.style.backgroundColor = '#fef2f2';

        let errorDisplay = document.getElementById(`${fieldId}-error`);
        if (!errorDisplay) {
            errorDisplay = document.createElement('div');
            errorDisplay.id = `${fieldId}-error`;
            errorDisplay.style.cssText = 'color: #dc2626; font-size: 12px; margin-top: 4px;';
            element.parentNode.appendChild(errorDisplay);
        }
        errorDisplay.textContent = error;
    };

    const clearFieldError = (fieldId) => {
        const element = document.getElementById(fieldId);
        if (!element) return;

        element.style.borderColor = '';
        element.style.backgroundColor = '';

        const errorDisplay = document.getElementById(`${fieldId}-error`);
        if (errorDisplay) errorDisplay.remove();
    };

    const getFormData = (formSelector) => {
        const form = document.querySelector(formSelector);
        if (!form) return null;

        const data = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox') {
                    data[input.id] = input.checked;
                } else {
                    data[input.id] = input.value;
                }
            }
        });

        return data;
    };

    const setFormData = (formSelector, data) => {
        const form = document.querySelector(formSelector);
        if (!form) return;

        Object.entries(data).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    };

    const validateForm = (formSelector, schema) => {
        const form = document.querySelector(formSelector);
        if (!form) return false;

        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (input.id && schema[input.id]) {
                const value = input.type === 'checkbox' ? input.checked : input.value;
                const rules = schema[input.id];

                let error = null;
                if (rules.required && (!value || value.toString().trim() === '')) {
                    error = `${input.id} jest wymagane`;
                }

                if (!error && rules.validator) {
                    error = rules.validator(value);
                }

                if (error) {
                    displayFieldError(input.id, error);
                    isValid = false;
                } else {
                    clearFieldError(input.id);
                }
            }
        });

        return isValid;
    };

    return {
        createField,
        getValue,
        validateField,
        getFormData,
        setFormData,
        validateForm,
        displayFieldError,
        clearFieldError
    };
})();

// ============================================
// OBSERVABLE PATTERN FOR FIELD CHANGES
// ============================================
const FormObserver = (() => {
    const watchers = new Map();

    const watch = (fieldId, callback, immediate = false) => {
        let previousValue = document.getElementById(fieldId)?.value;

        if (immediate) {
            callback(previousValue, undefined);
        }

        const unwatch = ReactiveForm.createField(fieldId, {
            onChange: (newValue) => {
                callback(newValue, previousValue);
                previousValue = newValue;
            }
        }).onChange(callback);

        if (!watchers.has(fieldId)) {
            watchers.set(fieldId, []);
        }
        watchers.get(fieldId).push(unwatch);

        return unwatch;
    };

    const unwatch = (fieldId) => {
        if (watchers.has(fieldId)) {
            watchers.get(fieldId).forEach(unsubscribe => unsubscribe());
            watchers.delete(fieldId);
        }
    };

    const computed = (fieldIds, computeFn) => {
        const calculate = () => {
            const values = fieldIds.map(id => ReactiveForm.getValue(id));
            return computeFn(...values);
        };

        const unsubscribes = fieldIds.map(fieldId => {
            return watch(fieldId, () => {
                calculate();
            });
        });

        return {
            get: calculate,
            unsubscribe: () => unsubscribes.forEach(fn => fn())
        };
    };

    return {
        watch,
        unwatch,
        computed
    };
})();

// ============================================
// UI FEEDBACK SYSTEM
// ============================================
const UIFeedback = (() => {
    const toast = (message, type = 'info', duration = 3000) => {
        const container = document.getElementById('toast-container') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            color: white;
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background: #10b981;' : ''}
            ${type === 'error' ? 'background: #ef4444;' : ''}
            ${type === 'warning' ? 'background: #f59e0b;' : ''}
            ${type === 'info' ? 'background: #3b82f6;' : ''}
        `;

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    };

    const createToastContainer = () => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    };

    const confirm = (message) => {
        return new Promise((resolve) => {
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                max-width: 400px;
                text-align: center;
            `;

            dialog.innerHTML = `
                <div style="margin-bottom: 24px; font-size: 16px; color: #111827;">
                    ${message}
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn-confirm" style="flex: 1; padding: 10px; border: none; border-radius: 6px; background: #3b82f6; color: white; cursor: pointer; font-weight: 600;">
                        Tak
                    </button>
                    <button class="btn-cancel" style="flex: 1; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: white; color: #374151; cursor: pointer; font-weight: 600;">
                        Nie
                    </button>
                </div>
            `;

            backdrop.appendChild(dialog);
            document.body.appendChild(backdrop);

            const confirmBtn = dialog.querySelector('.btn-confirm');
            const cancelBtn = dialog.querySelector('.btn-cancel');

            confirmBtn.addEventListener('click', () => {
                backdrop.remove();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                backdrop.remove();
                resolve(false);
            });
        });
    };

    return {
        toast,
        confirm
    };
})();

// ============================================
// INITIALIZE UI SYSTEM
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Add Undo/Redo buttons
    const actionsBar = document.querySelector('.actions-bar');
    if (actionsBar) {
        const undoBtn = document.createElement('button');
        undoBtn.id = 'undoBtn';
        undoBtn.className = 'btn btn-outline';
        undoBtn.textContent = '↩️ Cofnij';
        undoBtn.disabled = true;
        undoBtn.onclick = () => CommandManager.undo();
        actionsBar.appendChild(undoBtn);

        const redoBtn = document.createElement('button');
        redoBtn.id = 'redoBtn';
        redoBtn.className = 'btn btn-outline';
        redoBtn.textContent = '↪️ Ponów';
        redoBtn.disabled = true;
        redoBtn.onclick = () => CommandManager.redo();
        actionsBar.appendChild(redoBtn);

        CommandManager.subscribe(({ canUndo, canRedo }) => {
            undoBtn.disabled = !canUndo;
            redoBtn.disabled = !canRedo;
        });
    }

    // Initialize reactive fields
    ReactiveForm.createField('offerNumber', {
        onValidate: (value) => value.trim() ? null : 'Numer oferty jest wymagany.'
    });
    ReactiveForm.createField('buyerName', {
        onValidate: (value) => value.trim() ? null : 'Nazwa nabywcy jest wymagana.'
    });
});

window.UI = {
    Form: ReactiveForm,
    Observer: FormObserver,
    Feedback: UIFeedback,
    Command: CommandManager
};

console.log('✅ Advanced UI System v2.0 initialized');
