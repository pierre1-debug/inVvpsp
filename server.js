const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// DB path — Railway persiste /data si volume monté, sinon local
const DB_DIR = process.env.DB_PATH || path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const db = new Database(path.join(DB_DIR, 'vpsp.db'));

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS fiches (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    assoc     TEXT,
    immat     TEXT,
    num       TEXT,
    date_verif TEXT,
    heure     TEXT,
    verif     TEXT,
    mission   TEXT,
    nb_ok     INTEGER DEFAULT 0,
    nb_na     INTEGER DEFAULT 0,
    nb_miss   INTEGER DEFAULT 0,
    obs_global TEXT,
    items_json TEXT NOT NULL,
    sig1      TEXT,
    sig2      TEXT
  );
`);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── API ──────────────────────────────────────────────────────────────────────

// POST /api/fiches — sauvegarder une fiche
app.post('/api/fiches', (req, res) => {
  const d = req.body;
  if (!d || !d.items_json) return res.status(400).json({ error: 'items_json requis' });
  const stmt = db.prepare(`
    INSERT INTO fiches (assoc,immat,num,date_verif,heure,verif,mission,nb_ok,nb_na,nb_miss,obs_global,items_json,sig1,sig2)
    VALUES (@assoc,@immat,@num,@date_verif,@heure,@verif,@mission,@nb_ok,@nb_na,@nb_miss,@obs_global,@items_json,@sig1,@sig2)
  `);
  const info = stmt.run({
    assoc: d.assoc || '', immat: d.immat || '', num: d.num || '',
    date_verif: d.date_verif || '', heure: d.heure || '',
    verif: d.verif || '', mission: d.mission || '',
    nb_ok: d.nb_ok || 0, nb_na: d.nb_na || 0, nb_miss: d.nb_miss || 0,
    obs_global: d.obs_global || '',
    items_json: typeof d.items_json === 'string' ? d.items_json : JSON.stringify(d.items_json),
    sig1: d.sig1 || null, sig2: d.sig2 || null
  });
  res.json({ id: info.lastInsertRowid });
});

// GET /api/fiches — liste (sans items_json pour alléger)
app.get('/api/fiches', (req, res) => {
  const rows = db.prepare(`
    SELECT id,created_at,assoc,immat,num,date_verif,heure,verif,mission,nb_ok,nb_na,nb_miss
    FROM fiches ORDER BY id DESC LIMIT 200
  `).all();
  res.json(rows);
});

// GET /api/fiches/:id — détail complet
app.get('/api/fiches/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM fiches WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Fiche introuvable' });
  row.items_json = JSON.parse(row.items_json);
  res.json(row);
});

// DELETE /api/fiches/:id
app.delete('/api/fiches/:id', (req, res) => {
  db.prepare('DELETE FROM fiches WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/stats — stats globales
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM fiches').get().c;
  const lastWeek = db.prepare("SELECT COUNT(*) as c FROM fiches WHERE created_at >= datetime('now','-7 days')").get().c;
  const topMiss = db.prepare(`
    SELECT immat, nb_miss FROM fiches WHERE nb_miss > 0 ORDER BY nb_miss DESC LIMIT 5
  `).all();
  res.json({ total, lastWeek, topMiss });
});

// Catch-all → SPA
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`VPSP Check — port ${PORT}`));
