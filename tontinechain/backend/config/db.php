<?php
// Configuration de la base de données
// InfinityFree : Remplissez ces valeurs avec celles de votre Control Panel
$host = 'sql312.infinityfree.com'; 
$db   = 'if0_41111892_tontine_db';
$user = 'if0_41111892';
$pass = 'i1umVH4FGD58PfU';
$charset = 'utf8mb4';

/*$host = 'localhost'; 
$db   = 'tontine_db';
$user = 'assmedev';
$pass = 'password@123';
$charset = 'utf8mb4';*/

// En local, on garde les valeurs actuelles
if ($_SERVER['REMOTE_ADDR'] == '127.0.0.1' || $_SERVER['REMOTE_ADDR'] == '::1') {
    $host = 'localhost';
    $db   = 'tontine_db';
    $user = 'assmedev';
    $pass = 'password@123';
}

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE             => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES    => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Si la base n'existe pas encore, on essaie de se connecter sans db pour la créer
     if ($e->getCode() == 1049) {
         $dsnNoDb = "mysql:host=$host;charset=$charset";
         $pdo = new PDO($dsnNoDb, $user, $pass, $options);
         $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
         $pdo->exec("USE `$db`");
         // On pourrait aussi sourcer le init_db.sql ici, mais restons simple
     } else {
         throw new \PDOException($e->getMessage(), (int)$e->getCode());
     }
}
