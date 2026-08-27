# 🚀 Guide de Déploiement en Production — CV Tounsi SaaS

Ce guide explique étape par étape comment déployer votre SaaS en ligne pour le rendre accessible aux utilisateurs tunisiens et le lier à vos campagnes **Meta Ads**.

---

## 📋 Prérequis : Variables d'Environnement

Sur votre plateforme d'hébergement, ajoutez ces 2 variables d'environnement indispensables :

| Variable | Description | Exemple de Valeur |
|:---|:---|:---|
| `GEMINI_API_KEY` | Clé API Google Gemini (serveur uniquement) | `AQ.Ab8RN6JppqNkX6rg1...` |
| `ACTIVATION_SECRET` | Clé secrète de signature des tokens HMAC | `votre_phrase_secrete_tres_longue_2026` |
| `META_CAPI_TOKEN` | Token d'accès Meta Conversions API (Events Manager) | `EAAG...` |
| `META_PIXEL_ID` | ID du Pixel Meta (par défaut `1426962146006360`) | `1426962146006360` |
| `DATABASE_URL` | Chaîne de connexion MySQL / TiDB Cloud | `mysql://...` |
| `NODE_ENV` | Mode de production | `production` |
| `PORT` | Port d'écoute du serveur (si VPS) | `3000` |

---

## 🌟 Option 1 : Déploiement Vercel (Recommandé — Gratuit & Instantané)

Vercel est la solution la plus rapide, sans gestion de serveur, avec **certificat SSL HTTPS automatique** et CDN mondial.

### Étapes :
1. Poussez votre code sur votre compte **GitHub** (dépôt privé ou public).
2. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous avec votre compte GitHub.
3. Cliquez sur **"Add New Project"** et sélectionnez le dépôt `cv-tounsi-service`.
4. Vercel détecte automatiquement la configuration grâce au fichier `vercel.json`.
5. Dans la section **"Environment Variables"**, ajoutez :
   - `GEMINI_API_KEY`
   - `ACTIVATION_SECRET`
6. Cliquez sur **"Deploy"**. En moins de 2 minutes, votre site est en ligne avec une URL du type `cv-tounsi.vercel.app`.

### Lier votre Nom de Domaine Personnalisé (ex: `cvtounsi.tn` ou `cvtounsi.com`) :
1. Dans le tableau de bord Vercel, allez dans **Settings > Domains**.
2. Entrez votre domaine (ex: `cvtounsi.tn` ou `www.cvtounsi.tn`).
3. Ajoutez l'enregistrement DNS chez votre bureau d'enregistrement (ex: OVH, Tunhost, etc.) :
   - Type : `CNAME` | Nom : `www` | Valeur : `cname.vercel-dns.com`
   - Type : `A` | Nom : `@` | Valeur : `76.76.21.21`

---

## 🐧 Option 2 : Déploiement sur VPS Linux (Ubuntu / Debian / VPS Tunisien)

Si vous avez un VPS dédié (OVH, Hetzner, Tunhost, DigitalOcean) :

### 1. Installation de Node.js & PM2
```bash
# Mettre à jour le serveur
sudo apt update && sudo apt upgrade -y

# Installer Node.js 22 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
```

### 2. Cloner et Construire le Projet
```bash
# Cloner votre projet
git clone https://github.com/votre-compte/cv-tounsi-service.git /var/www/cv-tounsi
cd /var/www/cv-tounsi

# Créer le fichier .env
cat <<EOT >> .env
GEMINI_API_KEY=votre_cle_gemini
ACTIVATION_SECRET=votre_secret_hmac
NODE_ENV=production
PORT=3000
EOT

# Installer les dépendances et compiler
npm install
npm run build

# Démarrer le serveur avec PM2 (redémarrage automatique en cas de crash)
pm2 start dist/index.js --name "cv-tounsi"
pm2 startup
pm2 save
```

### 3. Configuration NGINX & Certificat SSL Gratuit (Let's Encrypt)
```bash
# Installer Nginx et Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurer le reverse proxy NGINX
sudo nano /etc/nginx/sites-available/cvtounsi
```

Collez cette configuration :
```nginx
server {
    server_name cvtounsi.tn www.cvtounsi.tn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activez et installez le SSL HTTPS :
```bash
sudo ln -s /etc/nginx/sites-available/cvtounsi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Activer le certificat SSL HTTPS automatique
sudo certbot --nginx -d cvtounsi.tn -d www.cvtounsi.tn
```

---

## 🐳 Option 3 : Déploiement Docker

Le projet inclut un `Dockerfile` multi-stage prêt à l'emploi :

```bash
# Construire et lancer l'image Docker
docker build -t cv-tounsi .
docker run -d -p 3000:3000 --env-file .env --name cv-tounsi-app cv-tounsi
```

---

## ✅ Checklist de Vérification Post-Déploiement

Une fois en ligne, vérifiez ces 4 points :
1. **Health Check** : Ouvrez `https://votre-domaine.tn/api/health` → doit retourner `{"status":"ok"}`.
2. **Amélioration IA** : Créez un CV et cliquez sur "Améliorer par l'IA" → la génération doit prendre < 1 seconde.
3. **Paiement & Déblocage** : Entrez un code comme `TN19` ou `SARRA19` → le PDF HD se télécharge net.
4. **Pages Légales** : Vérifiez que `/politique-de-confidentialite` et `/conditions-utilisation` s'affichent correctement.
