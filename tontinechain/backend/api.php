<?php
header('Content-Type: application/json');
require_once 'config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'members':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM members");
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO members (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)");
                $stmt->execute([$data['id'], $data['name']]);
                echo json_encode(['status' => 'success']);
            }
            break;

        case 'tontines':
            if ($method === 'GET') {
                $stmt = $pdo->query("SELECT * FROM tontines");
                $tontines = $stmt->fetchAll();
                // Décoder les champs JSON proprement
                foreach ($tontines as &$t) {
                    $t['membersOrder'] = json_decode($t['membersOrder'] ?? '[]', true);
                    $t['roundPaidStatus'] = json_decode($t['roundPaidStatus'] ?? '{}');
                    if (is_array($t['roundPaidStatus']) && empty($t['roundPaidStatus'])) {
                        $t['roundPaidStatus'] = new stdClass();
                    }
                    $t['historique'] = json_decode($t['historique'] ?? '[]', true);
                    $t['events'] = json_decode($t['events'] ?? '[]', true);
                    $t['members'] = json_decode($t['raw_members'] ?? '[]', true);
                }
                echo json_encode($tontines);
            } elseif ($method === 'POST') {
                $raw = file_get_contents('php://input');
                $data = json_decode($raw, true);
                if (!$data) {
                    echo json_encode(['status' => 'error', 'message' => 'JSON invalide']);
                    break;
                }

                $sql = "INSERT INTO tontines (id, name, montant, frequence, dateDebut, penalite, currentRound, cagnotte, cyclesTermines, status, membersOrder, roundPaidStatus, historique, events, raw_members)
                        VALUES (:id, :name, :montant, :frequence, :dateDebut, :penalite, :currentRound, :cagnotte, :cyclesTermines, :status, :membersOrder, :roundPaidStatus, :historique, :events, :raw_members)
                        ON DUPLICATE KEY UPDATE 
                        name=VALUES(name), montant=VALUES(montant), frequence=VALUES(frequence), dateDebut=VALUES(dateDebut), penalite=VALUES(penalite), currentRound=VALUES(currentRound), cagnotte=VALUES(cagnotte), cyclesTermines=VALUES(cyclesTermines), status=VALUES(status), membersOrder=VALUES(membersOrder), roundPaidStatus=VALUES(roundPaidStatus), historique=VALUES(historique), events=VALUES(events), raw_members=VALUES(raw_members)";
                
                $stmt = $pdo->prepare($sql);
                $params = [
                    ':id' => $data['id'],
                    ':name' => $data['name'],
                    ':montant' => $data['montant'],
                    ':frequence' => $data['frequence'],
                    ':dateDebut' => !empty($data['dateDebut']) ? $data['dateDebut'] : null,
                    ':penalite' => $data['penalite'],
                    ':currentRound' => $data['currentRound'],
                    ':cagnotte' => $data['cagnotte'],
                    ':cyclesTermines' => $data['cyclesTermines'],
                    ':status' => $data['status'],
                    ':membersOrder' => json_encode($data['membersOrder'] ?? []),
                    ':roundPaidStatus' => json_encode($data['roundPaidStatus'] ?? new stdClass()),
                    ':historique' => json_encode($data['historique'] ?? []),
                    ':events' => json_encode($data['events'] ?? []),
                    ':raw_members' => json_encode($data['members'] ?? [])
                ];
                $stmt->execute($params);
                echo json_encode(['status' => 'success', 'debug' => 'Tontine mise à jour']);
            }
            break;

        case 'users':
            if ($method === 'GET') {
                $wallet = $_GET['wallet'] ?? '';
                $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
                $stmt->execute([$wallet]);
                echo json_encode($stmt->fetch());
            } elseif ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO users (wallet_address, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)");
                $stmt->execute([$data['wallet_address'], $data['name']]);
                echo json_encode(['status' => 'success']);
            }
            break;

        case 'payments':
            if ($method === 'GET') {
                $tontine_id = $_GET['tontine_id'] ?? '';
                $stmt = $pdo->prepare("SELECT * FROM payments WHERE tontine_id = ? ORDER BY created_at DESC");
                $stmt->execute([$tontine_id]);
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $raw = file_get_contents('php://input');
                $data = json_decode($raw, true);
                if (!$data) {
                    echo json_encode(['status' => 'error', 'message' => 'JSON invalide pour paiement']);
                    break;
                }
                $stmt = $pdo->prepare("INSERT INTO payments (tontine_id, member_id, wallet_address, amount, transaction_hash, status) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['tontine_id'] ?? null, 
                    $data['member_id'] ?? null, 
                    $data['wallet_address'] ?? '0x',
                    $data['amount'] ?? 0, 
                    $data['transaction_hash'] ?? 'demo_hash', 
                    $data['status'] ?? 'confirmed'
                ]);
                echo json_encode(['status' => 'success']);
            }
            break;

        case 'notifications':
            if ($method === 'GET') {
                $wallet = $_GET['wallet'] ?? '';
                $stmt = $pdo->prepare("SELECT * FROM notifications WHERE wallet_address = ? ORDER BY created_at DESC");
                $stmt->execute([$wallet]);
                echo json_encode($stmt->fetchAll());
            } elseif ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO notifications (wallet_address, message) VALUES (?, ?)");
                $stmt->execute([$data['wallet_address'], $data['message']]);
                echo json_encode(['status' => 'success']);
            }
            break;

        default:
            echo json_encode(['error' => 'Action non reconnue']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
