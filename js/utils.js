/**
 * PESTECZKA OS - UTILITY FUNCTIONS
 * A collection of helper functions used across the application.
 */

/**
 * A simple shorthand for document.querySelector.
 * @param {string} selector - The CSS selector to find.
 * @returns {Element|null} The first element matching the selector, or null.
 */
export function $(selector) {
    return document.querySelector(selector);
}

/**
 * A simple shorthand for document.querySelectorAll.
 * @param {string} selector - The CSS selector to find.
 * @returns {NodeList} A NodeList of all elements matching the selector.
 */
export function $$(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generates a simple unique ID. Not cryptographically secure.
 * @param {string} prefix - An optional prefix for the ID.
 * @returns {string} A unique ID string.
 */
export function simpleUID(prefix = 'id_') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
