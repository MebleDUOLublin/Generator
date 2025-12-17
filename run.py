import http.server
import socketserver
import webbrowser
import os
import threading
import sys
import logging
from logging.handlers import RotatingFileHandler

# --- Setup Logging ---
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
log_file = 'server.log'

# Use a rotating file handler to prevent the log file from growing indefinitely
# 1MB per file, keeping up to 5 backup logs.
file_handler = RotatingFileHandler(log_file, maxBytes=1024*1024, backupCount=5)
file_handler.setFormatter(log_formatter)

# Also log to console for development
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(log_formatter)

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)


# --- Determine Correct Path ---
# PyInstaller creates a temp folder and stores path in _MEIPASS
if getattr(sys, 'frozen', False):
    # Running as a bundled exe
    BASE_DIR = sys._MEIPASS
    logger.info(f"Running in BUNDLED mode. Base directory: {BASE_DIR}")
else:
    # Running as a .py script
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    logger.info(f"Running in DEVELOPMENT mode. Base directory: {BASE_DIR}")

PORT = 8080

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # The directory is set here, using the globally determined BASE_DIR
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/shutdown':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "shutting down"}')
            logger.info("Shutdown endpoint called. Server is shutting down.")

            # Shutdown in a new thread to allow the response to be sent
            def shutdown_server():
                self.server.shutdown()
                self.server.server_close()
                logger.info("Server has been shut down.")
                sys.exit(0)

            threading.Thread(target=shutdown_server).start()
        else:
            # Fallback for other POST requests
            super().do_POST()

    def log_message(self, format, *args):
        # Override to direct server logs to our logger
        logger.info(f"HTTP Request: {self.address_string()} - {args[0]} {args[1]}")

def open_browser():
    """Opens the web browser in a separate thread."""
    try:
        webbrowser.open_new_tab(f'http://localhost:{PORT}')
        logger.info("Browser opened successfully.")
    except Exception as e:
        logger.error(f"Failed to open browser: {e}")

def run_server():
    """Starts the HTTP server."""
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            logger.info(f"Serving at http://localhost:{PORT}")
            # Open browser in a thread so it doesn't block server startup
            threading.Timer(1, open_browser).start()
            httpd.serve_forever()
    except OSError as e:
        logger.error(f"Could not start server on port {PORT}: {e}")
        # Exit if the port is already in use
        sys.exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
