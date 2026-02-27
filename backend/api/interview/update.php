<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->interviewId) || !isset($data->dateTime) || !isset($data->panel)) {
    echo json_encode(["success" => false, "message" => "Interview ID, DateTime, and Panel are required"]);
    exit();
}

try {
    $db->beginTransaction();
    $location = $data->location ?? '';
    $incomingStatus = isset($data->statusId) ? intval($data->statusId) : 8;
    $allowedScheduleStatuses = [8, 9];
    $interviewStatus = in_array($incomingStatus, $allowedScheduleStatuses, true) ? $incomingStatus : 8;

    $candidateQuery = "SELECT Candidate_id FROM tbl_interview_details WHERE Interview_id = :interviewId LIMIT 1";
    $candidateStmt = $db->prepare($candidateQuery);
    $candidateStmt->bindParam(":interviewId", $data->interviewId);
    $candidateStmt->execute();
    $candidateRow = $candidateStmt->fetch(PDO::FETCH_ASSOC);

    if (!$candidateRow) {
        $db->rollBack();
        echo json_encode(["success" => false, "message" => "Interview not found"]);
        exit();
    }

    $candidateId = intval($candidateRow['Candidate_id']);

    $deactivateQuery = "UPDATE tbl_interview_details SET Isactive = 0 WHERE Candidate_id = :candidateId AND Isactive = 1";
    $deactivateStmt = $db->prepare($deactivateQuery);
    $deactivateStmt->bindParam(":candidateId", $candidateId);
    $deactivateStmt->execute();

    $insertQuery = "INSERT INTO tbl_interview_details
                    (Candidate_id, Status_id, Feedback_by, Feedback, DateTime, Location, Isactive)
                    VALUES (:candidateId, :statusId, :panel, :feedback, :dateTime, :location, 1)";
    $insertStmt = $db->prepare($insertQuery);
    $emptyFeedback = '';
    $insertStmt->bindParam(":candidateId", $candidateId);
    $insertStmt->bindParam(":statusId", $interviewStatus);
    $insertStmt->bindParam(":panel", $data->panel);
    $insertStmt->bindParam(":feedback", $emptyFeedback);
    $insertStmt->bindParam(":dateTime", $data->dateTime);
    $insertStmt->bindParam(":location", $location);
    $insertStmt->execute();
    $newInterviewId = intval($db->lastInsertId());

    $statusQuery = "UPDATE mst_candidates SET Current_status = :statusId WHERE Candidate_id = :candidateId";
    $statusStmt = $db->prepare($statusQuery);
    $statusStmt->bindParam(":statusId", $interviewStatus);
    $statusStmt->bindParam(":candidateId", $candidateId);
    $statusStmt->execute();

    $db->commit();

    $candidateInfoQuery = "SELECT Candidate_name, Candidate_position FROM mst_candidates WHERE Candidate_id = :candidateId LIMIT 1";
    $candidateInfoStmt = $db->prepare($candidateInfoQuery);
    $candidateInfoStmt->bindParam(":candidateId", $candidateId);
    $candidateInfoStmt->execute();
    $candidateInfo = $candidateInfoStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $panelQuery = "SELECT User_name, User_email FROM mst_users WHERE User_id = :panelId AND Isactive = 1 LIMIT 1";
    $panelStmt = $db->prepare($panelQuery);
    $panelStmt->bindParam(":panelId", $data->panel);
    $panelStmt->execute();
    $panelRow = $panelStmt->fetch(PDO::FETCH_ASSOC);
    $panelName = trim((string)($panelRow['User_name'] ?? 'Panel Member'));
    $panelEmail = trim((string)($panelRow['User_email'] ?? ''));

    $emailNotification = null;
    if ($panelEmail !== '') {
        $emailNotification = sendPanelAssignmentEmail(
            $newInterviewId,
            intval($data->panel),
            $panelName,
            $panelEmail,
            trim((string)($candidateInfo['Candidate_name'] ?? 'Candidate')),
            trim((string)($candidateInfo['Candidate_position'] ?? 'Position')),
            (string)$data->dateTime,
            (string)$location
        );
    } else {
        $emailNotification = [
            'success' => false,
            'message' => 'Panel email not found in mst_users'
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Interview updated successfully",
        "emailNotification" => $emailNotification
    ]);
} catch(PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
