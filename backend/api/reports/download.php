<?php
require_once(__DIR__ . '/../config/database.php');

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    die("Database connection failed.");
}

$statusMap = [
    1 => "L1 Clear",
    2 => "L1 Reject",
    3 => "On Hold after L1",
    4 => "L2 Clear",
    5 => "L2 Reject",
    6 => "On Hold after L2",
    7 => "Pending",
    8 => "L1 Interview Confirmed",
    9 => "L2 Interview Confirmed",
    10 => "Offer Rolled Out",
    11 => "Offer Hold On"
];

$type = $_GET['type'] ?? '';
$filename = "report.xls";

if ($type == "current") {
    $query = "SELECT c.*, s.Status_description 
              FROM mst_candidates c
              LEFT JOIN mst_application_status s ON c.Current_status = s.Status_id
              WHERE c.Isactive = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $filename = strtolower(date('M_Y')) . "_report.xls";
}
else if ($type == "custom") {
    $from = $_GET['from'] ?? '';
    $to = $_GET['to'] ?? '';

    if (!$from || !$to) {
        die("Please provide both from and to dates");
    }

    $query = "SELECT c.*, s.Status_description 
              FROM mst_candidates c
              LEFT JOIN mst_application_status s ON c.Current_status = s.Status_id
              WHERE c.Isactive = 1";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $fromFormatted = date('d_m_Y', strtotime($from));
    $toFormatted = date('d_m_Y', strtotime($to));
    $filename = "from_{$fromFormatted}_to_{$toFormatted}_report.xls";
}
else {
    die("Invalid request");
}

header("Content-Type: application/vnd.ms-excel");
header("Content-Disposition: attachment; filename={$filename}");
header("Pragma: no-cache");
header("Expires: 0");

$columns = [
    "Candidate_id",
    "Candidate_name",
    "Candidate_phone",
    "Candidate_email",
    "Candidate_position",
    "Candidate_department",
    "Candidate_experience",
    "Candidate_skills",
    "Current_status",
    "Reason",
    "Candidate_resume_link"
];
echo implode("\t", $columns) . "\n";

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $data = [
        $row['Candidate_id'],
        $row['Candidate_name'],
        $row['Candidate_phone'],
        $row['Candidate_email'],
        $row['Candidate_position'],
        $row['Candidate_department'],
        $row['Candidate_experience'],
        $row['Candidate_skills'],
        $row['Status_description'] ?? $statusMap[$row['Current_status']] ?? "Unknown",
        $row['Reason'] ?? '-',
        $row['Candidate_resume_link']
    ];
    echo implode("\t", $data) . "\n";
}

exit;