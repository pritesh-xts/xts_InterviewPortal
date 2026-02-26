<?php
require_once '../config/database.php';
require_once '../helpers/email.php';

function renderStatusPage(string $title, string $message, int $statusCode = 200, bool $autoClose = false): void
{
    http_response_code($statusCode);
    header('Content-Type: text/html; charset=UTF-8');
    $closeScript = '';
    if ($autoClose) {
        $closeScript = '<script>'
            . 'setTimeout(function(){'
            . 'window.close();'
            . 'setTimeout(function(){'
            . 'try { history.back(); } catch(e) {}'
            . '}, 150);'
            . '}, 2000);'
            . '</script>';
    }
    echo '<!doctype html><html><head><meta charset="utf-8"><title>' . htmlspecialchars($title) . '</title></head>'
        . '<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;">'
        . '<div style="max-width:520px;margin:60px auto;padding:26px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 22px rgba(15,23,42,0.08);">'
        . '<h2 style="margin:0 0 10px 0;font-size:22px;color:#111827;">' . htmlspecialchars($title) . '</h2>'
        . '<p style="margin:0;font-size:15px;line-height:22px;color:#374151;">' . htmlspecialchars($message) . '</p>'
        . ($autoClose
            ? '<p style="margin:12px 0 0 0;font-size:12px;color:#6b7280;">This window will close automatically in 2 seconds.</p>'
            : '')
        . '</div>'
        . $closeScript
        . '</body></html>';
    exit();
}

$action = isset($_GET['action']) ? strtolower(trim((string)$_GET['action'])) : '';
$token = isset($_GET['token']) ? trim((string)$_GET['token']) : '';

if (!in_array($action, ['accept', 'reject'], true) || $token === '') {
    renderStatusPage('Invalid Request', 'The invite link is invalid.', 400);
}

$payload = verifyInviteToken($token);
if (!$payload) {
    renderStatusPage('Link Expired', 'This invite link is invalid or expired.', 400);
}

$interviewId = intval($payload['interviewId'] ?? 0);
$panelUserId = intval($payload['panelUserId'] ?? 0);
if ($interviewId <= 0 || $panelUserId <= 0) {
    renderStatusPage('Invalid Data', 'Invite data is invalid.', 400);
}

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT i.Interview_id, i.Feedback_by, i.Invite_response, i.DateTime, i.Location,
                     c.Candidate_name, c.Candidate_position, u.User_name AS Panel_name
              FROM tbl_interview_details i
              LEFT JOIN mst_candidates c ON c.Candidate_id = i.Candidate_id
              LEFT JOIN mst_users u ON u.User_id = i.Feedback_by
              WHERE i.Interview_id = :interviewId
              LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':interviewId', $interviewId);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        renderStatusPage('Not Found', 'Interview invite was not found.', 404);
    }

    if (intval($row['Feedback_by']) !== $panelUserId) {
        renderStatusPage('Access Denied', 'This invite does not belong to this panel member.', 403);
    }

    $inviteResponse = $action === 'accept' ? 'accepted' : 'rejected';
    $currentResponse = strtolower(trim((string)($row['Invite_response'] ?? 'pending')));
    if ($currentResponse === $inviteResponse) {
        if ($action === 'accept') {
            renderStatusPage('Invite Accepted', 'Your response has already been recorded.', 200, true);
        }
        renderStatusPage('Invite Rejected', 'Your response has already been recorded.', 200, true);
    }

    $now = date('Y-m-d H:i:s');
    $update = "UPDATE tbl_interview_details
               SET Invite_response = :inviteResponse, Invite_responded_at = :respondedAt
               WHERE Interview_id = :interviewId";
    $updateStmt = $db->prepare($update);
    $updateStmt->bindParam(':inviteResponse', $inviteResponse);
    $updateStmt->bindParam(':respondedAt', $now);
    $updateStmt->bindParam(':interviewId', $interviewId);
    $updateStmt->execute();

    if ($action === 'accept') {
        renderStatusPage('Invite Accepted', 'Your response has been recorded. Status updated successfully.', 200, true);
    } else {
        sendHrInviteResponseEmail(
            'rejected',
            (string)($row['Candidate_name'] ?? 'Candidate'),
            (string)($row['Candidate_position'] ?? 'Position'),
            (string)($row['Panel_name'] ?? 'Panel Member'),
            (string)($row['DateTime'] ?? ''),
            (string)($row['Location'] ?? '')
        );
        renderStatusPage('Invite Rejected', 'Your response has been recorded. HR can assign a different slot or panel.', 200, true);
    }
} catch (PDOException $e) {
    renderStatusPage('Server Error', 'Server error while processing invite response.', 500);
}
