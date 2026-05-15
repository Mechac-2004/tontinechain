# Documentation Technique - TontineChain

## 1. Introduction

TontineChain est une application de tontine décentralisée (DeFi) conçue pour sécuriser et moderniser le système d'épargne rotative traditionnel. Au Bénin, le marché des tontines représente entre **400 et 600 millions USD** par an, mais il souffre d'un manque de transparence et de fraudes récurrentes. TontineChain répond à ces enjeux par la technologie Blockchain.

## 2. Impact Économique et Pertes Évitées

L'utilisation de TontineChain permet de :

- **Sécuriser les flux** : En éliminant les intermédiaires opaques, on réduit drastiquement les risques de disparition de fonds (estimés entre 10 et 15% dans les circuits informels).
- **Protection des capitaux** : À l'échelle du marché béninois, TontineChain pourrait sauvegarder jusqu'à **60 à 90 millions USD** de pertes annuelles grâce à l'immuabilité des preuves blockchain.
- **Inclusion financière** : Faciliter l'accès au crédit tournant pour les populations non bancarisées.

## 2. Architecture Technique
- **Frontend** : HTML5, Vanilla CSS, JavaScript (ES6+).
- **Blockchain** : Ethers.js pour la connexion MetaMask et les transactions.
- **Backend** : PHP 8.x (API REST) pour la gestion avancée des métadonnées.
- **Base de données** : MySQL pour la persistance des tontines, membres et notifications.

## 3. Logique Smart Contract (Blockchain)
Les paiements sont effectués directement sur la blockchain. Chaque transaction génère un **Hash (TX)** unique qui est enregistré dans la base de données après validation, assurant que personne ne peut contester un paiement effectué.

## 4. Sécurité et Persistance
- **PDO** : Protection contre les injections SQL via des requêtes préparées.
- **XSS** : Échappement systématique des données utilisateur à l'affichage.
- **Auto-reconnexion** : Gestion sécurisée de la session Wallet avec MetaMask.

---
*Généré pour le Livrable Phase 3 - Hackathon 2026*
