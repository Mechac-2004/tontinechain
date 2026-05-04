# Notes de Démonstration - TontineChain 🔗

Ce document détaille les acteurs et le flux opérationnel utilisés pour la démonstration du projet **TontineChain**.

## 1. Acteurs Simulés
Pour la démonstration, nous utilisons 4 membres représentatifs d'une tontine communautaire :

*   **Alice (Administratrice)** : Crée le contrat sur la blockchain et définit les règles (10 000 FCFA / mois).
*   **Bob & Charlie** : Cotisants réguliers qui valident leurs transactions via MetaMask.
*   **Aminata** : Bénéficiaire du premier round.

## 2. Flux de la Démonstration (Étape par étape)

### Phase A : Initialisation du Smart Contract
1.  **Connexion Web3** : Alice connecte son portefeuille (MetaMask) à l'interface.
2.  **Paramétrage** : Alice définit le nom de la tontine, le montant des cotisations et la fréquence.
3.  **Déploiement** : Clic sur "INITIALISER SUR LA BLOCKCHAIN". Le contrat est créé avec une adresse unique (ex: 0x71C...). Le journal des événements enregistre le déploiement.

### Phase B : Cycle de Vie (Round 1)
1.  **Suivi en Temps Réel** : L'interface affiche Aminata comme la première bénéficiaire (⭐).
2.  **Apport de Cotisations** : Alice, Bob et Charlie cliquent sur "Payer". 
    - Le graphique circulaire (Chart.js) se met à jour visuellement à chaque paiement.
    - Le journal "Blockchain" trace chaque paiement de manière transparente.
3.  **Compte à rebours** : Mise en avant du timer qui assure que la tontine respecte les délais pour éviter les pénalités.

### Phase C : Libération et Clôture
1.  **Validation Smart Contract** : Une fois la barre de progression à 100%, le bouton de libération s'active.
2.  **Signature Web3** : Alice signe la transaction. Une animation confirme l'exécution du contrat.
3.  **Passage au Tour Suivant** : L'interface archive automatiquement le Round 1 (section Archives) et passe au Round 2 avec un nouveau bénéficiaire.

## 3. Points Techniques Mis en Avant
*   **Transparence** : Journal d'événements immuable.
*   **Décentralisation** : Interaction directe avec Ethers.js.
*   **UX/UI** : Dashboard moderne avec visualisation de données (Chart.js).
