# Pesteczka OS - Modułowy System Biznesowy

Pesteczka OS to lekkie, modułowe środowisko "systemu operacyjnego" działające w przeglądarce, zaprojektowane do uruchamiania zestawu aplikacji biznesowych. Jego główną filozofią jest architektura oparta na wtyczkach (pluginach), co pozwala na łatwą rozbudowę i utrzymanie.

**Stworzone przez Paweł Steczka ([pesteczka.com](https://pesteczka.com))**

![Zrzut ekranu przedstawiający interfejs Pesteczka OS](https://i.imgur.com/qRSzDBc.png)

## Kluczowe Funkcje

*   **W pełni modułowa architektura:** System został zaprojektowany od podstaw z myślą o modułowości. Każda aplikacja to niezależna wtyczka, co umożliwia łatwe dodawanie nowych funkcjonalności bez ingerencji w rdzeń systemu.
*   **Dynamiczne ładowanie aplikacji:** Pesteczka OS automatycznie wykrywa i ładuje wszystkie dostępne aplikacje przy starcie. Wystarczy dodać folder z nową aplikacją, a system sam zajmie się resztą.
*   **System profili:** Umożliwia zarządzanie wieloma firmami lub użytkownikami w jednej instalacji. Każdy profil ma własne logo, motyw kolorystyczny, dane oraz przypisane aplikacje.
*   **Zaawansowany generator ofert:** Jedna z kluczowych aplikacji, która pozwala na intuicyjne tworzenie, zarządzanie i eksportowanie profesjonalnych ofert do formatu PDF.
*   **Lekkość i szybkość:** Dzięki zastosowaniu czystego JavaScriptu, HTML i CSS, system działa niezwykle szybko i responsywnie, nawet na starszym sprzęcie.
*   **Praca w trybie offline:** Wszystkie dane przechowywane są lokalnie w przeglądarce dzięki IndexedDB, co zapewnia pełną funkcjonalność nawet bez dostępu do internetu.

## Pierwsze Kroki

Aby uruchomić projekt lokalnie, postępuj zgodnie z poniższymi krokami.

### Wymagania

*   **Python 3.x:** Niezbędny do uruchomienia lokalnego serwera deweloperskiego.
*   **Node.js i npm:** Używane do zarządzania zależnościami, np. do generowania plików PDF.

### Instalacja

1.  **Sklonuj repozytorium:**
    ```sh
    git clone https://github.com/MebleDUOLublin/Generator.git
    cd Generator
    ```

2.  **Zainstaluj zależności:**
    ```sh
    npm install
    ```

3.  **Uruchom serwer:**
    ```sh
    python3 run.py
    ```

4.  **Otwórz w przeglądarce:**
    Aplikacja będzie dostępna pod adresem [http://localhost:8080](http://localhost:8080).

## Struktura Projektu

Projekt ma przejrzystą strukturę, która oddziela rdzeń systemu od poszczególnych aplikacji:

```
/
├── src/
│   ├── apps/               # Katalog na wszystkie aplikacje (wtyczki)
│   │   └── offers/         # Przykład aplikacji do generowania ofert
│   ├── assets/             # Wspólne zasoby: style, czcionki, obrazki
│   └── core/               # Rdzeń systemu: zarządzanie oknami, wtyczkami, danymi
├── index.html              # Główny plik HTML
├── profiles.json           # Domyślna konfiguracja profili
└── run.py                  # Serwer deweloperski w Pythonie
```

## Tworzenie Nowej Aplikacji

Dzięki dynamicznemu ładowaniu, tworzenie nowych aplikacji jest niezwykle proste.

1.  **Stwórz nowy folder** w katalogu `src/apps/`. Nazwa folderu będzie identyfikatorem Twojej aplikacji (np. `faktury`).

2.  **Dodaj plik `manifest.json`:** Jest to plik konfiguracyjny, który informuje system o Twojej aplikacji.

    ```json
    {
      "id": "faktury",
      "name": "Faktury",
      "description": "Aplikacja do zarządzania fakturami.",
      "icon": "📄",
      "entrypoints": { "html": "ui.html", "js": "main.js" }
    }
    ```

3.  **Stwórz plik `ui.html`:** Będzie on zawierał strukturę HTML Twojej aplikacji.

4.  **Stwórz plik `main.js`:** Tutaj umieścisz całą logikę aplikacji. Pamiętaj, aby na końcu pliku zdefiniować globalny obiekt, np. `window.FakturyApp`, który będzie zawierał metodę `init(profil, elementOkna)`.

Po wykonaniu tych kroków, Twoja aplikacja zostanie automatycznie załadowana przy następnym uruchomieniu systemu. Aby ją aktywować dla wybranego profilu, dodaj jej `id` do tablicy `enabledApps` w pliku `profiles.json`.
