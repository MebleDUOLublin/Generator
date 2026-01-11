/**
 * PESTECZKA OS - UI SCRIPT
 * Manages all general UI interactions, windows, and components.
 */

const UI = {
    zIndexCounter: 1000,
    draggedWindow: null,
    dragOffset: { x: 0, y: 0 },

    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        console.log('🎨 UI Module Initialized');
        this.setupGlobalEventListeners();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    },

    setupGlobalEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleWindowDrag(e));
        document.addEventListener('mouseup', () => this.stopWindowDrag());
        document.addEventListener('click', (e) => {
            // Close start menu if clicked outside
            const startMenu = document.getElementById('startMenu');
            const startBtn = document.getElementById('startBtn');
            if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !startBtn?.contains(e.target)) {
                this.toggleStartMenu(false);
            }
            // Close context menu
            document.getElementById('contextMenu')?.classList.remove('active');
        });
    },

    // ============================================
    // WINDOW MANAGEMENT
    // ============================================
    openWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        win.style.display = 'flex';
        win.classList.add('active');
        win.classList.remove('minimized', 'closing');
        this.focusWindow(win);

        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if (taskbarIcon) {
            taskbarIcon.classList.add('active', 'open');
        }

        // Specific init functions for apps should be called from app.js
    },

    closeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (win) {
            win.classList.add('closing');
            win.addEventListener('animationend', () => {
                win.classList.remove('active', 'focused', 'closing');
                win.style.display = 'none';
            }, { once: true });
        }
        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if (taskbarIcon) {
            taskbarIcon.classList.remove('active', 'open');
        }
    },

    minimizeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (win) {
            win.classList.add('minimized');
            win.classList.remove('active', 'focused');
        }
         const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if (taskbarIcon) {
            taskbarIcon.classList.remove('active');
        }
    },

    maximizeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            win.style.top = win.dataset.prevTop || '50px';
            win.style.left = win.dataset.prevLeft || '100px';
            win.style.width = win.dataset.prevWidth || '90vw';
            win.style.height = win.dataset.prevHeight || '85vh';
        } else {
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
            win.classList.add('maximized');
        }
    },

    toggleWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        if (win.classList.contains('active') && !win.classList.contains('minimized')) {
            this.minimizeWindow(windowId);
        } else {
            this.openWindow(windowId);
        }
    },

    focusWindow(win) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = ++this.zIndexCounter;
    },

    startDrag(event, win) {
        if (!win || win.classList.contains('maximized')) return;
        this.draggedWindow = win;
        this.focusWindow(win);
        const rect = win.getBoundingClientRect();
        this.dragOffset.x = event.clientX - rect.left;
        this.dragOffset.y = event.clientY - rect.top;
        event.preventDefault();
    },

    handleWindowDrag(event) {
        if (!this.draggedWindow) return;
        const newX = event.clientX - this.dragOffset.x;
        const newY = event.clientY - this.dragOffset.y;
        this.draggedWindow.style.left = Math.max(0, newX) + 'px';
        this.draggedWindow.style.top = Math.max(0, newY) + 'px';
    },

    stopWindowDrag() {
        this.draggedWindow = null;
    },

    handleWindowAction(action, windowId) {
        switch (action) {
            case 'minimize': this.minimizeWindow(windowId); break;
            case 'maximize': this.maximizeWindow(windowId); break;
            case 'close': this.closeWindow(windowId); break;
        }
    },

    // ============================================
    // DESKTOP & SHELL UI
    // ============================================
    updateClock() {
        const now = new Date();
        const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
        const clockEl = document.getElementById('clock');
        if (clockEl) {
            clockEl.querySelector('.clock-time').textContent = time;
            clockEl.querySelector('.clock-date').textContent = date;
        }
    },

    toggleStartMenu(forceState) {
        const menu = document.getElementById('startMenu');
        if (menu) {
            if (typeof forceState === 'boolean') {
                 menu.classList.toggle('active', forceState);
            } else {
                menu.classList.toggle('active');
            }
        }
    },

    showContextMenu(event) {
        event.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        if(contextMenu) {
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.classList.add('active');
        }
    },

    switchTab(tabEl) {
        const tabId = tabEl.dataset.tab;
        const tabsContainer = tabEl.parentElement;
        const windowContent = tabsContainer.parentElement;

        tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        tabEl.classList.add('active');

        windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const activeTabContent = windowContent.querySelector(`#${tabId}-tab`);
        if (activeTabContent) activeTabContent.classList.add('active');
    },

    // ============================================
    // FEEDBACK & NOTIFICATIONS
    // ============================================
    Feedback: {
        show(title, message, type = 'info') {
            const notification = document.getElementById('notification');
            if (!notification) {
                console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
                return;
            }
            notification.querySelector('.notification-title').textContent = title;
            notification.querySelector('.notification-message').textContent = message;

            const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444' };
            notification.style.borderLeftColor = colors[type] || colors.info;

            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 4000);
        },

        toast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);
            toast.classList.add('show');
            setTimeout(() => {
                toast.remove();
            }, 2500);
        },

        async confirm(message) {
            return new Promise(resolve => {
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content" style="width: 400px; text-align: center;">
                        <p style="font-size: 1.1rem; margin-bottom: 2rem;">${message}</p>
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <button class="btn btn-primary" id="confirm-yes">Tak</button>
                            <button class="btn btn-outline" id="confirm-no">Anuluj</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                modal.querySelector('#confirm-yes').onclick = () => {
                    modal.remove();
                    resolve(true);
                };
                modal.querySelector('#confirm-no').onclick = () => {
                    modal.remove();
                    resolve(false);
                };
            });
        }
    },

    // ============================================
    // COMMAND PATTERN (Undo/Redo)
    // ============================================
    Command: {
        history: [],
        undoStack: [],

        execute(command) {
            command.execute();
            this.history.push(command);
            this.undoStack = []; // Clear redo stack on new action
        },

        undo() {
            if (this.history.length > 0) {
                const command = this.history.pop();
                command.undo();
                this.undoStack.push(command);
            }
        },

        redo() {
            if (this.undoStack.length > 0) {
                const command = this.undoStack.pop();
                command.execute();
                this.history.push(command);
            }
        }
    }
};

console.log('✅ UI.js loaded successfully');
