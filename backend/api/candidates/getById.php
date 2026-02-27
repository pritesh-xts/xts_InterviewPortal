<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$candidateId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($candidateId === 0) {
    echo json_encode(["success" => false, "message" => "Candidate ID is required"]);
    exit();
}

try {
    $query = "SELECT c.*, s.Status_description 
              FROM mst_candidates c 
              LEFT JOIN mst_application_status s ON c.Current_status = s.Status_id 
              WHERE c.Candidate_id = :id AND c.Isactive = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":id", $candidateId);
    $stmt->execute();
    
    $candidate = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($candidate) {
        $interviewQuery = "SELECT i.*, u.User_name as Panel_name, s.Status_description as Interview_status
                           FROM tbl_interview_details i
                           LEFT JOIN mst_users u ON i.Feedback_by = u.User_id
                           LEFT JOIN mst_application_status s ON i.Status_id = s.Status_id
                           WHERE i.Candidate_id = :id
                             AND i.DateTime IS NOT NULL
                             AND i.DateTime <> '0000-00-00 00:00:00'
                           ORDER BY i.Interview_id DESC LIMIT 1";
        
        $interviewStmt = $db->prepare($interviewQuery);
        $interviewStmt->bindParam(":id", $candidateId);
        $interviewStmt->execute();
        
        $interview = $interviewStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($interview) {
            $candidate['interview'] = $interview;
        }

        $historyQuery = "SELECT i.*, u.User_name as Panel_name, s.Status_description as Interview_status
                         FROM tbl_interview_details i
                         LEFT JOIN mst_users u ON i.Feedback_by = u.User_id
                         LEFT JOIN mst_application_status s ON i.Status_id = s.Status_id
                         WHERE i.Candidate_id = :id
                         ORDER BY i.Interview_id ASC";

        $historyStmt = $db->prepare($historyQuery);
        $historyStmt->bindParam(":id", $candidateId);
        $historyStmt->execute();
        $history = $historyStmt->fetchAll(PDO::FETCH_ASSOC);

        $candidate['history'] = $history ?: [];
        
        echo json_encode(["success" => true, "data" => $candidate]);
    } else {
        echo json_encode(["success" => false, "message" => "Candidate not found"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
