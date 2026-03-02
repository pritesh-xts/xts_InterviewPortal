<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(["success" => false, "message" => "Candidate ID is required"]);
    exit();
}

try {
    $skills = is_array($data->skills) ? implode(', ', $data->skills) : ($data->skills ?? '');
    $experience = isset($data->experience) ? floatval($data->experience) : 0;
    $reason = isset($data->reason) ? $data->reason : null;
    
    $query = "UPDATE mst_candidates 
              SET Candidate_name = :name, Candidate_phone = :phone, Candidate_position = :position, 
                  Candidate_resume_link = :resume, Candidate_department = :department, 
                  Candidate_skills = :skills, Candidate_experience = :experience, 
                  Candidate_email = :email, Current_status = :status, Reason = :reason 
              WHERE Candidate_id = :id AND Isactive = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":name", $data->name);
    $stmt->bindParam(":phone", $data->phone);
    $stmt->bindParam(":position", $data->position);
    $stmt->bindParam(":resume", $data->resume);
    $stmt->bindParam(":department", $data->department);
    $stmt->bindParam(":skills", $skills);
    $stmt->bindParam(":experience", $experience);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":status", $data->status);
    $stmt->bindParam(":reason", $reason);
    $stmt->bindParam(":id", $data->id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Candidate updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update candidate"]);
    }
} catch(PDOException $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
