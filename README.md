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

## Suivi GPS en temps réel

Onglet **Suivi GPS** : affiche sur une carte la position en direct des bus / mini bus
qui partagent leur GPS, avec l'heure de dernière mise à jour et la liste des véhicules
(en ligne / hors ligne).

Le chauffeur ouvre `chauffeur.html` sur son téléphone (bouton **Ouvrir la page
Chauffeur**), choisit son véhicule et clique **Démarrer le partage** : le navigateur
demande l'autorisation de localisation puis envoie la position via l'API `geolocation`
du navigateur dans la collection Firestore **`transport_positions`** (une position par
véhicule). Un véhicule est considéré **actif** si sa dernière position date de moins de
2 minutes.

> La géolocalisation du navigateur exige un contexte **sécurisé** (HTTPS) ; c'est le cas
> de GitHub Pages et de `localhost`. La page Chauffeur doit rester **ouverte** pendant le
> trajet pour continuer à émettre la position.

## Bus & Chauffeurs (flotte)

La rubrique **Bus & Chauffeurs** (menu de gauche) permet de saisir/modifier/supprimer les
véhicules : **Type** (Bus / Mini bus), **N° du bus**, **Matricule**, **Ligne/Trajet**,
**Nom du chauffeur**, **Téléphone du chauffeur** et **Capacité (places)**. Recherche + export
Excel inclus. Les données sont stockées dans la collection Firestore `transport_vehicles`.
La saisie est réservée au rôle **Éditeur** ; le rôle Consultation voit la liste en lecture seule.

## Connexion & comptes (Firebase Authentication)

L'application est protégée par une **page de connexion** (`login.html`). Deux rôles :

- **Éditeur** : peut consulter **et** saisir (ajouter / modifier / supprimer / importer / vider).
- **Consultation** : lecture seule (les boutons de saisie sont masqués).

La rubrique **Utilisateurs** (visible uniquement pour les éditeurs) permet d'**ajouter**
un compte (e-mail + mot de passe + rôle) et de **retirer** l'accès d'un compte.

### Mise en service (2 étapes dans la console Firebase)

1. **Activer la connexion Email/Mot de passe** (obligatoire) :
   Console Firebase → **Authentication** → **Sign-in method** → activez **E-mail/Mot de passe**.
2. **Coller les règles de sécurité** (recommandé) : voir `firestore.rules`.
   Console → **Firestore Database** → **Rules**.
   > ⚠️ Ce projet Firebase est **partagé avec SAMIR**. Les règles fournies ne couvrent que
   > les collections `transport_*`. **Ajoutez** ces blocs à vos règles existantes, ne les
   > remplacez pas entièrement, pour ne pas bloquer SAMIR.

Au **premier lancement**, la page de connexion propose « Créer le premier administrateur »
(rôle Éditeur). Cette option disparaît dès qu'un compte existe. Les comptes créés ensuite
le sont depuis la rubrique **Utilisateurs**.

> Le retrait d'un utilisateur révoque son **accès** (suppression de son rôle). Son identifiant
> Firebase Auth peut subsister ; sans rôle, il ne peut plus rien voir ni faire.

## Firebase

Le fichier `firebase-config.js` réutilise le même projet Firebase que SAMIR, mais dans
des **collections séparées** (`transport_personnel` pour le personnel, `transport_positions`
pour les positions GPS) pour ne pas mélanger les données.
Pour utiliser un projet Firebase distinct, remplacez les valeurs dans `firebase-config.js`.

## Développement local

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```
