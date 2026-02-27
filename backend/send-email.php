<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';

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

$mail = new PHPMailer(true);
$smtpDebugLog = [];
$debugEnabled = filter_var(getenv('EMAIL_DEBUG') ?: '0', FILTER_VALIDATE_BOOLEAN);

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
        $mail->Body = "Dear HR Team,\n\n"
            . "Feedback has been submitted for the following candidate:\n\n"
            . "Candidate Name: " . $data['candidateName'] . "\n"
            . "Position: " . $data['position'] . "\n"
            . "Panel Member: " . $data['panelMember'] . "\n"
            . "Status: " . $statusLabel . "\n"
            . "Rating: " . $rating . "\n\n"
            . $scoreLines
            . "Notes: " . $notes . "\n\n"
            . "Please login to the Interview Hub to view complete feedback.\n\n"
            . "Best regards,\nInterview Hub";
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Unsupported email type'
        ]);
        exit;
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
