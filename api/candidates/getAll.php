<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$roleId = isset($_GET['roleId']) ? intval($_GET['roleId']) : 0;
$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;

try {
    $query = "SELECT c.*, s.Status_description
              FROM mst_candidates c
              LEFT JOIN mst_application_status s ON c.Current_status = s.Status_id
              WHERE c.Isactive = 1";

    if ($roleId === 2 && $userId > 0) {
        $query .= " AND EXISTS (
                      SELECT 1
                      FROM tbl_interview_details i
                      WHERE i.Candidate_id = c.Candidate_id
                        AND i.Isactive = 1
                        AND i.Feedback_by = :userId
                    )";
    }

    $query .= " ORDER BY c.Candidate_id DESC";
    
    $stmt = $db->prepare($query);
    if ($roleId === 2 && $userId > 0) {
        $stmt->bindParam(":userId", $userId, PDO::PARAM_INT);
    }
    $stmt->execute();
    
    $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => $candidates]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
