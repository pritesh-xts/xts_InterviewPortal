<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT u.User_id, u.User_name, u.User_email, u.Role_id, r.Role_description, u.Isactive 
              FROM mst_users u 
              JOIN mst_roles r ON u.Role_id = r.Role_id 
              ORDER BY u.User_id DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "data" => $users
    ]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
