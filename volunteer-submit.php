<?php
declare(strict_types=1);

/**
 * Meher Welfare Trust — volunteer interest form (JSON POST).
 * Set $to and $fromEmail to your real addresses on your hosting domain.
 */

header('Content-Type: application/json; charset=UTF-8');

$to = 'info@meherwelfaretrust.org';
$fromEmail = 'noreply@meherwelfaretrust.org';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '{}', true);
if (!is_array($payload)) {
    $payload = [];
}

$name = trim((string)($payload['name'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$message = trim((string)($payload['message'] ?? ''));

$len = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
if ($len < 2) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid name.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}

$msgLen = function_exists('mb_strlen') ? mb_strlen($message) : strlen($message);
if ($msgLen < 10) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Message must be at least 10 characters.']);
    exit;
}

$subject = 'New volunteer message — Meher Welfare Trust';

$safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));

$body = '<html><body>';
$body .= '<h2>New volunteer enquiry</h2>';
$body .= '<p><strong>Name:</strong> ' . $safeName . '</p>';
$body .= '<p><strong>Email:</strong> ' . $safeEmail . '</p>';
$body .= '<p><strong>Message:</strong><br>' . $safeMessage . '</p>';
$body .= '</body></html>';

$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: Meher Welfare Trust <' . $fromEmail . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Unable to send message right now. Please try again or email us directly.',
    ]);
    exit;
}

echo json_encode(['ok' => true]);
