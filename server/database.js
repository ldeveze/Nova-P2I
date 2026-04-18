import Database from "better-sqlite3";

// Creation de la base de données
const db = new Database("./scores.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT NOT NULL,
    score INTEGER NOT NULL,
    perfect INTEGER,
    great INTEGER,
    good INTEGER,
    early INTEGER,
    late INTEGER,
    miss INTEGER,
    combo_max INTEGER,
    total_cercles INTEGER,
    musique TEXT,
    difficulte TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

try {
  db.exec(`ALTER TABLE scores ADD COLUMN early INTEGER`);
} catch {
  /* déjà existante */
}

export default db;
