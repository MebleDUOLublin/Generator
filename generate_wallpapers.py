import os
import requests
from PIL import Image
import io

# Configuration
IMAGE_URLS = [
    "https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=1920",  # Abstract purple/blue waves
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920",  # Soft gradient
    "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=1920"   # Dark, textured surface
]
OUTPUT_DIR = "userData/wallpapers"

def generate_wallpapers():
    """
    Downloads, verifies, and saves a set of professional wallpapers for the application.
    """
    print("--- Starting Wallpaper Generation ---")

    # Ensure the output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output directory '{OUTPUT_DIR}' is ready.")

    for i, url in enumerate(IMAGE_URLS):
        filename = f"wallpaper_{i + 1}.jpg"
        filepath = os.path.join(OUTPUT_DIR, filename)

        print(f"\nProcessing image {i + 1}/{len(IMAGE_URLS)} from {url}...")

        try:
            # 1. Download the image
            response = requests.get(url, timeout=20)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            print("  - Download successful.")

            # 2. Verify the image using Pillow
            try:
                image_data = io.BytesIO(response.content)
                img = Image.open(image_data)
                img.verify()  # Verify that it is, in fact, an image
                print(f"  - Image verified successfully (Format: {img.format}).")
            except Exception as e:
                print(f"  - ERROR: Downloaded file from {url} is not a valid image. Skipping. Error: {e}")
                continue

            # 3. Save the image to the file
            with open(filepath, "wb") as f:
                f.write(response.content)

            print(f"  - Successfully saved to '{filepath}'")

        except requests.exceptions.RequestException as e:
            print(f"  - ERROR: Failed to download {url}. Error: {e}")
        except Exception as e:
            print(f"  - ERROR: An unexpected error occurred. Error: {e}")

    print("\n--- Wallpaper Generation Complete ---")

if __name__ == "__main__":
    generate_wallpapers()
