<?php

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/../../config.php';

$autoloadPath = __DIR__ . '/../../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
}

function base64UrlEncode(string $input): string
{
    return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
}

function base64UrlDecode(string $input): string
{
    $padding = strlen($input) % 4;
    if ($padding > 0) {
        $input .= str_repeat('=', 4 - $padding);
    }
    return base64_decode(strtr($input, '-_', '+/'));
}

function inviteSecret(): string
{
    if (defined('INVITE_SECRET') && trim((string)INVITE_SECRET) !== '') {
        return (string)INVITE_SECRET;
    }
    return hash('sha256', (string)SMTP_PASSWORD . 'interview-portal');
}

function appBaseUrl(): string
{
    if (defined('APP_BASE_URL') && trim((string)APP_BASE_URL) !== '') {
        return rtrim((string)APP_BASE_URL, '/') . '/';
    }

    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $rootPath = preg_replace('#/api/.*$#', '', $scriptName);
    $rootPath = rtrim((string)$rootPath, '/') . '/';
    return $scheme . '://' . $host . $rootPath;
}

function applicationPortalUrl(): string
{
    if (defined('FRONTEND_URL') && trim((string)FRONTEND_URL) !== '') {
        return rtrim((string)FRONTEND_URL, '/');
    }
    return rtrim(appBaseUrl(), '/');
}

function appendApplicationLink(PHPMailer $mail): void
{
    $appUrl = applicationPortalUrl();
    $isHtml = stripos((string)$mail->ContentType, 'text/html') !== false;

    if ($isHtml) {
        $mail->Body .= '<p style="margin:16px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">'
            . 'Application Link: <a href="' . htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8') . '" '
            . 'style="color:#0f172a;">' . htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8') . '</a></p>';
    } else {
        $mail->Body = rtrim((string)$mail->Body) . "\n\nApplication Link: {$appUrl}\n";
    }

    $mail->AltBody = rtrim((string)$mail->AltBody) . "\n\nApplication Link: {$appUrl}\n";
}

function buildInviteToken(array $payload): string
{
    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES);
    $payloadEncoded = base64UrlEncode($payloadJson ?: '{}');
    $signature = hash_hmac('sha256', $payloadEncoded, inviteSecret(), true);
    $signatureEncoded = base64UrlEncode($signature);
    return $payloadEncoded . '.' . $signatureEncoded;
}

function verifyInviteToken(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return null;
    }

    [$payloadEncoded, $signatureEncoded] = $parts;
    $expectedSignature = base64UrlEncode(hash_hmac('sha256', $payloadEncoded, inviteSecret(), true));
    if (!hash_equals($expectedSignature, $signatureEncoded)) {
        return null;
    }

    $payloadJson = base64UrlDecode($payloadEncoded);
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        return null;
    }

    $expiresAt = isset($payload['exp']) ? intval($payload['exp']) : 0;
    if ($expiresAt > 0 && time() > $expiresAt) {
        return null;
    }

    return $payload;
}

function buildCalendarInvite(
    string $uid,
    string $candidateName,
    string $position,
    string $panelEmail,
    string $startDateTime,
    string $location,
    int $durationMinutes = 60
): string {
    $tz = new DateTimeZone(defined('APP_TIMEZONE') ? (string)APP_TIMEZONE : 'Asia/Kolkata');
    $start = DateTime::createFromFormat('Y-m-d H:i:s', $startDateTime, $tz) ?: new DateTime('now', $tz);
    $end = clone $start;
    $end->modify('+' . max(15, $durationMinutes) . ' minutes');

    $dtStamp = gmdate('Ymd\THis\Z');
    $dtStartLocal = $start->format('Ymd\THis');
    $dtEndLocal = $end->format('Ymd\THis');
    $tzId = $tz->getName();

    $summary = 'Interview: ' . $candidateName . ' - ' . $position;
    $description = "Interview assignment\nCandidate: {$candidateName}\nPosition: {$position}\nLocation: {$location}";
    $escapedSummary = addcslashes($summary, ",;\\");
    $escapedDescription = addcslashes($description, ",;\\");
    $escapedLocation = addcslashes($location, ",;\\");

    return "BEGIN:VCALENDAR\r\n"
        . "PRODID:-//Interview Portal//Interview Invite//EN\r\n"
        . "VERSION:2.0\r\n"
        . "CALSCALE:GREGORIAN\r\n"
        . "METHOD:REQUEST\r\n"
        . "BEGIN:VTIMEZONE\r\n"
        . "TZID:{$tzId}\r\n"
        . "X-LIC-LOCATION:{$tzId}\r\n"
        . "BEGIN:STANDARD\r\n"
        . "TZOFFSETFROM:+0530\r\n"
        . "TZOFFSETTO:+0530\r\n"
        . "TZNAME:IST\r\n"
        . "DTSTART:19700101T000000\r\n"
        . "END:STANDARD\r\n"
        . "END:VTIMEZONE\r\n"
        . "BEGIN:VEVENT\r\n"
        . "UID:{$uid}\r\n"
        . "DTSTAMP:{$dtStamp}\r\n"
        . "DTSTART;TZID={$tzId}:{$dtStartLocal}\r\n"
        . "DTEND;TZID={$tzId}:{$dtEndLocal}\r\n"
        . "SUMMARY:{$escapedSummary}\r\n"
        . "DESCRIPTION:{$escapedDescription}\r\n"
        . "LOCATION:{$escapedLocation}\r\n"
        . "ATTENDEE;CN=Panel Member;ROLE=REQ-PARTICIPANT:MAILTO:{$panelEmail}\r\n"
        . "ORGANIZER;CN=" . addcslashes((string)SMTP_FROM_NAME, ",;\\") . ":MAILTO:" . SMTP_FROM_EMAIL . "\r\n"
        . "STATUS:CONFIRMED\r\n"
        . "SEQUENCE:0\r\n"
        . "TRANSP:OPAQUE\r\n"
        . "END:VEVENT\r\n"
        . "END:VCALENDAR\r\n";
}

function buildMailer(&$errorMessage = null): ?PHPMailer
{
    $autoloadPath = __DIR__ . '/../../vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        $errorMessage = 'PHPMailer dependency missing';
        return null;
    }

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = ((int)SMTP_PORT === 465)
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;
        $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
        $mail->isHTML(false);
        return $mail;
    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
        return null;
    }
}

function sendPanelAssignmentEmail(
    int $interviewId,
    int $panelUserId,
    string $panelName,
    string $panelEmail,
    string $candidateName,
    string $position,
    string $interviewDateTime,
    string $location,
    int $durationMinutes = 60
): array {
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return [
            'success' => false,
            'message' => 'Unable to initialize mailer: ' . ($errorMessage ?: 'Unknown error')
        ];
    }

    if (!filter_var($panelEmail, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid panel email address'
        ];
    }

    try {
        $tz = new DateTimeZone(defined('APP_TIMEZONE') ? (string)APP_TIMEZONE : 'Asia/Kolkata');
        $startDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $interviewDateTime, $tz) ?: new DateTime('now', $tz);
        $dateLabel = $startDateTime->format('d M Y');
        $timeLabel = $startDateTime->format('h:i A') . ' IST';
        $inviteUid = 'interview-' . $interviewId . '-' . $panelUserId . '@interviewportal.local';
        $icsContent = buildCalendarInvite(
            $inviteUid,
            $candidateName,
            $position,
            $panelEmail,
            $startDateTime->format('Y-m-d H:i:s'),
            $location,
            $durationMinutes
        );

        $tokenPayload = [
            'interviewId' => $interviewId,
            'panelUserId' => $panelUserId,
            'exp' => time() + (7 * 24 * 60 * 60)
        ];
        $token = buildInviteToken($tokenPayload);
        $baseUrl = appBaseUrl();
        $appUrl = applicationPortalUrl();
        $acceptUrl = $baseUrl . 'api/interview/respond.php?action=accept&token=' . urlencode($token);
        $rejectUrl = $baseUrl . 'api/interview/respond.php?action=reject&token=' . urlencode($token);
        $calendarUrl = $baseUrl . 'api/interview/invite.ics.php?token=' . urlencode($token);

        $mail->addAddress($panelEmail);
        $mail->Subject = 'Interview Assignment - ' . $candidateName;
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Interview Invitation</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($panelName) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">You have been assigned to interview the candidate below. Please review details and respond.</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">'
            . '<tr><td style="padding:14px 16px;font-size:13px;line-height:24px;">'
            . '<div><span style="color:#6b7280;">Candidate:</span> <strong>' . htmlspecialchars($candidateName) . '</strong></div>'
            . '<div><span style="color:#6b7280;">Position:</span> ' . htmlspecialchars($position) . '</div>'
            . '<div><span style="color:#6b7280;">Date:</span> ' . htmlspecialchars($dateLabel) . '</div>'
            . '<div><span style="color:#6b7280;">Time:</span> ' . htmlspecialchars($timeLabel) . '</div>'
            . '<div><span style="color:#6b7280;">Location:</span> ' . htmlspecialchars($location) . '</div>'
            . '</td></tr>'
            . '</table>'
            . '<div style="margin-top:18px;font-size:13px;color:#4b5563;">Respond to this invite:</div>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;"><tr>'
            . '<td style="padding-right:8px;">'
            . '<a href="' . htmlspecialchars($acceptUrl) . '" '
            . 'style="display:inline-block;background:#ffffff;color:#059669;text-decoration:none;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid #059669;letter-spacing:0.2px;box-shadow:0 1px 2px rgba(0,0,0,0.06);" '
            . 'onmouseover="this.style.background=\'transparent\';this.style.color=\'#059669\';this.style.borderColor=\'#059669\';" '
            . 'onmouseout="this.style.background=\'#ffffff\';this.style.color=\'#059669\';this.style.borderColor=\'#059669\';">Accept Invite</a>'
            . '</td>'
            . '<td style="padding-right:8px;">'
            . '<a href="' . htmlspecialchars($rejectUrl) . '" '
            . 'style="display:inline-block;background:#ffffff;color:rgb(241, 41, 5);text-decoration:none;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid rgb(241, 41, 5);letter-spacing:0.2px;box-shadow:0 1px 2px rgba(0,0,0,0.06);" '
            . 'onmouseover="this.style.background=\'transparent\';this.style.color=\'rgb(241, 41, 5)\';this.style.borderColor=\'rgb(241, 41, 5)\';" '
            . 'onmouseout="this.style.background=\'#ffffff\';this.style.color=\'rgb(241, 41, 5)\';this.style.borderColor=\'rgb(241, 41, 5)\';">Reject Invite</a>'
            . '</td>'
            // . '<td>'
            // . '<a href="' . htmlspecialchars($calendarUrl) . '" '
            // . 'style="display:inline-block;background:#ffffff;color:#059669;text-decoration:none;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:700;border:1px solid #059669;letter-spacing:0.2px;box-shadow:0 1px 2px rgba(0,0,0,0.06);" '
            // . 'onmouseover="this.style.background=\'transparent\';this.style.color=\'#059669\';this.style.borderColor=\'#059669\';" '
            // . 'onmouseout="this.style.background=\'#ffffff\';this.style.color=\'#059669\';this.style.borderColor=\'#059669\';">Add to Calendar (.ics)</a>'
            // . '</td>'
            . '</tr></table>'
            . '<p style="margin:12px 0 0 0;font-size:13px;line-height:20px;color:#374151;">Application Link: '
            . '<a href="' . htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8') . '" style="color:#0f172a;">'
            . htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8') . '</a></p>'
            // . '<p style="margin:18px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">If buttons do not work, copy these links into your browser:<br>'
            // . 'Accept: ' . htmlspecialchars($acceptUrl) . '<br>'
            // . 'Reject: ' . htmlspecialchars($rejectUrl) . '<br>'
            // . 'Calendar: ' . htmlspecialchars($calendarUrl) . '</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$panelName},\n\n"
            . "You have been assigned to interview the following candidate:\n\n"
            . "Candidate Name: " . $candidateName . "\n"
            . "Position: " . $position . "\n"
            . "Interview Date: " . $dateLabel . "\n"
            . "Interview Time: " . $timeLabel . "\n"
            . "Location: " . $location . "\n\n"
            . "Accept Invite: " . $acceptUrl . "\n"
            . "Reject Invite: " . $rejectUrl . "\n"
            . "Application Link: " . $appUrl . "\n"
            . "Calendar Invite (.ics): " . $calendarUrl . "\n\n"
            . "Please login to the Interview Hub to review the candidate details.\n\n"
            . "Best regards,\nInterview Hub";
        $mail->addStringAttachment($icsContent, 'interview-invite-' . $interviewId . '.ics', 'base64', 'text/calendar; method=REQUEST; charset=UTF-8');
        $mail->send();
        return ['success' => true, 'message' => 'Email accepted by SMTP server'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    }
}

function sendHrInviteResponseEmail(
    string $responseType,
    string $candidateName,
    string $position,
    string $panelName,
    string $interviewDateTime,
    string $location
): array {
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return [
            'success' => false,
            'message' => 'Unable to initialize mailer: ' . ($errorMessage ?: 'Unknown error')
        ];
    }

    if (!defined('HR_EMAIL') || !filter_var((string)HR_EMAIL, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid HR email address'
        ];
    }

    try {
        $tz = new DateTimeZone(defined('APP_TIMEZONE') ? (string)APP_TIMEZONE : 'Asia/Kolkata');
        $startDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $interviewDateTime, $tz) ?: new DateTime('now', $tz);
        $dateLabel = $startDateTime->format('d M Y');
        $timeLabel = $startDateTime->format('h:i A') . ' IST';
        $normalizedResponse = strtolower(trim($responseType)) === 'accepted' ? 'Accepted' : 'Rejected';

        $mail->addAddress((string)HR_EMAIL);
        $mail->Subject = 'Panel Invite ' . $normalizedResponse . ' - ' . $candidateName;
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Panel Invite ' . htmlspecialchars($normalizedResponse) . '</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Panel member response has been recorded.</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">'
            . '<tr><td style="padding:14px 16px;font-size:13px;line-height:24px;">'
            . '<div><span style="color:#6b7280;">Candidate:</span> <strong>' . htmlspecialchars($candidateName) . '</strong></div>'
            . '<div><span style="color:#6b7280;">Position:</span> ' . htmlspecialchars($position) . '</div>'
            . '<div><span style="color:#6b7280;">Panel:</span> ' . htmlspecialchars($panelName) . '</div>'
            . '<div><span style="color:#6b7280;">Date:</span> ' . htmlspecialchars($dateLabel) . '</div>'
            . '<div><span style="color:#6b7280;">Time:</span> ' . htmlspecialchars($timeLabel) . '</div>'
            . '<div><span style="color:#6b7280;">Location:</span> ' . htmlspecialchars($location) . '</div>'
            . '<div><span style="color:#6b7280;">Invite Response:</span> <strong>' . htmlspecialchars($normalizedResponse) . '</strong></div>'
            . '</td></tr>'
            . '</table>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Panel invite response recorded.\n\n"
            . "Candidate Name: {$candidateName}\n"
            . "Position: {$position}\n"
            . "Panel: {$panelName}\n"
            . "Interview Date: {$dateLabel}\n"
            . "Interview Time: {$timeLabel}\n"
            . "Location: {$location}\n"
            . "Invite Response: {$normalizedResponse}\n\n"
            . "Interview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return ['success' => true, 'message' => 'HR notification sent'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    }
}

function sendUserCredentialsEmail(string $email, string $name, string $password): bool
{
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return false;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    try {
        $mail->addAddress($email);
        $mail->Subject = 'Your Interview Hub Account Credentials';
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Account Created</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($name) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">Your account has been created successfully. Please use the credentials below to login:</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">'
            . '<tr><td style="padding:14px 16px;font-size:13px;line-height:24px;">'
            . '<div><span style="color:#6b7280;">Email:</span> <strong>' . htmlspecialchars($email) . '</strong></div>'
            . '<div><span style="color:#6b7280;">Password:</span> <strong>' . htmlspecialchars($password) . '</strong></div>'
            . '</td></tr>'
            . '</table>'
            . '<p style="margin:18px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">Please change your password after first login for security.</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$name},\n\n"
            . "Your account has been created successfully.\n\n"
            . "Email: {$email}\n"
            . "Password: {$password}\n\n"
            . "Please change your password after first login.\n\n"
            . "Best regards,\nInterview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function sendCandidateInterviewEmail(
    string $candidateEmail,
    string $candidateName,
    string $position,
    string $interviewDateTime,
    string $location,
    string $panelName
): array {
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return [
            'success' => false,
            'message' => 'Unable to initialize mailer: ' . ($errorMessage ?: 'Unknown error')
        ];
    }

    if (!filter_var($candidateEmail, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid candidate email address'
        ];
    }

    try {
        $tz = new DateTimeZone(defined('APP_TIMEZONE') ? (string)APP_TIMEZONE : 'Asia/Kolkata');
        $startDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $interviewDateTime, $tz) ?: new DateTime('now', $tz);
        $dateLabel = $startDateTime->format('d M Y');
        $timeLabel = $startDateTime->format('h:i A') . ' IST';

        $mail->addAddress($candidateEmail);
        $mail->Subject = 'Interview Scheduled - ' . $position;
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Interview Scheduled</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($candidateName) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">Your interview has been scheduled. Please find the details below:</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">'
            . '<tr><td style="padding:14px 16px;font-size:13px;line-height:24px;">'
            . '<div><span style="color:#6b7280;">Position:</span> <strong>' . htmlspecialchars($position) . '</strong></div>'
            . '<div><span style="color:#6b7280;">Date:</span> ' . htmlspecialchars($dateLabel) . '</div>'
            . '<div><span style="color:#6b7280;">Time:</span> ' . htmlspecialchars($timeLabel) . '</div>'
            . '<div><span style="color:#6b7280;">Location:</span> ' . htmlspecialchars($location) . '</div>'
            . '</td></tr>'
            . '</table>'
            . '<p style="margin:18px 0 0 0;font-size:13px;line-height:20px;color:#374151;">Please be on time and prepare accordingly. We wish you all the best!</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$candidateName},\n\n"
            . "Your interview has been scheduled.\n\n"
            . "Position: {$position}\n"
            . "Interview Date: {$dateLabel}\n"
            . "Interview Time: {$timeLabel}\n"
            . "Location: {$location}\n\n"
            . "Please be on time and prepare accordingly. We wish you all the best!\n\n"
            . "Best regards,\nInterview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return ['success' => true, 'message' => 'Candidate email sent successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    }
}

function sendPasswordResetEmail(string $email, string $name, string $token): bool
{
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return false;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    try {
        $frontendUrl = defined('FRONTEND_URL') ? rtrim((string)FRONTEND_URL, '/') : 'http://localhost:5173';
        $resetUrl = $frontendUrl . '/?reset=' . urlencode($token);

        $mail->addAddress($email);
        $mail->Subject = 'Password Reset Request - Interview Hub';
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Password Reset</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($name) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">We received a request to reset your password. Click the button below to reset it:</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;"><tr><td>'
            . '<a href="' . htmlspecialchars($resetUrl) . '" '
            . 'style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.3px;">Reset Password</a>'
            . '</td></tr></table>'
            . '<p style="margin:18px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>'
            . '<p style="margin:12px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">Link: ' . htmlspecialchars($resetUrl) . '</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$name},\n\n"
            . "We received a request to reset your password.\n\n"
            . "Click this link to reset your password:\n{$resetUrl}\n\n"
            . "This link will expire in 1 hour.\n\n"
            . "If you did not request a password reset, please ignore this email.\n\n"
            . "Best regards,\nInterview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function sendCandidateL1ClearEmail(
    string $candidateEmail,
    string $candidateName,
    string $position
): array {
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return [
            'success' => false,
            'message' => 'Unable to initialize mailer: ' . ($errorMessage ?: 'Unknown error')
        ];
    }

    if (!filter_var($candidateEmail, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid candidate email address'
        ];
    }

    try {
        $mail->addAddress($candidateEmail);
        $mail->Subject = 'Congratulations! L1 Interview Cleared - ' . $position;
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:linear-gradient(135deg, #059669 0%, #047857 100%);padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#d1fae5;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">🎉 Congratulations!</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($candidateName) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">Great news! You have successfully cleared the <strong>L1 Interview</strong> for the position of <strong>' . htmlspecialchars($position) . '</strong>.</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #d1fae5;border-radius:10px;background:#ecfdf5;">'
            . '<tr><td style="padding:16px;text-align:center;">'
            . '<div style="font-size:16px;font-weight:700;color:#059669;margin-bottom:6px;">✓ L1 Interview Cleared</div>'
            . '<div style="font-size:13px;color:#047857;">You will be notified about the L2 interview schedule soon.</div>'
            . '</td></tr>'
            . '</table>'
            . '<p style="margin:18px 0 0 0;font-size:13px;line-height:20px;color:#374151;">Please prepare for the next round. We will send you the L2 interview details shortly.</p>'
            . '<p style="margin:12px 0 0 0;font-size:13px;line-height:20px;color:#374151;">Best of luck for the upcoming round!</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$candidateName},\n\n"
            . "Great news! You have successfully cleared the L1 Interview for the position of {$position}.\n\n"
            . "You will be notified about the L2 interview schedule soon.\n\n"
            . "Please prepare for the next round. Best of luck!\n\n"
            . "Best regards,\nInterview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return ['success' => true, 'message' => 'L1 clear notification sent to candidate'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    }
}

function sendCandidateL1RejectEmail(
    string $candidateEmail,
    string $candidateName,
    string $position
): array {
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return [
            'success' => false,
            'message' => 'Unable to initialize mailer: ' . ($errorMessage ?: 'Unknown error')
        ];
    }

    if (!filter_var($candidateEmail, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid candidate email address'
        ];
    }

    try {
        $mail->addAddress($candidateEmail);
        $mail->Subject = 'Interview Update - ' . $position;
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Interview Update</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($candidateName) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">Thank you for taking the time to interview for the position of <strong>' . htmlspecialchars($position) . '</strong>.</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">After careful consideration, we have decided not to move forward with your application at this time.</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">We appreciate your interest in our organization and wish you all the best in your future endeavors.</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$candidateName},\n\n"
            . "Thank you for taking the time to interview for the position of {$position}.\n\n"
            . "After careful consideration, we have decided not to move forward with your application at this time.\n\n"
            . "We appreciate your interest in our organization and wish you all the best in your future endeavors.\n\n"
            . "Best regards,\nInterview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return ['success' => true, 'message' => 'Interview update sent to candidate'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    }
}

function sendCandidateL2ClearEmail(
    string $candidateEmail,
    string $candidateName,
    string $position
): array {
    $errorMessage = null;
    $mail = buildMailer($errorMessage);
    if (!$mail) {
        return [
            'success' => false,
            'message' => 'Unable to initialize mailer: ' . ($errorMessage ?: 'Unknown error')
        ];
    }

    if (!filter_var($candidateEmail, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid candidate email address'
        ];
    }

    try {
        $mail->addAddress($candidateEmail);
        $mail->Subject = 'Congratulations! L2 Interview Cleared - ' . $position;
        $mail->isHTML(true);
        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:linear-gradient(135deg, #059669 0%, #047857 100%);padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#d1fae5;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">🎉 Excellent Performance!</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>' . htmlspecialchars($candidateName) . '</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">Congratulations! You have successfully cleared the <strong>L2 Interview</strong> for the position of <strong>' . htmlspecialchars($position) . '</strong>.</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #d1fae5;border-radius:10px;background:#ecfdf5;">'
            . '<tr><td style="padding:16px;text-align:center;">'
            . '<div style="font-size:16px;font-weight:700;color:#059669;margin-bottom:6px;">✓ L2 Interview Cleared</div>'
            . '<div style="font-size:13px;color:#047857;">Our HR team will contact you soon with the next steps.</div>'
            . '</td></tr>'
            . '</table>'
            . '<p style="margin:18px 0 0 0;font-size:13px;line-height:20px;color:#374151;">We are impressed with your performance and look forward to having you on our team!</p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear {$candidateName},\n\n"
            . "Congratulations! You have successfully cleared the L2 Interview for the position of {$position}.\n\n"
            . "Our HR team will contact you soon with the next steps.\n\n"
            . "We are impressed with your performance and look forward to having you on our team!\n\n"
            . "Best regards,\nInterview Hub";

        appendApplicationLink($mail);
        $mail->send();
        return ['success' => true, 'message' => 'L2 clear notification sent to candidate'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    }
}
