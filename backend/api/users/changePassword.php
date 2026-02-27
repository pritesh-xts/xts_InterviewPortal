<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->userId) || !isset($data->currentPassword) || !isset($data->newPassword)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit();
}

try {
    // Verify current password
    $query = "SELECT User_Password FROM mst_users WHERE User_id = :userId";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":userId", $data->userId);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit();
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user['User_Password'] !== $data->currentPassword) {
        echo json_encode(["success" => false, "message" => "Current password is incorrect"]);
        exit();
    }
    
    // Update password
    $updateQuery = "UPDATE mst_users SET User_Password = :newPassword WHERE User_id = :userId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":newPassword", $data->newPassword);
    $updateStmt->bindParam(":userId", $data->userId);
    
    if ($updateStmt->execute()) {
        echo json_encode(["success" => true, "message" => "Password changed successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update password"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
