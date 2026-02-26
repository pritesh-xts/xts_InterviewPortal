<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT Status_id, Status_description FROM mst_application_status ORDER BY Status_id";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $statuses]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
