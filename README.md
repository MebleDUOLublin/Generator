# 🌰 Pesteczka OS - Profesjonalny System Biznesowy

Pesteczka OS to nowoczesny, webowy system operacyjny zaprojektowany z myślą o małych i średnich przedsiębiorstwach. Jego głównym celem jest usprawnienie i automatyzacja codziennych zadań, takich jak generowanie ofert, zarządzanie danymi czy analiza wyników. Dzięki modułowej architekturze, system można łatwo rozbudowywać o nowe aplikacje, dostosowując go do specyficznych potrzeb każdej firmy.

## ✨ Kluczowe Funkcje

*   **Wirtualny Pulpit:** Intuicyjny interfejs przypominający klasyczny system operacyjny, zapewniający łatwość obsługi.
*   **System Profili:** Możliwość personalizacji ustawień, motywów i dostępu do aplikacji dla różnych firm lub oddziałów.
*   **Generator Ofert:** Zaawansowana aplikacja do szybkiego tworzenia i zarządzania profesjonalnymi ofertami handlowymi w formacie PDF.
*   **Dynamiczne Ładowanie Aplikacji:** Modułowa architektura pozwala na łatwe dodawanie nowych funkcji bez ingerencji w rdzeń systemu.
*   **Nowoczesny Design:** Czysty i estetyczny interfejs zbudowany w oparciu o przemyślany design system.

## 🚀 Uruchomienie Środowiska

Do uruchomienia i rozwoju Pesteczka OS potrzebujesz jedynie dwóch rzeczy:

*   **Python 3:** Do uruchomienia lekkiego serwera WWW.
*   **Przeglądarka internetowa:** Do obsługi interfejsu (rekomendowane Chrome, Firefox, Edge).

Aby uruchomić system, wykonaj poniższą komendę w głównym katalogu projektu:

```bash
python3 run.py
```

Serwer zostanie uruchomiony na porcie `8080`, a aplikacja otworzy się automatycznie w nowej karcie przeglądarki.

## 🛠️ Rozwój i Dodawanie Nowych Aplikacji

Jedną z największych zalet Pesteczka OS jest jego modułowość. Każda aplikacja to samodzielny "plugin", który system automatycznie wykrywa i ładuje.

### Struktura Aplikacji

Każda nowa aplikacja musi znajdować się w osobnym folderze wewnątrz katalogu `src/apps/`. Struktura folderu aplikacji powinna wyglądać następująco:

```
src/apps/moja-nowa-aplikacja/
├── 📄 manifest.json
├── 📄 ui.html
└── 📄 main.js
```

### Plik `manifest.json`

To serce każdej aplikacji. Zawiera wszystkie metadane potrzebne systemowi do jej załadowania.

**Przykład:**

```json
{
  "id": "moja-nowa-aplikacja",
  "name": "Moja Nowa Aplikacja",
  "version": "1.0.0",
  "icon": "💡",
  "entrypoints": {
    "html": "ui.html",
    "js": "main.js"
  },
  "window": {
    "width": "800px",
    "height": "600px"
  }
}
```

*   `id`: Unikalny identyfikator (używany w całym systemie).
*   `name`: Pełna nazwa aplikacji.
*   `icon`: Ikona emoji reprezentująca aplikację.
*   `entrypoints`: Ścieżki do plików HTML (interfejs) i JS (logika).
*   `window`: Domyślne wymiary okna aplikacji.

### Plik `ui.html`

Zawiera wyłącznie kod HTML interfejsu aplikacji, który zostanie wstrzyknięty do okna. Nie umieszczaj tu tagów `<html>` ani `<head>`.

**Przykład:**

```html
<div class="moja-aplikacja-container">
    <h1>Witaj w mojej aplikacji!</h1>
    <button id="super-przycisk">Kliknij mnie</button>
</div>
```

### Plik `main.js`

Logika aplikacji. System automatycznie tworzy globalny obiekt o nazwie zgodnej z `id` aplikacji (z wielkiej litery i z dopiskiem "App"), np. `MojaNowaAplikacjaApp`. Musi on zawierać metodę `init()`, która jest wywoływana po załadowaniu interfejsu.

**Przykład:**

```javascript
window.MojaNowaAplikacjaApp = {
    init: function(profile, windowElement) {
        console.log('Moja Nowa Aplikacja została zainicjowana!');
        console.log('Aktualny profil:', profile);

        // Dodajemy logikę do przycisku
        const przycisk = windowElement.querySelector('#super-przycisk');
        przycisk.addEventListener('click', () => {
            alert('Przycisk kliknięty!');
        });
    }
};
```

### Aktywacja Aplikacji w Profilu

Aby nowa aplikacja była widoczna dla danego użytkownika, dodaj jej `id` do tablicy `enabledApps` w pliku `profiles.json`:

```json
{
  "profiles": {
    "pesteczka": {
      "key": "pesteczka",
      "name": "Pesteczka",
      // ... inne dane
      "enabledApps": ["offers", "dashboard", "settings", "moja-nowa-aplikacja"]
    }
  }
}
```

Po wykonaniu tych kroków i odświeżeniu aplikacji, nowa ikona pojawi się na pulpicie, w menu start oraz na pasku zadań, a aplikacja będzie w pełni funkcjonalna.
