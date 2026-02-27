<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->candidateId) || !isset($data->date) || !isset($data->time) || !isset($data->location) || !isset($data->panel)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit();
}

try {
    // Get candidate details
    $candidateQuery = "SELECT Candidate_name, Candidate_position FROM mst_candidates WHERE Candidate_id = :candidateId";
    $candidateStmt = $db->prepare($candidateQuery);
    $candidateStmt->bindParam(":candidateId", $data->candidateId);
    $candidateStmt->execute();
    
    if ($candidateStmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Candidate not found"]);
        exit();
    }
    
    $candidate = $candidateStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get panel details
    $panelQuery = "SELECT User_name, User_email FROM mst_users WHERE User_id = :panelId";
    $panelStmt = $db->prepare($panelQuery);
    $panelStmt->bindParam(":panelId", $data->panel);
    $panelStmt->execute();
    
    if ($panelStmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Panel not found"]);
        exit();
    }
    
    $panel = $panelStmt->fetch(PDO::FETCH_ASSOC);
    
    // Create interview datetime
    $interviewDateTime = $data->date . ' ' . $data->time . ':00';
    
    // Insert interview record
    $insertQuery = "INSERT INTO tbl_interview_details (Candidate_id, Feedback_by, Status_id, DateTime, Location, Feedback, Isactive) 
                    VALUES (:candidateId, :panelId, 8, :datetime, :location, '', 1)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(":candidateId", $data->candidateId);
    $insertStmt->bindParam(":panelId", $data->panel);
    $insertStmt->bindParam(":datetime", $interviewDateTime);
    $insertStmt->bindParam(":location", $data->location);
    $insertStmt->execute();
    
    $interviewId = $db->lastInsertId();
    
    // Update candidate status to "Interview Scheduled" (status 8)
    $updateQuery = "UPDATE mst_candidates SET Current_status = 8 WHERE Candidate_id = :candidateId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":candidateId", $data->candidateId);
    $updateStmt->execute();
    
    // Send email to panel
    $emailResult = sendPanelAssignmentEmail(
        $interviewId,
        $data->panel,
        $panel['User_name'],
        $panel['User_email'],
        $candidate['Candidate_name'],
        $candidate['Candidate_position'],
        $interviewDateTime,
        $data->location
    );
    
    echo json_encode([
        "success" => true,
        "message" => "Interview scheduled successfully",
        "data" => [
            "interviewId" => $interviewId,
            "emailSent" => $emailResult['success']
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
