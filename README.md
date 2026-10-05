# QA Automation Portfolio

Portfolio projektów z zakresu automatyzacji testów.

## Stack

- Playwright
- TypeScript
- API Testing
- GitHub Actions

## Projekty

### Home Budget
Automatyczne testy aplikacji do zarządzania budżetem domowym.

Zakres:
- testy E2E
- testy formularzy
- testy importu plików
- testy walidacji
- testy API
- testy regresyjne

## Uruchomienie testów

```bash
npm install
npx playwright install
npx playwright test
## HB
## Aktualny zakres testów automatycznych

### Smoke / nawigacja
- Sprawdzenie poprawnego uruchomienia aplikacji Home Budget.
- Sprawdzenie dostępu do Pulpitu.
- Sprawdzenie przejścia do Importu.
- Sprawdzenie przejścia do Historii importów.
- Sprawdzenie przejścia do Historii miesięcznej.
- Sprawdzenie przejścia do Transakcji.
- Sprawdzenie przejścia do Kategorii.
- Sprawdzenie przejścia do Reguł kategoryzacji.

### Transakcje
- Filtrowanie transakcji po koncie.
- Filtrowanie tylko wydatków.
- Wyszukiwanie transakcji po opisie.
- Czyszczenie ustawionych filtrów.

### Kategorie
- Tworzenie nowej kategorii z unikalnymi danymi testowymi.
- Sprawdzenie, czy nowa kategoria pojawiła się na liście.
- Usunięcie utworzonej kategorii.
- Sprawdzenie, czy kategoria została poprawnie usunięta.
- Cleanup danych testowych po wykonaniu scenariusza.
