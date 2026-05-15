-- Script d'initialisation de la base de données Tontine

CREATE DATABASE IF NOT EXISTS tontine_db;
USE tontine_db;

-- Table des membres globaux
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table des tontines
CREATE TABLE IF NOT EXISTS tontines (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    montant INT NOT NULL,
    frequence VARCHAR(50),
    dateDebut DATE,
    penalite INT DEFAULT 0,
    currentRound INT DEFAULT 0,
    cagnotte INT DEFAULT 0,
    cyclesTermines INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    membersOrder JSON,
    roundPaidStatus JSON,
    historique JSON,
    events JSON,
    raw_members JSON -- Stocke les détails dynamiques des membres (hasPaid, etc.)
);

-- Table des utilisateurs (Wallet)
CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements / transactions blockchain
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tontine_id BIGINT,
    member_id VARCHAR(50),
    wallet_address VARCHAR(255),
    amount INT,
    transaction_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tontine_id) REFERENCES tontines(id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
