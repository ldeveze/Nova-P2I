# 🌟 Nova — P2I — Jeu de rythme

Nova est un jeu de rythme inspiré d'Osu! : des cibles apparaissent sur l'écran en rythme avec la musique, et il faut cliquer dessus au bon moment. Plus le timing est précis, plus le score est élevé.

**Afin de pouvoir jouer au jeu, tu trouveras la procédure d'installation à suivre ci-dessous.**

## Prérequis

Avant de commencer, assure-toi d'avoir installé sur ta machine :

- **Node.js** (version 18 ou supérieure) — [https://nodejs.org](https://nodejs.org)

---

## Installation

### 1. Dézipper l'archive

Après avoir téléchargé et dézippé le contenu du fichier `.zip` dans le dossier de ton choix. Tu obtiens une structure de ce type :

Nova-P2I-main/

├── public/

│ └── audio/

├── server/

│ ├── server.js

│ ├── database.js

│ └── package.json

├── src/

├── index.html

└── package.json

### 2. Installer les dépendances du front-end

Ouvre un terminal à la racine du projet (dans le dossier `Nova-P2I-main/`) et lance :

```bash
npm install
```

### 3. Installer les dépendances du serveur

Toujours dans le terminal, déplace-toi dans le dossier `server/` et lance ligne par ligne :

```bash
cd server
npm install
```

---

## Lancement

Le jeu nécessite de lancer **deux processus en parallèle** : le serveur back-end et le front-end. Il faut donc deux terminaux ouverts simultanément.

**Attention**, pour lancer ces deux processus, assure toi bien d'avoir ouvert spécifiquement **l'invite de commande**, et non pas Windows PowerShell ou autre.

### Terminal 1 — Lancer le serveur

Dans le dossier `server/`, lance :

```bash
node server.js
```

Tu dois voir s'afficher :

**Serveur démarré sur http://localhost:3000**

### Terminal 2 — Lancer le front-end

À la racine du projet (dossier `Nova-P2I-main/`) lance :

```bash
npm run dev
```

Tu dois voir s'afficher une URL du type :

**http://localhost:5173**

**Ouvre cette URL dans ton navigateur pour jouer !**

---

## Ajouter des musiques

Si tu veux ajouter tes propres morceaux, c'est possible ! Pour cela, suit les étapes suivantes :

1. Place ton fichier audio (`.mp3`, `.ogg` ou `.wav`) dans le dossier `public/audio/`
2. Ouvre le fichier `public/audio/musiques.json` et ajoute une entrée :

```json
{
  "fichier": "nomDuFichier.mp3",
  "titre": "Titre du morceau",
  "artiste": "Nom de l'artiste"
}
```

La musique apparaîtra ensuite automatiquement dans le carousel de sélection après avoir rafraîchi la page.

---

## Règles du jeu

- Des cercles apparaissent sur l'écran en rythme avec la musique
- Un anneau blanc se rétrécit autour de chaque cible — clique au moment précis où il la touche
- Plus ton timing est précis, plus tu marques de points :

| Timing  | Points  |
| ------- | ------- |
| PERFECT | 500 pts |
| GREAT   | 300 pts |
| GOOD    | 100 pts |
| EARLY   | 50 pts  |
| LATE    | 0 pt    |
| MISS    | -50 pts |

- Enchaîne 3 PERFECT consécutifs pour activer le mode **Combo** et gagner des points bonus à chaque frappe parfaite supplémentaire
- Appuie sur **Échap** pour mettre le jeu en pause

---

## Structure du projet

Après avoir effectué toutes les installations, voici la structure que devrait avoir ton dossier.

Nova-P2I-main/

├── public/

│ └── audio/ # Fichiers audio et musiques.json

├── server/

│ ├── server.js # Serveur Express (API REST)

│ ├── database.js # Configuration SQLite

│ ├── scores.db # Base de données (créée automatiquement)

│ └── package.json

├── src/

│ ├── pages/

│ │ ├── AccueilPage.vue

│ │ ├── ConfigurationPage.vue

│ │ ├── JeuPage.vue

│ │ ├── RecapPage.vue

│ │ └── ScoresPage.vue

│ ├── router/

│ │ └── index.js

│ ├── App.vue

│ └── main.js

├── index.html

└── package.json
