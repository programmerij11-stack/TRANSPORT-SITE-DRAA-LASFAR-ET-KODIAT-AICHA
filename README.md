# Transport Draa Lasfar & Koudiat Aicha

Application web (site statique) de gestion du **personnel transporté** vers les sites
**Draa Lasfar** et **Koudiat Aicha** (bus / minibus électriques — CMG / TECHSUB).

Construite comme SAMIR : **HTML + JavaScript + Firebase (Firestore)**, sans build,
déployable gratuitement sur **GitHub Pages**.

## Fonctionnalités

- **Tableau de bord** : nombre d'agents, lieux de départ, trajets, répartition par type de transport.
- **Personnel** : liste complète avec **recherche** et **filtres** (lieu de départ, trajet, type, poste).
- **Ajout / Modification / Suppression** des agents.
- **Import / Export Excel** (.xlsx) — chargez votre fichier complet en un clic.
- **Départs & Lignes** : regroupement par départ → destination avec le nombre d'agents et les types de véhicules.
- **Carte** (OpenStreetMap / Leaflet) : points de départ et destinations.
- Synchronisation **temps réel** entre tous les appareils + mode **hors-ligne**.

## Colonnes gérées

`NOM · PRENOM · LIEU DEPART · SERVICE · TRAJET · SOCIETE · TYPE TRANSPORT · QTE · POSTE`

Elles correspondent exactement à votre fichier Excel : utilisez **Importer Excel** pour
charger toute la liste d'un coup.

## Déploiement sur GitHub Pages

1. Poussez ces fichiers sur la branche `main` du dépôt.
2. Dans GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**.
3. Choisissez la branche `main` et le dossier `/ (root)`, puis **Save**.
4. Le site sera disponible sur `https://<votre-utilisateur>.github.io/transport-draa-lasfar/`.

## Firebase

Le fichier `firebase-config.js` réutilise le même projet Firebase que SAMIR, mais dans
une **collection séparée** (`transport_personnel`) pour ne pas mélanger les données.
Pour utiliser un projet Firebase distinct, remplacez les valeurs dans `firebase-config.js`.

## Développement local

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
