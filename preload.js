// preload.js

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  // You can expose specific Node.js functionality to the renderer process
  // in a controlled way here.
  console.log('Preload script loaded.');
});
