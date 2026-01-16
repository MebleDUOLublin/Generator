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
