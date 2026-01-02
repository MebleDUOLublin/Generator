from PIL import Image
import os

# Utworzenie katalogu, jeśli nie istnieje
output_dir = "userData/wallpapers"
os.makedirs(output_dir, exist_ok=True)

# Definicje tapet: nazwa pliku i kolor (R, G, B)
wallpapers = {
    "wallpaper1.jpg": (44, 62, 80),   # Ciemny granat
    "wallpaper2.jpg": (52, 73, 94),   # Ciemnoszary
    "wallpaper3.jpg": (142, 68, 173)  # Fiolet
}

# Rozmiar obrazu
width, height = 1920, 1080

# Generowanie i zapisywanie obrazów
for filename, color in wallpapers.items():
    try:
        img = Image.new('RGB', (width, height), color=color)
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, 'JPEG')
        print(f"Utworzono tapetę: {filepath}")
    except Exception as e:
        print(f"Błąd podczas tworzenia {filename}: {e}")
