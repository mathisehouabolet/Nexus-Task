# Déployer le backend sur Vercel

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Base **MongoDB Atlas** (Vercel ne peut pas héberger MongoDB)
- Le dépôt Git poussé sur GitHub / GitLab / Bitbucket

## 2. Créer le projet Vercel

1. [vercel.com/new](https://vercel.com/new) → importer votre dépôt
2. **Root Directory** : `backend` (dossier du serveur Express)
3. Framework Preset : **Other**
4. Build Command : laisser vide ou `npm run vercel-build`
5. Output Directory : laisser vide
6. Install Command : `npm install`

## 3. Variables d'environnement (Settings → Environment Variables)

| Variable        | Exemple / description                                      |
|-----------------|------------------------------------------------------------|
| `MONGODB_URI`   | `mongodb+srv://...` (Atlas → Network Access : autoriser `0.0.0.0/0`) |
| `JWT_SECRET`    | Chaîne longue et aléatoire                                 |
| `FRONTEND_URL`  | `https://votre-frontend.vercel.app`                        |
| `CORS_ORIGINS`  | (optionnel) URLs preview séparées par des virgules          |

Cochez **Production**, **Preview** et **Development**.

## 4. Déployer

Cliquez sur **Deploy**. L’API sera disponible à :

`https://votre-projet.vercel.app`

Test : `https://votre-projet.vercel.app/api/health`

## 5. Brancher le frontend

Dans le projet **frontend** (Vercel ou `.env.local`) :

```env
NEXT_PUBLIC_API_URL=https://votre-projet.vercel.app
```

Sans slash final.

## 6. Développement local

```bash
cd backend
npm install
cp .env.example .env
# éditer .env
npm run dev
```

## Dépannage

- **503 Database** : `MONGODB_URI` incorrect ou IP non autorisée sur Atlas
- **CORS** : ajoutez l’URL exacte du frontend dans `FRONTEND_URL` ou `CORS_ORIGINS`
- **Cold start** : la première requête après inactivité peut prendre quelques secondes
