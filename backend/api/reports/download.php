<?php
require_once(__DIR__ . '/../config/database.php');

// Create database connection
$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    die("Database connection failed.");
}

// Map numeric Current_status to readable text
$statusMap = [
    1 => "Pending",
    5 => "Interview Confirmed",
    8 => "Completed"
    // add more mappings if needed
];

$type = $_GET['type'] ?? '';
$filename = "report.xls"; // default

if ($type == "current") {
    $query = "SELECT * FROM mst_candidates 
              WHERE MONTH(Created_date) = MONTH(CURRENT_DATE())
              AND YEAR(Created_date) = YEAR(CURRENT_DATE())";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    // Generate filename: feb_2026_report.xls
    $filename = strtolower(date('M_Y')) . "_report.xls";
}
else if ($type == "custom") {
    $from = $_GET['from'] ?? '';
    $to = $_GET['to'] ?? '';

    if (!$from || !$to) {
        die("Please provide both from and to dates");
    }

    $query = "SELECT * FROM mst_candidates 
              WHERE DATE(Created_date) BETWEEN :from AND :to";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':from', $from);
    $stmt->bindParam(':to', $to);
    $stmt->execute();

    // Format dates for filename: from_dd_mm_yyyy_to_dd_mm_yyyy_report.xls
    $fromFormatted = date('d_m_Y', strtotime($from));
    $toFormatted = date('d_m_Y', strtotime($to));
    $filename = "from_{$fromFormatted}_to_{$toFormatted}_report.xls";
}
else {
    die("Invalid request");
}

// Set headers for Excel
header("Content-Type: application/vnd.ms-excel");
header("Content-Disposition: attachment; filename={$filename}");
header("Pragma: no-cache");
header("Expires: 0");

// Output header row (remove Isactive)
$columns = [
    "Candidate_id",
    "Candidate_name",
    "Candidate_phone",
    "Candidate_position",
    "Candidate_resume_link",
    "Candidate_department",
    "Candidate_skills",
    "Candidate_experience",
    "Candidate_email",
    "Current_status",
    "Created_date"
];
echo implode("\t", $columns) . "\n";

// Output data rows
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $data = [
        $row['Candidate_id'],
        $row['Candidate_name'],
        $row['Candidate_phone'],
        $row['Candidate_position'],
        $row['Candidate_resume_link'],
        $row['Candidate_department'],
        $row['Candidate_skills'],
        $row['Candidate_experience'],
        $row['Candidate_email'],
        $statusMap[$row['Current_status']] ?? "Unknown",
        $row['Created_date']
    ];
    // Output row with tabs
    echo implode("\t", $data) . "\n";
}

exit;