# Pesteczka OS - Modular Business System

Pesteczka OS is a lightweight, modular operating system environment built for the web, designed to run a suite of business-oriented applications. Its core philosophy is a plugin-based architecture, allowing for easy expansion and maintenance.

**Created by Paweł Steczka ([pesteczka.com](https://pesteczka.com))**

![Screenshot of the Pesteczka OS desktop interface](https://i.imgur.com/qRSzDBc.png)

## Key Features

*   **Modular, Plugin-Based Architecture:** The entire system is built around plugins. Each application (like the Offer Generator or Settings) is a self-contained module, making the system easy to extend and maintain.
*   **Multi-Profile System:** Easily manage different business entities. Each profile has its own data, branding (logo, color scheme), and set of enabled applications, allowing for tailored experiences.
*   **Dynamic UI:** The desktop, taskbar, and start menu are all generated dynamically based on the applications enabled for the currently logged-in profile.
*   **Offer Generator:** A powerful, built-in application to create, manage, and generate professional-looking PDF offers for clients.
*   **Lightweight & Fast:** Built entirely with vanilla JavaScript, HTML, and CSS, ensuring a snappy and responsive user experience without the need for heavy frameworks.
*   **Offline First:** Uses IndexedDB to store all data locally in the browser, making the application fully functional without an internet connection.

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

You will need the following software installed on your system:

*   **Python 3.x:** Required to run the local development server.
*   **Node.js and npm:** Required for managing project dependencies (like `pdfmake`).

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/pesteczka-os.git
    cd pesteczka-os
    ```

2.  **Install dependencies:**
    The project uses a few Node.js packages for functionalities like PDF generation. Install them using npm:
    ```sh
    npm install
    ```

3.  **Run the development server:**
    A simple Python web server is included to serve the application locally.
    ```sh
    python3 run.py
    ```

4.  **Open in browser:**
    Once the server is running, you can access the application by navigating to:
    [http://localhost:8080](http://localhost:8080)

## Project Structure

The project is organized with a clear separation between the core OS and its applications:

```
/
├── src/
│   ├── apps/               # Contains all self-contained application plugins
│   │   └── offers/
│   ├── assets/             # Shared static assets (CSS, logos, fonts)
│   └── core/               # The OS "microkernel" (app logic, storage, UI)
├── vendor/                 # Third-party libraries (e.g., pdfmake)
├── index.html              # The main application shell
├── profiles.json           # Default user/business profiles data
└── run.py                  # Simple Python server for development
```

## Creating a New Application (Plugin)

To extend the system, you can create your own application.

1.  **Create a Directory:** Add a new folder in `src/apps/`. The folder name is your app's unique ID (e.g., `my-new-app`).

2.  **Create `manifest.json`:** This file describes your app to the OS.

    ```json
    {
      "id": "my-new-app",
      "name": "My New App",
      "description": "A brief description.",
      "icon": "🚀",
      "entrypoints": { "html": "ui.html", "js": "main.js" }
    }
    ```

3.  **Create `ui.html`:** This file contains only the HTML for your app's content area.

4.  **Create `main.js`:** This file contains your app's logic. It must expose a global object (e.g., `window.MyNewAppApp`) with an `init(profile)` function.

5.  **Register the Plugin:** Add the path to your new `manifest.json` in `src/core/pluginLoader.js` to make it discoverable.

## Building for Production

Currently, the project is designed for development and direct use from a web server. A build process for creating a standalone executable (e.g., using Electron) is planned for the future.
