# Pesteczka OS

## Project Overview

Pesteczka OS is a web-based desktop environment designed to run in a browser, created by PSteczka (pesteczka.com). It offers a dynamic and customizable user interface that can be tailored to different user profiles, each with its own theme, applications, and settings. The project is built using vanilla HTML, CSS, and JavaScript, with a Python server for local development.

## Key Features

*   **Dynamic Theming:** The look and feel of the OS can be changed based on the user profile. The system supports multiple themes, with a default "Pesteczka" theme (Royal Purple and Neon Blue) and a "Meble Duo" theme (Red, White, and Black).
*   **User Profiles:** The OS supports multiple user profiles, each with its own set of applications, desktop icons, and start menu items.
*   **Desktop Environment:** A familiar desktop interface with a taskbar, start menu, and desktop icons.
*   **Application Suite:** Includes a set of built-in applications, such as:
    *   **Generator Ofert:** An offer generation tool.
    *   **Dashboard:** A data visualization dashboard.
    *   **Ustawienia (Settings):** An application for customizing the OS.
    *   **Neon Snake:** A classic snake game.
*   **Extensible:** The OS is designed to be extensible, with a clear separation of concerns between the UI, application logic, and data storage.

## Setup and Installation

### Running in a Browser

1.  **Start the Server:**
    ```bash
    python3 run.py
    ```
2.  **Open in Browser:** Open your web browser and navigate to `http://localhost:8080`.

### Building the Application (.exe)

This project can be packaged as a standalone desktop application using Electron.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Build the Application:**
    ```bash
    npm run dist
    ```
    This command will create a `dist` folder containing the executable file.

## Project Structure

```
.
├── app.js              # Main application logic
├── style.css           # Main stylesheet
├── index.html          # Main HTML file
├── ui.js               # UI components and logic
├── storage.js          # Data storage logic (IndexedDB)
├── profiles.json       # User profile data
├── run.py              # Python server for local development
├── main.js             # Electron main process
├── preload.js          # Electron preload script
├── package.json        # Project metadata and dependencies
└── README.md           # This file
```

## Customization

The OS can be customized by modifying the `profiles.json` file. This file contains the user profiles, including their names, themes, and application lists.

### Themes

Themes are defined in `style.css` using CSS variables. Each theme has a primary and accent color. To add a new theme, you need to:

1.  Add the new theme colors to `style.css`.
2.  Add a new theme object to the `profiles.json` file.
3.  Assign the new theme to a user profile.

### Applications

Applications are defined in their own JavaScript files (e.g., `snake.js`, `domator.js`). To add a new application, you need to:

1.  Create a new JavaScript file for the application logic.
2.  Add the new application to the `desktopIcons` and `startMenuItems` arrays in the `profiles.json` file.
3.  Add a new case to the `launchApp` function in `app.js` to handle launching the new application.
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
