import os
from PIL import Image, ImageDraw

# --- Konfiguracja ---
WALLPAPERS_DIR = 'userData/wallpapers'
NUM_WALLPAPERS = 4
IMAGE_SIZE = (1920, 1080)
COLORS = [
    ((76, 10, 100), (200, 100, 150)),   # Fioletowy gradient
    ((10, 50, 100), (80, 150, 200)),  # Niebieski gradient
    ((0, 70, 50), (50, 180, 150)),   # Zielony gradient
    ((100, 50, 10), (220, 150, 80))    # Pomarańczowy gradient
]

# --- Upewnij się, że katalog istnieje ---
os.makedirs(WALLPAPERS_DIR, exist_ok=True)

def generate_gradient_wallpaper(index, colors):
    """Generuje i zapisuje tapetę z gradientem."""
    filename = f'wallpaper{index}.jpg'
    filepath = os.path.join(WALLPAPERS_DIR, filename)

    if os.path.exists(filepath):
        print(f'✅ Tapeta {filename} już istnieje. Pomijam.')
        return

    try:
        print(f'🎨 Generowanie tapety #{index}...')
        img = Image.new('RGB', IMAGE_SIZE)
        draw = ImageDraw.Draw(img)

        # Rysuj gradient od lewej do prawej
        start_color = colors[0]
        end_color = colors[1]
        for i in range(IMAGE_SIZE[0]):
            r = start_color[0] + (end_color[0] - start_color[0]) * i // IMAGE_SIZE[0]
            g = start_color[1] + (end_color[1] - start_color[1]) * i // IMAGE_SIZE[0]
            b = start_color[2] + (end_color[2] - start_color[2]) * i // IMAGE_SIZE[0]
            draw.line([(i, 0), (i, IMAGE_SIZE[1])], fill=(r, g, b))

        img.save(filepath, 'JPEG', quality=90)
        print(f'👍 Zapisano pomyślnie: {filepath}')

    except Exception as e:
        print(f'❌ Wystąpił błąd podczas generowania tapety #{index}: {e}')


if __name__ == "__main__":
    print('--- Rozpoczynam generowanie tapet ---')
    for i in range(NUM_WALLPAPERS):
        generate_gradient_wallpaper(i + 1, COLORS[i % len(COLORS)])
    print('--- Zakończono generowanie tapet ---')
