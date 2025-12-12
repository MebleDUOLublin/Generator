import http.server
import socketserver
import webbrowser
import os
import threading
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == '/shutdown':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "shutting down"}')

            def shutdown():
                self.server.shutdown()
                print("Server shutting down...", flush=True)
                sys.exit(0)

            threading.Thread(target=shutdown).start()
        else:
            # Fallback to default behavior for other POST requests if any
            super().do_POST()

# Setting allow_reuse_address to True
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Serving at port {PORT}")
    # In a real-world scenario, you might want to open the browser automatically.
    # For automated environments, this is often disabled.
    # webbrowser.open_new_tab(f'http://localhost:{PORT}')
    httpd.serve_forever()
