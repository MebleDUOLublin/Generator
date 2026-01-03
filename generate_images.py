
from PIL import Image, ImageDraw

def create_gradient_image(width, height, color1, color2, filename):
    """Creates a beautiful gradient PNG image."""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)

    r1, g1, b1 = color1
    r2, g2, b2 = color2

    for y in range(height):
        # Interpolate color vertically
        r = int(r1 + (r2 - r1) * y / height)
        g = int(g1 + (g2 - g1) * y / height)
        b = int(b1 + (b2 - b1) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    img.save(f"userData/wallpapers/{filename}", 'JPEG')

if __name__ == "__main__":
    # Nature-inspired gradient
    create_gradient_image(1920, 1080, (22, 160, 133), (241, 196, 15), 'wallpaper1.jpg')

    # Abstract/Vibrant gradient
    create_gradient_image(1920, 1080, (155, 89, 182), (231, 76, 60), 'wallpaper2.jpg')

    # Space/Cosmic gradient
    create_gradient_image(1920, 1080, (44, 62, 80), (25, 25, 112), 'wallpaper3.jpg')

    print("Generated 3 beautiful gradient wallpapers in userData/wallpapers/")
