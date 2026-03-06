<?php
require_once 'config.php';

$allowedOrigin = defined('FRONTEND_URL') ? rtrim((string)FRONTEND_URL, '/') : 'http://localhost:3000';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'PHPMailer dependency missing. Run: composer require phpmailer/phpmailer'
    ]);
    exit;
}
require $autoloadPath;

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['type'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

function missingRequiredFields(array $payload, array $requiredFields): array
{
    $missing = [];
    foreach ($requiredFields as $field) {
        if (!isset($payload[$field]) || trim((string)$payload[$field]) === '') {
            $missing[] = $field;
        }
    }
    return $missing;
}

function appendApplicationLinkToMail(PHPMailer $mail, string $appUrl): void
{
    $isHtml = stripos((string)$mail->ContentType, 'text/html') !== false;
    if ($isHtml) {
        $safeUrl = htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8');
        $mail->Body .= '<p style="margin:16px 0 0 0;font-size:12px;line-height:19px;color:#6b7280;">'
            . 'Application Link: <a href="' . $safeUrl . '" style="color:#0f172a;">' . $safeUrl . '</a></p>';
    } else {
        $mail->Body = rtrim((string)$mail->Body) . "\n\nApplication Link: {$appUrl}\n";
    }
    $mail->AltBody = rtrim((string)$mail->AltBody) . "\n\nApplication Link: {$appUrl}\n";
}

$mail = new PHPMailer(true);
$smtpDebugLog = [];
$debugEnabled = filter_var(getenv('EMAIL_DEBUG') ?: '0', FILTER_VALIDATE_BOOLEAN);
$applicationLinkHandledInTemplate = false;

try {
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

    if ($debugEnabled) {
        $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        $mail->Debugoutput = function ($str, $level) use (&$smtpDebugLog) {
            $smtpDebugLog[] = '[' . $level . '] ' . $str;
        };
    }

    if ($data['type'] === 'panel_assignment') {
        $missingFields = missingRequiredFields($data, [
            'panelEmail',
            'candidateName',
            'position',
            'interviewDate',
            'interviewTime',
            'location'
        ]);
        if (!empty($missingFields)) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields',
                'missingFields' => $missingFields
            ]);
            exit;
        }

        if (!filter_var($data['panelEmail'], FILTER_VALIDATE_EMAIL)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid panel email address'
            ]);
            exit;
        }

        $mail->addAddress($data['panelEmail']);
        $mail->Subject = 'Interview Assignment - ' . $data['candidateName'];
        $mail->Body = "Dear Panel Member,\n\n"
            . "You have been assigned to interview the following candidate:\n\n"
            . "Candidate Name: " . $data['candidateName'] . "\n"
            . "Position: " . $data['position'] . "\n"
            . "Interview Date: " . $data['interviewDate'] . "\n"
            . "Interview Time: " . $data['interviewTime'] . "\n"
            . "Location: " . $data['location'] . "\n\n"
            . "Please login to the Interview Hub to review the candidate details.\n\n"
            . "Best regards,\nInterview Hub";
    } elseif ($data['type'] === 'feedback_submitted') {
        $missingFields = missingRequiredFields($data, [
            'candidateName',
            'position',
            'panelMember',
            'notes'
        ]);
        if (!empty($missingFields)) {
            echo json_encode([
                'success' => false,
                'message' => 'Missing required fields',
                'missingFields' => $missingFields
            ]);
            exit;
        }

        if (!filter_var(HR_EMAIL, FILTER_VALIDATE_EMAIL)) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid HR_EMAIL in config'
            ]);
            exit;
        }

        $notes = isset($data['notes']) ? (string)$data['notes'] : '';
        $rating = isset($data['rating']) ? (string)$data['rating'] : 'N/A';
        $statusLabel = isset($data['statusLabel']) ? (string)$data['statusLabel'] : 'N/A';
        $technicalSkills = isset($data['technicalSkills']) ? (string)$data['technicalSkills'] : null;
        $communication = isset($data['communication']) ? (string)$data['communication'] : null;
        $cultureFit = isset($data['cultureFit']) ? (string)$data['cultureFit'] : null;

        $scoreLines = '';
        if ($technicalSkills !== null || $communication !== null || $cultureFit !== null) {
            $scoreLines = "Technical Skills: " . ($technicalSkills ?? 'N/A') . "/10\n"
                . "Communication: " . ($communication ?? 'N/A') . "/10\n"
                . "Culture Fit: " . ($cultureFit ?? 'N/A') . "/10\n\n";
        }

        $mail->addAddress(HR_EMAIL);
        $mail->Subject = 'Feedback Submitted - ' . $data['candidateName'];
        $mail->isHTML(true);
        $frontendUrl = defined('FRONTEND_URL') && trim((string)FRONTEND_URL) !== ''
            ? rtrim((string)FRONTEND_URL, '/')
            : 'http://localhost:5173';

        $scoreRowsHtml = '';
        if ($technicalSkills !== null || $communication !== null || $cultureFit !== null) {
            $scoreRowsHtml = '<div><span style="color:#6b7280;">Technical Skills:</span> ' . htmlspecialchars((string)($technicalSkills ?? 'N/A')) . '/10</div>'
                . '<div><span style="color:#6b7280;">Communication:</span> ' . htmlspecialchars((string)($communication ?? 'N/A')) . '/10</div>'
                . '<div><span style="color:#6b7280;">Culture Fit:</span> ' . htmlspecialchars((string)($cultureFit ?? 'N/A')) . '/10</div>';
        }

        $mail->Body = '<!doctype html><html><body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f3f5f9;padding:28px 12px;">'
            . '<tr><td align="center">'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="620" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">'
            . '<tr><td style="background:#0f172a;padding:22px 24px;">'
            . '<div style="font-size:12px;letter-spacing:1px;color:#93c5fd;text-transform:uppercase;">Interview Hub</div>'
            . '<div style="font-size:22px;line-height:28px;font-weight:700;color:#ffffff;margin-top:8px;">Feedback Submitted</div>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;">'
            . '<p style="margin:0 0 14px 0;font-size:15px;line-height:22px;">Dear <strong>HR Team</strong>,</p>'
            . '<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#374151;">New interview feedback has been submitted.</p>'
            . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">'
            . '<tr><td style="padding:14px 16px;font-size:13px;line-height:24px;">'
            . '<div><span style="color:#6b7280;">Candidate:</span> <strong>' . htmlspecialchars((string)$data['candidateName']) . '</strong></div>'
            . '<div><span style="color:#6b7280;">Position:</span> ' . htmlspecialchars((string)$data['position']) . '</div>'
            . '<div><span style="color:#6b7280;">Panel Member:</span> ' . htmlspecialchars((string)$data['panelMember']) . '</div>'
            . '<div><span style="color:#6b7280;">Status:</span> <strong>' . htmlspecialchars($statusLabel) . '</strong></div>'
            . '<div><span style="color:#6b7280;">Rating:</span> ' . htmlspecialchars($rating) . '</div>'
            . $scoreRowsHtml
            . '</td></tr>'
            . '</table>'
            . '<div style="margin-top:14px;font-size:13px;line-height:22px;color:#374151;">'
            . '<span style="color:#6b7280;">Notes:</span> ' . nl2br(htmlspecialchars($notes))
            . '</div>'
            . '<p style="margin:16px 0 0 0;font-size:13px;line-height:20px;color:#374151;">Please login to the Interview Hub to review complete feedback.</p>'
            . '<p style="margin:10px 0 0 0;font-size:13px;line-height:20px;color:#374151;">Application Link: <a href="' . htmlspecialchars($frontendUrl, ENT_QUOTES, 'UTF-8') . '" style="color:#0f172a;">' . htmlspecialchars($frontendUrl, ENT_QUOTES, 'UTF-8') . '</a></p>'
            . '</td></tr>'
            . '<tr><td style="border-top:1px solid #e5e7eb;padding:14px 24px;font-size:12px;color:#6b7280;">Interview Hub</td></tr>'
            . '</table>'
            . '</td></tr></table>'
            . '</body></html>';

        $mail->AltBody = "Dear HR Team,\n\n"
            . "Feedback has been submitted for the following candidate:\n\n"
            . "Candidate Name: " . $data['candidateName'] . "\n"
            . "Position: " . $data['position'] . "\n"
            . "Panel Member: " . $data['panelMember'] . "\n"
            . "Status: " . $statusLabel . "\n"
            . "Rating: " . $rating . "\n\n"
            . $scoreLines
            . "Notes: " . $notes . "\n\n"
            . "Please login to the Interview Hub to view complete feedback.\n\n"
            . "Application Link: {$frontendUrl}\n\n"
            . "Best regards,\nInterview Hub";
        $applicationLinkHandledInTemplate = true;
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Unsupported email type'
        ]);
        exit;
    }

    $frontendUrl = defined('FRONTEND_URL') && trim((string)FRONTEND_URL) !== ''
        ? rtrim((string)FRONTEND_URL, '/')
        : 'http://localhost:5173';
    if (!$applicationLinkHandledInTemplate) {
        appendApplicationLinkToMail($mail, $frontendUrl);
    }
    $mail->send();
    $response = ['success' => true, 'message' => 'Email accepted by SMTP server'];
    if ($debugEnabled) {
        $response['smtpDebug'] = $smtpDebugLog;
    }
    echo json_encode($response);
} catch (Exception $e) {
    $response = ['success' => false, 'message' => 'Email failed: ' . $mail->ErrorInfo];
    if ($debugEnabled) {
        $response['smtpDebug'] = $smtpDebugLog;
    }
    echo json_encode($response);
}
?>
