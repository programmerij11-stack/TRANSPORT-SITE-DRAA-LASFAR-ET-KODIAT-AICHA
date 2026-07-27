---
name: testing-transport-site
description: Test the Transport Draa Lasfar & Koudiat Aicha static site end-to-end (dashboard, Départs & Lignes, Carte, Cartes de transport / impression). Use when verifying UI changes to this app.
---

# Testing — Transport Draa Lasfar & Koudiat Aicha

Static site: `index.html` + `app.js` + `firebase-config.js` (Bootstrap + Leaflet + Firestore). No build step.

## Run locally
```bash
cd <repo> && python3 -m http.server 8099
# open http://localhost:8099/index.html in Chrome
```
The site connects to a **live Firestore** (collection `transport_personnel`), so real data may already be present — usually no need to load samples. If the list is empty, the Personnel table shows a "Charger des exemples" button (writes 8 sample agents to the shared Firestore; only load if empty and clean up with "Vider la liste" afterward). Avoid destructive actions on real data.

## Sections & how to reach them
- Sidebar buttons (`.nav-link` with `data-section`): `dashboard`, `personnel`, `lignes` (Départs & Lignes), `carte`, `cartes` (Cartes de transport).
- **Départs & Lignes** (`renderLignes` in app.js): grouped by `(lieuDepart, trajet, typeTransport)` → one card per vehicle type. Verify each BUS / MINI BUS variant is its own card and each shows "Arrivée : Mine Draa Lasfar".
- **Carte** (`renderMap`): each vehicle path is `départ → (regroupement=trajet) → MINE`. The mine constant `MINE` is the common arrival (⛏️ marker). Use the "Choisir un trajet à isoler" `<select id="mapTrajet">` to reduce clutter — isolating one trajet makes the lines-to-mine and the ⛏️ marker easy to see. Hover/click a vehicle to see tooltip `DEP → VIA → Mine Draa Lasfar (count)`.

- **Cartes de transport** (`renderCartes` in app.js): one printable ID-card per agent (style carte nationale). Filters: search `#cartesQ` (nom/prénom) and départ `#cartesDepart`. Print via `printAllCartes()` (all filtered) and per-card `printOne(id)`.

## Testing with an empty database
If Firestore has 0 agents (it can be emptied between sessions), the honest way to test data-driven views (Cartes, Lignes) is to **create 1–2 agents through the "Ajouter" form**, test, then delete them via Personnel (trash icon → "Supprimer"). This avoids `console` injection (which the recording viewer finds confusing) and exercises the real create→render path. Note: the form closes after each save, so re-open "Ajouter" for each new agent; `typeTransport` is a select (BUS / MINI BUS), Poste defaults to 1.

## Verifying print (`@media print`)
Click "Imprimer" (single) or "Imprimer les cartes" (all) → Chrome print preview opens as an in-page overlay. Screenshot it. This is the adversarial check: the preview page must show **only the card(s)** at card size — no sidebar, topbar, toolbar, or other sections. `printOne` adds `body.print-one` + `.print-target` so `@media print` hides `.col-cart:not(.print-target)`. If the preview shows the app menu or all sections, the print CSS is broken. Cancel with the "Cancel" button (Escape may not close it reliably).

## Verifying map animation
Vehicles animate via `requestAnimationFrame`. To prove movement, zoom the same map region twice ~3s apart and compare marker positions along the line (your reaction time is too slow to judge from one frame). The DOM lists vehicle markers as `<div>🚌</div>`/`<div>🚐</div>` plus one `<div>⛏️</div>` for the mine.

## Data notes
- `typeTransport` in real data is often numbered: `BUS 1`, `BUS 2`, `MINI BUS 1`…`MINI BUS 6`. Grouping by type means each number is its own card/line — expected, not a bug. Some rows have blank/`—` type; they still form their own card.
- Lieux without coordinates in the `GEO` dict in app.js won't appear on the map.

## Devin Secrets Needed
None — Firebase config is committed in `firebase-config.js` (public web API key). No login required.
