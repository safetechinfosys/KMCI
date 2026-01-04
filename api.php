<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// --- CONFIGURATION ---
$host = '193.203.184.215'; // Use 'localhost' on Hostinger for better speed
$db   = 'u895470646_KMCI';
$user = 'u895470646_administrator';
$pass = '0^qi7N:t';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database Connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit;
}

// --- API ROUTES ---

if ($method === 'GET') {
    if ($action === 'get_all') {
        $stmt = $pdo->query("SELECT * FROM registration_groups ORDER BY created_at DESC");
        $groups = $stmt->fetchAll();
        
        $stmt2 = $pdo->query("SELECT * FROM attendees");
        $attendees = $stmt2->fetchAll();
        
        echo json_encode(['groups' => $groups, 'attendees' => $attendees]);
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'save_group') {
        $pdo->beginTransaction();
        try {
            if (isset($data['id']) && $data['id']) {
                // Update
                $stmt = $pdo->prepare("UPDATE registration_groups SET name=?, total_fee=?, paid=?, adults_count=?, kids_count=? WHERE id=?");
                $stmt->execute([$data['name'], $data['totalFee'], (int)$data['paid'], $data['adultsCount'], $data['kidsCount'], $data['id']]);
                $groupId = $data['id'];
                
                // Delete existing attendees
                $stmtDel = $pdo->prepare("DELETE FROM attendees WHERE group_id=?");
                $stmtDel->execute([$groupId]);
            } else {
                // Insert
                $stmt = $pdo->prepare("INSERT INTO registration_groups (name, total_fee, paid, adults_count, kids_count) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$data['name'], $data['totalFee'], (int)$data['paid'], $data['adultsCount'], $data['kidsCount']]);
                $groupId = $pdo->lastInsertId();
            }

            // Insert attendees
            $stmtAtt = $pdo->prepare("INSERT INTO attendees (group_id, name, type, arrived, profession, irish_county, kerala_district, email, whatsapp, mobile, address_kerala, eircode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['attendees'] as $a) {
                $stmtAtt->execute([
                    $groupId, 
                    $a['name'], 
                    $a['type'], 
                    (int)($a['arrived'] ?? 0), 
                    $a['profession'] ?? null, 
                    $a['irishCounty'] ?? null, 
                    $a['keralaDistrict'] ?? null,
                    $a['email'] ?? null, 
                    $a['whatsapp'] ?? null, 
                    $a['mobile'] ?? null,
                    $a['addressKerala'] ?? null, 
                    $a['eircode'] ?? null
                ]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'id' => $groupId]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        // Cascade delete will handle attendees if FK is set correctly
        $stmt = $pdo->prepare("DELETE FROM registration_groups WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
}
?>
