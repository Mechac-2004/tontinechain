# Documentation Technique - TontineChain

## 1. Introduction
TontineChain est une application de tontine décentralisée (DeFi) qui combine la transparence de la blockchain avec la simplicité d'une interface web moderne. Elle permet aux membres de collecter des fonds de manière tournante avec une preuve de paiement immuable.

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
