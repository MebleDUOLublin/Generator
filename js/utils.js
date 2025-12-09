
export function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const timeEl = clockEl.querySelector('.clock-time');
        const dateEl = clockEl.querySelector('.clock-date');
        if (timeEl) timeEl.textContent = time;
        if (dateEl) dateEl.textContent = date;
    }
}

export function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        return;
    }

    const titleEl = notification.querySelector('.notification-title');
    const messageEl = notification.querySelector('.notification-message');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444' };
    notification.style.borderLeftColor = colors[type] || colors.info;

    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

export function generateOfferNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const offerNumberInput = document.getElementById('offerNumber');
    if(offerNumberInput) offerNumberInput.value = `OF/${year}/${month}/${day}/${random}`;
}

export function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const offerDateInput = document.getElementById('offerDate');
    if(offerDateInput) offerDateInput.value = today;

    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    const validUntilInput = document.getElementById('validUntil');
    if(validUntilInput) validUntilInput.value = validDate.toISOString().split('T')[0];
}
