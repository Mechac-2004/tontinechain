# 🚀 Guide de Déploiement - TontineChain

Suivez ces étapes pour mettre votre projet en ligne pour le hackathon.

## 1. Déploiement de la Base de Données (MySQL)
1.  Connectez-vous à l'interface de votre hébergeur (cPanel, Plesk, etc.).
2.  Créez une nouvelle base de données MySQL.
3.  Importez le fichier `backend/sql/init_db.sql`.
4.  Éditez `backend/config/db.php` pour qu'il utilise les nouveaux accès ou utilisez `db_production.php`.

## 2. Déploiement du Smart Contract (Blockchain)
1.  Ouvrez [Remix IDE](https://remix.ethereum.org/).
2.  Créez un fichier `Tontine.sol` et collez-y le contenu de votre fichier local.
3.  Compilez le contrat (version 0.8.x).
4.  Dans l'onglet "Deploy", choisissez "Injected Provider - MetaMask".
5.  Assurez-vous d'être sur le réseau **Sepolia** dans MetaMask.
6.  Déployez le contrat et **copiez son adresse**.

## 3. Configuration du Frontend
1.  Ouvrez `assets/js/app.js`.
2.  (Optionnel) Remplacez la simulation de transaction par l'appel réel au contrat si vous avez le temps d'intégrer l'ABI.
3.  Vérifiez que tous les chemins `fetch` pointent bien vers `backend/api.php`.

## 4. Mise en ligne
1.  Utilisez un client FTP (comme FileZilla) ou Git pour envoyer tous les fichiers du dossier `tontinechain/` vers le dossier public (souvent `public_html` ou `www`) de votre serveur.
2.  Accédez à votre nom de domaine.

## 🚀 Spécial InfinityFree (Hackathon)

1.  **Dossier htdocs** : Uploadez tout le contenu du dossier `tontinechain/` à l'intérieur du dossier `htdocs` de votre compte InfinityFree.
2.  **Base de Données** :
    *   Le **Hostname** sur InfinityFree n'est JAMAIS `localhost`. Il ressemble à `sqlXXX.infinityfree.com`.
    *   Copiez ce hostname dans votre fichier `backend/config/db.php`.
3.  **Erreur 403/404** : Assurez-vous que le fichier `index.html` est bien à la racine de `htdocs`.

✅ **Astuce** : Pour importer vos tables, allez dans **phpMyAdmin** sur InfinityFree, sélectionnez votre base, et utilisez l'onglet "Importer" avec votre fichier `backend/sql/init_db.sql`.
