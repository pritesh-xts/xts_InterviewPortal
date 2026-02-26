<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    echo json_encode(["success" => false, "message" => "Email and password are required"]);
    exit();
}

try {
    $query = "SELECT u.User_id, u.User_name, u.User_email, u.Role_id, r.Role_description 
              FROM mst_users u 
              JOIN mst_roles r ON u.Role_id = r.Role_id 
              WHERE u.User_email = :email AND u.User_Password = :password AND u.Isactive = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":password", $data->password);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $token = base64_encode($user['User_id'] . ':' . time());
        
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "data" => [
                "token" => $token,
                "user" => [
                    "id" => $user['User_id'],
                    "name" => $user['User_name'],
                    "email" => $user['User_email'],
                    "roleId" => $user['Role_id'],
                    "role" => $user['Role_description']
                ]
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
