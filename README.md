# Pesteczka OS - Premium Business System

Pesteczka OS is a web-based "operating system" designed to streamline business operations. It provides a suite of applications within a unified desktop environment, accessible from any modern web browser. The flagship application is a powerful Offer Generator that allows for the creation, management, and export of professional business proposals.

**Created by PSteczka (pesteczka.com)**

## Key Features

*   **Virtual Desktop Environment:** A familiar, intuitive desktop interface with a taskbar, start menu, and draggable windows.
*   **Multi-Profile Support:** Easily switch between different company profiles, each with its own branding, data, and settings.
*   **Dynamic Theming:** The user interface automatically adapts to the brand colors of the selected profile.
*   **Advanced Offer Generator:** A comprehensive tool for creating detailed sales offers. Features include dynamic product cards, drag-and-drop reordering, image support, automatic calculations, and autosave functionality.
*   **PDF Export:** Generate professional, branded PDF documents from the offers you create, with customizable templates and layouts.
*   **"Zamówienie Domator" App:** A dedicated application for quickly generating orders for a specific partner, complete with its own interface and PDF export capabilities.
*   **Data Persistence:** All data is saved locally in the browser's IndexedDB, ensuring your work is never lost between sessions.
*   **Extensible:** The OS is designed to be extensible, with additional applications like a data dashboard, a settings panel, and even a retro snake game.

## Recent Improvements

This project has recently undergone several improvements to enhance its reliability, functionality, and user experience:

*   **UI Modernization:** The "Zamówienie Domator" and "Offer Generator" applications have been redesigned for a more intuitive and consistent user experience.
*   **Enhanced Offer Generator:** The Offer Generator now uses a `<template>` based approach for product cards, features a more reliable drag-and-drop system, and includes a visual indicator for the autosave status.
*   **Improved UX:** The overall user interface has been polished with better icon visibility, refined animations for window management, and improved interactive feedback on UI elements.
*   **Code Refactoring:** The JavaScript code for the "Domator" and "Offer Generator" apps has been refactored for better readability, maintainability, and performance.

## Getting Started

To run Pesteczka OS locally, you will need Python 3 installed.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Run the application:**
    ```bash
    python3 run.py
    ```

    The application will be served at `http://localhost:8080`, and it will automatically open in your default web browser.

## Project Structure

*   `index.html`: The main entry point of the application.
*   `style.css`: The stylesheet for the entire application.
*   `app.js`: The core JavaScript file that manages the OS environment and application logic.
*   `profiles.json`: The configuration file for the different company profiles.
*   `logos/`: A directory containing the logos for the different brands.
*   `run.py`: The Python script for running the local web server.
*   `tests/`: Contains the Playwright test suite for automated testing.

## Technologies Used

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **UI:** Custom-built component library (windows, tabs, modals, etc.)
*   **Data Storage:** IndexedDB for client-side persistence.
*   **PDF Generation:** jsPDF and autoTable plugin.
*   **Charting:** Chart.js for the dashboard.
*   **Development Server:** Python 3 with the built-in `http.server` module.
