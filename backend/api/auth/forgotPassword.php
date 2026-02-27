<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email)) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit();
}

try {
    // Check if user exists
    $query = "SELECT User_id, User_name, User_email FROM mst_users WHERE User_email = :email AND Isactive = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $data->email);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Email not found"]);
        exit();
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Generate reset token (valid for 1 hour)
    $token = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Store token in database
    $updateQuery = "UPDATE mst_users SET reset_token = :token, reset_token_expiry = :expiry WHERE User_id = :userId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":token", $token);
    $updateStmt->bindParam(":expiry", $expiry);
    $updateStmt->bindParam(":userId", $user['User_id']);
    $updateStmt->execute();
    
    // Send reset email
    $emailSent = sendPasswordResetEmail($user['User_email'], $user['User_name'], $token);
    
    if ($emailSent) {
        echo json_encode(["success" => true, "message" => "Password reset link sent to your email"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to send email"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
