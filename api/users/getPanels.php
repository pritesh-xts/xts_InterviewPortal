<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT User_id, User_name FROM mst_users WHERE User_id IN (3, 4, 5) AND Isactive = 1 ORDER BY User_name";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $panels = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $panels]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
