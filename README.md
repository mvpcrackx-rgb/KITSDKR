# KITS DKR – Boutique de maillots (React + Vite + Tailwind + Supabase)

Boutique publique (catalogue, panier, commande WhatsApp) + espace administrateur sécurisé (produits, stocks, commandes, statistiques). Le catalogue est **vide** tant que vous n'ajoutez pas de maillots : rien n'est pré-rempli, aucun prix n'est inventé.

## 1. Installation locale
```bash
npm install
cp .env.example .env     # puis remplissez les 3 variables (étape 3)
npm run dev              # http://localhost:5173
```
Prérequis : Node 18+.

## 2. Configurer Supabase
1. Créez un projet sur https://supabase.com.
2. **SQL Editor** → collez tout `supabase/schema.sql` → *Run*. Cela crée les tables, les règles RLS, la fonction de commande sécurisée `place_order`, le trigger de stock et le bucket `product-images`.
3. **Authentication → Providers → Email** : désactivez **« Allow new users to sign up »** (aucun compte public possible).
4. **Authentication → Users → Add user** : créez *votre* compte (e-mail + mot de passe fort, « Auto Confirm »).
5. Dans le SQL Editor, rendez ce compte administrateur (remplacez l'e-mail) :
```sql
insert into public.admins (user_id) select id from auth.users where email = 'VOTRE_EMAIL@exemple.com';
```
Vous seul êtes admin : la table `admins` n'a aucune règle d'écriture, donc personne ne peut s'y ajouter via le site.

## 3. Connecter Supabase à React
**Project Settings → API** : copiez *Project URL* et la clé *anon public* dans `.env` :
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_WHATSAPP_NUMBER=221XXXXXXXXX
```
La clé *anon* est publique par conception ; la sécurité vient de la RLS. **N'utilisez jamais la clé `service_role` dans ce projet.** `.env` est ignoré par git.

## 4. Utiliser l'administration
Allez sur `/admin/login` (aucun lien public n'y mène). Onglets : **Produits** (ajout, photos, prix FCFA, tailles, stock, activer/désactiver, supprimer), **Commandes** (statuts en attente → confirmée → expédiée → livrée, ou annulée), **Statistiques**.
Le stock baisse automatiquement quand une commande passe de « en attente » à confirmée/expédiée/livrée.

## 5. Déployer sur Netlify
1. Poussez le projet sur GitHub, puis Netlify → *Add new site → Import from Git*.
2. Build : `npm run build`, dossier : `dist` (déjà dans `netlify.toml`, avec la redirection SPA).
3. **Site settings → Environment variables** : ajoutez les 3 variables du `.env`.
4. Déployez. Puis dans Supabase **Authentication → URL Configuration**, mettez l'URL Netlify dans *Site URL*.
(Alternative sans Git : `npm run build` puis glissez le dossier `dist` dans Netlify Drop, après avoir créé le `.env`.)

## 6. Sécurité en bref
- Clients : lecture des produits **actifs** uniquement ; aucune écriture sur produits, tailles, commandes.
- Commandes : créées uniquement via `place_order`, qui relit prix et stock en base et calcule le total côté serveur (un client ne peut pas modifier un prix).
- Admin : toutes les écritures exigent `is_admin()` dans les policies RLS et pour le stockage des photos.

## 7. Faire évoluer la boutique
- Textes de livraison, tailles, versions, statuts : `src/lib/config.js`.
- Couleurs et polices : `tailwind.config.js`, `index.html`.
- Nouvelles colonnes : ajoutez-les en SQL (`alter table`), puis dans `src/pages/admin/Products.jsx`.

## Structure
`src/pages` (boutique), `src/pages/admin` (administration), `src/context` (panier, authentification), `src/lib` (Supabase, config), `supabase/schema.sql`.
