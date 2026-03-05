<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->status)) {
    echo json_encode(["success" => false, "message" => "Candidate ID and Status are required"]);
    exit();
}

try {
    $status = intval($data->status);
    $reason = isset($data->reason) ? trim((string)$data->reason) : '';

    if ($status === 11 && $reason === '') {
        echo json_encode(["success" => false, "message" => "Reason is required for Offer On Hold"]);
        exit();
    }

    $reasonValue = ($status === 11) ? $reason : null;

    $query = "UPDATE mst_candidates 
              SET Current_status = :status, Reason = :reason
              WHERE Candidate_id = :id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":status", $status, PDO::PARAM_INT);
    $stmt->bindParam(":reason", $reasonValue, is_null($reasonValue) ? PDO::PARAM_NULL : PDO::PARAM_STR);
    $stmt->bindParam(":id", $data->id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update status"]);
    }

} catch(PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
