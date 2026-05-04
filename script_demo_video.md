# Script de Présentation Vidéo - TontineChain 🎥

Ce script est conçu pour vous guider lors de l'enregistrement de votre vidéo de démonstration. Les textes entre crochets **[Action]** sont les manipulations à faire à l'écran.

---

## 🎤 Introduction (0:00 - 0:30)
"Bonjour à tous ! Aujourd'hui, je vais vous présenter **TontineChain**, une application décentralisée qui modernise la tontine traditionnelle grâce à la puissance de la blockchain. Notre objectif est d'apporter une transparence totale et une sécurité immuable à l'épargne communautaire."

## 🦊 Étape 1 : Connexion Web3 (0:30 - 1:00)
**[Action : Cliquez sur "Connect Wallet" en haut à droite]**
"Tout commence par la connexion au portefeuille. Ici, notre application s'interface directement avec **MetaMask** via la bibliothèque **Ethers.js**. Comme vous pouvez le voir, l'adresse de mon portefeuille est maintenant liée, ce qui me permettra d'interagir avec les contrats intelligents en toute sécurité."

## 🏗️ Étape 2 : Création du Contrat (1:00 - 2:00)
**[Action : Remplissez le formulaire à gauche : Nom, Montant, sélectionnez 3 membres]**
"Nous allons maintenant créer une nouvelle tontine. Je définis le montant des cotisations à 10 000 FCFA et je sélectionne les membres participants dans notre liste intégrée. "

**[Action : Cliquez sur "INITIALISER SUR LA BLOCKCHAIN"]**
"En cliquant ici, nous déployons une instance de notre **Smart Contract Solidity**. Vous pouvez voir dans le journal des événements en bas que le contrat a été initialisé avec une adresse unique. Toutes les règles (pénalités, ordre de passage) sont désormais inscrites dans le code et ne peuvent plus être modifiées."

## 📊 Étape 3 : Gestion & Transparence (2:00 - 3:30)
**[Action : Cliquez sur la tontine dans la liste de droite pour ouvrir le Dashboard]**
"Une fois le contrat actif, nous accédons au tableau de bord de gestion. Ici, la transparence est reine. Nous voyons qui est le bénéficiaire actuel du tour (marqué d'une étoile) et un compte à rebours nous rappelle le délai de paiement."

**[Action : Cliquez sur "Payer" pour deux membres]**
"À chaque cotisation reçue, notre graphique **Chart.js** se met à jour instantanément pour montrer la barre de progression de la collecte. Regardez le journal de bord : chaque transaction est enregistrée avec son horodatage, créant une piste d'audit immuable."

## 🔓 Étape 4 : Libération des Fonds (3:30 - 4:15)
**[Action : Cliquez sur "Payer" pour le dernier membre. Le bouton de libération apparaît]**
"Une fois que la cagnotte est complète, le Smart Contract autorise la libération des fonds. C'est ici que la magie opère."

**[Action : Cliquez sur "LIBÉRER LES FONDS" -> Signez la transaction MetaMask si elle apparaît]**
"L'application demande une signature Web3 pour valider l'exécution. Les fonds sont alors versés au bénéficiaire, et le système archive automatiquement le round précédent dans notre section **Archives** tout en passant au bénéficier suivant pour le nouveau tour."

## 🏁 Conclusion (4:15 - 5:00)
"TontineChain n'est pas juste une application web, c'est une solution de confiance décentralisée. Elle élimine les litiges, automatise les flux financiers et redonne le pouvoir aux communautés. Merci de votre attention et bienvenue dans le futur de l'épargne !"

---

### 💡 Conseils pour réussir votre vidéo :
*   **Vitesse** : Parlez calmement et laissez l'image suivre vos paroles.
*   **MetaMask** : Si vous montrez MetaMask, cachez bien vos informations privées.
*   **Visuels** : Montrez bien les changements de couleurs (boutons verts) et les mouvements du graphique.
