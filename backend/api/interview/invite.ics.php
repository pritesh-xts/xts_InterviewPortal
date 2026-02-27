<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

$token = isset($_GET['token']) ? trim((string)$_GET['token']) : '';
if ($token === '') {
    http_response_code(400);
    echo 'Missing token';
    exit();
}

$payload = verifyInviteToken($token);
if (!$payload) {
    http_response_code(400);
    echo 'Invalid or expired token';
    exit();
}

$interviewId = intval($payload['interviewId'] ?? 0);
$panelUserId = intval($payload['panelUserId'] ?? 0);
if ($interviewId <= 0 || $panelUserId <= 0) {
    http_response_code(400);
    echo 'Invalid token payload';
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT i.Interview_id, i.Feedback_by, i.DateTime, i.Location,
                     c.Candidate_name, c.Candidate_position,
                     u.User_email
              FROM tbl_interview_details i
              INNER JOIN mst_candidates c ON c.Candidate_id = i.Candidate_id
              INNER JOIN mst_users u ON u.User_id = i.Feedback_by
              WHERE i.Interview_id = :interviewId
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':interviewId', $interviewId);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo 'Interview not found';
        exit();
    }

    if (intval($row['Feedback_by']) !== $panelUserId) {
        http_response_code(403);
        echo 'Token is not valid for this invite';
        exit();
    }

    $uid = 'interview-' . intval($row['Interview_id']) . '-' . $panelUserId . '@interviewportal.local';
    $ics = buildCalendarInvite(
        $uid,
        (string)$row['Candidate_name'],
        (string)$row['Candidate_position'],
        (string)$row['User_email'],
        (string)$row['DateTime'],
        (string)$row['Location']
    );

    $fileName = 'interview-invite-' . intval($row['Interview_id']) . '.ics';
    header('Content-Type: text/calendar; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    echo $ics;
} catch (PDOException $e) {
    http_response_code(500);
    echo 'Server error';
}

