<?php
// process_form.php
// Basic secure form handler: validates, sanitizes, sends email, returns JSON for AJAX.

// --------------- CONFIG ---------------
$recipient = 'admin@fibriontextiles.com'; // <- CHANGE THIS to your preferred recipient
$siteName  = 'Fibrion Textiles';
$subjectPrefix = "Website Enquiry - {$siteName}";

// Optional: set a from address (use your domain to avoid spam filters)
$fromEmail = 'noreply@yourdomain.com'; // <- CHANGE to an address at your domain
$fromName  = $siteName;

// --------------- Helpers ---------------
function _json($data) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function clean($val) {
    return trim(htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
}

// --------------- Accept POST only ---------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Not a POST request — return a friendly message
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
        _json(['success' => false, 'message' => 'Invalid request method.']);
    } else {
        http_response_code(405);
        echo "Invalid request method.";
        exit;
    }
}

// --------------- Get & sanitize fields ---------------
$honeypot = $_POST['website_hp'] ?? '';
if (!empty($honeypot)) {
    // Spam detected. Silent exit or return a subtle failure.
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
        _json(['success' => false, 'message' => 'Spam detected.']);
    } else {
        echo "Spam detected.";
        exit;
    }
}

$purpose      = clean($_POST['Purpose'] ?? '');
$howHeard     = clean($_POST['howHeard'] ?? '');
$companyName  = clean($_POST['companyName'] ?? '');
$email        = clean($_POST['email'] ?? '');
$address      = clean($_POST['address'] ?? '');
$addressLine2 = clean($_POST['addressLine2'] ?? '');
$city         = clean($_POST['city'] ?? '');
$state        = clean($_POST['state'] ?? '');
$phone        = clean($_POST['phone'] ?? '');
$inquiry      = clean($_POST['Inquiry'] ?? '');
$billingSame  = isset($_POST['billingSame']) ? true : false; // checkbox
$orgName      = clean($_POST['orgName'] ?? '');
$orgContact   = clean($_POST['orgContact'] ?? '');
$orgVat       = clean($_POST['orgVat'] ?? '');
$orgEmail     = clean($_POST['orgEmail'] ?? '');

// --------------- Server-side validation ---------------
$errors = [];

if (!$purpose)   $errors[] = 'Purpose is required.';
if (!$howHeard)  $errors[] = 'Please tell us how you heard about us.';
if (!$companyName) $errors[] = 'Company / full name is required.';
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Valid email is required.';
if (!$address)   $errors[] = 'Address is required.';
if (!$phone)     $errors[] = 'Phone number is required.';
if (!$inquiry)   $errors[] = 'Please describe your requirements.';

// If company details provided (billingSame==false) validate minimal fields
if (!$billingSame) {
    // optional: require orgName or orgContact when billing differs
    // if (!$orgName) $errors[] = 'Billing company name is required when billing is different.';
}

// If errors, return them
if (!empty($errors)) {
    $msg = implode(" ", $errors);
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
        _json(['success' => false, 'message' => $msg]);
    } else {
        // plain text fallback
        http_response_code(400);
        echo $msg;
        exit;
    }
}

// --------------- Build email ---------------
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$time = date('Y-m-d H:i:s');

$body = "";
$body .= "New enquiry received from website\r\n";
$body .= "Time: {$time}\r\n";
$body .= "IP: {$ip}\r\n";
$body .= "-------------------------------------\r\n";
$body .= "Purpose: {$purpose}\r\n";
$body .= "How heard: {$howHeard}\r\n";
$body .= "Name/Company: {$companyName}\r\n";
$body .= "Email: {$email}\r\n";
$body .= "Phone: {$phone}\r\n";
$body .= "Address: {$address}\r\n";
if ($addressLine2) $body .= "Address line 2: {$addressLine2}\r\n";
if ($city) $body .= "City: {$city}\r\n";
if ($state) $body .= "State: {$state}\r\n";
$body .= "Inquiry:\r\n{$inquiry}\r\n\r\n";

$body .= "Billing same as above: " . ($billingSame ? 'Yes' : 'No') . "\r\n";
if (!$billingSame) {
    $body .= "Billing Company Name: {$orgName}\r\n";
    $body .= "Billing Contact: {$orgContact}\r\n";
    $body .= "Billing VAT/Reg: {$orgVat}\r\n";
    $body .= "Billing Email: {$orgEmail}\r\n";
}

$subject = "{$subjectPrefix}: " . (substr($inquiry, 0, 60) ?: 'New enquiry');

// Headers (use your domain email in From to avoid spam)
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: ' . $fromName . ' <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $companyName . ' <' . $email . '>';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$headers_string = implode("\r\n", $headers);

// --------------- Send email ---------------
$mailSent = @mail($recipient, $subject, $body, $headers_string);

// --------------- Response ---------------
if ($mailSent) {
    $successMsg = 'Thanks — your enquiry was sent. We will contact you shortly.';
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
        _json(['success' => true, 'message' => $successMsg]);
    } else {
        echo $successMsg;
    }
} else {
    $errMsg = 'Failed to send email — please try again later.';
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false) {
        _json(['success' => false, 'message' => $errMsg]);
    } else {
        http_response_code(500);
        echo $errMsg;
    }
}
