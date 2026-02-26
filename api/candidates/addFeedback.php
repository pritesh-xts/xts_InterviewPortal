<?php
require_once '../config/database.php';

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
        // Fallback for legacy rows where no active interview exists.
        $insertQuery = "INSERT INTO tbl_interview_details 
                        (Candidate_id, Status_id, Feedback_by, Feedback, Location, Isactive) 
                        VALUES (:candidateId, :statusId, :feedbackBy, :feedback, :location, 1)";
        $stmt = $db->prepare($insertQuery);
        $stmt->bindParam(":candidateId", $data->candidateId);
        $stmt->bindParam(":statusId", $data->statusId);
        $stmt->bindParam(":feedbackBy", $data->feedbackBy);
        $stmt->bindParam(":feedback", $data->feedback);
        $stmt->bindParam(":location", $location);
        $stmt->execute();
    }
    
    $query2 = "UPDATE mst_candidates SET Current_status = :statusId WHERE Candidate_id = :candidateId";
    $stmt2 = $db->prepare($query2);
    $stmt2->bindParam(":statusId", $data->statusId);
    $stmt2->bindParam(":candidateId", $data->candidateId);
    $stmt2->execute();
    
    $db->commit();

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
