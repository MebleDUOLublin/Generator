from PIL import Image, ImageDraw

def generate_gradient_wallpaper(width, height, color_from, color_to, filename):
    """Generates a vertical gradient wallpaper and saves it as a PNG file."""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)

    r1, g1, b1 = color_from
    r2, g2, b2 = color_to

    for i in range(height):
        r = int(r1 + (r2 - r1) * i / height)
        g = int(g1 + (g2 - g1) * i / height)
        b = int(b1 + (b2 - b1) * i / height)
        draw.line([(0, i), (width, i)], fill=(r, g, b))

    img.save(filename, 'PNG')
    print(f"Generated wallpaper: {filename}")

if __name__ == "__main__":
    WIDTH, HEIGHT = 1920, 1080
    OUTPUT_DIR = "userData/wallpapers"

    # Wallpaper definitions (from color, to color)
    wallpapers = {
        "wallpaper_default.png": ((102, 126, 234), (118, 75, 162)), # Original purple gradient
        "wallpaper1.png": ((24, 49, 83), (11, 23, 42)),          # Deep space blue
        "wallpaper2.png": ((2, 62, 138), (0, 119, 182)),         # Ocean blue
        "wallpaper3.png": ((64, 224, 208), (255, 140, 0)),       # Teal to orange
    }

    import os
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for name, colors in wallpapers.items():
        generate_gradient_wallpaper(WIDTH, HEIGHT, colors[0], colors[1], os.path.join(OUTPUT_DIR, name))

    print("\nAll wallpapers generated successfully!")
