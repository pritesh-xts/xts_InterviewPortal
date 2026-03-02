<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || !isset($data->email) || !isset($data->position)) {
    echo json_encode(["success" => false, "message" => "Name, email, and position are required"]);
    exit();
}

try {
    $db->beginTransaction();
    
    $status = isset($data->status) ? intval($data->status) : 7;
    $skills = is_array($data->skills) ? implode(', ', $data->skills) : ($data->skills ?? '');
    $experience = isset($data->experience) ? floatval($data->experience) : 0;
    
    $query = "INSERT INTO mst_candidates 
              (Candidate_name, Candidate_phone, Candidate_position, Candidate_primary_skill, Candidate_resume_link, 
               Candidate_department, Candidate_skills, Candidate_experience, Candidate_email, 
               Current_status, Isactive) 
              VALUES (:name, :phone, :position, :primarySkill, :resume, :department, :skills, :experience, :email, :status, 1)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":name", $data->name);
    $phone = $data->phone ?? '';
    $stmt->bindParam(":phone", $phone);
    $stmt->bindParam(":position", $data->position);
    $primarySkill = $data->primarySkill ?? '';
    $stmt->bindParam(":primarySkill", $primarySkill);
    $resume = $data->resume ?? '';
    $stmt->bindParam(":resume", $resume);
    $department = $data->department ?? 'Engineering';
    $stmt->bindParam(":department", $department);
    $stmt->bindParam(":skills", $skills);
    $stmt->bindParam(":experience", $experience);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":status", $status);
    $stmt->execute();
    
    $candidateId = $db->lastInsertId();
    
    $emailNotification = null;

    if (isset($data->date) && isset($data->time) && isset($data->panel) && !empty($data->panel)) {
        $dateTime = $data->date . ' ' . $data->time . ':00';
        $allowedScheduleStatuses = [8, 9];
        $interviewStatus = in_array($status, $allowedScheduleStatuses, true) ? $status : 8;
        $location = $data->location ?? '';
        
        $interviewQuery = "INSERT INTO tbl_interview_details 
                          (Candidate_id, Status_id, Feedback_by, DateTime, Location, Isactive) 
                          VALUES (:candidate_id, :status_id, :feedback_by, :datetime, :location, 1)";
        
        $interviewStmt = $db->prepare($interviewQuery);
        $interviewStmt->bindParam(":candidate_id", $candidateId);
        $interviewStmt->bindParam(":status_id", $interviewStatus);
        $interviewStmt->bindParam(":feedback_by", $data->panel);
        $interviewStmt->bindParam(":datetime", $dateTime);
        $interviewStmt->bindParam(":location", $location);
        $interviewStmt->execute();
        $interviewId = intval($db->lastInsertId());

        $panelQuery = "SELECT User_name, User_email FROM mst_users WHERE User_id = :panelId AND Isactive = 1 LIMIT 1";
        $panelStmt = $db->prepare($panelQuery);
        $panelStmt->bindParam(":panelId", $data->panel);
        $panelStmt->execute();
        $panelRow = $panelStmt->fetch(PDO::FETCH_ASSOC);
        $panelName = trim((string)($panelRow['User_name'] ?? 'Panel Member'));
        $panelEmail = trim((string)($panelRow['User_email'] ?? ''));

        if ($panelEmail !== '') {
            $candidateName = trim((string)$data->name);
            $candidatePosition = trim((string)$data->position);
            $emailNotification = sendPanelAssignmentEmail(
                $interviewId,
                intval($data->panel),
                $panelName,
                $panelEmail,
                $candidateName,
                $candidatePosition,
                $dateTime,
                $location
            );
            
            // Send email to candidate
            $candidateEmail = trim((string)$data->email);
            if (filter_var($candidateEmail, FILTER_VALIDATE_EMAIL)) {
                $candidateEmailResult = sendCandidateInterviewEmail(
                    $candidateEmail,
                    $candidateName,
                    $candidatePosition,
                    $dateTime,
                    $location,
                    $panelName
                );
                if (!$candidateEmailResult['success']) {
                    error_log('Candidate email failed: ' . $candidateEmailResult['message']);
                }
            }
        } else {
            $emailNotification = [
                'success' => false,
                'message' => 'Panel email not found in mst_users'
            ];
        }
    }
    
    $db->commit();
    
    $response = [
        "success" => true,
        "message" => "Candidate created successfully",
        "data" => ["id" => $candidateId]
    ];
    if ($emailNotification !== null) {
        $response["emailNotification"] = $emailNotification;
    }
    echo json_encode($response);
} catch(PDOException $e) {
    $db->rollBack();
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
