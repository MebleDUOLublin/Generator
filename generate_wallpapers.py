
from PIL import Image, ImageDraw
import os

def generate_wallpaper(width, height, color, filename):
    """Generates a simple wallpaper image."""
    image = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(image)

    # Add some simple geometric shapes for visual interest
    for i in range(0, width, 50):
        draw.line((i, 0, i, height), fill=(255, 255, 255, 50))
    for i in range(0, height, 50):
        draw.line((0, i, width, i), fill=(255, 255, 255, 50))

    try:
        image.save(filename, 'PNG')
        print(f"Successfully generated {filename}")
    except IOError as e:
        print(f"Error saving {filename}: {e}")

def main():
    """Main function to generate wallpapers."""
    output_dir = 'userData/wallpapers'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")

    wallpapers = {
        'wallpaper1.png': (4, 8, 110),
        'wallpaper2.png': (110, 8, 4),
        'wallpaper3.png': (8, 110, 4)
    }

    for filename, color in wallpapers.items():
        filepath = os.path.join(output_dir, filename)
        generate_wallpaper(1920, 1080, color, filepath)

if __name__ == '__main__':
    main()
