<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->token) || !isset($data->newPassword)) {
    echo json_encode(["success" => false, "message" => "Token and new password are required"]);
    exit();
}

try {
    // Verify token
    $query = "SELECT User_id, User_name FROM mst_users 
              WHERE reset_token = :token 
              AND reset_token_expiry > NOW() 
              AND Isactive = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":token", $data->token);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired reset link"]);
        exit();
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Update password and clear token
    $updateQuery = "UPDATE mst_users 
                    SET User_Password = :password, 
                        reset_token = NULL, 
                        reset_token_expiry = NULL 
                    WHERE User_id = :userId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":password", $data->newPassword);
    $updateStmt->bindParam(":userId", $user['User_id']);
    
    if ($updateStmt->execute()) {
        echo json_encode(["success" => true, "message" => "Password reset successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to reset password"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
