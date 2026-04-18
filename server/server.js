// Les importations servent à autoriser les requêtes entre les localhost
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import db from "./database.js";

const app = express();
app.use(cors());
app.use(express.json());

// Récupère les musiques pour affichage
app.get("/musiques", (req, res) => {
  const dossierAudio = path.join("..", "public", "audio");
  const fichiers = fs
    .readdirSync(dossierAudio)
    .filter((f) => f.endsWith(".mp3") || f.endsWith(".ogg") || f.endsWith(".wav"));
  res.json(fichiers);
});

// Sauvegarde les scores dans la base de données via requête SQL
app.post("/scores", (req, res) => {
  const {
    pseudo,
    score,
    perfect,
    great,
    good,
    early,
    late,
    miss,
    combo_max,
    total_cercles,
    musique,
    difficulte,
  } = req.body;

  if (!pseudo || score === undefined) {
    return res.status(400).json({ erreur: "pseudo et score obligatoires" });
  }

  const stmt = db.prepare(`
    INSERT INTO scores (pseudo, score, perfect, great, good, early, late, miss, combo_max, total_cercles, musique, difficulte)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    pseudo,
    score,
    perfect,
    great,
    good,
    early ?? null,
    late,
    miss,
    combo_max,
    total_cercles,
    musique ?? null,
    difficulte ?? null,
  );
  res.json({ id: result.lastInsertRowid });
});

// Récupère les scores pour affichage
app.get("/scores", (req, res) => {
  const rows = db
    .prepare(
      `
    SELECT * FROM scores ORDER BY score DESC LIMIT 50
  `,
    )
    .all();
  res.json(rows);
});

app.listen(3000, () => {
  console.log("Serveur démarré sur http://localhost:3000");
});
