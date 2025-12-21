
from PIL import Image, ImageDraw

def create_gradient_image(width, height, color1, color2, filename):
    """Creates a vertical gradient PNG image."""
    base = Image.new('RGB', (width, height), color1)
    top = Image.new('RGB', (width, height), color2)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        mask_data.extend([int(255 * (y / height))] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    path = f"userData/wallpapers/{filename}"
    base.save(path, 'PNG')
    print(f"Generated {path}")

if __name__ == "__main__":
    # A cool, blue/purple gradient
    create_gradient_image(1920, 1080, (29, 78, 216), (124, 58, 237), 'wallpaper1.png')
    # A warm, sunset-like gradient
    create_gradient_image(1920, 1080, (234, 88, 12), (251, 191, 36), 'wallpaper2.png')
    # A fresh, green/teal gradient
    create_gradient_image(1920, 1080, (4, 120, 87), (5, 150, 105), 'wallpaper3.png')
    print("\nGenerated 3 gradient wallpapers in userData/wallpapers/")
