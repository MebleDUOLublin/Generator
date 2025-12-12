
from PIL import Image

def create_placeholder_image(width, height, color, filename):
    """Creates a simple PNG image with a solid color."""
    img = Image.new('RGB', (width, height), color)
    img.save(f"userData/{filename}", 'PNG')

if __name__ == "__main__":
    create_placeholder_image(200, 150, (255, 105, 180), 'wallpaper1.png')  # Hot Pink
    create_placeholder_image(200, 150, (135, 206, 235), 'wallpaper2.png')  # Sky Blue
    create_placeholder_image(200, 150, (60, 179, 113), 'wallpaper3.png')   # Medium Sea Green
    print("Generated 3 placeholder images in userData/")
