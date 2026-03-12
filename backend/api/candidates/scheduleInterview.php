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
    $candidateQuery = "SELECT Candidate_name, Candidate_position, Candidate_email, Current_status FROM mst_candidates WHERE Candidate_id = :candidateId";
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
    
    // Determine interview status based on current candidate status
    $currentStatus = intval($candidate['Current_status'] ?? 0);
    $interviewStatus = 8; // Default: L1 Interview Confirmed
    $roundLabel = 'L1 Round';
    
    if ($currentStatus === 1) {
        // Candidate has L1 Clear, so this is L2 scheduling
        $interviewStatus = 9; // L2 Interview Confirmed
        $roundLabel = 'L2 Round';
    }
    
    // Insert interview record
    $insertQuery = "INSERT INTO tbl_interview_details (Candidate_id, Feedback_by, Status_id, DateTime, Location, Feedback, Isactive) 
                    VALUES (:candidateId, :panelId, :statusId, :datetime, :location, '', 1)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(":candidateId", $data->candidateId);
    $insertStmt->bindParam(":panelId", $data->panel);
    $insertStmt->bindParam(":statusId", $interviewStatus);
    $insertStmt->bindParam(":datetime", $interviewDateTime);
    $insertStmt->bindParam(":location", $data->location);
    $insertStmt->execute();
    
    $interviewId = $db->lastInsertId();
    
    // Update candidate status to match interview status
    $updateQuery = "UPDATE mst_candidates SET Current_status = :statusId WHERE Candidate_id = :candidateId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":statusId", $interviewStatus);
    $updateStmt->bindParam(":candidateId", $data->candidateId);
    $updateStmt->execute();
    
    $hrName = '';
    if (isset($data->hrName)) {
        $hrName = trim((string)$data->hrName);
    }
    if (isset($data->hrId)) {
        $hrId = is_numeric($data->hrId) ? intval($data->hrId) : 0;
        if ($hrId > 0) {
            $hrQuery = "SELECT User_name FROM mst_users WHERE User_id = :hrId LIMIT 1";
            $hrStmt = $db->prepare($hrQuery);
            $hrStmt->bindValue(":hrId", $hrId, PDO::PARAM_INT);
            $hrStmt->execute();
            if ($hrStmt->rowCount() > 0) {
                $hrRow = $hrStmt->fetch(PDO::FETCH_ASSOC);
                $hrName = trim((string)($hrRow['User_name'] ?? ''));
            }
        }
    }
    if ($hrName === '' && defined('SMTP_FROM_NAME')) {
        $hrName = (string)SMTP_FROM_NAME;
    }
    if ($hrName === '') {
        $hrName = 'HR Team';
    }

    // Send email to panel
    $emailResult = sendPanelAssignmentEmail(
        $interviewId,
        $data->panel,
        $panel['User_name'],
        $panel['User_email'],
        $candidate['Candidate_name'],
        $candidate['Candidate_position'],
        $interviewDateTime,
        $data->location,
        $roundLabel,
        $hrName
    );

    $candidateEmailResult = sendCandidateInterviewEmail(
        $candidate['Candidate_email'],
        $candidate['Candidate_name'],
        $candidate['Candidate_position'],
        $interviewDateTime,
        $data->location,
        $hrName,
        $roundLabel
    );
    
    echo json_encode([
        "success" => true,
        "message" => "Interview scheduled successfully",
        "data" => [
            "interviewId" => $interviewId,
            "panelEmailSent" => $emailResult['success'],
            "candidateEmailSent" => $candidateEmailResult['success']
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
