# Pesteczka OS - Premium Business System

Pesteczka OS is a web-based "operating system" designed to streamline business operations. It provides a suite of applications within a unified desktop environment, accessible from any modern web browser. The flagship application is a powerful Offer Generator that allows for the creation, management, and export of professional business proposals.

**Created by PSteczka (pesteczka.com)**

## Key Features

*   **Virtual Desktop Environment:** A familiar, intuitive desktop interface with a taskbar, start menu, and draggable windows.
*   **Multi-Profile Support:** Easily switch between different company profiles, each with its own branding, data, and settings.
*   **Dynamic Theming:** The user interface automatically adapts to the brand colors of the selected profile.
*   **Offer Generator:** A comprehensive tool for creating detailed sales offers, including product lists, images, discounts, and terms.
*   **PDF Export:** Generate professional, branded PDF documents from the offers you create.
*   **Data Persistence:** All data is saved locally in your browser, ensuring your work is never lost.
*   **Extensible:** The OS is designed to be extensible, with additional applications like a dashboard, a simple order generator, and even a game included.

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
