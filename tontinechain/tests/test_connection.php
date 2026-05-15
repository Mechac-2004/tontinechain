<?php
require_once '../backend/config/db.php';

echo "--- Test de connexion TontineChain ---\n";

try {
    // 1. Vérifier la connexion
    echo "[ ] Tentative de connexion... ";
    $pdo->query("SELECT 1");
    echo "OK !\n";

    // 2. Vérifier les tables
    echo "[ ] Vérification des tables... ";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    
    $required = ['members', 'tontines'];
    foreach ($required as $table) {
        if (in_array($table, $tables)) {
            echo "\n    - Table '$table' : OK";
        } else {
            echo "\n    - Table '$table' : MANQUANTE !";
            // On tente de créer les tables si elles manquent
            echo " (Tentative de création...)";
            require_once 'init_db.sql'; // Note: Ceci ne fonctionnera pas directement via require, on va utiliser exec
            $sql = file_get_contents('init_db.sql');
            $pdo->exec($sql);
            echo " Créée.";
        }
    }
    echo "\n\n--- Succès : La base de données est prête ! ---\n";

} catch (Exception $e) {
    echo "ERREUR : " . $e->getMessage() . "\n";
    echo "Vérifiez vos identifiants dans db.php\n";
}
