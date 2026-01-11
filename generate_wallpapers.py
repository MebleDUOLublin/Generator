import os
from PIL import Image, ImageDraw

# --- Konfiguracja ---
OUTPUT_DIR = 'userData/wallpapers'
IMAGE_SIZE = (1920, 1080)
WALLPAPERS = {
    'wallpaper1': ('#667eea', '#764ba2'), # Fioletowy gradient (Natura)
    'wallpaper2': ('#2af598', '#009efd'), # Zielono-niebieski (Abstrakcja)
    'wallpaper3': ('#1e3c72', '#2a5298')  # Ciemnoniebieski (Kosmos)
}

def hex_to_rgb(hex_color):
    """Konwertuje kolor HEX na krotkę RGB."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient_wallpaper(filename, color_start, color_end):
    """Tworzy obraz z pionowym gradientem i zapisuje go jako JPEG."""
    output_path = os.path.join(OUTPUT_DIR, f'{filename}.jpg')

    print(f"Generowanie tapety gradientowej '{filename}'...")

    try:
        # Konwersja kolorów HEX na RGB
        start_rgb = hex_to_rgb(color_start)
        end_rgb = hex_to_rgb(color_end)

        # Stworzenie nowego obrazu
        image = Image.new('RGB', IMAGE_SIZE)
        draw = ImageDraw.Draw(image)

        # Rysowanie gradientu linia po linii
        for y in range(IMAGE_SIZE[1]):
            # Obliczenie koloru dla bieżącego wiersza
            r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * y / IMAGE_SIZE[1])
            g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * y / IMAGE_SIZE[1])
            b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * y / IMAGE_SIZE[1])
            draw.line([(0, y), (IMAGE_SIZE[0], y)], fill=(r, g, b))

        # Zapis obrazu
        image.save(output_path, 'JPEG', quality=90)
        print(f"✅ Pomyślnie zapisano: {output_path}")
        return True

    except Exception as e:
        print(f"❌ BŁĄD: Nie udało się wygenerować tapety '{filename}'. {e}")
        return False

if __name__ == "__main__":
    # Upewnij się, że katalog docelowy istnieje
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Rozpoczynam generowanie {len(WALLPAPERS)} tapet do katalogu '{OUTPUT_DIR}'...")

    success_count = 0
    for filename, colors in WALLPAPERS.items():
        if create_gradient_wallpaper(filename, colors[0], colors[1]):
            success_count += 1

    print(f"\nZakończono. Pomyślnie wygenerowano {success_count} z {len(WALLPAPERS)} tapet.")
