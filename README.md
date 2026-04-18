# VPSP Check — Guide de déploiement
## FFSS · G-2010-C-009 · Hébergé sur serveur

---

## Structure du projet

```
vpsp-server/
├── server.js          → Serveur Node.js + API REST + SQLite
├── package.json
├── Dockerfile         → Pour Railway / Docker
├── .gitignore
└── public/
    ├── index.html     → Application PWA complète
    ├── manifest.json  → Manifeste PWA
    ├── sw.js          → Service Worker (mode hors-ligne)
    └── icon.svg       → Icône de l'app
```

---

## Déploiement sur Railway (gratuit, recommandé — 10 min)

### Prérequis
- Compte GitHub (gratuit) : https://github.com
- Compte Railway (gratuit) : https://railway.app

### Étapes

**1. Crée un repo GitHub**
```bash
# Sur ton PC, installe Git si nécessaire, puis :
git init vpsp-server
cd vpsp-server
# Copie tous les fichiers du ZIP ici
git add .
git commit -m "VPSP Check initial"
# Crée un repo sur github.com, puis :
git remote add origin https://github.com/TON_USER/vpsp-server.git
git push -u origin main
```

**2. Déploie sur Railway**
1. Va sur https://railway.app → "New Project"
2. Choisis "Deploy from GitHub repo"
3. Sélectionne ton repo `vpsp-server`
4. Railway détecte automatiquement le Dockerfile

**3. Ajoute un volume persistant (pour la base de données)**
1. Dans Railway, clique sur ton service
2. Onglet "Volumes" → "Add Volume"
3. Mount path : `/data`
4. Railway redémarre automatiquement

**4. Récupère ton URL**
- Onglet "Settings" → "Networking" → "Generate Domain"
- Tu obtiens une URL type : `https://vpsp-check-production.up.railway.app`

**5. Installe l'app sur les téléphones de l'équipe**

*iPhone (Safari obligatoire) :*
1. Ouvre l'URL dans Safari
2. Bouton Partager → "Sur l'écran d'accueil"
3. L'icône FFSS apparaît

*Android (Chrome) :*
1. Ouvre l'URL dans Chrome
2. Menu ⋮ → "Installer l'application"

---

## Déploiement sur VPS Linux (OVH, Hetzner, etc.)

```bash
# Sur le serveur
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs git

# Clone le projet
git clone https://github.com/TON_USER/vpsp-server.git
cd vpsp-server
npm install --production

# Lance en permanent avec PM2
npm install -g pm2
DB_PATH=/var/data/vpsp pm2 start server.js --name vpsp
pm2 save && pm2 startup

# Nginx reverse proxy (optionnel, pour HTTPS)
sudo apt install -y nginx certbot python3-certbot-nginx
# Configurer nginx pour proxy vers localhost:3000
# Puis : certbot --nginx -d votre-domaine.fr
```

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📋 Saisie infos | Association, immat, vérificateur, mission |
| ✅ Contrôle | 17 chapitres, 160+ items (OK / N/A / Manquant) |
| 📊 Bilan | Stats colorées, liste des manquants |
| 💾 Sauvegarde | Enregistrement sur le serveur (SQLite) |
| 📄 Export PDF | Fiche complète avec signatures |
| ✉️ Email | Corps pré-rempli dans le client mail |
| 🗂️ Historique | Consultation, re-génération PDF, suppression |
| 📱 PWA | Installation iOS & Android, fonctionne hors-ligne |

---

## API REST

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/fiches` | Liste des fiches (sans items) |
| `POST` | `/api/fiches` | Créer une fiche |
| `GET` | `/api/fiches/:id` | Détail complet d'une fiche |
| `DELETE` | `/api/fiches/:id` | Supprimer une fiche |
| `GET` | `/api/stats` | Statistiques globales |

---

## Mise à jour de l'app

```bash
# Sur le repo local
git add . && git commit -m "update"
git push

# Railway redéploie automatiquement en ~1 min
# Sur VPS :
git pull && pm2 restart vpsp
```

---

*Document établi conformément à G-2010-C-009 — FFSS Commission Nationale Opérationnelle — 29/03/2023*
