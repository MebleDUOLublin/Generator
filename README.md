# Pesteczka OS - Modułowy System Biznesowy

Pesteczka OS to lekkie, modułowe środowisko "systemu operacyjnego" działające w przeglądarce, zaprojektowane do uruchamiania zestawu aplikacji biznesowych. Jego główną filozofią jest architektura oparta na wtyczkach (pluginach), co pozwala na łatwą rozbudowę i utrzymanie.

**Stworzone przez Paweł Steczka ([pesteczka.com](https://pesteczka.com))**

![Zrzut ekranu przedstawiający interfejs Pesteczka OS](https://i.imgur.com/qRSzDBc.png)

## Kluczowe Funkcje

*   **Dynamiczna Architektura Oparta na Wtyczkach:** Cały system jest zbudowany wokół wtyczek. Każda aplikacja (jak Generator Ofert czy Ustawienia) jest samodzielnym modułem. System automatycznie wykrywa i ładuje wszystkie aplikacje umieszczone w folderze `src/apps`, co eliminuje potrzebę ręcznej konfiguracji.
*   **System Wielu Profili:** Z łatwością zarządzaj różnymi podmiotami biznesowymi. Każdy profil posiada własne dane, branding (logo, kolorystykę) oraz zestaw włączonych aplikacji, co pozwala na dostosowanie środowiska do indywidualnych potrzeb.
*   **Dynamiczny Interfejs Użytkownika:** Pulpit, pasek zadań i menu start są generowane dynamicznie na podstawie aplikacji włączonych dla aktualnie zalogowanego profilu.
*   **Generator Ofert:** Potężna, wbudowana aplikacja do tworzenia, zarządzania i generowania profesjonalnie wyglądających ofert w formacie PDF dla klientów.
*   **Lekki i Szybki:** Zbudowany w całości przy użyciu czystego JavaScriptu, HTML i CSS, co zapewnia błyskawiczne i responsywne działanie bez potrzeby korzystania z ciężkich frameworków.
*   **Działanie Offline:** Wykorzystuje IndexedDB do przechowywania wszystkich danych lokalnie w przeglądarce, dzięki czemu aplikacja jest w pełni funkcjonalna bez połączenia z internetem.

## Pierwsze Kroki

Postępuj zgodnie z poniższymi instrukcjami, aby uruchomić projekt na swojej lokalnej maszynie w celach deweloperskich i testowych.

### Wymagania Wstępne

Będziesz potrzebować następującego oprogramowania zainstalowanego na swoim systemie:

*   **Python 3.x:** Wymagany do uruchomienia lokalnego serwera deweloperskiego.
*   **Node.js i npm:** Wymagane do zarządzania zależnościami projektu (takimi jak `electron`).

### Instalacja i Uruchomienie

1.  **Sklonuj repozytorium:**
    ```sh
    git clone https://github.com/MebleDUOLublin/Generator.git
    cd Generator
    ```

2.  **Zainstaluj zależności:**
    Projekt wykorzystuje kilka pakietów Node.js do obsługi takich funkcji jak generowanie PDF. Zainstaluj je za pomocą npm:
    ```sh
    npm install
    ```

3.  **Uruchom serwer deweloperski:**
    Prosty serwer webowy w Pythonie jest dołączony, aby udostępniać aplikację lokalnie.
    ```sh
    python3 run.py
    ```

4.  **Otwórz w przeglądarce:**
    Gdy serwer jest uruchomiony, możesz uzyskać dostęp do aplikacji, przechodząc pod adres:
    [http://localhost:8080](http://localhost:8080)

## Struktura Projektu

Projekt jest zorganizowany z wyraźnym podziałem na rdzeń systemu (core) i jego aplikacje:

```
/
├── src/
│   ├── apps/               # Zawiera wszystkie samodzielne wtyczki (aplikacje)
│   │   └── offers/         # Przykładowa aplikacja: Generator Ofert
│   ├── assets/             # Współdzielone zasoby statyczne (CSS, loga, czcionki)
│   └── core/               # "Mikrojądro" systemu (logika aplikacji, przechowywanie danych, UI)
├── index.html              # Główna powłoka aplikacji
├── profiles.json           # Domyślne dane profili użytkowników/firm
└── run.py                  # Serwer w Pythonie, który obsługuje dynamiczne wykrywanie wtyczek
```

## Tworzenie Nowej Aplikacji (Wtyczki)

Aby rozszerzyć system, możesz stworzyć własną aplikację. System **automatycznie wykryje** każdą nową wtyczkę umieszczoną w katalogu `src/apps/`.

1.  **Stwórz Katalog:** Dodaj nowy folder w `src/apps/`. Nazwa folderu jest unikalnym ID Twojej aplikacji (np. `moja-nowa-aplikacja`).

2.  **Stwórz `manifest.json`:** Ten plik opisuje Twoją aplikację dla systemu operacyjnego.

    ```json
    {
      "id": "moja-nowa-aplikacja",
      "name": "Moja Nowa Aplikacja",
      "description": "Krótki opis aplikacji.",
      "icon": "🚀",
      "entrypoints": { "html": "ui.html", "js": "main.js" }
    }
    ```

3.  **Stwórz `ui.html`:** Ten plik zawiera wyłącznie kod HTML dla obszaru treści Twojej aplikacji.

4.  **Stwórz `main.js`:** Ten plik zawiera logikę Twojej aplikacji. Musi on eksportować globalny obiekt (np. `window.MojaNowaAplikacjaApp`) z funkcją `init(profil, elementOkna)`.

System automatycznie załaduje Twoją aplikację przy następnym uruchomieniu. Wystarczy, że włączysz ją w pliku `profiles.json` dla wybranego profilu.

## Budowanie Wersji Produkcyjnej

Projekt jest skonfigurowany do budowania jako aplikacja desktopowa za pomocą Electron.

*   Aby uruchomić aplikację w trybie deweloperskim Electron:
    ```sh
    npm start
    ```
*   Aby zbudować plik wykonywalny dla Twojego systemu operacyjnego:
    ```sh
    npm run dist
    ```
Pliki wynikowe znajdą się w folderze `dist/`.
