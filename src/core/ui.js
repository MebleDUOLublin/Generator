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

        container.appendChild(toast);

        // Delay adding the 'show' class to trigger the CSS transition
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                // Remove the element after the transition ends
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300); // Corresponds to transition duration in style.css
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
const initializeAdvancedUI = (containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const actionsBar = container.querySelector('.actions-bar');
    if (actionsBar && !actionsBar.querySelector('.undo-btn')) {
        const undoBtn = document.createElement('button');
        undoBtn.className = 'btn btn-outline undo-btn';
        undoBtn.textContent = '↩️ Cofnij';
        undoBtn.disabled = true;
        undoBtn.onclick = () => CommandManager.undo();
        actionsBar.appendChild(undoBtn);

        const redoBtn = document.createElement('button');
        redoBtn.className = 'btn btn-outline redo-btn';
        redoBtn.textContent = '↪️ Ponów';
        redoBtn.disabled = true;
        redoBtn.onclick = () => CommandManager.redo();
        actionsBar.appendChild(redoBtn);

        CommandManager.subscribe(({ canUndo, canRedo }) => {
            undoBtn.disabled = !canUndo;
            redoBtn.disabled = !canRedo;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Shutdown logic
    const closeAppBtn = document.getElementById('closeAppBtn');
    if (closeAppBtn) {
        closeAppBtn.addEventListener('click', async () => {
            const confirmed = await UIFeedback.confirm('Czy na pewno chcesz zamknąć aplikację?');
            if (confirmed) {
                try {
                    await fetch('/shutdown', { method: 'POST' });
                    UIFeedback.toast('Aplikacja została zamknięta.', 'info');
                    // Give a moment for the toast to show
                    setTimeout(() => window.close(), 1000);
                } catch (error) {
                    console.error('Shutdown request failed:', error);
                    UIFeedback.toast('Serwer nie odpowiada. Zamknij okno ręcznie.', 'error');
                }
            }
        });
    }
});

window.UI = {
    Form: ReactiveForm,
    Observer: FormObserver,
    Feedback: UIFeedback,
    Command: CommandManager,
    initAdvanced: initializeAdvancedUI
};
