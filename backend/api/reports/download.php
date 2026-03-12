<?php
require_once(__DIR__ . '/../config/database.php');

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    die("Database connection failed.");
}

$type = $_GET['type'] ?? '';
$filename = "report.xls";

if ($type == "current") {

    $query = "
        SELECT 
            c.Candidate_id,
            c.Candidate_name,
            c.Candidate_phone,
            c.Candidate_email,
            c.Candidate_position,
            c.Candidate_department,
            c.Candidate_experience,
            c.Candidate_skills,
            s.Status_description,
            c.Reason,

            MAX(CASE 
                WHEN t.Status_id IN (1, 2, 3, 8) THEN t.Feedback 
            END) AS L1_feedback,

            MAX(CASE 
                WHEN t.Status_id IN (4, 5, 6, 9) THEN t.Feedback 
            END) AS L2_feedback

        FROM mst_candidates c

        LEFT JOIN mst_application_status s 
            ON c.Current_status = s.Status_id

        LEFT JOIN tbl_interview_details t 
            ON c.Candidate_id = t.Candidate_id
            AND t.Isactive = 1

        WHERE c.Isactive = 1

        GROUP BY 
            c.Candidate_id,
            c.Candidate_name,
            c.Candidate_phone,
            c.Candidate_email,
            c.Candidate_position,
            c.Candidate_department,
            c.Candidate_experience,
            c.Candidate_skills,
            s.Status_description,
            c.Reason
    ";

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

    $query = "
        SELECT 
            c.Candidate_id,
            c.Candidate_name,
            c.Candidate_phone,
            c.Candidate_email,
            c.Candidate_position,
            c.Candidate_department,
            c.Candidate_experience,
            c.Candidate_skills,
            s.Status_description,
            c.Reason,

            MAX(CASE 
                WHEN t.Status_id IN (1, 2, 3, 8) THEN t.Feedback 
            END) AS L1_feedback,

            MAX(CASE 
                WHEN t.Status_id IN (4, 5, 6, 9) THEN t.Feedback 
            END) AS L2_feedback

        FROM mst_candidates c

        LEFT JOIN mst_application_status s 
            ON c.Current_status = s.Status_id

        LEFT JOIN tbl_interview_details t 
            ON c.Candidate_id = t.Candidate_id
            AND t.Isactive = 1

        WHERE c.Isactive = 1
        AND DATE(t.DateTime) BETWEEN :from AND :to

        GROUP BY 
            c.Candidate_id,
            c.Candidate_name,
            c.Candidate_phone,
            c.Candidate_email,
            c.Candidate_position,
            c.Candidate_department,
            c.Candidate_experience,
            c.Candidate_skills,
            s.Status_description,
            c.Reason
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':from', $from);
    $stmt->bindParam(':to', $to);
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

/* -------- UPDATED COLUMNS (Resume Removed) -------- */

$columns = [
    "Candidate ID",
    "Name",
    "Phone",
    "Email",
    "Position",
    "Education",
    "Experience",
    "Skills",
    "Status",
    "L1 Feedback",
    "L2 Feedback",
    "Reason"
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
        $row['Status_description'] ?? 'Unknown',
        $row['L1_feedback'] ?? '-',
        $row['L2_feedback'] ?? '-',
        $row['Reason'] ?? '-'
    ];

    echo implode("\t", $data) . "\n";
}

exit;