<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_POST['candidateId']) || !isset($_FILES['resume'])) {
    echo json_encode(["success" => false, "message" => "candidateId and resume file are required"]);
    exit();
}

$candidateId = intval($_POST['candidateId']);
if ($candidateId <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid candidateId"]);
    exit();
}

$file = $_FILES['resume'];
if (!isset($file['error']) || is_array($file['error'])) {
    echo json_encode(["success" => false, "message" => "Invalid file upload"]);
    exit();
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "File upload failed with error code " . $file['error']]);
    exit();
}

$allowedExtensions = ['pdf', 'doc', 'docx'];
$originalName = $file['name'] ?? 'resume';
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if (!in_array($extension, $allowedExtensions, true)) {
    echo json_encode(["success" => false, "message" => "Only PDF, DOC, and DOCX files are allowed"]);
    exit();
}

$maxFileSize = 5 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxFileSize) {
    echo json_encode(["success" => false, "message" => "File size must be 5MB or less"]);
    exit();
}

try {
    $checkQuery = "SELECT Candidate_id FROM mst_candidates WHERE Candidate_id = :candidateId AND Isactive = 1 LIMIT 1";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':candidateId', $candidateId, PDO::PARAM_INT);
    $checkStmt->execute();
    $candidate = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$candidate) {
        echo json_encode(["success" => false, "message" => "Candidate not found"]);
        exit();
    }

    $uploadsRoot = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'resumes';
    if (!is_dir($uploadsRoot)) {
        mkdir($uploadsRoot, 0775, true);
    }

    $safeName = 'resume_' . $candidateId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
    $targetFsPath = $uploadsRoot . DIRECTORY_SEPARATOR . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $targetFsPath)) {
        echo json_encode(["success" => false, "message" => "Could not save uploaded file"]);
        exit();
    }

    $resumePath = 'uploads/resumes/' . $safeName;
    $updateQuery = "UPDATE mst_candidates SET Candidate_resume_link = :resumePath WHERE Candidate_id = :candidateId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':resumePath', $resumePath);
    $updateStmt->bindParam(':candidateId', $candidateId, PDO::PARAM_INT);
    $updateStmt->execute();

    echo json_encode([
        "success" => true,
        "message" => "Resume uploaded successfully",
        "data" => [
            "resumePath" => $resumePath,
            "originalName" => $originalName
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
