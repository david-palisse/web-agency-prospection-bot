# Prospection de commerces sans site web

Application Node.js / Express qui interroge Google Places API pour rechercher, par ville, des commerces ne disposant pas de site internet, puis exporte les résultats dans un fichier CSV.

## Fonctionnalités

- saisie d'une ville via une interface web simple ;
- recherche multi-catégories de commerces dans la ville ;
- récupération des détails Google Places pour filtrer les établissements sans site web ;
- export CSV avec les colonnes demandées :
  - nom du commerce ;
  - type de commerce ;
  - adresse du commerce ;
  - note moyenne des avis ;
  - adresse mail ;
  - numéro de téléphone.

## Limitation importante

Google Places API ne fournit généralement **pas** l'adresse e-mail des commerces. La colonne `adresse mail` est donc créée dans le CSV, mais reste vide si aucune donnée n'est disponible côté API.

## Installation

1. Installer les dépendances :

```bash
npm install
```

2. Copier le fichier d'environnement :

```bash
cp .env.example .env
```

3. Ajouter votre clé API dans `.env` :

```env
GOOGLE_MAPS_API_KEY=your_google_places_api_key
```

## Lancement

### Mode développement

```bash
npm run dev
```

### Mode normal

```bash
npm start
```

Ensuite ouvrir :

```text
http://localhost:3000
```

## Utilisation API

### Endpoint

`POST /api/prospection/export`

### Exemple de payload

```json
{
  "city": "Marseille"
}
```

### Exemple avec curl

```bash
curl -X POST http://localhost:3000/api/prospection/export \
  -H "Content-Type: application/json" \
  -d '{"city":"Marseille"}'
```

### Réponse type

```json
{
  "city": "Marseille",
  "scannedBusinesses": 146,
  "exportedBusinesses": 38,
  "fileName": "prospection-marseille-2026-04-02T18-30-00-000Z.csv",
  "filePath": "exports/prospection-marseille-2026-04-02T18-30-00-000Z.csv",
  "downloadUrl": "/exports/prospection-marseille-2026-04-02T18-30-00-000Z.csv",
  "limitations": [
    "Google Places API ne fournit généralement pas les adresses e-mail des commerces : la colonne reste donc vide si aucune donnée n'est disponible."
  ]
}
```

## Structure

- `public/` : interface web minimaliste ;
- `src/routes/` : routes Express ;
- `src/controllers/` : logique HTTP ;
- `src/services/` : appels Google Places + export CSV ;
- `exports/` : fichiers CSV générés.

## Remarques techniques

- La recherche est faite sur plusieurs catégories de commerces afin d'améliorer la couverture.
- Les doublons sont supprimés via l'identifiant Google Places.
- Les résultats restent dépendants de la qualité des données retournées par Google Places API.
