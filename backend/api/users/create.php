<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || !isset($data->email) || !isset($data->roleId)) {
    echo json_encode(["success" => false, "message" => "Name, email and role are required"]);
    exit();
}

try {
    // Check if email already exists
    $checkQuery = "SELECT User_id FROM mst_users WHERE User_email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":email", $data->email);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Email already exists"]);
        exit();
    }
    
    // Generate random password
    $password = bin2hex(random_bytes(4)); // 8 character password
    
    // Insert user
    $query = "INSERT INTO mst_users (User_name, User_email, User_Password, Role_id, Isactive) 
              VALUES (:name, :email, :password, :roleId, 1)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":password", $password);
    $stmt->bindParam(":roleId", $data->roleId);
    
    if ($stmt->execute()) {
        $userId = $db->lastInsertId();
        
        // Send email with credentials
        $emailSent = sendUserCredentialsEmail($data->email, $data->name, $password);
        
        echo json_encode([
            "success" => true,
            "message" => "User created successfully",
            "data" => [
                "id" => $userId,
                "emailSent" => $emailSent
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create user"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
