<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->candidateId) || !isset($data->statusId) || !isset($data->feedbackBy) || !isset($data->feedback)) {
    $debug = [
        "candidateId" => isset($data->candidateId) ? $data->candidateId : 'missing',
        "statusId" => isset($data->statusId) ? $data->statusId : 'missing',
        "feedbackBy" => isset($data->feedbackBy) ? $data->feedbackBy : 'missing',
        "feedback" => isset($data->feedback) ? $data->feedback : 'missing'
    ];
    echo json_encode(["success" => false, "message" => "All fields are required", "debug" => $debug]);
    exit();
}

try {
    $db->beginTransaction();
    
    $location = isset($data->location) ? $data->location : '';
    $activeQuery = "SELECT Interview_id FROM tbl_interview_details WHERE Candidate_id = :candidateId AND Isactive = 1 ORDER BY Interview_id DESC LIMIT 1";
    $activeStmt = $db->prepare($activeQuery);
    $activeStmt->bindParam(":candidateId", $data->candidateId);
    $activeStmt->execute();
    $activeInterview = $activeStmt->fetch(PDO::FETCH_ASSOC);

    if ($activeInterview && isset($activeInterview['Interview_id'])) {
        $updateInterview = "UPDATE tbl_interview_details
                            SET Status_id = :statusId,
                                Feedback_by = :feedbackBy,
                                Feedback = :feedback,
                                Location = CASE WHEN :location = '' THEN Location ELSE :location END
                            WHERE Interview_id = :interviewId";
        $stmt = $db->prepare($updateInterview);
        $stmt->bindParam(":statusId", $data->statusId);
        $stmt->bindParam(":feedbackBy", $data->feedbackBy);
        $stmt->bindParam(":feedback", $data->feedback);
        $stmt->bindParam(":location", $location);
        $stmt->bindParam(":interviewId", $activeInterview['Interview_id']);
        $stmt->execute();
    } else {
        $db->rollBack();
        echo json_encode(["success" => false, "message" => "No active interview found for this candidate"]);
        exit();
    }
    
    $query2 = "UPDATE mst_candidates SET Current_status = :statusId WHERE Candidate_id = :candidateId";
    $stmt2 = $db->prepare($query2);
    $stmt2->bindParam(":statusId", $data->statusId);
    $stmt2->bindParam(":candidateId", $data->candidateId);
    $stmt2->execute();
    
    // Get candidate details for email notification
    $candidateQuery = "SELECT Candidate_name, Candidate_email, Candidate_position FROM mst_candidates WHERE Candidate_id = :candidateId";
    $candidateStmt = $db->prepare($candidateQuery);
    $candidateStmt->bindParam(":candidateId", $data->candidateId);
    $candidateStmt->execute();
    $candidate = $candidateStmt->fetch(PDO::FETCH_ASSOC);
    
    $db->commit();

    // Send email notification to candidate based on status
    $emailResult = null;
    if ($candidate) {
        $statusId = intval($data->statusId);
        $candidateEmail = trim($candidate['Candidate_email']);
        $candidateName = trim($candidate['Candidate_name']);
        $position = trim($candidate['Candidate_position']);
        
        // Only send rejection emails immediately
        // L1 Clear email will be sent when HR schedules L2
        if ($statusId === 2) {
            // L1 Reject
            $emailResult = sendCandidateL1RejectEmail($candidateEmail, $candidateName, $position);
        } elseif ($statusId === 4) {
            // L2 Clear
            $emailResult = sendCandidateL2ClearEmail($candidateEmail, $candidateName, $position);
        } elseif ($statusId === 5) {
            // L2 Reject
            $emailResult = sendCandidateL1RejectEmail($candidateEmail, $candidateName, $position);
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Feedback added successfully",
        "data" => ["id" => ($activeInterview['Interview_id'] ?? $db->lastInsertId())]
    ]);
} catch(PDOException $e) {
    $db->rollBack();
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
